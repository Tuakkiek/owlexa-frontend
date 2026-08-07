import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { authApi } from "../../api/authApi";
import { clearAuthState } from "../../auth/authService";
import { usePermissions } from "../../hooks/usePermissions";
import { useAuthStore } from "../../store/authStore";

type RoleName =
  | "ADMIN"
  | "OWNER"
  | "TEACHER"
  | "STUDENT"
  | "CASHIER"
  | "MANAGER"
  | "ACADEMIC_STAFF";

interface NavItem {
  name: string;
  path: string;
  permission?: string;
  end?: boolean;
}

const sidebarLinks: Record<RoleName, NavItem[]> = {
  OWNER: [
    {
      name: "Tổng quan",
      path: "/owner/dashboard",
      permission: "DASHBOARD_OWNER",
    },
    { name: "Trung tâm", path: "/owner/centers", permission: "CENTER_VIEW" },
    { name: "Giáo viên", path: "/owner/teachers", permission: "TEACHER_VIEW" },
    { name: "Học sinh", path: "/owner/students", permission: "STUDENT_VIEW" },
    { name: "Thu ngân", path: "/owner/cashiers", permission: "USER_VIEW" },
    { name: "Khóa học", path: "/owner/courses", permission: "COURSE_VIEW" },
    { name: "Phòng học", path: "/owner/rooms", permission: "ROOM_VIEW" },
    { name: "Lớp học", path: "/owner/classes", permission: "CLASS_VIEW" },
    {
      name: "Điểm danh HS",
      path: "/owner/attendance",
      permission: "ATTENDANCE_VIEW",
    },
    {
      name: "Chấm công GV",
      path: "/owner/teacher-attendance",
      permission: "TEACHER_ATT_VIEW",
    },
    {
      name: "Học phí",
      path: "/owner/fee-records/overdue",
      permission: "FEE_VIEW",
    },
    { name: "Thanh toán", path: "/owner/payments", permission: "PAYMENT_VIEW" },
    { name: "Phiên đăng nhập", path: "/owner/sessions" },
  ],
  MANAGER: [
    {
      name: "Tổng quan",
      path: "/owner/dashboard",
      permission: "DASHBOARD_OWNER",
    },
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
    {
      name: "Điểm danh HS",
      path: "/owner/attendance",
      permission: "ATTENDANCE_VIEW",
    },
  ],
  TEACHER: [
    { name: "Bảng điều khiển", path: "/teacher/dashboard" },
    {
      name: "Lịch dạy",
      path: "/teacher/schedule",
      permission: "SCHEDULE_VIEW",
    },
    {
      name: "Điểm danh",
      path: "/teacher/attendance",
      permission: "ATTENDANCE_MARK",
    },
    {
      name: "Tiêu chí chấm điểm",
      path: "/teacher/grading-criteria",
      permission: "ESSAY_GRADE",
    },
    {
      name: "Ngân hàng câu hỏi",
      path: "/teacher/questions",
      permission: "TEST_VIEW",
    },
    {
      name: "Tạo đề thi",
      path: "/teacher/assessments",
      permission: "TEST_VIEW",
    },
    {
      name: "Tài liệu",
      path: "/teacher/documents",
      permission: "DOCUMENT_VIEW",
    },
    {
      name: "Bài tập",
      path: "/teacher/assignments",
      permission: "ESSAY_GRADE",
      end: true,
    },
    {
      name: "Kho bài tập",
      path: "/teacher/assignments/archived",
      permission: "ESSAY_GRADE",
      end: true,
    },
  ],
  STUDENT: [
    { name: "Bảng điều khiển", path: "/student/dashboard" },
    {
      name: "Lịch học",
      path: "/student/schedule",
      permission: "SCHEDULE_VIEW",
    },
    {
      name: "Điểm danh",
      path: "/student/attendance",
      permission: "STUDENT_VIEW",
    },
    { name: "Học phí", path: "/student/fees", permission: "PAYMENT_VIEW" },
    { name: "Tài liệu", path: "/student/documents" },
    { name: "Bài tập", path: "/student/assignments" },
  ],
  CASHIER: [
    {
      name: "Bảng điều khiển",
      path: "/cashier/dashboard",
      permission: "DASHBOARD_FINANCE",
    },
    {
      name: "Thu học phí",
      path: "/cashier/payments",
      permission: "PAYMENT_COLLECT",
    },
    {
      name: "Lịch sử",
      path: "/cashier/payment-history",
      permission: "PAYMENT_VIEW",
    },
  ],
  ADMIN: [{ name: "Bảng điều khiển", path: "/admin/dashboard" }],
};

const roleLabels: Record<RoleName, string> = {
  ADMIN: "Cổng quản trị hệ thống",
  OWNER: "Cổng quản lý trung tâm",
  MANAGER: "Cổng quản lý",
  ACADEMIC_STAFF: "Cổng giáo vụ",
  TEACHER: "Cổng giáo viên",
  STUDENT: "Cổng học viên",
  CASHIER: "Cổng thủ ngân",
};

const AppLayout = () => {
  const user = useAuthStore((state) => state.user);
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = user
    ? (sidebarLinks[user.roleName] || []).filter(
        (link) => !link.permission || hasPermission(link.permission),
      )
    : [];

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
          "fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-surface-border bg-white transition-transform lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-16 items-center gap-3 border-b border-surface-border px-6">
          <img src="/logo1.png" alt="Owlexa Logo" className="h-10 w-10 object-contain" />
          <div className="min-w-0">
            <div className="font-semibold leading-tight text-gray-900">
              Owlexa
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.end}
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

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
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

        <main className="flex-1 overflow-auto bg-surface-page p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
