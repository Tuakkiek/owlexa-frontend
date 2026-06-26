import { Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

const AppLayout = () => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  const getSidebarLinks = () => {
    if (!user) return [];
    switch (user.roleName) {
      case "OWNER":
        return [
          { name: "Dashboard", path: "/owner/dashboard" },
          { name: "Teachers", path: "/owner/teachers" },
          { name: "Students", path: "/owner/students" },
          { name: "Classes", path: "/owner/classes" },
          { name: "Fees", path: "/owner/fees" },
        ];
      case "TEACHER":
        return [
          { name: "Dashboard", path: "/teacher/dashboard" },
          { name: "Schedule", path: "/teacher/schedule" },
          { name: "Attendance", path: "/teacher/attendance" },
          { name: "Students", path: "/teacher/students" },
        ];
      case "STUDENT":
        return [
          { name: "Dashboard", path: "/student/dashboard" },
          { name: "Schedule", path: "/student/schedule" },
          { name: "Fees", path: "/student/fees" },
          { name: "Documents", path: "/student/documents" },
        ];
      case "CASHIER":
        return [
          { name: "Dashboard", path: "/cashier/dashboard" },
          { name: "Payments", path: "/cashier/payments" },
        ];
      case "ADMIN":
        return [{ name: "Dashboard", path: "/admin/dashboard" }];
      default:
        return [];
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-5">
          <div className="text-xl font-semibold text-gray-900">Owlexa</div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5">
          {getSidebarLinks().map((link) => (
            <a
              key={link.path}
              href={link.path}
              className="flex items-center rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              {link.name}
            </a>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
          <div className="text-base font-semibold text-gray-900">
            {user?.roleName} Portal
          </div>

          <div className="flex items-center gap-x-4">
            <span className="text-sm text-gray-600">{user?.email}</span>

            <button
              onClick={handleLogout}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-white p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
