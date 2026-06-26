import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import ProtectedRoute from "./router/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import TeachersPage from "./pages/owner/TeachersPage";
import StudentsPage from "./pages/owner/StudentsPage";
import ClassesPage from "./pages/owner/ClassesPage";
import FeesPage from "./pages/owner/FeesPage";
import StudentFeesPage from "./pages/student/StudentFeesPage";
import StudentDashboardPage from "./pages/student/StudentDashboardPage";
import StudentDocumentsPage from "./pages/student/StudentDocumentsPage";
import StudentEssayPage from "./pages/student/StudentEssayPage";
import StudentMockTestsPage from "./pages/student/StudentMockTestsPage";
import StudentTestTakingPage from "./pages/student/StudentTestTakingPage";
import StudentTestResultsPage from "./pages/student/StudentTestResultsPage";
import TeacherAttendancePage from "./pages/teacher/TeacherAttendancePage";
import TeacherDashboardPage from "./pages/teacher/TeacherDashboardPage";
import TeacherStudentsPage from "./pages/teacher/TeacherStudentsPage";
import TeacherEssayRubricsPage from "./pages/teacher/TeacherEssayRubricsPage";
import TeacherEssayReviewPage from "./pages/teacher/TeacherEssayReviewPage";
import OwnerDashboardPage from "./pages/owner/OwnerDashboardPage";
import OwnerMockTestsPage from "./pages/owner/OwnerMockTestsPage";
import TeacherSchedulePage from "./pages/teacher/TeacherSchedulePage";
import StudentSchedulePage from "./pages/student/StudentSchedulePage";
import CashierPaymentsPage from "./pages/cashier/CashierPaymentsPage";

// Dummy Dashboard components for Phase 1 testing
const DummyDashboard = ({ role }: { role: string }) => (
  <div className="bg-white p-6 rounded shadow">
    <h2 className="text-xl font-bold">{role} Dashboard Placeholder</h2>
    <p className="mt-2 text-gray-600">
      This is a placeholder for the {role} dashboard (Phase 2+).
    </p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Protected Routes wrapped in AppLayout */}
        <Route element={<AppLayout />}>
          {/* OWNER Routes */}
          <Route element={<ProtectedRoute allowedRoles={["OWNER"]} />}>
            <Route path="/owner/dashboard" element={<OwnerDashboardPage />} />
            <Route path="/owner/teachers" element={<TeachersPage />} />
            <Route path="/owner/students" element={<StudentsPage />} />
            <Route path="/owner/classes" element={<ClassesPage />} />
            <Route path="/owner/fees" element={<FeesPage />} />
            <Route path="/owner/mock-tests" element={<OwnerMockTestsPage />} />
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
          </Route>

          {/* STUDENT Routes */}
          <Route element={<ProtectedRoute allowedRoles={["STUDENT"]} />}>
            <Route
              path="/student/dashboard"
              element={<StudentDashboardPage />}
            />
            <Route path="/student/schedule" element={<StudentSchedulePage />} />
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
            <Route
              path="/student/mock-tests"
              element={<StudentMockTestsPage />}
            />
            <Route
              path="/student/mock-tests/:attemptId/take"
              element={<StudentTestTakingPage />}
            />
            <Route
              path="/student/mock-tests/results/:attemptId"
              element={<StudentTestResultsPage />}
            />
          </Route>

          {/* CASHIER Routes */}
          <Route element={<ProtectedRoute allowedRoles={["CASHIER"]} />}>
            <Route
              path="/cashier/dashboard"
              element={<DummyDashboard role="CASHIER" />}
            />
            <Route path="/cashier/payments" element={<CashierPaymentsPage />} />
          </Route>

          {/* ADMIN Routes */}
          <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
            <Route
              path="/admin/dashboard"
              element={<DummyDashboard role="ADMIN" />}
            />
          </Route>
        </Route>

        {/* Fallback for undefined routes */}
        <Route
          path="*"
          element={
            <div className="flex h-screen items-center justify-center bg-gray-100 text-center">
              <div>
                <h1 className="text-4xl font-bold text-gray-800">404</h1>
                <p className="text-gray-600 mt-2">Page not found</p>
                <a
                  href="/login"
                  className="mt-4 inline-block text-blue-600 hover:underline"
                >
                  Go to Login
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
