import { useNavigate } from "react-router-dom";
import { assessmentBuilderApi } from "../../api/assessmentBuilderApi";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/SharedComponents";
import { useToast } from "../../components/ui/Toast";
import type { AssessmentRequest } from "../../types/assessmentBuilder";
import { AssessmentForm } from "./components/AssessmentForm";

const AssessmentEditorPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const goBackToList = () => {
    navigate("/teacher/assessments");
  };

  const handleCreate = async (request: AssessmentRequest) => {
    await assessmentBuilderApi.create(request);
    toast.success("Tạo mới đề thi thành công.");
    goBackToList();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Tạo mới đề thi"
        description="Soạn nội dung, thêm content block và chèn câu hỏi vào đúng vị trí."
      >
        <Button type="button" variant="secondary" onClick={goBackToList}>
          Quay lại danh sách
        </Button>
      </PageHeader>

      <AssessmentForm onSubmit={handleCreate} onCancel={goBackToList} />
    </div>
  );
};

export default AssessmentEditorPage;
