<template>
  <div class="app-wrapper">
    <Sidebar
      :sessions="sessions"
      :current-session-id="currentSessionId"
      @new-chat="handleNewChat"
      @switch-session="handleSwitchSession"
      @delete-session="handleDeleteSession"
      @toggle="handleSidebarToggle"
    />
    <div class="chat-container" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <h1 class="chat-title">AI对话框（测试版）</h1>

      <div class="chat-messages" ref="messageContainer">
        <!-- 当消息数量超过阈值时使用虚拟滚动 -->
        <VirtualList
          v-if="messages.length > VIRTUAL_SCROLL_THRESHOLD"
          ref="virtualListRef"
          :items="messages"
          :item-height="150"
          :overscan="10"
        >
          <template #default="{ item: msg }">
            <div 
              :class="['message-item', msg.role === 'user' ? 'user-message' : 'ai-message']">
              <div class="message-role">{{ msg.role === 'user' ? '我' : 'AI' }}</div>
              <ChatMessage 
                :message="msg" 
                :state="currentMessageStates[msg.id] || chatStore.messageStates[msg.id]"
                :stream-progress="streamProgress[msg.id] || 100" 
                @card-click="handleCardClick"
              />
              <div 
                v-if="msg.role === 'assistant'" 
                class="message-actions"
              >
                <button 
                  class="action-btn" 
                  @click="handleCopy(msg)"
                  :disabled="(currentMessageStates[msg.id] || chatStore.messageStates[msg.id]) === 'loading'"
                >
                  复制内容
                </button>
                <button 
                  class="action-btn"
                  @click="handleRegenerate(msg)"
                  :disabled="(currentMessageStates[msg.id] || chatStore.messageStates[msg.id]) === 'loading' || chatStore.global.isSending"
                >
                  重新生成
                </button>
              </div>

              <div v-if="(currentMessageStates[msg.id] || chatStore.messageStates[msg.id]) === 'error'" class="retry-btn-container">
                <button 
                  class="retry-btn" 
                  @click="handleRetry(msg)"
                >
                  重试
                </button>
              </div>
              <div class="message-time">{{ msg.timestamp }}</div>
            </div>
          </template>
        </VirtualList>
        
        <!-- 消息数量较少时使用普通渲染 -->
        <template v-else>
          <div 
            v-for="msg in messages" 
            :key="msg.id"
            :class="['message-item', msg.role === 'user' ? 'user-message' : 'ai-message']">
            <div class="message-role">{{ msg.role === 'user' ? '我' : 'AI' }}</div>
            <ChatMessage 
              :message="msg" 
              :state="currentMessageStates[msg.id] || chatStore.messageStates[msg.id]"
              :stream-progress="streamProgress[msg.id] || 100" 
              @card-click="handleCardClick"
            />
            <div 
              v-if="msg.role === 'assistant'" 
              class="message-actions"
            >
              <button 
                class="action-btn" 
                @click="handleCopy(msg)"
                :disabled="(currentMessageStates[msg.id] || chatStore.messageStates[msg.id]) === 'loading'"
              >
                复制内容
              </button>
              <button 
                class="action-btn"
                @click="handleRegenerate(msg)"
                :disabled="(currentMessageStates[msg.id] || chatStore.messageStates[msg.id]) === 'loading' || chatStore.global.isSending"
              >
                重新生成
              </button>
            </div>

            <div v-if="(currentMessageStates[msg.id] || chatStore.messageStates[msg.id]) === 'error'" class="retry-btn-container">
              <button 
                class="retry-btn" 
                @click="handleRetry(msg)"
              >
                重试
              </button>
            </div>
            <div class="message-time">{{ msg.timestamp }}</div>
          </div>
        </template>
      </div>

      <InputArea 
        :is-sending="chatStore.global.isSending"
        @send="handleSend"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, watch, computed } from 'vue';
import { chatStore, chatActions } from '../store/chatStore';
import { getMockAnswer } from '../store/helpers';
import { formatTime } from '../utils/formatter';
import ChatMessage from './ChatMessage/index.vue';
import InputArea from './InputArea.vue';
import Sidebar from './Sidebar.vue';
import VirtualList from './VirtualList.vue';

// 多会话存储键
const STORAGE_KEY = 'chat_sessions_v2';
const streamProgress = ref({});
const sidebarCollapsed = ref(false);

// 虚拟滚动阈值：当消息数量超过此值时启用虚拟滚动
const VIRTUAL_SCROLL_THRESHOLD = 200;

// 默认欢迎消息
const defaultWelcomeMessage = () => ({
  id: Date.now(),
  role: 'assistant',
  content: '你好！我是AI助手，有什么可以帮你的？',
  timestamp: formatTime(new Date())
});

// 会话列表
const sessions = ref([]);
const currentSessionId = ref('');

// 当前会话的消息
const messages = computed(() => {
  const session = sessions.value.find(s => s.id === currentSessionId.value);
  return session ? session.messages : [];
});

// 当前会话的消息状态
const currentMessageStates = computed(() => {
  const session = sessions.value.find(s => s.id === currentSessionId.value);
  return session ? session.messageStates : {};
});

// 更新当前会话的消息
function updateCurrentSessionMessages(newMessages) {
  const session = sessions.value.find(s => s.id === currentSessionId.value);
  if (session) {
    session.messages = newMessages;
    session.updatedAt = formatTime(new Date());
    updateSessionTitle(session);
  }
}

// 更新会话标题（使用第一条用户消息）
function updateSessionTitle(session) {
  const firstUserMsg = session.messages.find(m => m.role === 'user');
  if (firstUserMsg && typeof firstUserMsg.content === 'string') {
    session.title = firstUserMsg.content.length > 20 
      ? firstUserMsg.content.substring(0, 20) + '...' 
      : firstUserMsg.content;
  }
}

// 更新当前会话的消息状态
function updateCurrentSessionStates(newStates) {
  const session = sessions.value.find(s => s.id === currentSessionId.value);
  if (session) {
    session.messageStates = { ...newStates };
    // 同时更新 chatStore 以便其他地方使用
    Object.assign(chatStore.messageStates, newStates);
  }
}

const messageContainer = ref(null);
const virtualListRef = ref(null);

function scrollToBottom() {
  nextTick(() => {
    // 如果使用虚拟滚动，调用虚拟滚动的方法
    if (virtualListRef.value && messages.value.length > VIRTUAL_SCROLL_THRESHOLD) {
      virtualListRef.value.scrollToBottom();
    } else if (messageContainer.value) {
      // 否则使用普通滚动
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
    }
  });
}

function normalizeAiContent(mockResult) {
  if (typeof mockResult === 'object' && mockResult !== null) {
    if (mockResult.type === 'card') {
      return mockResult;
    }
    if (mockResult.raw) {
      return mockResult.raw;
    }
    return JSON.stringify(mockResult);
  }
  return typeof mockResult === 'string' ? mockResult : String(mockResult);
}

function createAiStream(aiMessage, isReplySuccess) {
  streamProgress.value[aiMessage.id] = 0;
  let progress = 0;
  const interval = setInterval(() => {
    progress += 2;
    streamProgress.value[aiMessage.id] = progress;

    if (progress >= 100) {
      clearInterval(interval);
      const finalState = isReplySuccess ? 'success' : 'error';
      const session = sessions.value.find(s => s.id === currentSessionId.value);
      if (session) {
        session.messageStates[aiMessage.id] = finalState;
      }
      chatActions.setMessageState(aiMessage.id, finalState);
      chatActions.setIsSending(false);
    }
  }, 50);
}

function getPreviousUserContent(targetMsgId) {
  const currentMsgs = messages.value;
  const idx = currentMsgs.findIndex(m => m.id === targetMsgId);
  for (let i = idx - 1; i >= 0; i--) {
    if (currentMsgs[i].role === 'user') {
      return currentMsgs[i].content;
    }
  }
  return '';
}

function handleSend(content) {
  const userMsg = {
    id: Date.now(),
    role: 'user',
    content: content,
    timestamp: formatTime(new Date())
  };
  const currentMessages = [...messages.value, userMsg];
  updateCurrentSessionMessages(currentMessages);
  // 更新消息状态到会话
  const session = sessions.value.find(s => s.id === currentSessionId.value);
  if (session) {
    session.messageStates[userMsg.id] = 'success';
    chatActions.setMessageState(userMsg.id, 'success');
  }

  const loadingMsg = {
    id: Date.now() + 1,
    role: 'assistant',
    content: 'AI正在思考...',
    timestamp: formatTime(new Date())
  };
  const messagesWithLoading = [...currentMessages, loadingMsg];
  updateCurrentSessionMessages(messagesWithLoading);
  // 更新消息状态到会话（重用上面的 session 变量）
  if (session) {
    session.messageStates[loadingMsg.id] = 'loading';
    chatActions.setMessageState(loadingMsg.id, 'loading');
  }
  chatActions.setIsSending(true);

  scrollToBottom();

  // 修改handleSend方法中的定时器部分
  setTimeout(() => {
    const currentMsgs = messages.value.filter(m => m.id !== loadingMsg.id);
    updateCurrentSessionMessages(currentMsgs);
  const isReplySuccess = Math.random() > 0.3;
  let aiContent = '';

  if (isReplySuccess) {
    const mockResult = getMockAnswer(content);
    // 处理 getMockAnswer 返回的不同格式：
    // 1. 卡片类型：{ type: 'card', ... } - 直接使用
    // 2. 文本类型：{ raw: string, html: string } - 使用 raw 字段用于流式渲染
    if (typeof mockResult === 'object' && mockResult !== null) {
      if (mockResult.type === 'card') {
        // 卡片类型，直接使用对象
        aiContent = mockResult;
      } else if (mockResult.raw) {
        // 文本类型，使用 raw 字段（原始文本用于流式渲染）
        aiContent = mockResult.raw;
      } else {
        // 兜底：如果格式不对，转换为字符串
        aiContent = String(mockResult);
      }
    } else {
      // 如果返回的是字符串，直接使用
      aiContent = mockResult;
    }
  } else {
    aiContent = '抱歉，回复失败，请点击重试~';
  }

  if (isReplySuccess) {
    aiContent = normalizeAiContent(getMockAnswer(content));
  } else {
    aiContent = '抱歉，回复失败，请点击重试~';
  }

    const aiReply = {
      id: Date.now() + 2,
      role: 'assistant',
      type: typeof aiContent === 'object' && aiContent.type === 'card' ? 'card' : 'text',
      content: aiContent,
      timestamp: formatTime(new Date())
    };
    const finalMessages = [...currentMsgs, aiReply];
    updateCurrentSessionMessages(finalMessages);
    
    // 设置消息状态为 loading，以便触发流式渲染
    const session = sessions.value.find(s => s.id === currentSessionId.value);
    if (session) {
      session.messageStates[aiReply.id] = 'loading';
      chatActions.setMessageState(aiReply.id, 'loading');
    }
    
    createAiStream(aiReply, isReplySuccess);

    scrollToBottom();
  }, 2000);
}
// 处理卡片点击事件
const handleCardClick = (cardData) => {
  switch (cardData.subtype) {
    case 'article':
      // 文章卡片：打开链接
      if (cardData.url) {
        window.open(cardData.url, '_blank');
      }
      break;
    case 'contact':
      // 联系方式卡片：复制邮箱
      if (cardData.contact) {
        navigator.clipboard.writeText(cardData.contact)
          .then(() => alert('邮箱已复制到剪贴板'))
          .catch(err => console.error('复制失败:', err));
      }
      break;
    default:
      console.log('未知卡片类型', cardData);
  }
}

function handleRetry(failedMsg) {
  const msgState = currentMessageStates.value[failedMsg.id] || chatStore.messageStates[failedMsg.id];
  if (failedMsg.role !== 'assistant' || msgState !== 'error') return;

  chatActions.setMessageState(failedMsg.id, 'loading');
  chatActions.setIsSending(true);

  setTimeout(() => {
    const isReplySuccess = Math.random() > 0.3;
    const prompt = getPreviousUserContent(failedMsg.id);
    const newContent = isReplySuccess 
      ? normalizeAiContent(getMockAnswer(prompt || ''))
      : '抱歉，回复仍失败，请稍后再试~';

    failedMsg.content = newContent;
    failedMsg.type = typeof newContent === 'object' && newContent.type === 'card' ? 'card' : 'text';
    failedMsg.timestamp = formatTime(new Date());
    createAiStream(failedMsg, isReplySuccess);
  }, 1500);
}

function handleCopy(message) {
  let textToCopy = '';
  if (message.type === 'card' && typeof message.content === 'object') {
    const { title, content, url, contact, phone } = message.content;
    textToCopy = [title, content, url, contact, phone].filter(Boolean).join('\n');
  } else if (typeof message.content === 'string') {
    textToCopy = message.content;
  } else {
    textToCopy = JSON.stringify(message.content);
  }

  navigator.clipboard?.writeText(textToCopy).then(() => {
    console.log('内容已复制');
  }).catch(() => {
    console.warn('复制失败');
  });
}

function handleRegenerate(message) {
  if (message.role !== 'assistant') return;
  const prompt = getPreviousUserContent(message.id);
  if (!prompt) return;

  chatActions.setMessageState(message.id, 'loading');
  chatActions.setIsSending(true);

  setTimeout(() => {
    const isReplySuccess = Math.random() > 0.3;
    const newContent = isReplySuccess 
      ? normalizeAiContent(getMockAnswer(prompt))
      : '抱歉，回复失败，请稍后再试~';

    message.content = newContent;
    message.type = typeof newContent === 'object' && newContent.type === 'card' ? 'card' : 'text';
    message.timestamp = formatTime(new Date());

    createAiStream(message, isReplySuccess);
  }, 1500);
}

// 会话管理函数
function createNewSession() {
  const newSessionId = 'session_' + Date.now();
  const welcome = defaultWelcomeMessage();
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
  hydrateStreamProgress();
  scrollToBottom();
}

function handleNewChat() {
  createNewSession();
}

function handleSwitchSession(sessionId) {
  if (sessionId === currentSessionId.value) return;
  currentSessionId.value = sessionId;
  const session = sessions.value.find(s => s.id === sessionId);
  if (session) {
    // 恢复会话的消息状态到 chatStore
    chatStore.messageStates = { ...session.messageStates };
  }
  chatActions.resetSession(sessionId);
  hydrateStreamProgress();
  scrollToBottom();
}

function handleDeleteSession(sessionId) {
  const index = sessions.value.findIndex(s => s.id === sessionId);
  if (index === -1) return;
  
  sessions.value.splice(index, 1);
  
  // 如果删除的是当前会话，切换到其他会话或创建新会话
  if (sessionId === currentSessionId.value) {
    if (sessions.value.length > 0) {
      currentSessionId.value = sessions.value[0].id;
      chatActions.resetSession(sessions.value[0].id);
    } else {
      createNewSession();
    }
  }
  hydrateStreamProgress();
}

function handleSidebarToggle(collapsed) {
  sidebarCollapsed.value = collapsed;
}

function ensureDefaultMessage() {
  const currentMsgs = messages.value;
  if (!currentMsgs.length) {
    const welcome = defaultWelcomeMessage();
    updateCurrentSessionMessages([welcome]);
    chatActions.setMessageState(welcome.id, 'success');
  }
}

function hydrateStreamProgress() {
  const currentMsgs = messages.value;
  currentMsgs.forEach(msg => {
    if (msg.role === 'assistant') {
      streamProgress.value[msg.id] = 100;
      const states = currentMessageStates.value;
      if (!states[msg.id]) {
        chatActions.setMessageState(msg.id, 'success');
      }
    }
  });
}

// 持久化函数
function persistSessions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      sessions: sessions.value,
      currentSessionId: currentSessionId.value
    }));
  } catch (err) {
    console.warn('保存会话失败', err);
  }
}

function loadSessions() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
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
      ensureDefaultMessage();
      hydrateStreamProgress();
    }
  }
}

onMounted(() => {
  loadSessions();
});

// 监听会话变化并持久化
watch(
  [sessions, currentSessionId],
  () => {
    persistSessions();
  },
  { deep: true }
);

// 监听消息状态变化并更新到会话
watch(
  () => chatStore.messageStates,
  (newStates) => {
    updateCurrentSessionStates(newStates);
  },
  { deep: true }
);
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Arial', sans-serif;
}

.app-wrapper {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.chat-container {
  flex: 1;
  margin-left: 280px;
  display: flex;
  flex-direction: column;
  max-width: calc(100% - 280px);
  padding: 20px;
  overflow: hidden;
  transition: margin-left 0.3s ease, max-width 0.3s ease;
}

.chat-container.sidebar-collapsed {
  margin-left: 60px;
  max-width: calc(100% - 60px);
}

.chat-title {
  text-align: center;
  color: #333;
  margin-bottom: 20px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  background-color: #fafafa;
}

.message-item {
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
  max-width: 70%;
}

.user-message {
  margin-left: auto;
}

.user-message .message-content,
.user-message .card-message {
  background-color: #409eff;
  color: white;
  border-radius: 16px 16px 4px 16px;
}

.ai-message {
  margin-right: auto;
}

.ai-message .message-content,
.ai-message .card-message {
  background-color: #e0e0e0;
  color: #333;
  border-radius: 16px 16px 16px 4px;
}

.message-role {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.message-time {
  font-size: 10px;
  color: #999;
  margin-top: 4px;
  text-align: right;
}

.retry-btn-container {
  margin-top: 4px;
  text-align: right;
}

.retry-btn {
  background-color: #ff4d4f;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 12px;
  cursor: pointer;
}

.retry-btn:hover {
  background-color: #e03131;
}

.message-actions {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}

.action-btn {
  background-color: transparent;
  border: 1px solid #ccc;
  border-radius: 12px;
  padding: 2px 10px;
  font-size: 12px;
  cursor: pointer;
  color: #555;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn:not(:disabled):hover {
  border-color: #409eff;
  color: #409eff;
}
</style>