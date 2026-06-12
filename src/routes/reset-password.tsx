import { createFileRoute } from "@tanstack/react-router";
import { updateUser } from "@netlify/identity";
import { useIdentity } from "../lib/identity-context.js";
import { useState } from "react";
import { ArrowLeft, KeyRound } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { user, ready } = useIdentity();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="bg-red-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
              <KeyRound className="w-6 h-6 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Invalid or Expired Link
            </h1>
            <p className="text-sm text-gray-500 mb-4">
              This password reset link is no longer valid. Please request a new one.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await updateUser({ password: newPassword });
      setSuccess(true);
    } catch (err: any) {
      const msg = err.message || "";
      if (/rate limit/i.test(msg)) {
        setError("Too many attempts. Please wait a few minutes before trying again.");
      } else {
        setError(msg || "Failed to reset password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-6">
            <div className="bg-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
              <KeyRound className="w-6 h-6 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Set New Password
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Choose a new password for your account
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center">
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3 mb-4">
                Your password has been reset successfully.
              </div>
              <Link
                to="/admin"
                className="inline-block bg-indigo-600 text-white font-medium py-2.5 px-6 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Go to Admin Portal
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="Confirm new password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white font-medium py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
