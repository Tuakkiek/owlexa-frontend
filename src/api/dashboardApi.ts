import axiosClient from './axiosClient';

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalFeeRecords: number;
  unpaidFeeRecords: number;
  paidFeeRecords: number;
  totalRevenue: number;
}

const dashboardApi = {
  getOwnerStats: (): Promise<DashboardStats> =>
    axiosClient
      .get('/owner/dashboard/stats')
      .then((res) => res.data?.data || res.data),
};

export default dashboardApi;
