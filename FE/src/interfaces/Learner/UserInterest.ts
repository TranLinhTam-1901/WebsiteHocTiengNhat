export interface IUserInterest {
    userID: string;
    topicID: string; // Guid
    
    /** * Số lần tương tác. 
     * Tự động tăng khi User học hoặc làm Quiz thuộc Topic này. 
     */
    interactionCount: number;
}