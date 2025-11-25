<template>
  <div class="chat-container">
    <h1 class="chat-title">AI对话框（测试版）</h1>

    <div class="chat-messages" ref="messageContainer">
      <div 
        v-for="msg in messages" 
        :key="msg.id"
        :class="['message-item', msg.role === 'user' ? 'user-message' : 'ai-message']"
      >
        <div class="message-role">{{ msg.role === 'user' ? '我' : 'AI' }}</div>
        <ChatMessage 
          :message="msg" 
          :state="chatStore.messageStates[msg.id]" 
        />
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

  setTimeout(() => {
    messages.value.pop();
    const isReplySuccess = Math.random() > 0.3;
    let aiContent = '';

    if (isReplySuccess) {
      aiContent = getMockAnswer(content);
    } else {
      aiContent = '抱歉，回复失败，请点击重试~';
    }

    const aiReply = {
      id: Date.now() + 2,
      role: 'assistant',
      content: aiContent,
      timestamp: formatTime(new Date())
    };
    messages.value.push(aiReply);
    chatActions.setMessageState(aiReply.id, isReplySuccess ? 'success' : 'error');
    chatActions.setIsSending(false);

    scrollToBottom();
  }, 2000);
}

function handleRetry(failedMsg) {
  if (failedMsg.role !== 'assistant' || chatStore.messageStates[failedMsg.id] !== 'error') return;

  chatActions.setMessageState(failedMsg.id, 'loading');
  chatActions.setIsSending(true);

  setTimeout(() => {
    const isReplySuccess = Math.random() > 0.3;
    const newContent = isReplySuccess 
      ? getMockAnswer(messages.value[messages.value.length - 2].content)
      : '抱歉，回复仍失败，请稍后再试~';

    failedMsg.content = newContent;
    chatActions.setMessageState(failedMsg.id, isReplySuccess ? 'success' : 'error');
    chatActions.setIsSending(false);
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
</style>