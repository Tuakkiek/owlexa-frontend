import axiosClient from "./axiosClient";
import type {
  MockTest,
  MockTestQuestion,
  TestAttempt,
  TestSubmitRequest,
} from "../types/tests";

const testApi = {
  // Student: Get list of available tests
  getAvailableTests: async (): Promise<MockTest[]> => {
    const res = await axiosClient.get<MockTest[]>("/student/mock-tests");
    return res.data ?? [];
  },

  // Student: Start test
  startTest: async (testId: number): Promise<TestAttempt> => {
    const res = await axiosClient.post<TestAttempt>(
      `/mock-tests/${testId}/start`,
      {},
    );
    return res.data;
  },

  // Student: Submit test
  submitTest: async (
    testId: number,
    payload: TestSubmitRequest,
  ): Promise<TestAttempt> => {
    const res = await axiosClient.post<TestAttempt>(
      `/mock-tests/${testId}/submit`,
      payload,
    );
    return res.data;
  },

  // Student: Save answer (auto-save)
  saveAnswer: async (
    testId: number,
    questionId: number,
    answer: string,
  ): Promise<void> => {
    await axiosClient.post(`/mock-tests/${testId}/answers/${questionId}`, {
      answer,
    });
  },

  // Student: Get my test results
  getMyResults: async (): Promise<TestAttempt[]> => {
    const res = await axiosClient.get<TestAttempt[]>(
      "/student/mock-tests/results",
    );
    return res.data ?? [];
  },

  // Student: Get specific test result
  getTestResult: async (attemptId: number): Promise<TestAttempt> => {
    const res = await axiosClient.get<TestAttempt>(
      `/mock-tests/results/${attemptId}`,
    );
    return res.data;
  },

  // Student: Get active attempt
  getAttempt: async (attemptId: number): Promise<TestAttempt> => {
    const res = await axiosClient.get<TestAttempt>(`/mock-tests/attempts/${attemptId}`);
    return res.data;
  },

  // Owner: Get all tests
  getAllTests: async (): Promise<MockTest[]> => {
    const res = await axiosClient.get<MockTest[]>("/owner/mock-tests");
    return res.data ?? [];
  },

  // Owner: Create test
  createTest: async (test: Partial<MockTest>): Promise<MockTest> => {
    const res = await axiosClient.post<MockTest>("/owner/mock-tests", test);
    return res.data;
  },

  // Owner: Update test
  updateTest: async (
    testId: number,
    test: Partial<MockTest>,
  ): Promise<MockTest> => {
    const res = await axiosClient.put<MockTest>(
      `/owner/mock-tests/${testId}`,
      test,
    );
    return res.data;
  },

  // Owner: Delete test
  deleteTest: async (testId: number): Promise<void> => {
    await axiosClient.delete(`/owner/mock-tests/${testId}`);
  },

  // Owner: Questions
  getOwnerQuestions: async (testId: number): Promise<MockTestQuestion[]> => {
    const res = await axiosClient.get<MockTestQuestion[]>(
      `/owner/mock-tests/${testId}/questions`,
    );
    return res.data ?? [];
  },

  getStudentQuestions: async (testId: number): Promise<MockTestQuestion[]> => {
    const res = await axiosClient.get<MockTestQuestion[]>(
      `/student/mock-tests/${testId}/questions`,
    );
    return res.data ?? [];
  },

  addQuestion: async (
    testId: number,
    question: Partial<MockTestQuestion>,
  ): Promise<MockTestQuestion> => {
    const res = await axiosClient.post<MockTestQuestion>(
      `/owner/mock-tests/${testId}/questions`,
      question,
    );
    return res.data;
  },

  updateQuestion: async (
    testId: number,
    questionId: number,
    question: Partial<MockTestQuestion>,
  ): Promise<MockTestQuestion> => {
    const res = await axiosClient.put<MockTestQuestion>(
      `/owner/mock-tests/${testId}/questions/${questionId}`,
      question,
    );
    return res.data;
  },

  deleteQuestion: async (testId: number, questionId: number): Promise<void> => {
    await axiosClient.delete(`/owner/mock-tests/${testId}/questions/${questionId}`);
  },

  // Owner: Attempts
  getOwnerAttempts: async (testId: number): Promise<TestAttempt[]> => {
    const res = await axiosClient.get<TestAttempt[]>(
      `/owner/mock-tests/${testId}/attempts`,
    );
    return res.data ?? [];
  },

  getOwnerAttempt: async (attemptId: number): Promise<TestAttempt> => {
    const res = await axiosClient.get<TestAttempt>(
      `/owner/mock-tests/attempts/${attemptId}`,
    );
    return res.data;
  },

  // Teacher: Attempts for students in classes taught by current teacher
  getTeacherAttempts: async (classId?: number): Promise<TestAttempt[]> => {
    const res = await axiosClient.get<TestAttempt[]>(
      "/teacher/mock-tests/attempts",
      { params: classId ? { classId } : undefined },
    );
    return res.data ?? [];
  },

  getTeacherAttempt: async (attemptId: number): Promise<TestAttempt> => {
    const res = await axiosClient.get<TestAttempt>(
      `/teacher/mock-tests/attempts/${attemptId}`,
    );
    return res.data;
  },
};

export default testApi;
