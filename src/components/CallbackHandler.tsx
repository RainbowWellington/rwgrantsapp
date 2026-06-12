import { useEffect, useRef, useState } from "react";
import { handleAuthCallback, acceptInvite, AuthError } from "@netlify/identity";

const AUTH_HASH_PATTERN =
  /^#(confirmation_token|recovery_token|invite_token|email_change_token|access_token)=/;

export function CallbackHandler({ children }: { children: React.ReactNode }) {
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    if (!AUTH_HASH_PATTERN.test(window.location.hash)) return;
    processed.current = true;

    handleAuthCallback()
      .then((result) => {
        if (result?.type === "invite" && result.token) {
          setInviteToken(result.token);
        } else if (result?.type === "recovery") {
          window.location.href = "/reset-password";
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

  if (inviteToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Accept Invite
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Set a password to activate your account
            </p>
          </div>

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
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
