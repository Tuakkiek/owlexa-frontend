import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Building2,
  GraduationCap,
  Users,
  UserCheck,
  BookOpen,
  DoorOpen,
  Clock,
  School,
  CalendarCheck,
  CreditCard,
  Receipt,
  RotateCcw,
  ShieldCheck,
  Calendar,
  Sliders,
  HelpCircle,
  FileCheck,
  FileText,
  ClipboardList,
  Archive,
  History,
  UserCog,
  ScrollText,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
} from "lucide-react";
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
  icon: LucideIcon;
}

const sidebarLinks: Record<RoleName, NavItem[]> = {
  OWNER: [
    {
      name: "Tổng quan",
      path: "/owner/dashboard",
      permission: "DASHBOARD_OWNER",
      icon: LayoutDashboard,
    },
    { name: "Trung tâm", path: "/owner/centers", permission: "CENTER_VIEW", icon: Building2 },
    { name: "Giáo viên", path: "/owner/teachers", permission: "TEACHER_VIEW", icon: GraduationCap },
    { name: "Học sinh", path: "/owner/students", permission: "STUDENT_VIEW", icon: Users },
    { name: "Thu ngân", path: "/owner/cashiers", permission: "USER_VIEW", icon: UserCheck },
    { name: "Khóa học", path: "/owner/courses", permission: "COURSE_VIEW", icon: BookOpen },
    { name: "Phòng học", path: "/owner/rooms", permission: "ROOM_VIEW", icon: DoorOpen },
    { name: "Ca học", path: "/owner/settings/time-slots", permission: "ROOM_VIEW", icon: Clock },
    { name: "Lớp học", path: "/owner/classes", permission: "CLASS_VIEW", icon: School },
    {
      name: "Điểm danh HS",
      path: "/owner/attendance",
      permission: "ATTENDANCE_VIEW",
      icon: CalendarCheck,
    },
    {
      name: "Chấm công GV",
      path: "/owner/teacher-attendance",
      permission: "TEACHER_ATT_VIEW",
      icon: UserCheck,
    },
    {
      name: "Học phí",
      path: "/owner/fee-records/overdue",
      permission: "FEE_VIEW",
      icon: CreditCard,
    },
    { name: "Thanh toán", path: "/owner/payments", permission: "PAYMENT_VIEW", icon: Receipt },
    { name: "Hoàn tiền", path: "/owner/refunds", permission: "PAYMENT_VIEW", icon: RotateCcw },
    { name: "Phiên đăng nhập", path: "/owner/sessions", icon: ShieldCheck },
  ],
  MANAGER: [
    {
      name: "Tổng quan",
      path: "/owner/dashboard",
      permission: "DASHBOARD_OWNER",
      icon: LayoutDashboard,
    },
    { name: "Trung tâm", path: "/owner/centers", permission: "CENTER_VIEW", icon: Building2 },
    { name: "Giáo viên", path: "/owner/teachers", permission: "TEACHER_VIEW", icon: GraduationCap },
    { name: "Học sinh", path: "/owner/students", permission: "STUDENT_VIEW", icon: Users },
    { name: "Khóa học", path: "/owner/courses", permission: "COURSE_VIEW", icon: BookOpen },
    { name: "Phòng học", path: "/owner/rooms", permission: "ROOM_VIEW", icon: DoorOpen },
    { name: "Ca học", path: "/owner/settings/time-slots", permission: "ROOM_VIEW", icon: Clock },
    { name: "Lớp học", path: "/owner/classes", permission: "CLASS_VIEW", icon: School },
  ],
  ACADEMIC_STAFF: [
    { name: "Học sinh", path: "/owner/students", permission: "STUDENT_VIEW", icon: Users },
    { name: "Lớp học", path: "/owner/classes", permission: "CLASS_VIEW", icon: School },
    {
      name: "Điểm danh HS",
      path: "/owner/attendance",
      permission: "ATTENDANCE_VIEW",
      icon: CalendarCheck,
    },
  ],
  TEACHER: [
    { name: "Bảng điều khiển", path: "/teacher/dashboard", icon: LayoutDashboard },
    {
      name: "Lịch dạy",
      path: "/teacher/schedule",
      permission: "SCHEDULE_VIEW",
      icon: Calendar,
    },
    {
      name: "Điểm danh",
      path: "/teacher/attendance",
      permission: "ATTENDANCE_MARK",
      icon: CalendarCheck,
    },
    {
      name: "Tiêu chí chấm điểm",
      path: "/teacher/grading-criteria",
      permission: "ESSAY_GRADE",
      icon: Sliders,
    },
    {
      name: "Ngân hàng câu hỏi",
      path: "/teacher/questions",
      permission: "TEST_VIEW",
      icon: HelpCircle,
    },
    {
      name: "Tạo đề thi",
      path: "/teacher/assessments",
      permission: "TEST_VIEW",
      icon: FileCheck,
    },
    {
      name: "Tài liệu",
      path: "/teacher/documents",
      permission: "DOCUMENT_VIEW",
      icon: FileText,
    },
    {
      name: "Bài tập",
      path: "/teacher/assignments",
      permission: "ESSAY_GRADE",
      end: true,
      icon: ClipboardList,
    },
    {
      name: "Kho bài tập",
      path: "/teacher/assignments/archived",
      permission: "ESSAY_GRADE",
      end: true,
      icon: Archive,
    },
  ],
  STUDENT: [
    { name: "Bảng điều khiển", path: "/student/dashboard", icon: LayoutDashboard },
    {
      name: "Lịch học",
      path: "/student/schedule",
      permission: "SCHEDULE_VIEW",
      icon: Calendar,
    },
    {
      name: "Điểm danh",
      path: "/student/attendance",
      permission: "STUDENT_VIEW",
      icon: CalendarCheck,
    },
    { name: "Học phí", path: "/student/fees", permission: "PAYMENT_VIEW", icon: CreditCard },
    { name: "Tài liệu", path: "/student/documents", icon: FileText },
    { name: "Bài tập", path: "/student/assignments", icon: ClipboardList },
  ],
  CASHIER: [
    {
      name: "Bảng điều khiển",
      path: "/cashier/dashboard",
      permission: "DASHBOARD_FINANCE",
      icon: LayoutDashboard,
    },
    {
      name: "Thu học phí",
      path: "/cashier/payments",
      permission: "PAYMENT_COLLECT",
      icon: CreditCard,
    },
    {
      name: "Lịch sử",
      path: "/cashier/payment-history",
      permission: "PAYMENT_VIEW",
      icon: History,
    },
  ],
  ADMIN: [
    { name: "Bảng điều khiển", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Người dùng", path: "/admin/users", icon: UserCog },
    { name: "Trung tâm", path: "/admin/centers", icon: Building2 },
    { name: "Nhật ký quản trị", path: "/admin/audit-logs", icon: ScrollText },
  ],
};

const roleLabels: Record<RoleName, string> = {
  ADMIN: "Cổng quản trị hệ thống",
  OWNER: "Cổng quản lý trung tâm",
  MANAGER: "Cổng quản lý",
  ACADEMIC_STAFF: "Cổng giáo vụ",
  TEACHER: "Cổng giáo viên",
  STUDENT: "Cổng học viên",
  CASHIER: "Cổng thủ quỹ",
};

const COLLAPSED_SIDEBAR_WIDTH_CLASS = "w-[72px]";
const EXPANDED_SIDEBAR_WIDTH_CLASS = "w-64";

const SidebarTooltip = ({ label }: { label: string }) => (
  <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-input bg-gray-900 px-3 py-2 text-sm font-medium text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100">
    {label}
  </span>
);

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

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const sidebarWidthClass = sidebarOpen
    ? EXPANDED_SIDEBAR_WIDTH_CLASS
    : COLLAPSED_SIDEBAR_WIDTH_CLASS;

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
      <aside
        className={[
          "flex h-screen shrink-0 flex-col overflow-x-hidden border-r border-surface-border bg-white transition-all duration-300 ease-in-out",
          sidebarWidthClass,
        ].join(" ")}
      >
        <div
          className={[
            "flex h-16 shrink-0 items-center overflow-hidden transition-all duration-300",
            sidebarOpen ? "px-4 justify-between" : "px-0 justify-center",
          ].join(" ")}
        >
          <div className="flex min-w-0 items-center gap-3">
            {sidebarOpen ? (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                <img
                  src="/logo1.png"
                  alt="Owlexa Logo"
                  className="h-8 w-8 object-contain"
                />
              </div>
            ) : (
              <button
                type="button"
                aria-label="Mở thanh bên"
                onClick={toggleSidebar}
                className="group relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-btn text-gray-700 transition-colors hover:bg-surface-hover hover:text-gray-900"
              >
                <img
                  src="/logo1.png"
                  alt="Owlexa Logo"
                  className="h-8 w-8 object-contain transition-all duration-200 group-hover:scale-75 group-hover:opacity-0"
                />
                <PanelLeftOpen className="absolute h-5 w-5 opacity-0 scale-75 transition-all duration-200 group-hover:scale-100 group-hover:opacity-100" />
                <SidebarTooltip label="Mở thanh bên" />
              </button>
            )}

            <div
              className={[
                "min-w-0 overflow-hidden whitespace-nowrap transition-all duration-200 ease-in-out",
                sidebarOpen
                  ? "opacity-100 max-w-[140px]"
                  : "opacity-0 max-w-0 pointer-events-none hidden",
              ].join(" ")}
            >
              <div className="truncate text-lg font-semibold text-gray-900">Owlexa</div>
              <div className="truncate text-xs text-gray-400">
                {user ? roleLabels[user.roleName] : "Ứng dụng"}
              </div>
            </div>
          </div>

          {sidebarOpen && (
            <button
              type="button"
              aria-label="Đóng thanh bên"
              onClick={toggleSidebar}
              className="group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-btn text-gray-600 transition-colors hover:bg-surface-hover hover:text-gray-900"
            >
              <PanelLeftClose className="h-5 w-5" />
              <SidebarTooltip label="Đóng thanh bên" />
            </button>
          )}
        </div>

        <nav
          className={[
            "min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-4 transition-all duration-300",
            sidebarOpen ? "px-4 custom-scrollbar" : "px-0 no-scrollbar flex flex-col items-center",
          ].join(" ")}
        >
          <div className={sidebarOpen ? "space-y-2 w-full" : "space-y-2 flex flex-col items-center w-full"}>
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end={link.end}
                  className={({ isActive }) =>
                    [
                      "group relative flex h-10 items-center rounded-btn text-sm font-medium transition-all duration-200",
                      sidebarOpen ? "w-full px-3 gap-3" : "w-10 justify-center px-0 mx-auto",
                      isActive
                        ? "bg-primary text-white"
                        : "text-gray-600 hover:bg-surface-hover hover:text-gray-900",
                    ].join(" ")
                  }
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span
                    className={[
                      "min-w-0 truncate whitespace-nowrap overflow-hidden transition-all duration-200 ease-in-out",
                      sidebarOpen
                        ? "opacity-100 max-w-[160px]"
                        : "opacity-0 max-w-0 pointer-events-none hidden",
                    ].join(" ")}
                  >
                    {link.name}
                  </span>
                  {!sidebarOpen && <SidebarTooltip label={link.name} />}
                </NavLink>
              );
            })}
          </div>
        </nav>

        <div
          className={[
            "shrink-0 border-t border-surface-border overflow-hidden transition-all duration-300",
            sidebarOpen ? "p-3 w-full" : "py-3 px-0 flex flex-col items-center w-full",
          ].join(" ")}
        >
          <NavLink
            to="/account"
            className={({ isActive }) =>
              [
                "group relative mb-2 flex h-10 items-center rounded-btn transition-all duration-200 hover:bg-surface-hover",
                sidebarOpen ? "w-full px-2 gap-3" : "w-10 justify-center px-0 mx-auto",
                isActive ? "bg-surface-hover" : "",
              ].join(" ")
            }
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
              {user?.fullName?.charAt(0) || user?.roleName.charAt(0) || "O"}
            </div>
            <div
              className={[
                "min-w-0 flex-1 whitespace-nowrap overflow-hidden transition-all duration-200 ease-in-out",
                sidebarOpen
                  ? "opacity-100 max-w-[160px]"
                  : "opacity-0 max-w-0 pointer-events-none hidden",
              ].join(" ")}
            >
              <div className="truncate text-sm font-medium text-gray-900">
                {user?.fullName || user?.phoneNumber || user?.email}
              </div>
              <div className="truncate text-xs text-gray-400">
                {user?.phoneNumber || user?.email}
              </div>
            </div>
            {!sidebarOpen && (
              <SidebarTooltip
                label={user?.fullName || user?.phoneNumber || user?.email || "Tài khoản"}
              />
            )}
          </NavLink>

          <button
            type="button"
            onClick={handleLogout}
            className={[
              "group relative flex h-10 items-center rounded-btn text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-50",
              sidebarOpen ? "w-full px-3 gap-3" : "w-10 justify-center px-0 mx-auto",
            ].join(" ")}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span
              className={[
                "min-w-0 truncate whitespace-nowrap overflow-hidden transition-all duration-200 ease-in-out",
                sidebarOpen
                  ? "opacity-100 max-w-[160px]"
                  : "opacity-0 max-w-0 pointer-events-none hidden",
              ].join(" ")}
            >
              Đăng xuất
            </span>
            {!sidebarOpen && <SidebarTooltip label="Đăng xuất" />}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden transition-[width] duration-200 ease-in-out">
        <header className="flex h-16 items-center justify-between border-b border-surface-border bg-white px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="truncate text-sm font-semibold text-gray-900">
              {user ? roleLabels[user.roleName] : "Owlexa"}
            </div>
          </div>

          {user?.centerName && (
            <div className="hidden rounded-full border border-surface-border px-3 py-1 text-sm text-gray-500 sm:block">
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
