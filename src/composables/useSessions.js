import { ref, computed, watch } from 'vue';
import { formatTime } from '../utils/formatter';
import { STORAGE_KEYS, DEFAULT_MESSAGES } from '../config/constants';
import { chatStore, chatActions } from '../store/chatStore';

export function useSessions() {
  const sessions = ref([]);
  const currentSessionId = ref('');

  // 创建默认欢迎消息
  const createWelcomeMessage = () => ({
    id: Date.now(),
    role: 'assistant',
    content: DEFAULT_MESSAGES.WELCOME,
    timestamp: formatTime(new Date())
  });

  // 创建新会话
  function createNewSession() {
    const newSessionId = 'session_' + Date.now();
    const welcome = createWelcomeMessage();
    const newSession = {
      id: newSessionId,
      title: '新对话',
      messages: [welcome],
      messageStates: { [welcome.id]: 'success' },
      createdAt: formatTime(new Date()),
      updatedAt: formatTime(new Date())
    };
    sessions.value.unshift(newSession);
    currentSessionId.value = newSessionId;
    chatActions.resetSession(newSessionId);
    return newSession;
  }

  // 切换会话
  function switchSession(sessionId) {
    if (sessionId === currentSessionId.value) return;
    currentSessionId.value = sessionId;
    const session = sessions.value.find(s => s.id === sessionId);
    if (session) {
      // 恢复会话的消息状态到 chatStore
      Object.assign(chatStore.messageStates, session.messageStates);
    }
    chatActions.resetSession(sessionId);
  }

  // 删除会话
  function deleteSession(sessionId) {
    const index = sessions.value.findIndex(s => s.id === sessionId);
    if (index === -1) return false;
    
    sessions.value.splice(index, 1);
    
    // 如果删除的是当前会话，切换到其他会话或创建新会话
    if (sessionId === currentSessionId.value) {
      if (sessions.value.length > 0) {
        switchSession(sessions.value[0].id);
      } else {
        createNewSession();
      }
    }
    return true;
  }

  // 更新会话标题
  function updateSessionTitle(session) {
    const firstUserMsg = session.messages.find(m => m.role === 'user');
    if (firstUserMsg && typeof firstUserMsg.content === 'string') {
      session.title = firstUserMsg.content.length > 20 
        ? firstUserMsg.content.substring(0, 20) + '...' 
        : firstUserMsg.content;
    }
  }

  // 更新会话消息
  function updateSessionMessages(sessionId, newMessages) {
    const session = sessions.value.find(s => s.id === sessionId);
    if (session) {
      session.messages = newMessages;
      session.updatedAt = formatTime(new Date());
      updateSessionTitle(session);
    }
  }

  // 更新会话消息状态
  function updateSessionStates(sessionId, newStates) {
    const session = sessions.value.find(s => s.id === sessionId);
    if (session) {
      session.messageStates = { ...newStates };
    }
  }

  // 获取当前会话
  const currentSession = computed(() => {
    return sessions.value.find(s => s.id === currentSessionId.value);
  });

  // 获取当前会话的消息
  const currentMessages = computed(() => {
    return currentSession.value ? currentSession.value.messages : [];
  });

  // 获取当前会话的消息状态
  const currentMessageStates = computed(() => {
    return currentSession.value ? currentSession.value.messageStates : {};
  });

  // 持久化会话
  function persistSessions() {
    try {
      localStorage.setItem(STORAGE_KEYS.CHAT_SESSIONS, JSON.stringify({
        sessions: sessions.value,
        currentSessionId: currentSessionId.value
      }));
    } catch (err) {
      console.warn('保存会话失败', err);
    }
  }

  // 加载会话
  function loadSessions() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHAT_SESSIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.sessions) && parsed.sessions.length) {
          sessions.value = parsed.sessions;
          currentSessionId.value = parsed.currentSessionId || parsed.sessions[0]?.id || '';
        }
      }
    } catch (err) {
      console.warn('加载会话失败', err);
    } finally {
      // 如果没有会话，创建默认会话
      if (sessions.value.length === 0) {
        createNewSession();
      } else {
        // 确保当前会话ID有效
        if (!currentSessionId.value || !sessions.value.find(s => s.id === currentSessionId.value)) {
          currentSessionId.value = sessions.value[0].id;
        }
        chatActions.resetSession(currentSessionId.value);
      }
    }
  }

  // 监听会话变化并持久化
  watch(
    [sessions, currentSessionId],
    () => {
      persistSessions();
    },
    { deep: true }
  );

  return {
    sessions,
    currentSessionId,
    currentSession,
    currentMessages,
    currentMessageStates,
    createNewSession,
    switchSession,
    deleteSession,
    updateSessionMessages,
    updateSessionStates,
    loadSessions,
    persistSessions
  };
}
