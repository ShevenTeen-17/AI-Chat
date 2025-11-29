<template>
  <div 
    :class="['message-item', message.role === 'user' ? 'user-message' : 'ai-message']"
  >
    <div class="message-role">{{ message.role === 'user' ? '我' : 'AI' }}</div>
    <ChatMessage 
      :message="message" 
      :state="messageState"
      :stream-progress="streamProgress" 
      @card-click="$emit('card-click', $event)"
    />
    <div 
      v-if="message.role === 'assistant'" 
      class="message-actions"
    >
      <button 
        class="action-btn" 
        @click="$emit('copy', message)"
        :disabled="messageState === 'loading'"
      >
        复制内容
      </button>
      <button 
        class="action-btn"
        @click="$emit('regenerate', message)"
        :disabled="messageState === 'loading' || isSending"
      >
        重新生成
      </button>
    </div>

    <div v-if="messageState === 'error'" class="retry-btn-container">
      <button 
        class="retry-btn" 
        @click="$emit('retry', message)"
      >
        重试
      </button>
    </div>
    <div class="message-time">{{ message.timestamp }}</div>
  </div>
</template>

<script setup>
import ChatMessage from '../chatmessage/Index.vue';

defineProps({
  message: {
    type: Object,
    required: true
  },
  messageState: {
    type: String,
    default: 'success'
  },
  streamProgress: {
    type: Number,
    default: 100
  },
  isSending: {
    type: Boolean,
    default: false
  }
});

defineEmits(['card-click', 'copy', 'regenerate', 'retry']);
</script>

<style scoped>
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

/* 在现有样式基础上添加 */
.message-item .image-message-container {
  padding: 4px;
}

.user-message .image-message-container {
  border-radius: 16px 16px 4px 16px;
  background-color: #409eff;
}

.ai-message .image-message-container {
  border-radius: 16px 16px 16px 4px;
  background-color: #e0e0e0;
}

/* 新增图片消息样式 */
.message-item .image-message-container {
  padding: 8px;
}

.user-message .image-message-container {
  background-color: #409eff;
  border-radius: 16px 16px 4px 16px;
}

.ai-message .image-message-container {
  background-color: #e0e0e0;
  border-radius: 16px 16px 16px 4px;
}

/* 确保图片不超出容器 */
.message-item img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
}

</style>