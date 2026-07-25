export interface GradingCriteriaRequest {
  name: string;
  content: string;
}

export interface GradingCriteriaResponse {
  id: number;
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
