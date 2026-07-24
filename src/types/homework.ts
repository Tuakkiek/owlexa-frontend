export type HomeworkType = "QUIZ" | "ESSAY" | "MIXED";
export type HomeworkDifficulty = "EASY" | "MEDIUM" | "HARD";
export type HomeworkQuestionType = "MULTIPLE_CHOICE" | "ESSAY" | "FILE_UPLOAD";
export type HomeworkAssignmentStatus = "DRAFT" | "SCHEDULED" | "OPEN" | "CLOSED" | "CANCELLED";
export type HomeworkSubmissionStatus = "DRAFT" | "SUBMITTED" | "GRADING" | "GRADED";

export interface HomeworkRubricCriterion {
  id?: number;
  name: string;
  description?: string;
  maxScore: number;
  sortOrder: number;
}

export interface HomeworkRubric {
  id?: number;
  criteria: HomeworkRubricCriterion[];
}

export interface HomeworkQuestionOption {
  id?: number;
  optionText: string;
  isCorrect: boolean;
  sortOrder: number;
}

export interface HomeworkQuestion {
  id?: number;
  type: HomeworkQuestionType;
  questionText: string;
  attachedImageUrl?: string;
  attachedAudioUrl?: string;
  attachedFileUrl?: string;
  sortOrder: number;
  maxScore: number;
  options?: HomeworkQuestionOption[];
  rubric?: HomeworkRubric;
}

export interface HomeworkTemplate {
  id: number;
  title: string;
  description?: string;
  instructions?: string;
  homeworkType: HomeworkType;
  estimatedTime?: number;
  difficulty?: HomeworkDifficulty;
  maxScore: number;
  parentTemplateId?: number;
  version: number;
  archived: boolean;
  teacherId: number;
  teacherFullName: string;
  questions?: HomeworkQuestion[];
  createdAt: string;
  updatedAt: string;
  assignmentCount?: number;
  activeAssignmentCount?: number;
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
}

export interface TeacherHomeworkTemplateSaveRequest {
  title: string;
  description?: string;
  instructions?: string;
  homeworkType: HomeworkType;
  estimatedTime?: number;
  difficulty?: HomeworkDifficulty;
  maxScore: number;
  parentTemplateId?: number;
  questions?: HomeworkQuestion[];
}

export interface HomeworkAssignmentResponse {
  id: number;
  templateId: number;
  templateTitle: string;
  maxScore: number;
  clazzId: number;
  clazzName: string;
  teacherId: number;
  teacherFullName: string;
  status: HomeworkAssignmentStatus;
  availableFrom?: string;
  dueDate?: string;
  closeAt?: string;
  scheduledAt?: string;
  openedAt?: string;
  closedAt?: string;
  archivedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  allowLateSubmission: boolean;
  allowResubmit: boolean;
  publishScoreImmediately: boolean;
  isGradesReleased: boolean;
  showAnswerAfterGrading: boolean;
  totalStudents: number;
  submittedCount: number;
  gradedCount: number;
  missingCount: number;
  lateCount: number;
}

export interface TeacherHomeworkAssignmentSaveRequest {
  templateId: number;
  clazzId: number;
  availableFrom?: string | null;
  dueDate?: string | null;
  closeAt?: string | null;
  allowLateSubmission?: boolean;
  allowResubmit?: boolean;
  publishScoreImmediately?: boolean;
  showAnswerAfterGrading?: boolean;
}
