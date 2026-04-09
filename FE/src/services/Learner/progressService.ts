import axiosInstance from "../../utils/axiosInstance";
import { DashboardProgressResponse } from "../../interfaces/Learner/Dashboard";

const dashboardService = {
  getOverallProgress: () => 
    axiosInstance.get<DashboardProgressResponse>("learner/dashboard/progress"),
};

export default dashboardService;