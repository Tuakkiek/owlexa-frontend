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
  AttendanceMarkRequest,
  AttendanceResponse,
  AttendanceStatus,
  ClassSessionResponse,
} from "../../types/attendance";
import { STATUS_META } from "../../types/attendance";
import type { TeacherClassStudents } from "../../types/teacherClassStudents";

export default function TeacherAttendancePage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [sessions, setSessions] = useState<ClassSessionResponse[]>([]);
  const [classes, setClasses] = useState<TeacherClassStudents[]>([]);
  const [selectedSession, setSelectedSession] = useState<ClassSessionResponse | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceResponse[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load basic data
  const loadInitialData = useCallback(async () => {
    try {
      const classData = await classApi.findMyClassesWithStudentsAsTeacher();
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
      setSuccess("");
      const sessionData = await attendanceApi.findTeacherClassSessionsByDate(date);
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
      setSuccess("");
      const records = await attendanceApi.findAllByScheduleEvent(
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

  // Use a local state for the editable rows inside the detail view
  const [editableRows, setEditableRows] = useState(studentRows);
  useEffect(() => {
    setEditableRows(studentRows);
  }, [studentRows]);

  const updateRow = (userId: number, patch: Partial<typeof editableRows[0]>) => {
    setEditableRows(current => current.map(r => r.userId === userId ? { ...r, ...patch } : r));
  };

  const handleSave = async () => {
    if (!selectedSession || editableRows.length === 0) return;

    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      const request: AttendanceMarkRequest = {
        date,
        records: editableRows.map((row) => ({
          studentUserId: row.userId,
          status: row.status ?? "PRESENT", // default to present if not set explicitly but saved
          note: row.note.trim() || undefined,
        })),
      };

      await attendanceApi.markScheduleEventAttendance(
        selectedSession.scheduleEventId,
        request,
      );
      
      setSuccess("Đã lưu điểm danh thành công.");
      await loadAttendance(); // reload to get saved IDs and true state
      await loadSessions(); // refresh the counts in the session list
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể lưu điểm danh.");
    } finally {
      setIsSaving(false);
    }
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
      <div className="space-y-6 pb-24">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-surface-border pb-4">
          <Button variant="outline" onClick={() => setSelectedSession(null)} className="shrink-0 self-start sm:self-auto">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Điểm danh lớp {selectedSession.className}
            </h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
              <Clock className="h-4 w-4" /> {selectedSession.startTime.slice(0, 5)} - {selectedSession.endTime.slice(0, 5)} 
              <span className="text-gray-300">|</span> 
              <CalendarDays className="h-4 w-4" /> {date.split('-').reverse().join('/')}
            </p>
          </div>
        </div>

        {error && <ErrorBanner message={error} />}
        {success && (
          <div className="rounded-input border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-4">
          {(["PRESENT", "ABSENT", "LATE", "EXCUSED"] as AttendanceStatus[]).map(
            (status) => (
              <StatCard
                key={status}
                label={STATUS_META[status].label}
                value={editableRows.filter(r => r.status === status).length}
              />
            ),
          )}
        </div>

        {isLoadingDetail ? (
          <LoadingSkeleton count={4} />
        ) : !selectedClass || editableRows.length === 0 ? (
          <EmptyState
            message="Chưa có học sinh nào trong lớp này."
            icon={Inbox}
          />
        ) : (
          <Card className="p-0 overflow-hidden">
            <div className="border-b border-surface-border px-6 py-4 flex justify-between items-center bg-surface-page/50">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Danh sách học sinh
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {editableRows.length} học sinh
                </p>
              </div>
              <Button 
                onClick={() => {
                  setEditableRows(current => current.map(r => ({ ...r, status: "PRESENT" })));
                }}
                variant="secondary"
                size="sm"
              >
                Đánh dấu tất cả có mặt
              </Button>
            </div>
            
            <div className="divide-y divide-surface-border">
              {editableRows.map((row) => (
                <div
                  key={row.userId}
                  className="grid gap-4 px-6 py-4 lg:grid-cols-[1.2fr_1.1fr_1.4fr] lg:items-center hover:bg-surface-hover/50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {row.fullName}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {row.phoneNumber}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(["PRESENT", "LATE", "ABSENT", "EXCUSED"] as AttendanceStatus[]).map((status) => {
                      const active = row.status === status;
                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() => updateRow(row.userId, { status })}
                          className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                            active
                              ? STATUS_META[status].className
                              : "border-surface-border bg-white text-gray-600 hover:bg-surface-hover hover:text-gray-900"
                          }`}
                        >
                          {STATUS_META[status].label}
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    <input
                      type="text"
                      value={row.note}
                      onChange={(event) =>
                        updateRow(row.userId, { note: event.target.value })
                      }
                      placeholder="Ghi chú thêm..."
                      className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-primary"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Floating Save Button */}
        {editableRows.length > 0 && (
          <div className="fixed bottom-0 left-0 lg:left-64 right-0 flex items-center justify-between border-t border-surface-border bg-white/80 backdrop-blur-md px-6 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
            <p className="text-sm text-gray-600 hidden sm:block">
              Đã điểm danh: <span className="font-semibold text-gray-900">{editableRows.filter(r => r.status !== null).length}/{editableRows.length}</span> học sinh
            </p>
            <Button onClick={handleSave} isLoading={isSaving} className="w-full sm:w-auto shadow-sm">
              Lưu điểm danh 
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Render list view
  return (
    <div className="space-y-6">
      <PageHeader
        title="Điểm danh"
        description="Xem danh sách các ca dạy trong ngày và thực hiện điểm danh học sinh"
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
        <EmptyState message="Bạn không có ca dạy nào trong ngày này." icon={CalendarDays} />
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
                            <><Clock3 className="h-3.5 w-3.5" /> Cần điểm danh</>
                          )}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span>Học sinh: {session.studentCount}</span>
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
