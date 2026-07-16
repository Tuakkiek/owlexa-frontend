import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { authApi } from "../../api/authApi";
import { clearAuthState } from "../../auth/authService";
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
    { name: "Khóa học", path: "/owner/courses" },
    { name: "Phòng học", path: "/owner/rooms" },
    { name: "Lớp học", path: "/owner/classes" },
    { name: "Điểm danh HS", path: "/owner/attendance" },
    { name: "Chấm công GV", path: "/owner/teacher-attendance" },
    { name: "Học phí", path: "/owner/fee-records/overdue" },
    { name: "Thanh toán", path: "/owner/payments" },
    { name: "Đề thi", path: "/owner/tests" },
    { name: "Phiên đăng nhập", path: "/owner/sessions" },
  ],
  TEACHER: [
    { name: "Dashboard", path: "/teacher/dashboard" },
    { name: "Schedule", path: "/teacher/schedule" },
    { name: "Attendance", path: "/teacher/attendance" },
    { name: "Students", path: "/teacher/students" },
    { name: "Essay Rubrics", path: "/teacher/essay-rubrics" },
    { name: "Essay Review", path: "/teacher/essays" },
    { name: "Mock Tests", path: "/teacher/tests" },
  ],
  STUDENT: [
    { name: "Dashboard", path: "/student/dashboard" },
    { name: "Schedule", path: "/student/schedule" },
    { name: "Attendance", path: "/student/attendance" },
    { name: "Fees", path: "/student/fees" },
    { name: "Essays", path: "/student/essays" },
    { name: "Mock Tests", path: "/student/tests" },
    { name: "Documents", path: "/student/documents" },
  ],
  CASHIER: [
    { name: "Dashboard", path: "/cashier/dashboard" },
    { name: "Thu học phí", path: "/cashier/payments" },
    { name: "Lịch sử", path: "/cashier/payment-history" },
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
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const links = user ? sidebarLinks[user.roleName] : [];

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Clearing local state is enough if the session has already expired.
    } finally {
      clearAuthState();
      localStorage.removeItem("tenantId");
      navigate("/login");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface-page">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Đóng menu"
          className="fixed inset-0 z-20 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-surface-border bg-white transition-transform lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-surface-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-btn bg-primary text-sm font-semibold text-white">
            O
          </div>
          <div className="min-w-0">
            <div className="font-semibold leading-tight text-gray-900">
              Owlexa
            </div>
            <div className="text-xs text-gray-500">Quản lý trung tâm</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                [
                  "flex items-center rounded-btn px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-primary-light hover:text-primary-active",
                ].join(" ")
              }
            >
              {link.name}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-surface-border p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-hover text-sm font-semibold text-gray-700">
              {user?.fullName?.charAt(0) || user?.roleName.charAt(0) || "O"}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-gray-900">
                {user?.fullName || user?.phoneNumber || user?.email}
              </div>
              <div className="truncate text-xs text-gray-500">
                {user?.phoneNumber || user?.email}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full rounded-btn border border-surface-border bg-white px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-surface-border bg-white px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Mở menu"
              className="rounded-btn border border-surface-border p-2 text-gray-600 transition-colors hover:bg-surface-hover lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <div className="text-sm font-semibold text-gray-900">
              {user ? roleLabels[user.roleName] : "Owlexa"}
            </div>
          </div>

          {user?.centerName && (
            <div className="hidden rounded-full border border-surface-border px-3 py-1 text-sm text-gray-600 sm:block">
              {user.centerName}
            </div>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-surface-page p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
