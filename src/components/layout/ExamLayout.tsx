import { Outlet } from "react-router-dom";

const ExamLayout = () => (
  <div className="min-h-dvh bg-surface-page text-gray-900">
    <Outlet />
  </div>
);

export default ExamLayout;
