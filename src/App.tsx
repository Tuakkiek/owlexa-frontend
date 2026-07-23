import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ProtectedRoute from "./router/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import TeachersPage from "./pages/owner/TeachersPage";
import StudentsPage from "./pages/owner/StudentsPage";
import ClassesPage from "./pages/owner/ClassesPage";
import CoursesPage from "./pages/owner/CoursesPage";
import RoomsPage from "./pages/owner/RoomsPage";
import FeesPage from "./pages/owner/FeesPage";
import CentersPage from "./pages/owner/CentersPage";
import CashiersPage from "./pages/owner/CashiersPage";
import OwnerPaymentsPage from "./pages/owner/OwnerPaymentsPage";
import ReceiptPage from "./pages/owner/ReceiptPage";
import DiscountManagementPage from "./pages/owner/DiscountManagementPage";
import InstallmentManagementPage from "./pages/owner/InstallmentManagementPage";
import AuditLogPage from "./pages/owner/AuditLogPage";
import FinancialTimelinePage from "./pages/owner/FinancialTimelinePage";
import StudentFeesPage from "./pages/student/StudentFeesPage";
import StudentAttendancePage from "./pages/student/StudentAttendancePage";
import StudentDashboardPage from "./pages/student/StudentDashboardPage";
import StudentDocumentsPage from "./pages/student/StudentDocumentsPage";
import StudentEssayPage from "./pages/student/StudentEssayPage";
import StudentTestsPage from "./pages/student/StudentTestsPage";
import StudentTestTakingPage from "./pages/student/StudentTestTakingPage";
import StudentTestResultsPage from "./pages/student/StudentTestResultsPage";
import TeacherAttendancePage from "./pages/teacher/TeacherAttendancePage";
import TeacherDashboardPage from "./pages/teacher/TeacherDashboardPage";
import TeacherStudentsPage from "./pages/teacher/TeacherStudentsPage";
import TeacherEssayRubricsPage from "./pages/teacher/TeacherEssayRubricsPage";
import TeacherEssayReviewPage from "./pages/teacher/TeacherEssayReviewPage";
import OwnerDashboardPage from "./pages/owner/OwnerDashboardPage";
import OwnerTestsPage from "./pages/owner/OwnerTestsPage";
import OwnerAttendancePage from "./pages/owner/OwnerAttendancePage";
import OwnerTeacherAttendancePage from "./pages/owner/OwnerTeacherAttendancePage";
import TeacherSchedulePage from "./pages/teacher/TeacherSchedulePage";
import TeacherTestsPage from "./pages/teacher/TeacherTestsPage";
import StudentSchedulePage from "./pages/student/StudentSchedulePage";
import CashierPaymentsPage from "./pages/cashier/CashierPaymentsPage";
import CashierPaymentHistoryPage from "./pages/cashier/CashierPaymentHistoryPage";
import CashierDashboardPage from "./pages/cashier/CashierDashboardPage";
import SessionManagementPage from "./pages/owner/SessionManagementPage";
import AccountPage from "./pages/account/AccountPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";

import { ToastProvider } from "./components/ui/Toast";
import { ConfirmProvider } from "./components/ui/ConfirmDialog";

function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/register/student"
          element={<RegisterPage mode="student" />}
        />
        <Route path="/register/owner" element={<RegisterPage mode="owner" />} />

        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Protected Routes wrapped in AppLayout */}
        <Route element={<AppLayout />}>
          {/* Account — accessible to all roles (no allowedRoles filter) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/account" element={<AccountPage />} />
          </Route>

          {/* OWNER Routes */}
          <Route element={<ProtectedRoute allowedRoles={["OWNER"]} />}>
            <Route path="/owner/dashboard" element={<OwnerDashboardPage />} />
            <Route path="/owner/centers" element={<CentersPage />} />
            <Route path="/owner/teachers" element={<TeachersPage />} />
            <Route path="/owner/students" element={<StudentsPage />} />
            <Route path="/owner/cashiers" element={<CashiersPage />} />
            <Route path="/owner/classes" element={<ClassesPage />} />
            <Route path="/owner/courses" element={<CoursesPage />} />
            <Route path="/owner/rooms" element={<RoomsPage />} />
            <Route path="/owner/fees" element={<FeesPage />} />
            <Route path="/owner/fee-records/overdue" element={<FeesPage />} />
            <Route path="/owner/payments" element={<OwnerPaymentsPage />} />
            <Route
              path="/owner/payments/:paymentId/receipt"
              element={<ReceiptPage />}
            />
            <Route
              path="/owner/discounts"
              element={<DiscountManagementPage />}
            />
            <Route
              path="/owner/installments"
              element={<InstallmentManagementPage />}
            />
            <Route path="/owner/audit-logs" element={<AuditLogPage />} />
            <Route path="/owner/finance/timeline" element={<FinancialTimelinePage />} />
            <Route path="/owner/tests" element={<OwnerTestsPage />} />
            <Route
              path="/owner/mock-tests"
              element={<Navigate to="/owner/tests" replace />}
            />
            <Route path="/owner/attendance" element={<OwnerAttendancePage />} />
            <Route
              path="/owner/teacher-attendance"
              element={<OwnerTeacherAttendancePage />}
            />
            <Route path="/owner/sessions" element={<SessionManagementPage />} />
          </Route>

          {/* TEACHER Routes */}
          <Route element={<ProtectedRoute allowedRoles={["TEACHER"]} />}>
            <Route
              path="/teacher/dashboard"
              element={<TeacherDashboardPage />}
            />
            <Route path="/teacher/schedule" element={<TeacherSchedulePage />} />
            <Route
              path="/teacher/attendance"
              element={<TeacherAttendancePage />}
            />
            <Route path="/teacher/students" element={<TeacherStudentsPage />} />
            <Route
              path="/teacher/essay-rubrics"
              element={<TeacherEssayRubricsPage />}
            />
            <Route
              path="/teacher/essays"
              element={<TeacherEssayReviewPage />}
            />
            <Route path="/teacher/tests" element={<TeacherTestsPage />} />
            <Route
              path="/teacher/mock-tests"
              element={<Navigate to="/teacher/tests" replace />}
            />
          </Route>

          {/* STUDENT Routes */}
          <Route element={<ProtectedRoute allowedRoles={["STUDENT"]} />}>
            <Route
              path="/student/dashboard"
              element={<StudentDashboardPage />}
            />
            <Route path="/student/schedule" element={<StudentSchedulePage />} />
            <Route
              path="/student/attendance"
              element={<StudentAttendancePage />}
            />
            <Route path="/student/fees" element={<StudentFeesPage />} />
            <Route
              path="/student/documents"
              element={<StudentDocumentsPage />}
            />
            <Route
              path="/student/essays/:rubricId"
              element={<StudentEssayPage />}
            />
            <Route path="/student/essays" element={<StudentEssayPage />} />
            <Route path="/student/tests" element={<StudentTestsPage />} />
            <Route
              path="/student/mock-tests"
              element={<Navigate to="/student/tests" replace />}
            />
            <Route
              path="/student/tests/:attemptId/take"
              element={<StudentTestTakingPage />}
            />
            <Route
              path="/student/mock-tests/:attemptId/take"
              element={<Navigate to="/student/tests/:attemptId/take" replace />}
            />
            <Route
              path="/student/tests/results/:attemptId"
              element={<StudentTestResultsPage />}
            />
            <Route
              path="/student/mock-tests/results/:attemptId"
              element={
                <Navigate to="/student/tests/results/:attemptId" replace />
              }
            />
          </Route>

          {/* CASHIER Routes */}
          <Route element={<ProtectedRoute allowedRoles={["CASHIER"]} />}>
            <Route
              path="/cashier/dashboard"
              element={<CashierDashboardPage />}
            />
            <Route path="/cashier/payments" element={<CashierPaymentsPage />} />
            <Route
              path="/cashier/payment-history"
              element={<CashierPaymentHistoryPage />}
            />
            <Route
              path="/cashier/payments/:paymentId/receipt"
              element={<ReceiptPage />}
            />
          </Route>

          {/* MANAGER Routes — shares OWNER pages with limited sidebar */}
          <Route element={<ProtectedRoute allowedRoles={["MANAGER"]} />}>
            <Route path="/owner/dashboard" element={<OwnerDashboardPage />} />
            <Route path="/owner/centers" element={<CentersPage />} />
            <Route path="/owner/teachers" element={<TeachersPage />} />
            <Route path="/owner/students" element={<StudentsPage />} />
            <Route path="/owner/classes" element={<ClassesPage />} />
            <Route path="/owner/courses" element={<CoursesPage />} />
            <Route path="/owner/rooms" element={<RoomsPage />} />
            <Route path="/owner/attendance" element={<OwnerAttendancePage />} />
            <Route path="/owner/sessions" element={<SessionManagementPage />} />
          </Route>

          {/* ACADEMIC_STAFF Routes — limited academic operations */}
          <Route element={<ProtectedRoute allowedRoles={["ACADEMIC_STAFF"]} />}>
            <Route path="/owner/students" element={<StudentsPage />} />
            <Route path="/owner/classes" element={<ClassesPage />} />
            <Route path="/owner/attendance" element={<OwnerAttendancePage />} />
          </Route>

          {/* ADMIN Routes */}
          <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          </Route>

          {/* Unauthorized page */}
          <Route
            path="/unauthorized"
            element={
              <div className="flex min-h-screen items-center justify-center bg-surface-page">
                <div className="text-center">
                  <h1 className="text-6xl font-bold text-gray-300">403</h1>
                  <p className="mt-4 text-lg text-gray-600">
                    Bạn không có quyền truy cập trang này.
                  </p>
                  <a
                    href="/login"
                    className="mt-6 inline-block text-primary hover:underline"
                  >
                    Quay lại đăng nhập
                  </a>
                </div>
              </div>
            }
          />
        </Route>

        {/* Fallback for undefined routes */}
        <Route
          path="*"
          element={
            <div className="flex h-screen items-center justify-center bg-surface-page text-center">
              <div>
                <h1 className="text-4xl font-semibold text-gray-900">404</h1>
                <p className="mt-2 text-sm text-gray-500">Không tìm thấy trang</p>
                <a
                  href="/login"
                  className="mt-4 inline-block text-sm font-medium text-primary hover:text-primary-hover transition-colors"
                >
                  Quay lại đăng nhập
                </a>
              </div>
            </div>
          }
        />
      </Routes>
        </BrowserRouter>
      </ConfirmProvider>
    </ToastProvider>
  );
}

export default App;
