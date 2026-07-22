import axiosClient from "./axiosClient";
import type {
  CourseRequest,
  CourseResponse,
  CourseStatisticsResponse,
  CourseClassResponse,
  CourseDeleteValidationResponse,
} from "../types/course";

const BASE_URL = "/owner/courses";

export const courseApi = {
  findAll: async (): Promise<CourseResponse[]> => {
    const response = await axiosClient.get(BASE_URL);
    return response.data;
  },

  findAllIncludingInactive: async (): Promise<CourseResponse[]> => {
    const response = await axiosClient.get(`${BASE_URL}/all`);
    return response.data;
  },

  findById: async (courseId: number): Promise<CourseResponse> => {
    const response = await axiosClient.get(`${BASE_URL}/${courseId}`);
    return response.data;
  },

  getStatistics: async (courseId: number): Promise<CourseStatisticsResponse> => {
    const response = await axiosClient.get(`${BASE_URL}/${courseId}/statistics`);
    return response.data;
  },

  getClasses: async (courseId: number): Promise<CourseClassResponse[]> => {
    const response = await axiosClient.get(`${BASE_URL}/${courseId}/classes`);
    return response.data;
  },

  validateDelete: async (courseId: number): Promise<CourseDeleteValidationResponse> => {
    const response = await axiosClient.get(`${BASE_URL}/${courseId}/delete-validation`);
    return response.data;
  },

  create: async (request: CourseRequest): Promise<CourseResponse> => {
    const response = await axiosClient.post(BASE_URL, request);
    return response.data;
  },

  update: async (
    courseId: number,
    request: CourseRequest,
  ): Promise<CourseResponse> => {
    const response = await axiosClient.put(`${BASE_URL}/${courseId}`, request);
    return response.data;
  },

  delete: async (courseId: number): Promise<void> => {
    await axiosClient.delete(`${BASE_URL}/${courseId}`);
  },
};
