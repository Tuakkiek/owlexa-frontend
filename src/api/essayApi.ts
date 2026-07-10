import axiosClient from "./axiosClient";
import type {
  EssaySubmission,
  EssayGradingResult,
  EssayRubric,
} from "../types/essay";

const essayApi = {
  // ── Teacher: Rubric management ──
  findMyRubricsAsTeacher: async (): Promise<EssayRubric[]> => {
    const res = await axiosClient.get<EssayRubric[]>(
      "/teacher/essay-rubrics/me",
    );
    return res.data ?? [];
  },

  createRubric: async (request: {
    classId: number;
    title: string;
    description: string;
    maxScore: number;
    criteria: Array<{
      name: string;
      description: string;
      weight: number;
      maxScore: number;
    }>;
  }): Promise<EssayRubric> => {
    const res = await axiosClient.post<EssayRubric>(
      "/teacher/essay-rubrics",
      request,
    );
    return res.data;
  },

  // ── Student: Submit essay ──
  submitEssay: async (
    rubricId: number,
    content: string,
  ): Promise<EssaySubmission> => {
    const res = await axiosClient.post<EssaySubmission>("/essays/submit", {
      rubricId,
      content,
    });
    return res.data;
  },

  // Student: Get submitted essays
  getMyEssays: async (): Promise<EssaySubmission[]> => {
    const res = await axiosClient.get<EssaySubmission[]>("/student/essays/me");
    return res.data ?? [];
  },

  // Student: Get essay with grading result
  getEssayWithResult: async (
    essayId: number,
  ): Promise<{
    essay: EssaySubmission;
    gradingResult: EssayGradingResult | null;
  }> => {
    const res = await axiosClient.get(`/essays/${essayId}`);
    return res.data;
  },

  // Student: Poll essay grading status
  checkGradingStatus: async (
    essayId: number,
  ): Promise<EssayGradingResult | null> => {
    const res = await axiosClient.get<EssayGradingResult | null>(
      `/essays/${essayId}/grading-result`,
    );
    return res.data;
  },

  // Teacher: Get essays to review for class
  getEssaysToReview: async (classId: number): Promise<EssaySubmission[]> => {
    const res = await axiosClient.get<EssaySubmission[]>(
      `/teacher/classes/${classId}/essays`,
    );
    return res.data ?? [];
  },

  // Teacher: Add manual feedback
  addManualFeedback: async (
    essayId: number,
    feedback: string,
  ): Promise<void> => {
    await axiosClient.post(`/essays/${essayId}/manual-feedback`, { feedback });
  },
};

export default essayApi;
