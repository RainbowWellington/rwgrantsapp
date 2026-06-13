import { useEffect, useRef, useState } from "react";
import { handleAuthCallback, acceptInvite, AuthError } from "@netlify/identity";
import { KeyRound } from "lucide-react";

const AUTH_HASH_PATTERN =
  /^#(confirmation_token|recovery_token|invite_token|email_change_token|access_token)=/;

export function CallbackHandler({ children }: { children: React.ReactNode }) {
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    const hash = window.location.hash;
    if (!AUTH_HASH_PATTERN.test(hash)) return;
    processed.current = true;

    // Password recovery: keep the raw token and show a "set new password" form.
    // The token is redeemed once, server-side, only when the user submits — see
    // /api/reset-password — so the single-use link can't be spent prematurely.
    const recoveryMatch = hash.match(/[#&]recovery_token=([^&]+)/);
    if (recoveryMatch) {
      setRecoveryToken(recoveryMatch[1]);
      // Strip the token from the address bar so a refresh doesn't reprocess it.
      history.replaceState(null, "", window.location.pathname);
      return;
    }

    handleAuthCallback()
      .then((result) => {
        if (result?.type === "invite" && result.token) {
          setInviteToken(result.token);
        } else if (result?.type === "confirmation" || result?.type === "oauth") {
          window.location.href = "/admin";
        }
      })
      .catch(() => {
        window.location.href = "/login";
      });
  }, []);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteToken) return;
    setLoading(true);
    setError("");
    try {
      await acceptInvite(inviteToken, password);
      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/admin";
      }, 1500);
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError("Failed to accept invite. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryToken) return;
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: recoveryToken, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password.");
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (recoveryToken) {
    return (
      <AuthCard
        title="Set New Password"
        subtitle="Choose a new password for your account"
      >
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}
        {success ? (
          <div className="text-center">
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3 mb-4">
              Your password has been reset successfully. You can now log in with
              your new password.
            </div>
            <a
              href="/login"
              className="inline-block bg-indigo-600 text-white font-medium py-2.5 px-6 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Continue to Login
            </a>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
      </AuthCard>
    );
  }

  if (inviteToken) {
    return (
      <AuthCard
        title="Accept Invite"
        subtitle="Set a password to activate your account"
      >
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}
        {success ? (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3">
            Account activated! Redirecting to the portal...
          </div>
        ) : (
          <form onSubmit={handleAccept} className="space-y-4">
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
                placeholder="Choose a password (min 6 characters)"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-medium py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Activating..." : "Activate Account"}
            </button>
          </form>
        )}
      </AuthCard>
    );
  }

  return <>{children}</>;
}

function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-6">
          <div className="bg-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
            <KeyRound className="w-6 h-6 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
