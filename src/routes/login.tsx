import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { login, requestPasswordRecovery } from "@netlify/identity";
import { useIdentity } from "../lib/identity-context.js";
import { useState } from "react";
import { ArrowLeft, LogIn, KeyRound } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { user, ready } = useIdentity();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    navigate({ to: "/admin" });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(email, password);
      navigate({ to: "/admin" });
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await requestPasswordRecovery(email);
      setRecoverySent(true);
    } catch (err: any) {
      const msg = err.message || "";
      if (/rate limit/i.test(msg)) {
        setError("Too many recovery requests. Please wait a few minutes before trying again.");
      } else {
        setError(msg || "Failed to send recovery email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (forgotMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <button
              onClick={() => {
                setForgotMode(false);
                setRecoverySent(false);
                setError("");
              }}
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-6">
              <div className="bg-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                <KeyRound className="w-6 h-6 text-indigo-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Reset Password
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Enter your email to receive a password reset link
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
                {error}
              </div>
            )}

            {recoverySent ? (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3">
                A password reset link has been sent to <strong>{email}</strong>. Check your email and click the link to set a new password.
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    placeholder="admin@example.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white font-medium py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-6">
            <div className="bg-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
              <LogIn className="w-6 h-6 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Admin Login
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Sign in to access the admin portal
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-medium py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Please wait..." : "Sign In"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setForgotMode(true);
                setError("");
              }}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Forgot your password?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
