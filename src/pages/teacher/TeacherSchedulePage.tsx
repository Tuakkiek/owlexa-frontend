import { useEffect, useState, useCallback } from 'react';
import axiosClient from '../../api/axiosClient';

interface ScheduleItem {
  id: number;
  classId: number;
  className: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
  isActive: boolean;
}

const DAY_NAMES = ['', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

const DAY_COLORS: Record<number, string> = {
  2: 'bg-blue-50 border-blue-200 text-blue-700',
  3: 'bg-violet-50 border-violet-200 text-violet-700',
  4: 'bg-amber-50 border-amber-200 text-amber-700',
  5: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  6: 'bg-rose-50 border-rose-200 text-rose-700',
  7: 'bg-orange-50 border-orange-200 text-orange-700',
  1: 'bg-pink-50 border-pink-200 text-pink-700',
};

const SkeletonRow = () => (
  <div className="animate-pulse flex items-center gap-4 p-4 rounded-xl bg-gray-50">
    <div className="h-10 w-16 rounded-lg bg-gray-200" />
    <div className="flex-1 space-y-2">
      <div className="h-3 bg-gray-200 rounded w-1/3" />
      <div className="h-3 bg-gray-200 rounded w-1/4" />
    </div>
    <div className="h-3 bg-gray-200 rounded w-20" />
  </div>
);

export const TeacherSchedulePage = () => {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await axiosClient.get('/teacher/schedules/me');
      setSchedules(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Không thể tải lịch dạy.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Group by dayOfWeek
  const grouped = schedules.reduce<Record<number, ScheduleItem[]>>((acc, s) => {
    if (!acc[s.dayOfWeek]) acc[s.dayOfWeek] = [];
    acc[s.dayOfWeek].push(s);
    return acc;
  }, {});
  const sortedDays = Object.keys(grouped).map(Number).sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lịch dạy của tôi</h1>
          <p className="text-sm text-gray-500 mt-0.5">Thời khoá biểu theo tuần</p>
        </div>
        <button
          onClick={load}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50 transition"
        >
          <span className={isLoading ? 'animate-spin' : ''}>↻</span>
          Làm mới
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-rose-700 text-sm">⚠️ {error}</div>
      )}

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📅</div>
          <p className="font-medium">Bạn chưa có lịch dạy nào.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDays.map((day) => (
            <div key={day}>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {DAY_NAMES[day] ?? `Ngày ${day}`}
              </h2>
              <div className="space-y-2">
                {grouped[day]
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((s) => (
                    <div
                      key={s.id}
                      className={`flex items-center gap-4 p-4 rounded-xl border ${DAY_COLORS[day] ?? 'bg-gray-50 border-gray-200 text-gray-700'}`}
                    >
                      <div className="text-center min-w-[56px]">
                        <p className="text-xs font-medium opacity-70">{s.startTime.slice(0, 5)}</p>
                        <p className="text-[10px] opacity-50">—</p>
                        <p className="text-xs font-medium opacity-70">{s.endTime.slice(0, 5)}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{s.className}</p>
                        <p className="text-xs opacity-70">🏫 Phòng {s.room}</p>
                      </div>
                      {!s.isActive && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">Tạm dừng</span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherSchedulePage;
