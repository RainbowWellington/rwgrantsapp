import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  getAdminUsers,
  addAdminUser,
  removeAdminUser,
  updateAdminUser,
} from "../../server/admin-users.js";
import { useState, useEffect } from "react";
import { useIdentity } from "../../lib/identity-context.js";
import { UserPlus, Trash2, Shield, Mail, Eye, RefreshCw, Pencil, X, Key } from "lucide-react";

export const Route = createFileRoute("/admin/users")({
  beforeLoad: async ({ context }) => {
    const { role } = context as { role: string };
    if (role !== "admin") {
      throw redirect({ to: "/admin" });
    }
  },
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const { user } = useIdentity();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"reviewer" | "admin">("reviewer");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [identityStatus, setIdentityStatus] = useState("");
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<"reviewer" | "admin">("reviewer");
  const [editPassword, setEditPassword] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const syncIdentityUser = async (
    email: string,
    name: string | undefined,
    method: "POST" | "DELETE"
  ) => {
    try {
      const res = await fetch("/api/manage-identity-user", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setIdentityStatus(
          `Portal updated, but Identity sync failed: ${data.error}`
        );
        return;
      }
      if (data.alreadyExists) {
        setIdentityStatus("User already has a Netlify Identity account.");
      } else if (method === "POST") {
        setIdentityStatus("Invite email sent to the user.");
      }
    } catch {
      setIdentityStatus(
        "Portal updated, but could not sync with Netlify Identity."
      );
    }
  };

  const loadUsers = async () => {
    const data = await getAdminUsers();
    setUsers(data);
    setLoading(false);
  };

  const openEditModal = (u: any) => {
    setEditingUser(u);
    setEditName(u.name || "");
    setEditEmail(u.email);
    setEditRole(u.role === "admin" ? "admin" : "reviewer");
    setEditPassword("");
    setEditError("");
    setIdentityStatus("");
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditSaving(true);
    setEditError("");
    setIdentityStatus("");

    try {
      const emailChanged =
        editEmail.trim().toLowerCase() !== editingUser.email.toLowerCase();
      await updateAdminUser({
        data: {
          id: editingUser.id,
          email: emailChanged ? editEmail.trim() : undefined,
          name: editName.trim() || undefined,
          role: editRole,
        },
      });

      const hasIdentityUpdates =
        emailChanged || editPassword || editName.trim() !== (editingUser.name || "");
      if (hasIdentityUpdates) {
        try {
          const res = await fetch("/api/manage-identity-user", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: editingUser.email,
              newEmail: emailChanged ? editEmail.trim() : undefined,
              name: editName.trim(),
              password: editPassword || undefined,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            setIdentityStatus(
              `Portal updated, but Identity sync failed: ${data.error}`
            );
          } else {
            setIdentityStatus("User updated successfully.");
          }
        } catch {
          setIdentityStatus(
            "Portal updated, but could not sync with Netlify Identity."
          );
        }
      } else {
        setIdentityStatus("User updated successfully.");
      }

      setEditingUser(null);
      await loadUsers();
    } catch (err: any) {
      setEditError(err.message || "Failed to update user");
    } finally {
      setEditSaving(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setAdding(true);
    setError("");
    setIdentityStatus("");
    try {
      await addAdminUser({
        data: {
          email: email.trim(),
          name: name.trim() || undefined,
          role,
        },
      });
      await syncIdentityUser(email.trim(), name.trim() || undefined, "POST");
      setEmail("");
      setName("");
      setRole("reviewer");
      await loadUsers();
    } catch (err: any) {
      setError(err.message || "Failed to add user");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: number, adminEmail: string) => {
    if (adminEmail.toLowerCase() === user?.email?.toLowerCase()) {
      if (!confirm("Are you sure you want to remove yourself?")) {
        return;
      }
    }
    setIdentityStatus("");
    await removeAdminUser({ data: { id } });
    await syncIdentityUser(adminEmail, undefined, "DELETE");
    await loadUsers();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Portal Users</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">
          Invite User
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Add an email address to grant portal access. The user must also have a
          Netlify Identity account to log in.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-3">
            {error}
          </div>
        )}

        {identityStatus && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3 mb-3 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 flex-shrink-0" />
            {identityStatus}
          </div>
        )}

        <form onSubmit={handleAdd} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name (optional)"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Role:</span>
            <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
              <input
                type="radio"
                name="role"
                value="reviewer"
                checked={role === "reviewer"}
                onChange={() => setRole("reviewer")}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              Reviewer
            </label>
            <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
              <input
                type="radio"
                name="role"
                value="admin"
                checked={role === "admin"}
                onChange={() => setRole("admin")}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              Admin
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={adding}
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" />
              {adding ? "Adding..." : "Invite User"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">
            Portal Users ({users.length})
          </h2>
        </div>
        {users.length === 0 ? (
          <div className="p-5 text-center text-sm text-gray-500">
            No users configured.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {users.map((u) => (
              <li
                key={u.id}
                className="px-5 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    {u.role === "admin" ? (
                      <Shield className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Eye className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {u.name || u.email}
                      {u.email.toLowerCase() ===
                        user?.email?.toLowerCase() && (
                        <span className="text-xs text-gray-400 ml-2">
                          (you)
                        </span>
                      )}
                      <span
                        className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.role === "admin"
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {u.role === "admin" ? "Admin" : "Reviewer"}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {u.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(u)}
                    className="text-gray-400 hover:text-indigo-600 transition-colors p-1"
                    title="Edit user"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemove(u.id, u.email)}
                    className="text-gray-400 hover:text-red-600 transition-colors p-1"
                    title="Remove user"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Inviting a user here also sends them a Netlify
          Identity invite email to set up their account. Removing a user also
          removes their Identity account. Reviewers can view and edit
          applications but cannot manage users.
        </p>
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit User</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSave} className="p-5 space-y-4">
              {editError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                  {editError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Full name"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="radio"
                      name="editRole"
                      value="reviewer"
                      checked={editRole === "reviewer"}
                      onChange={() => setEditRole("reviewer")}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    Reviewer
                  </label>
                  <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="radio"
                      name="editRole"
                      value="admin"
                      checked={editRole === "admin"}
                      onChange={() => setEditRole("admin")}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    Admin
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" />
                  New Password
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                  minLength={8}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 8 characters. Only fill in if you want to change the password.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {editSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
