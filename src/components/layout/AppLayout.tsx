import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { authApi } from "../../api/authApi";
import { useAuthStore } from "../../store/authStore";

type RoleName = "ADMIN" | "OWNER" | "TEACHER" | "STUDENT" | "CASHIER";

interface NavItem {
  name: string;
  path: string;
}

const sidebarLinks: Record<RoleName, NavItem[]> = {
  OWNER: [
    { name: "Tổng quan", path: "/owner/dashboard" },
    { name: "Trung tâm", path: "/owner/centers" },
    { name: "Giáo viên", path: "/owner/teachers" },
    { name: "Học sinh", path: "/owner/students" },
    { name: "Thu ngân", path: "/owner/cashiers" },
    { name: "Lớp học", path: "/owner/classes" },
    { name: "Học phí quá hạn", path: "/owner/fee-records/overdue" },
    { name: "Thanh toán", path: "/owner/payments" },
    { name: "Đề thi", path: "/owner/tests" },
  ],
  TEACHER: [
    { name: "Dashboard", path: "/teacher/dashboard" },
    { name: "Schedule", path: "/teacher/schedule" },
    { name: "Attendance", path: "/teacher/attendance" },
    { name: "Students", path: "/teacher/students" },
    { name: "Mock Tests", path: "/teacher/tests" },
  ],
  STUDENT: [
    { name: "Dashboard", path: "/student/dashboard" },
    { name: "Schedule", path: "/student/schedule" },
    { name: "Fees", path: "/student/fees" },
    { name: "Documents", path: "/student/documents" },
  ],
  CASHIER: [
    { name: "Dashboard", path: "/cashier/dashboard" },
    { name: "Payments", path: "/cashier/payments" },
  ],
  ADMIN: [{ name: "Dashboard", path: "/admin/dashboard" }],
};

const roleLabels: Record<RoleName, string> = {
  ADMIN: "Admin Portal",
  OWNER: "Owner Portal",
  TEACHER: "Teacher Portal",
  STUDENT: "Student Portal",
  CASHIER: "Cashier Portal",
};

const AppLayout = () => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const links = user ? sidebarLinks[user.roleName] : [];

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Clearing local state is enough if the session has already expired.
    } finally {
      clearAuth();
      localStorage.removeItem("tenantId");
      navigate("/login");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Đóng menu"
          className="fixed inset-0 z-20 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-16 items-center gap-3 border-b border-gray-100 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900 text-sm font-semibold text-white">
            O
          </div>
          <div className="min-w-0">
            <div className="font-semibold leading-tight text-gray-900">Owlexa</div>
            <div className="text-xs text-gray-500">Quản lý trung tâm</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                [
                  "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-950",
                ].join(" ")
              }
            >
              {link.name}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-100 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
              {user?.fullName?.charAt(0) || user?.roleName.charAt(0) || "O"}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-gray-900">
                {user?.fullName || user?.phoneNumber || user?.email}
              </div>
              <div className="truncate text-xs text-gray-500">{user?.phoneNumber || user?.email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Mở menu"
              className="rounded-md border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="text-sm font-semibold text-gray-900">
              {user ? roleLabels[user.roleName] : "Owlexa"}
            </div>
          </div>

          {user?.centerName && (
            <div className="hidden rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-600 sm:block">
              {user.centerName}
            </div>
          )}
        </header>

        <main className="flex-1 overflow-auto bg-gray-50 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
