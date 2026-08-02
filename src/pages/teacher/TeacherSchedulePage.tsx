import { useCallback, useEffect, useState } from "react";
import { scheduleApi } from "../../api/scheduleApi";
import { ModernWeeklySchedule } from "../../components/schedule/ModernWeeklySchedule";
import { ErrorBanner } from "../../components/ui/SharedComponents";
import type { ScheduleResponse } from "../../types/schedule";

export default function TeacherSchedulePage() {
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSchedules(await scheduleApi.findMySchedulesAsTeacher());
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể tải lịch dạy.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      {error && <ErrorBanner message={error} />}
      <ModernWeeklySchedule
        title="Lịch dạy"
        description="Theo dõi lịch dạy và lịch thi theo tuần"
        schedules={schedules}
        isLoading={isLoading}
        emptyMessage="Chưa có lịch dạy nào phù hợp."
        onRefresh={load}
      />
    </div>
  );
}
