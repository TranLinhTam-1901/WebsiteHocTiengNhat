import axiosInstance from "../../utils/axiosInstance";
import { DashboardProgressResponse, UserSkillMatrixResponse } from "../../interfaces/Learner/Dashboard";

const dashboardService = {
  getOverallProgress: () => 
    axiosInstance.get<DashboardProgressResponse>("learner/dashboard/progress"),

  getSkillMatrix: () =>
    axiosInstance.get<UserSkillMatrixResponse>("learner/dashboard/skill-matrix"),
};

export default dashboardService;