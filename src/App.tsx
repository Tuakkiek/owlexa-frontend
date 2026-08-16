import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ProtectedRoute from "./router/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import ExamLayout from "./components/layout/ExamLayout";
import TeachersPage from "./pages/owner/TeachersPage";
import StudentsPage from "./pages/owner/StudentsPage";
import ClassesPage from "./pages/owner/ClassesPage";
import CoursesPage from "./pages/owner/CoursesPage";
import RoomsPage from "./pages/owner/RoomsPage";
import { OwnerTimeSlotsPage } from "./pages/owner/OwnerTimeSlotsPage";
import FeesPage from "./pages/owner/FeesPage";
import CentersPage from "./pages/owner/CentersPage";
import CashiersPage from "./pages/owner/CashiersPage";
import OwnerPaymentsPage from "./pages/owner/OwnerPaymentsPage";
import ReceiptPage from "./pages/owner/ReceiptPage";
import AuditLogPage from "./pages/owner/AuditLogPage";
import FinancialTimelinePage from "./pages/owner/FinancialTimelinePage";
import RefundsPage from "./pages/owner/RefundsPage";
import StudentFeesPage from "./pages/student/StudentFeesPage";
import StudentAttendancePage from "./pages/student/StudentAttendancePage";
import StudentDashboardPage from "./pages/student/StudentDashboardPage";
import StudentDocumentsPage from "./pages/student/StudentDocumentsPage";
import StudentAssignmentsPage from "./pages/student/StudentAssignmentsPage";
import StudentSubmissionAttemptPage from "./pages/student/StudentSubmissionAttemptPage";

import TeacherAttendancePage from "./pages/teacher/TeacherAttendancePage";
import TeacherDashboardPage from "./pages/teacher/TeacherDashboardPage";
import GradingCriteriaPage from "./pages/teacher/GradingCriteriaPage";
import QuestionBankPage from "./pages/teacher/QuestionBankPage";
import QuestionEditorPage from "./pages/teacher/QuestionEditorPage";
import AssessmentBuilderPage from "./pages/teacher/AssessmentBuilderPage";
import TeacherAssignmentsPage from "./pages/teacher/TeacherAssignmentsPage";
import TeacherArchivedAssignmentsPage from "./pages/teacher/TeacherArchivedAssignmentsPage";
import TeacherDocumentsPage from "./pages/teacher/TeacherDocumentsPage";


import OwnerDashboardPage from "./pages/owner/OwnerDashboardPage";

import OwnerAttendancePage from "./pages/owner/OwnerAttendancePage";
import OwnerTeacherAttendancePage from "./pages/owner/OwnerTeacherAttendancePage";
import TeacherSchedulePage from "./pages/teacher/TeacherSchedulePage";

import StudentSchedulePage from "./pages/student/StudentSchedulePage";
import CashierPaymentsPage from "./pages/cashier/CashierPaymentsPage";
import CashierPaymentHistoryPage from "./pages/cashier/CashierPaymentHistoryPage";
import CashierDashboardPage from "./pages/cashier/CashierDashboardPage";
import SessionManagementPage from "./pages/owner/SessionManagementPage";
import AccountPage from "./pages/account/AccountPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminCentersPage from "./pages/admin/AdminCentersPage";
import AdminAuditLogPage from "./pages/admin/AdminAuditLogPage";

import { ToastProvider } from "./components/ui/ToastProvider";
import { ConfirmProvider } from "./components/ui/ConfirmProvider";

function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/register/owner"
              element={<RegisterPage />}
            />

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
                <Route
                  path="/owner/dashboard"
                  element={<OwnerDashboardPage />}
                />
                <Route path="/owner/centers" element={<CentersPage />} />
                <Route path="/owner/teachers" element={<TeachersPage />} />
                <Route path="/owner/students" element={<StudentsPage />} />
                <Route path="/owner/cashiers" element={<CashiersPage />} />
                <Route path="/owner/classes" element={<ClassesPage />} />
                <Route path="/owner/courses" element={<CoursesPage />} />
                <Route path="/owner/rooms" element={<RoomsPage />} />
                <Route
                  path="/owner/settings/time-slots"
                  element={<OwnerTimeSlotsPage />}
                />
                <Route path="/owner/fees" element={<FeesPage />} />
                <Route
                  path="/owner/fee-records/overdue"
                  element={<FeesPage />}
                />
                <Route path="/owner/payments" element={<OwnerPaymentsPage />} />
                <Route
                  path="/owner/payments/:paymentId/receipt"
                  element={<ReceiptPage />}
                />
                <Route path="/owner/audit-logs" element={<AuditLogPage />} />
                <Route
                  path="/owner/finance/timeline"
                  element={<FinancialTimelinePage />}
                />
                <Route
                  path="/owner/refunds"
                  element={<RefundsPage />}
                />

                <Route
                  path="/owner/attendance"
                  element={<OwnerAttendancePage />}
                />
                <Route
                  path="/owner/teacher-attendance"
                  element={<OwnerTeacherAttendancePage />}
                />
                <Route
                  path="/owner/sessions"
                  element={<SessionManagementPage />}
                />
              </Route>

              {/* TEACHER Routes */}
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={["TEACHER"]}
                    permission="TEACHER_DASHBOARD"
                  />
                }
              >
                <Route
                  path="/teacher/dashboard"
                  element={<TeacherDashboardPage />}
                />
              </Route>
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={["TEACHER"]}
                    permission="TEACHER_SCHEDULE"
                  />
                }
              >
                <Route
                  path="/teacher/schedule"
                  element={<TeacherSchedulePage />}
                />
              </Route>
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={["TEACHER"]}
                    permission="TEACHER_ATTENDANCE"
                  />
                }
              >
                <Route
                  path="/teacher/attendance"
                  element={<TeacherAttendancePage />}
                />
              </Route>
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={["TEACHER"]}
                    permission="TEACHER_GRADING_CRITERIA"
                  />
                }
              >
                <Route
                  path="/teacher/grading-criteria"
                  element={<GradingCriteriaPage />}
                />
              </Route>
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={["TEACHER"]}
                    permission="TEACHER_QUESTION_BANK"
                  />
                }
              >
                <Route
                  path="/teacher/questions"
                  element={<QuestionBankPage />}
                />
                <Route
                  path="/teacher/questions/new"
                  element={<QuestionEditorPage />}
                />
                <Route
                  path="/teacher/questions/:questionId/edit"
                  element={<QuestionEditorPage />}
                />
              </Route>
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={["TEACHER"]}
                    permission="TEACHER_ASSESSMENTS"
                  />
                }
              >
                <Route
                  path="/teacher/assessments"
                  element={<AssessmentBuilderPage />}
                />
              </Route>
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={["TEACHER"]}
                    permission="TEACHER_ASSIGNMENTS"
                  />
                }
              >
                <Route
                  path="/teacher/assignments"
                  element={<TeacherAssignmentsPage />}
                />
                <Route
                  path="/teacher/assignments/archived"
                  element={<TeacherArchivedAssignmentsPage />}
                />
              </Route>
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={["TEACHER"]}
                    permission="TEACHER_DOCUMENTS"
                  />
                }
              >
                <Route
                  path="/teacher/documents"
                  element={<TeacherDocumentsPage />}
                />
              </Route>

              {/* STUDENT Routes */}
              <Route element={<ProtectedRoute allowedRoles={["STUDENT"]} />}>
                <Route
                  path="/student/dashboard"
                  element={<StudentDashboardPage />}
                />
                <Route
                  path="/student/schedule"
                  element={<StudentSchedulePage />}
                />
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
                  path="/student/assignments"
                  element={<StudentAssignmentsPage />}
                />
              </Route>

              {/* CASHIER Routes */}
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={["CASHIER"]}
                    permission="CASHIER_DASHBOARD"
                  />
                }
              >
                <Route
                  path="/cashier/dashboard"
                  element={<CashierDashboardPage />}
                />
              </Route>
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={["CASHIER"]}
                    permission="CASHIER_PAYMENTS"
                  />
                }
              >
                <Route
                  path="/cashier/payments"
                  element={<CashierPaymentsPage />}
                />
              </Route>
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={["CASHIER"]}
                    permission="CASHIER_PAYMENT_HISTORY"
                  />
                }
              >
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
                <Route
                  path="/owner/dashboard"
                  element={<OwnerDashboardPage />}
                />
                <Route path="/owner/centers" element={<CentersPage />} />
                <Route path="/owner/teachers" element={<TeachersPage />} />
                <Route path="/owner/students" element={<StudentsPage />} />
                <Route path="/owner/classes" element={<ClassesPage />} />
                <Route path="/owner/courses" element={<CoursesPage />} />
                <Route path="/owner/rooms" element={<RoomsPage />} />
                <Route
                  path="/owner/settings/time-slots"
                  element={<OwnerTimeSlotsPage />}
                />
                <Route
                  path="/owner/attendance"
                  element={<OwnerAttendancePage />}
                />
                <Route
                  path="/owner/sessions"
                  element={<SessionManagementPage />}
                />
              </Route>

              {/* ACADEMIC_STAFF Routes — limited academic operations */}
              <Route
                element={<ProtectedRoute allowedRoles={["ACADEMIC_STAFF"]} />}
              >
                <Route path="/owner/students" element={<StudentsPage />} />
                <Route path="/owner/classes" element={<ClassesPage />} />
                <Route
                  path="/owner/attendance"
                  element={<OwnerAttendancePage />}
                />
              </Route>

              {/* ADMIN Routes */}
              <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
                <Route
                  path="/admin/dashboard"
                  element={<AdminDashboardPage />}
                />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/centers" element={<AdminCentersPage />} />
                <Route path="/admin/audit-logs" element={<AdminAuditLogPage />} />
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

            <Route element={<ProtectedRoute allowedRoles={["STUDENT"]} />}>
              <Route element={<ExamLayout />}>
                <Route
                  path="/student/submission-attempts/:attemptId"
                  element={<StudentSubmissionAttemptPage />}
                />
              </Route>
            </Route>

            {/* Fallback for undefined routes */}
            <Route
              path="*"
              element={
                <div className="flex h-screen items-center justify-center bg-surface-page text-center">
                  <div>
                    <h1 className="text-4xl font-semibold text-gray-900">
                      404
                    </h1>
                    <p className="mt-2 text-sm text-gray-500">
                      Không tìm thấy trang
                    </p>
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
