export interface TopicItem {
    topicID: string;
    topicName: string;
    description?: string;
    usageCount: number;
}

export interface CreateUpdateTopicDTO {
    topicName: string;
    description: string;
}