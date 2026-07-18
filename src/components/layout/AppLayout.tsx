import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { authApi } from "../../api/authApi";
import { clearAuthState } from "../../auth/authService";
import { useAuthStore } from "../../store/authStore";
import { usePermissions } from "../../hooks/usePermissions";

type RoleName = "ADMIN" | "OWNER" | "TEACHER" | "STUDENT" | "CASHIER" | "MANAGER" | "ACADEMIC_STAFF";

interface NavItem {
  name: string;
  path: string;
  permission?: string;
}

const sidebarLinks: Record<RoleName, NavItem[]> = {
  OWNER: [
    { name: "Tổng quan", path: "/owner/dashboard", permission: "DASHBOARD_OWNER" },
    { name: "Trung tâm", path: "/owner/centers", permission: "CENTER_VIEW" },
    { name: "Giáo viên", path: "/owner/teachers", permission: "TEACHER_VIEW" },
    { name: "Học sinh", path: "/owner/students", permission: "STUDENT_VIEW" },
    { name: "Thu ngân", path: "/owner/cashiers", permission: "USER_VIEW" },
    { name: "Khóa học", path: "/owner/courses", permission: "COURSE_VIEW" },
    { name: "Phòng học", path: "/owner/rooms", permission: "ROOM_VIEW" },
    { name: "Lớp học", path: "/owner/classes", permission: "CLASS_VIEW" },
    { name: "Điểm danh HS", path: "/owner/attendance", permission: "ATTENDANCE_VIEW" },
    { name: "Chấm công GV", path: "/owner/teacher-attendance", permission: "TEACHER_ATT_VIEW" },
    { name: "Học phí", path: "/owner/fee-records/overdue", permission: "FEE_VIEW" },
    { name: "Thanh toán", path: "/owner/payments", permission: "PAYMENT_VIEW" },
    { name: "Đề thi", path: "/owner/tests", permission: "TEST_VIEW" },
    { name: "Phiên đăng nhập", path: "/owner/sessions" },
  ],
  MANAGER: [
    { name: "Tổng quan", path: "/owner/dashboard", permission: "DASHBOARD_OWNER" },
    { name: "Trung tâm", path: "/owner/centers", permission: "CENTER_VIEW" },
    { name: "Giáo viên", path: "/owner/teachers", permission: "TEACHER_VIEW" },
    { name: "Học sinh", path: "/owner/students", permission: "STUDENT_VIEW" },
    { name: "Khóa học", path: "/owner/courses", permission: "COURSE_VIEW" },
    { name: "Phòng học", path: "/owner/rooms", permission: "ROOM_VIEW" },
    { name: "Lớp học", path: "/owner/classes", permission: "CLASS_VIEW" },
  ],
  ACADEMIC_STAFF: [
    { name: "Học sinh", path: "/owner/students", permission: "STUDENT_VIEW" },
    { name: "Lớp học", path: "/owner/classes", permission: "CLASS_VIEW" },
    { name: "Điểm danh HS", path: "/owner/attendance", permission: "ATTENDANCE_VIEW" },
  ],
  TEACHER: [
    { name: "Dashboard", path: "/teacher/dashboard" },
    { name: "Schedule", path: "/teacher/schedule", permission: "SCHEDULE_VIEW" },
    { name: "Attendance", path: "/teacher/attendance", permission: "ATTENDANCE_MARK" },
    { name: "Students", path: "/teacher/students", permission: "CLASS_VIEW" },
    { name: "Essay Rubrics", path: "/teacher/essay-rubrics" },
    { name: "Essay Review", path: "/teacher/essays", permission: "ESSAY_VIEW" },
    { name: "Mock Tests", path: "/teacher/tests", permission: "TEST_VIEW" },
  ],
  STUDENT: [
    { name: "Dashboard", path: "/student/dashboard" },
    { name: "Schedule", path: "/student/schedule", permission: "SCHEDULE_VIEW" },
    { name: "Attendance", path: "/student/attendance", permission: "STUDENT_VIEW" },
    { name: "Fees", path: "/student/fees", permission: "PAYMENT_VIEW" },
    { name: "Essays", path: "/student/essays", permission: "ESSAY_VIEW" },
    { name: "Mock Tests", path: "/student/tests" },
    { name: "Documents", path: "/student/documents" },
  ],
  CASHIER: [
    { name: "Dashboard", path: "/cashier/dashboard", permission: "DASHBOARD_FINANCE" },
    { name: "Thu học phí", path: "/cashier/payments", permission: "PAYMENT_COLLECT" },
    { name: "Lịch sử", path: "/cashier/payment-history", permission: "PAYMENT_VIEW" },
  ],
  ADMIN: [{ name: "Dashboard", path: "/admin/dashboard" }],
};

const roleLabels: Record<RoleName, string> = {
  ADMIN: "Admin Portal",
  OWNER: "Owner Portal",
  MANAGER: "Manager Portal",
  ACADEMIC_STAFF: "Academic Portal",
  TEACHER: "Teacher Portal",
  STUDENT: "Student Portal",
  CASHIER: "Cashier Portal",
};

const AppLayout = () => {
  const user = useAuthStore((state) => state.user);
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const links = user ? (sidebarLinks[user.roleName] || []).filter(link => !link.permission || hasPermission(link.permission)) : [];

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
          <NavLink
            to="/account"
            onClick={() => setSidebarOpen(false)}
            className="mb-3 flex items-center gap-3 rounded-btn p-2 -mx-2 transition-colors hover:bg-surface-hover"
          >
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
          </NavLink>
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
