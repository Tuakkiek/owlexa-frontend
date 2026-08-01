import { useState } from "react";
import { FilterTabs } from "../../../components/ui/SharedComponents";
import { TeacherReviewQueue } from "./TeacherReviewQueue";
import { TeacherSubmissionList } from "./TeacherSubmissionList";

interface TeacherGradingWorkspaceProps {
  assignmentId: number;
  assignmentTitle: string;
}

type WorkspaceTab = "grading" | "submissions";

export const TeacherGradingWorkspace = ({
  assignmentId,
  assignmentTitle,
}: TeacherGradingWorkspaceProps) => {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("grading");

  return (
    <div className="space-y-4">
      <div className="rounded-card border border-surface-border bg-surface-page p-4">
        <div className="text-base font-semibold text-gray-900">
          {assignmentTitle}
        </div>
        <div className="mt-1 text-sm text-gray-600">
          Mở bài học sinh đã nộp, ưu tiên chấm các bài mới trước, rồi hoàn tất
          và công bố kết quả ngay trong cùng một màn hình.
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
          <span className="rounded-full bg-white px-3 py-1">1. Chọn bài cần chấm</span>
          <span className="rounded-full bg-white px-3 py-1">2. Xem bài và nhập điểm</span>
          <span className="rounded-full bg-white px-3 py-1">3. Hoàn tất và công bố</span>
        </div>
      </div>

      <FilterTabs
        tabs={[
          { key: "grading", label: "Cần chấm" },
          { key: "submissions", label: "Tất cả bài nộp" },
        ]}
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as WorkspaceTab)}
      />

      {activeTab === "grading" ? (
        <TeacherReviewQueue
          assignmentId={assignmentId}
          assignmentTitle={assignmentTitle}
        />
      ) : (
        <TeacherSubmissionList
          assignmentId={assignmentId}
          assignmentTitle={assignmentTitle}
        />
      )}
    </div>
  );
};
