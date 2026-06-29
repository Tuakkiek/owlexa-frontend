export interface CenterRequest {
  name: string;
  subdomain: string;
}

export interface CenterResponse {
  id: number;
  name: string;
  subdomain: string;
  createdAt: string;
}
