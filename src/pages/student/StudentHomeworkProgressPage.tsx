import { useEffect, useState } from "react";
import { PageHeader, LoadingSkeleton, ErrorBanner, StatCard, Badge } from "../../components/ui/SharedComponents";
import axiosClient from "../../api/axiosClient";

interface ScoreHistoryItem {
  assignmentId: number;
  assignmentTitle: string;
  score: number;
  maxScore: number;
  submittedAt: string;
}

interface StudentProgressResponse {
  averageScore: number;
  totalCompleted: number;
  totalMissing: number;
  totalLate: number;
  scoreHistory: ScoreHistoryItem[];
}

export default function StudentHomeworkProgressPage() {
  const [data, setData] = useState<StudentProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get("/student/homework-progress");
        setData(res.data);
      } catch (err: any) {
        setError(err?.response?.data?.message ?? "Không thể tải tiến độ học tập.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <LoadingSkeleton count={4} height="h-32" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <ErrorBanner message={error || "Không có dữ liệu"} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Tiến độ Bài tập" />
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Điểm trung bình"
          value={`${data.averageScore.toFixed(1)}%`}
        />
        <StatCard
          label="Đã hoàn thành"
          value={data.totalCompleted}
        />
        <StatCard
          label="Nộp muộn"
          value={data.totalLate}
        />
        <StatCard
          label="Chưa nộp (thiếu)"
          value={data.totalMissing}
        />
      </div>

      <section className="rounded-card border border-surface-border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Lịch sử Bài tập đã chấm</h3>
        
        {data.scoreHistory.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">Chưa có bài tập nào được chấm điểm.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="border-b border-surface-border bg-surface-hover text-xs font-medium uppercase text-gray-500">
                  <th className="px-4 py-3">Bài tập</th>
                  <th className="px-4 py-3">Ngày nộp</th>
                  <th className="px-4 py-3 text-right">Điểm số</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {data.scoreHistory.map(item => (
                  <tr key={item.assignmentId} className="hover:bg-surface-hover transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{item.assignmentTitle}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(item.submittedAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant={(item.score / item.maxScore) >= 0.5 ? "success" : "error"}>
                        {item.score} / {item.maxScore}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
