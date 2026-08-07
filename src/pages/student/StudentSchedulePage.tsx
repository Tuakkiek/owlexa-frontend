import { useCallback, useEffect, useState } from "react";
import { scheduleApi } from "../../api/scheduleApi";
import { ModernWeeklySchedule } from "../../components/schedule/ModernWeeklySchedule";
import type { ScheduleResponse } from "../../types/schedule";

export const StudentSchedulePage = () => {
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await scheduleApi.findMySchedulesAsStudent();
      setSchedules(data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể tải thời khoá biểu.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-input border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <ModernWeeklySchedule
        title="Lịch học"
        description="Theo dõi lịch học và lịch thi theo tuần"
        schedules={schedules}
        isLoading={isLoading}
        emptyMessage="Lịch trống"
        onRefresh={load}
      />
    </div>
  );
};

export default StudentSchedulePage;
