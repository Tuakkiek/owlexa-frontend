import axiosClient from "./axiosClient";
import type {
  MockTest,
  TestAttempt,
  TestSubmitRequest,
} from "../types/mocktest";

const mocktestApi = {
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
};

export default mocktestApi;
