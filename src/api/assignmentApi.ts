import axiosClient from "./axiosClient";
import type {
  AssignmentDetailResponse,
  AssignmentListResponse,
  AssignmentRequest,
  AssignmentSearchParams,
  PageResponse,
  StudentAssignmentListResponse,
} from "../types/assignment";

const TEACHER_BASE_URL = "/teacher/assignments";
const STUDENT_BASE_URL = "/student/assignments";

const buildParams = (params: AssignmentSearchParams) => ({
  ...(params.search?.trim() ? { search: params.search.trim() } : {}),
  ...(params.type ? { type: params.type } : {}),
  ...(params.status ? { status: params.status } : {}),
  ...(params.classId ? { classId: params.classId } : {}),
  page: params.page ?? 0,
  size: params.size ?? 20,
});

export const assignmentApi = {
  findAll: async (
    params: AssignmentSearchParams,
  ): Promise<PageResponse<AssignmentListResponse>> => {
    const response = await axiosClient.get(TEACHER_BASE_URL, {
      params: buildParams(params),
    });
    return response.data;
  },

  findById: async (assignmentId: number): Promise<AssignmentDetailResponse> => {
    const response = await axiosClient.get(
      `${TEACHER_BASE_URL}/${assignmentId}`,
    );
    return response.data;
  },

  create: async (
    request: AssignmentRequest,
  ): Promise<AssignmentDetailResponse> => {
    const response = await axiosClient.post(TEACHER_BASE_URL, request);
    return response.data;
  },

  update: async (
    assignmentId: number,
    request: AssignmentRequest,
  ): Promise<AssignmentDetailResponse> => {
    const response = await axiosClient.put(
      `${TEACHER_BASE_URL}/${assignmentId}`,
      request,
    );
    return response.data;
  },

  publish: async (assignmentId: number): Promise<AssignmentDetailResponse> => {
    const response = await axiosClient.post(
      `${TEACHER_BASE_URL}/${assignmentId}/publish`,
    );
    return response.data;
  },

  close: async (assignmentId: number): Promise<AssignmentDetailResponse> => {
    const response = await axiosClient.post(
      `${TEACHER_BASE_URL}/${assignmentId}/close`,
    );
    return response.data;
  },

  archive: async (assignmentId: number): Promise<AssignmentDetailResponse> => {
    const response = await axiosClient.post(
      `${TEACHER_BASE_URL}/${assignmentId}/archive`,
    );
    return response.data;
  },

  delete: async (assignmentId: number): Promise<void> => {
    await axiosClient.delete(`${TEACHER_BASE_URL}/${assignmentId}`);
  },

  findStudentAssignments: async (): Promise<
    StudentAssignmentListResponse[]
  > => {
    const response = await axiosClient.get(STUDENT_BASE_URL);
    return response.data;
  },
};
