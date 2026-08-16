import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, Inbox, Clock, MapPin, Users, CheckCircle, Clock3 } from "lucide-react";
import { attendanceApi } from "../../api/attendanceApi";
import { classApi } from "../../api/classApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  PageHeader,
  StatCard,
  Card,
  ErrorBanner,
  LoadingSkeleton,
  EmptyState,
} from "../../components/ui/SharedComponents";
import type {
  AttendanceResponse,
  AttendanceStatus,
  ClassSessionResponse,
} from "../../types/attendance";
import { STATUS_META } from "../../types/attendance";
import type { TeacherClassStudents } from "../../types/teacherClassStudents";

export default function OwnerAttendancePage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [sessions, setSessions] = useState<ClassSessionResponse[]>([]);
  const [classes, setClasses] = useState<TeacherClassStudents[]>([]);
  const [selectedSession, setSelectedSession] = useState<ClassSessionResponse | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceResponse[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [error, setError] = useState("");

  // Load basic data
  const loadInitialData = useCallback(async () => {
    try {
      const classData = await classApi.findAllClassesWithStudentsForOwner();
      setClasses(classData);
    } catch (err: any) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Load sessions when date changes
  const loadSessions = useCallback(async () => {
    if (!date) return;
    try {
      setIsLoading(true);
      setError("");
      const sessionData = await attendanceApi.findClassSessionsByDate(date);
      setSessions(sessionData);
      setSelectedSession(null); // Reset selection on date change
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Không thể tải danh sách buổi học.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [date]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Load detail attendance when session is selected
  const loadAttendance = useCallback(async () => {
    if (!selectedSession) {
      setAttendanceRecords([]);
      return;
    }
    try {
      setIsLoadingDetail(true);
      setError("");
      const records = await attendanceApi.findByScheduleEventOwner(
        selectedSession.scheduleEventId,
        date
      );
      setAttendanceRecords(records);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Không thể tải danh sách điểm danh.",
      );
      setAttendanceRecords([]);
    } finally {
      setIsLoadingDetail(false);
    }
  }, [selectedSession, date]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  // Derived state for detail view
  const selectedClass = useMemo(
    () => classes.find((c) => c.id === selectedSession?.classId) ?? null,
    [classes, selectedSession?.classId]
  );

  const summary = useMemo(() => {
    const counts: Record<AttendanceStatus, number> = {
      PRESENT: 0,
      ABSENT: 0,
      LATE: 0,
      EXCUSED: 0,
    };
    attendanceRecords.forEach((r) => {
      if (counts[r.status] !== undefined) counts[r.status] += 1;
    });
    return counts;
  }, [attendanceRecords]);

  const studentRows = useMemo(() => {
    if (!selectedClass) return [];
    const recordMap = new Map<number, AttendanceResponse>();
    attendanceRecords.forEach((r) => recordMap.set(r.studentUserId, r));
    return selectedClass.students.map((s) => {
      const record = recordMap.get(s.userId);
      return {
        userId: s.userId,
        fullName: s.fullName,
        phoneNumber: s.phoneNumber,
        status: record?.status ?? null,
        note: record?.note ?? "",
        hasRecord: !!record,
      };
    });
  }, [selectedClass, attendanceRecords]);

  const handleExportCSV = () => {
    if (studentRows.length === 0) return;
    const header = "Họ tên,SĐT,Trạng thái,Ghi chú";
    const rows = studentRows.map(
      (r) =>
        `"${r.fullName}","${r.phoneNumber}","${
          r.hasRecord && r.status
            ? STATUS_META[r.status]?.label ?? r.status
            : "Chưa điểm danh"
        }","${r.note}"`,
    );
    const csv = "\uFEFF" + [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `diem-danh-${selectedClass?.className ?? "lop"}-${date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const groupSessionsByTime = (sessions: ClassSessionResponse[]) => {
    const morning: ClassSessionResponse[] = [];
    const afternoon: ClassSessionResponse[] = [];
    const evening: ClassSessionResponse[] = [];

    sessions.forEach(session => {
      const hour = parseInt(session.startTime.split(':')[0], 10);
      if (hour < 12) {
        morning.push(session);
      } else if (hour < 17) {
        afternoon.push(session);
      } else {
        evening.push(session);
      }
    });

    return { Sáng: morning, Chiều: afternoon, Tối: evening };
  };

  const groupedSessions = useMemo(() => groupSessionsByTime(sessions), [sessions]);

  // Prev / Next day handlers
  const handlePrevDay = () => {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    setDate(d.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    setDate(d.toISOString().split("T")[0]);
  };

  // Render detail view
  if (selectedSession) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setSelectedSession(null)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Chi tiết điểm danh
            </h1>
            <p className="text-sm text-gray-500">
              {selectedSession.className} · {selectedSession.startTime.slice(0, 5)} - {selectedSession.endTime.slice(0, 5)} · Ngày {date.split('-').reverse().join('/')}
            </p>
          </div>
          {studentRows.length > 0 && (
            <Button variant="secondary" onClick={handleExportCSV}>
              Xuất CSV
            </Button>
          )}
        </div>

        {error && <ErrorBanner message={error} />}

        <div className="grid gap-4 sm:grid-cols-4">
          {(["PRESENT", "ABSENT", "LATE", "EXCUSED"] as AttendanceStatus[]).map(
            (status) => (
              <StatCard
                key={status}
                label={STATUS_META[status].label}
                value={summary[status]}
              />
            ),
          )}
        </div>

        {isLoadingDetail ? (
          <LoadingSkeleton count={4} />
        ) : !selectedClass || studentRows.length === 0 ? (
          <EmptyState
            message="Chưa có học sinh nào trong lớp hoặc chưa có dữ liệu điểm danh."
            icon={Inbox}
          />
        ) : (
          <Card className="p-0 overflow-hidden">
            <div className="border-b border-surface-border px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Danh sách học sinh
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {studentRows.length} học sinh
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-border bg-surface-page">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Học sinh</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Trạng thái</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {studentRows.map((row) => (
                    <tr key={row.userId} className="hover:bg-surface-hover">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{row.fullName}</p>
                        <p className="text-sm text-gray-500">{row.phoneNumber}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
                            row.hasRecord
                              ? STATUS_META[row.status!].className
                              : "border-gray-300 bg-gray-50 text-gray-500"
                          }`}
                        >
                          {row.hasRecord ? STATUS_META[row.status!].label : "Chưa điểm danh"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{row.note || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    );
  }

  // Render list view
  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý điểm danh"
        description="Xem danh sách buổi học trong ngày và tình trạng điểm danh"
      />

      {error && <ErrorBanner message={error} />}

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handlePrevDay}>&lt; Ngày trước</Button>
            <div className="w-48">
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={handleNextDay}>Ngày sau &gt;</Button>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <LoadingSkeleton count={3} />
      ) : sessions.length === 0 ? (
        <EmptyState message="Không có lịch học nào trong ngày này." icon={CalendarDays} />
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedSessions).map(([period, periodSessions]) => {
            if (periodSessions.length === 0) return null;
            return (
              <div key={period} className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 border-b border-surface-border pb-2">
                  Ca {period}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {periodSessions.map(session => (
                    <div
                      key={session.scheduleEventId}
                      onClick={() => setSelectedSession(session)}
                      className="group cursor-pointer rounded-xl border border-surface-border bg-white p-5 transition-all hover:border-primary hover:shadow-md"
                    >
                      <div className="mb-4 flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                            {session.className}
                          </h3>
                          <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                            <Clock className="h-4 w-4" />
                            <span>
                              {session.startTime.slice(0, 5)} - {session.endTime.slice(0, 5)}
                            </span>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                          session.attendanceStatus === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
                            : 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20'
                        }`}>
                          {session.attendanceStatus === 'COMPLETED' ? (
                            <><CheckCircle className="h-3.5 w-3.5" /> Đã điểm danh</>
                          ) : (
                            <><Clock3 className="h-3.5 w-3.5" /> Chưa hoàn thành</>
                          )}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span>Giáo viên: {session.teacherUserFullName || "Chưa xếp"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>Phòng: {session.roomName || "Chưa xếp"}</span>
                        </div>
                      </div>
                      
                      {session.attendanceStatus === 'COMPLETED' && (
                        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-sm">
                          <div className="text-gray-500">
                            <span className="font-medium text-emerald-600">{session.presentCount}</span> có mặt
                          </div>
                          <div className="text-gray-500">
                            <span className="font-medium text-rose-600">{session.absentCount}</span> vắng
                          </div>
                          <div className="text-gray-500">
                            <span className="font-medium text-amber-600">{session.lateCount}</span> muộn
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
