export interface MockTest {
  id: number;
  title: string;
  description: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  duration: number; // in minutes
  totalQuestions: number;
  createdAt: string;
  isActive: boolean;
  questionCount?: number;
  attemptCount?: number;
}

export interface MockTestQuestion {
  id: number;
  testId: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer?: "A" | "B" | "C" | "D" | null;
  explanation?: string | null;
  sortOrder: number;
}

export interface TestQuestion {
  id: number;
  testId: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: "A" | "B" | "C" | "D";
  explanation: string;
}

export interface TestAttempt {
  id: number;
  studentId: number;
  studentFullName: string;
  testId: number;
  testTitle: string;
  durationMinutes?: number;
  score: number;
  maxScore: number;
  correctAnswers: number;
  totalQuestions: number;
  startedAt: string;
  completedAt: string | null;
  status: "IN_PROGRESS" | "COMPLETED";
  answers: TestAnswer[];
}

export interface TestAnswer {
  questionId: number;
  questionText?: string;
  studentAnswer: "A" | "B" | "C" | "D" | null;
  isCorrect: boolean;
  correctAnswer: "A" | "B" | "C" | "D";
}

export interface TestSubmitRequest {
  testId: number;
  answers: Array<{
    questionId: number;
    answer: "A" | "B" | "C" | "D";
  }>;
}
