import { useCallback, useEffect, useRef, useState } from 'react';
import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';
import { useSelector } from 'react-redux';
import type { ChatConversationListItem, ChatMessage } from '../types/chat';
import { getBrowserSessionId } from '../utils/browserSessionId';

function getChatHubUrl(): string {
  const api = import.meta.env.VITE_API_URL ?? 'http://localhost:5167/api';
  const root = api.replace(/\/api\/?$/, '');
  const browserId = encodeURIComponent(getBrowserSessionId());
  return `${root}/chatHub?browserId=${browserId}`;
}

type Options = {
  enabled: boolean;
  onReceiveMessage?: (msg: ChatMessage) => void;
  onConversationUpdated?: (preview: ChatConversationListItem) => void;
};

export function useChatHub({ enabled, onReceiveMessage, onConversationUpdated }: Options) {
  const token = useSelector((state: { auth?: { token?: string } }) => state.auth?.token);
  const connectionRef = useRef<HubConnection | null>(null);
  const [connected, setConnected] = useState(false);
  const cbMsg = useRef(onReceiveMessage);
  const cbConv = useRef(onConversationUpdated);
  cbMsg.current = onReceiveMessage;
  cbConv.current = onConversationUpdated;

  useEffect(() => {
    if (!enabled || !token) {
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
      setConnected(false);
      return;
    }

    if (connectionRef.current?.state === 'Connected') return;

    const connection = new HubConnectionBuilder()
      .withUrl(getChatHubUrl(), {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on('ReceiveMessage', (msg: ChatMessage) => {
      cbMsg.current?.(msg);
    });
    connection.on('ConversationUpdated', (preview: ChatConversationListItem) => {
      cbConv.current?.(preview);
    });

    connection.on('ForceLogout', (message: string) => {
      localStorage.removeItem('token');
      localStorage.removeItem('roles');
      const encodedMsg = encodeURIComponent(message || 'Tài khoản đã đăng nhập nơi khác.');
      window.location.replace(`/login?reason=forced&message=${encodedMsg}`);
    });

    connectionRef.current = connection;

    let cancelled = false;
    connection
      .start()
      .then(() => {
        if (!cancelled) setConnected(true);
      })
      .catch(() => {
        if (!cancelled) setConnected(false);
      });

    return () => {
      cancelled = true;
      connection.off('ForceLogout');
      connection.stop();
      if (connectionRef.current === connection) connectionRef.current = null;
      setConnected(false);
    };
  }, [enabled, token]);

  const joinConversation = useCallback(async (conversationId: string) => {
    const conn = connectionRef.current;
    if (!conn || conn.state !== 'Connected') return;
    await conn.invoke('JoinConversation', conversationId);
  }, []);

  const leaveConversation = useCallback(async (conversationId: string) => {
    const conn = connectionRef.current;
    if (!conn || conn.state !== 'Connected') return;
    await conn.invoke('LeaveConversation', conversationId);
  }, []);

  const sendMessage = useCallback(async (conversationId: string | null, content: string) => {
    const conn = connectionRef.current;
    if (!conn || conn.state !== 'Connected') throw new Error('Chat chưa kết nối.');
    await conn.invoke('SendMessage', conversationId, content);
  }, []);

  return { connected, joinConversation, leaveConversation, sendMessage, connectionRef };
}
