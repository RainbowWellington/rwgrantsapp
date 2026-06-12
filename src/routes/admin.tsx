import {
  createFileRoute,
  Outlet,
  Link,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { getServerUser } from "../lib/auth.js";
import { useIdentity } from "../lib/identity-context.js";
import {
  autoRegisterFirstAdmin,
  isUserAdmin,
} from "../server/admin-users.js";
import {
  LayoutDashboard,
  FileText,
  Users,
  LogOut,
  Menu,
  X,
  ClipboardCheck,
  CircleDollarSign,
  BookOpen,
  TableProperties,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const user = await getServerUser();
    if (!user) {
      throw redirect({ to: "/login" });
    }
    const adminCheck = await isUserAdmin({ data: { email: user.email } });
    if (adminCheck.isFirstUser) {
      await autoRegisterFirstAdmin({
        data: { email: user.email, name: user.name || (user as any).userMetadata?.full_name },
      });
      return { user, role: "admin" as const };
    } else if (!adminCheck.isAdmin) {
      throw redirect({ to: "/login" });
    }
    return { user, role: adminCheck.role ?? ("admin" as const) };
  },
  component: AdminLayout,
});

const NAV_ITEMS = [
  { to: "/admin" as const, label: "Dashboard", icon: LayoutDashboard, exact: true, adminOnly: false },
  { to: "/admin/rounds" as const, label: "Funding Rounds", icon: CircleDollarSign, exact: false, adminOnly: false },
  { to: "/admin/applications" as const, label: "Applications", icon: FileText, exact: false, adminOnly: false },
  { to: "/admin/grants-overview" as const, label: "Grants Overview", icon: TableProperties, exact: false, adminOnly: false },
  { to: "/admin/assessments" as const, label: "Assessments", icon: ClipboardCheck, exact: false, adminOnly: false },
  { to: "/admin/criteria" as const, label: "Assessment Criteria", icon: BookOpen, exact: false, adminOnly: false },
  { to: "/admin/users" as const, label: "Manage Users", icon: Users, exact: false, adminOnly: true },
];

function AdminLayout() {
  const { user, role } = Route.useRouteContext();
  const identity = useIdentity();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || role === "admin"
  );

  const handleLogout = async () => {
    await identity.logout();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform lg:translate-x-0 lg:static lg:inset-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <Link to="/admin" className="text-lg font-bold text-gray-900">
            Grants Admin
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {visibleNavItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact }}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors [&.active]:bg-indigo-50 [&.active]:text-indigo-700"
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-medium text-indigo-700">
              {(user.name || user.email || "A").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.name || "Admin"}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-semibold text-gray-900">Grants Admin</span>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
