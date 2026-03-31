export interface ChatConversationListItem {
  id: string;
  learnerId: string;
  learnerName: string;
  learnerEmail: string;
  assignedAdminId: string;
  assignedAdminName: string;
  lastMessagePreview: string | null;
  lastMessageAt: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  isFromAdmin: boolean;
  content: string;
  sentAt: string;
}
