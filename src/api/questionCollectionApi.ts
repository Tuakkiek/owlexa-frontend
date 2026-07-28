import axiosClient from "./axiosClient";
import type {
  QuestionCollectionCreateRequest,
  QuestionCollectionResponse,
  QuestionCollectionUpdateRequest,
} from "../types/questionBank";

const BASE_URL = "/teacher/question-collections";

export const questionCollectionApi = {
  findAll: async (): Promise<QuestionCollectionResponse[]> => {
    const response = await axiosClient.get(BASE_URL);
    return response.data;
  },

  create: async (
    request: QuestionCollectionCreateRequest,
  ): Promise<QuestionCollectionResponse> => {
    const response = await axiosClient.post(BASE_URL, request);
    return response.data;
  },

  update: async (
    collectionId: number,
    request: QuestionCollectionUpdateRequest,
  ): Promise<QuestionCollectionResponse> => {
    const response = await axiosClient.put(
      `${BASE_URL}/${collectionId}`,
      request,
    );
    return response.data;
  },

  delete: async (collectionId: number): Promise<void> => {
    await axiosClient.delete(`${BASE_URL}/${collectionId}`);
  },
};
