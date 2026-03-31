import axiosInstance from "../../utils/axiosInstance";
import { User } from "../../interfaces/User";

const BASE_PATH = "learner/profile";

export const LearnerProfileService = {
    getCurrentProfile: async (): Promise<User> => {
        const response = await axiosInstance.get(`${BASE_PATH}/me`);
        
        return response.data?.$values ?? response.data;
    }
};