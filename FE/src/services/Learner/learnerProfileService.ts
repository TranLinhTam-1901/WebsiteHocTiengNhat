import axiosInstance from "../../utils/axiosInstance";
import { User } from "../../interfaces/User";

const BASE_PATH = "learner/profile";

export const LearnerProfileService = {
    getCurrentProfile: async (): Promise<User> => {
        const response = await axiosInstance.get(`${BASE_PATH}/me`);
        
        return response.data?.$values ?? response.data;
    },

    updateProfile: async (payload: Partial<User>): Promise<User> => {
        const response = await axiosInstance.put(`${BASE_PATH}`, payload);
        return response.data;
    }
};