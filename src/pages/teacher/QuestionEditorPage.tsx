import { useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { gradingCriteriaApi } from "../../api/gradingCriteriaApi";
import { questionBankApi } from "../../api/questionBankApi";
import { questionCollectionApi } from "../../api/questionCollectionApi";
import { Button } from "../../components/ui/Button";
import {
  ErrorBanner,
  LoadingSkeleton,
  PageHeader,
} from "../../components/ui/SharedComponents";
import { useToast } from "../../components/ui/Toast";
import type { GradingCriteriaResponse } from "../../types/gradingCriteria";
import type {
  QuestionCollectionResponse,
  QuestionRequest,
  QuestionResponse,
} from "../../types/questionBank";
import { QuestionForm } from "./components/QuestionForm";

const QuestionEditorPage = () => {
  const navigate = useNavigate();
  const { questionId } = useParams();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [question, setQuestion] = useState<QuestionResponse>();
  const [collections, setCollections] = useState<QuestionCollectionResponse[]>([]);
  const [criteria, setCriteria] = useState<GradingCriteriaResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const isEdit = Boolean(questionId);
  const initialCollectionId =
    Number(searchParams.get("collection") ?? "") || undefined;

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const [loadedCollections, loadedCriteria, loadedQuestion] =
        await Promise.all([
          questionCollectionApi.findAll(),
          gradingCriteriaApi.findAll(),
          questionId ? questionBankApi.findById(Number(questionId)) : undefined,
        ]);
      setCollections(loadedCollections);
      setCriteria(loadedCriteria);
      setQuestion(loadedQuestion);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể tải trình soạn câu hỏi.");
    } finally {
      setIsLoading(false);
    }
  }, [questionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/teacher/questions");
    }
  };

  const save = async (request: QuestionRequest) => {
    if (isEdit) {
      await questionBankApi.update(Number(questionId), request);
      toast.success("Đã cập nhật câu hỏi.");
    } else {
      const created = await questionBankApi.create(request);
      toast.success(`Đã tạo câu hỏi ${created.questionCode}.`);
    }
    handleBack();
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Quay lại trang trước</span>
      </button>
      <PageHeader
        title={isEdit ? "Chỉnh sửa câu hỏi" : "Tạo câu hỏi"}
        description="Collection, Section, Display Order va Question Code la danh tinh hien thi cua cau hoi."
      />
      {error && <ErrorBanner message={error} />}
      {isLoading ? (
        <LoadingSkeleton count={6} height="h-16" />
      ) : isEdit && !question ? (
        <ErrorBanner message={error || "Không tìm thấy câu hỏi."} />
      ) : collections.length === 0 ? (
        <div className="rounded-card border border-surface-border bg-white p-8 text-center">
          <p className="text-sm text-gray-600">
            Hãy tạo Collection trước khi tạo câu hỏi.
          </p>
          <Button className="mt-4" onClick={handleBack}>
            Về Question Bank
          </Button>
        </div>
      ) : (
        <div className="rounded-card border border-surface-border bg-white p-6">
          <QuestionForm
            initialData={question}
            initialCollectionId={initialCollectionId}
            collections={collections}
            gradingCriteria={criteria}
            onSubmit={save}
            onCancel={handleBack}
          />
        </div>
      )}
    </div>
  );
};

export default QuestionEditorPage;
