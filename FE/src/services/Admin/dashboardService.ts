import axiosInstance from '../../utils/axiosInstance';
import { AdminDashboardOverview } from '../../interfaces/Admin/Dashboard';

const dashboardService = {
  getOverview: async (): Promise<AdminDashboardOverview> => {
    const response = await axiosInstance.get<AdminDashboardOverview>('/admin/dashboard/overview');
    return response.data;
  },
};

export default dashboardService;
