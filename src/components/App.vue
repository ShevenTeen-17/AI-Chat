<template>
  <div class="chat-container">
    <h1 class="chat-title">AI对话框（测试版）</h1>

    <div class="chat-messages" ref="messageContainer">
      <div 
        v-for="msg in messages" 
        :key="msg.id"
        :class="['message-item', msg.role === 'user' ? 'user-message' : 'ai-message']">
        <div class="message-role">{{ msg.role === 'user' ? '我' : 'AI' }}</div>
        <ChatMessage 
    :message="msg" 
    :state="chatStore.messageStates[msg.id]"
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
            :disabled="chatStore.messageStates[msg.id] === 'loading'"
          >
            复制内容
          </button>
          <button 
            class="action-btn"
            @click="handleRegenerate(msg)"
            :disabled="chatStore.messageStates[msg.id] === 'loading' || chatStore.global.isSending"
          >
            重新生成
          </button>
        </div>

        <div v-if="chatStore.messageStates[msg.id] === 'error'" class="retry-btn-container">
          <button 
            class="retry-btn" 
            @click="handleRetry(msg)"
          >
            重试
          </button>
        </div>
        <div class="message-time">{{ msg.timestamp }}</div>
      </div>
    </div>

    <InputArea 
      :is-sending="chatStore.global.isSending"
      @send="handleSend"
    />
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import { chatStore, chatActions } from '../store/chatStore';
import { getMockAnswer } from '../store/helpers';
import { formatTime } from '../utils/formatter';
import ChatMessage from './ChatMessage/index.vue';
import InputArea from './InputArea.vue';


  // 添加流式渲染进度管理
const streamProgress = ref({});
const messages = ref([
  {
    id: 1,
    role: 'assistant',
    content: '你好！我是AI助手，有什么可以帮你的？',
    timestamp: formatTime(new Date())
  }
]);

const messageContainer = ref(null);

function scrollToBottom() {
  nextTick(() => {
    if (messageContainer.value) {
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
      chatActions.setMessageState(aiMessage.id, isReplySuccess ? 'success' : 'error');
      chatActions.setIsSending(false);
    }
  }, 50);
}

function getPreviousUserContent(targetMsgId) {
  const idx = messages.value.findIndex(m => m.id === targetMsgId);
  for (let i = idx - 1; i >= 0; i--) {
    if (messages.value[i].role === 'user') {
      return messages.value[i].content;
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
  messages.value.push(userMsg);
  chatActions.setMessageState(userMsg.id, 'success');

  const loadingMsg = {
    id: Date.now() + 1,
    role: 'assistant',
    content: 'AI正在思考...',
    timestamp: formatTime(new Date())
  };
  messages.value.push(loadingMsg);
  chatActions.setMessageState(loadingMsg.id, 'loading');
  chatActions.setIsSending(true);

  scrollToBottom();


// 修改handleSend方法中的定时器部分
setTimeout(() => {
  messages.value.pop();
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
  messages.value.push(aiReply);
  
  // 设置消息状态为 loading，以便触发流式渲染
  chatActions.setMessageState(aiReply.id, 'loading');
  
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
  if (failedMsg.role !== 'assistant' || chatStore.messageStates[failedMsg.id] !== 'error') return;

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
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Arial', sans-serif;
}

.chat-container {
  max-width: 800px;
  margin: 20px auto;
  padding: 0 20px;
}

.chat-title {
  text-align: center;
  color: #333;
  margin-bottom: 20px;
}

.chat-messages {
  height: 500px;
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