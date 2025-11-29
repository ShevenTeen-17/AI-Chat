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
            <MessageItem
              :message="msg"
              :message-state="getMessageState(msg.id)"
              :stream-progress="streamProgress[msg.id] || 100"
              :is-sending="chatStore.global.isSending"
              @card-click="handleCardClick"
              @copy="handleCopy"
              @regenerate="handleRegenerate"
              @retry="handleRetry"
            />
          </template>
        </VirtualList>
        
        <!-- 消息数量较少时使用普通渲染 -->
        <template v-else>
          <MessageItem
            v-for="msg in messages"
            :key="msg.id"
            :message="msg"
            :message-state="getMessageState(msg.id)"
            :stream-progress="streamProgress[msg.id] || 100"
            :is-sending="chatStore.global.isSending"
            @card-click="handleCardClick"
            @copy="handleCopy"
            @regenerate="handleRegenerate"
            @retry="handleRetry"
          />
        </template>
      </div>

      <!-- 上下文选择器区域 -->
      <div 
        class="context-selector-container"
        v-if="showContextSelector"
      >
        <ContextSelector 
          :messages="messages" 
          v-model:selected="selectedContextIds"
          ref="contextSelectorRef"
        />
      </div>

      <div class="input-actions">
        <button 
          class="context-btn"
          @click="toggleContextSelector"
          :disabled="chatStore.global.isSending"
        >
          {{ showContextSelector ? '关闭上下文' : '选择上下文' }}
        </button>
        <button 
          class="image-upload-btn" 
          @click="triggerImageUpload"
          :disabled="chatStore.global.isSending"
        >
          📷 上传图片
        </button>
        <InputArea 
          :is-sending="chatStore.global.isSending"
          @send="handleSendText"
        />
        <input 
          type="file" 
          ref="imageInput" 
          class="image-input"
          accept="image/*" 
          @change="handleImageSelected"
          hidden
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, watch } from 'vue';
import { chatStore } from '../store/chatStore';
import { VIRTUAL_SCROLL_THRESHOLD } from '../config/constants';
import { useSessions } from '../composables/useSessions';
import { useMessages } from '../composables/useMessages';
import Sidebar from './Sidebar.vue';
import InputArea from './InputArea.vue';
import VirtualList from './VirtualList.vue';
import MessageItem from './message/MessageItem.vue';
import ContextSelector from './ContextSelector.vue'; // 导入上下文选择组件

// 侧边栏状态
const sidebarCollapsed = ref(false);
const imageInput = ref(null);

// 上下文选择相关状态
const showContextSelector = ref(false);
const selectedContextIds = ref([]);
const contextSelectorRef = ref(null);

// 会话管理
const {
  sessions,
  currentSessionId,
  currentMessageStates,
  createNewSession,
  switchSession,
  deleteSession,
  updateSessionMessages,
  updateSessionStates,
  loadSessions
} = useSessions();

// 消息处理
const {
  messages,
  streamProgress,
  handleSend: sendMessage,
  handleSendImage: sendImageMessage,
  handleRetry,
  handleCopy,
  handleRegenerate,
  hydrateStreamProgress,
  ensureDefaultMessage
} = useMessages(sessions, currentSessionId, updateSessionMessages, updateSessionStates);

// 滚动相关
const messageContainer = ref(null);
const virtualListRef = ref(null);

function scrollToBottom() {
  nextTick(() => {
    if (virtualListRef.value && messages.length > VIRTUAL_SCROLL_THRESHOLD) {
      virtualListRef.value.scrollToBottom();
    } else if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
    }
  });
}

// 获取消息状态
function getMessageState(msgId) {
  return currentMessageStates.value[msgId] || chatStore.messageStates[msgId] || 'success';
}

function handleSendText(content) {
  // 获取选中的上下文消息
  let contextMessages = [];
  if (contextSelectorRef.value) {
    contextMessages = contextSelectorRef.value.getSelectedMessages();
  }
  
  // 构建包含上下文的完整内容
  let fullContent = content;
  if (contextMessages.length > 0) {
    const contextContent = contextMessages.map(msg => {
      const role = msg.role === 'user' ? '用户' : 'AI';
      // 处理不同类型消息的内容提取
      let msgContent = '';
      if (msg.type === 'text') {
        msgContent = msg.content;
      } else if (msg.type === 'image') {
        msgContent = '[图片消息]';
      } else if (msg.type === 'card' && typeof msg.content === 'object') {
        msgContent = `[卡片: ${msg.content.title || '无标题'}]`;
      }
      return `[${role}]: ${msgContent}`;
    }).join('\n');
    
    fullContent = `参考以下上下文进行回答:\n${contextContent}\n\n我的问题: ${content}`;
  }
  
  sendMessage(fullContent);
  scrollToBottom();
  
  // 发送后关闭上下文选择器并清空选择
  if (showContextSelector.value) {
    toggleContextSelector();
  }
  selectedContextIds.value = [];
}


// 会话管理事件处理（修改原有方法，添加上下文重置逻辑）
function handleNewChat() {
  createNewSession();
  scrollToBottom();
  // 新建会话时关闭上下文选择器（新增）
  showContextSelector.value = false;
  selectedContextIds.value = [];
}

function handleSwitchSession(sessionId) {
  switchSession(sessionId);
  hydrateStreamProgress();
  scrollToBottom();
  // 切换会话时关闭上下文选择器（新增）
  showContextSelector.value = false;
  selectedContextIds.value = [];
}

// 图片上传处理
function triggerImageUpload() {
  imageInput.value?.click();
}

function handleImageSelected(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    sendImageMessage({
      url: e.target.result,
      name: file.name,
      size: file.size
    });
    scrollToBottom();
  };
  reader.readAsDataURL(file);
  
  // 重置input值，允许重复上传同一张图片
  event.target.value = '';
}

// 上下文选择器切换
function toggleContextSelector() {
  showContextSelector.value = !showContextSelector.value;
  // 重置选择状态
  if (!showContextSelector.value) {
    selectedContextIds.value = [];
  }
}

// 实现处理方法
// 选择同步由 v-model:selected 自动处理

function handleDeleteSession(sessionId) {
  deleteSession(sessionId);
  hydrateStreamProgress();
}

function handleSidebarToggle(collapsed) {
  sidebarCollapsed.value = collapsed;
}

// 卡片点击处理
function handleCardClick(cardData) {
  switch (cardData.subtype) {
    case 'article':
      if (cardData.url) {
        window.open(cardData.url, '_blank');
      }
      break;
    case 'contact':
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

// 监听消息状态变化并更新到会话
watch(
  () => chatStore.messageStates,
  (newStates) => {
    updateSessionStates(currentSessionId.value, newStates);
  },
  { deep: true }
);

// 初始化
onMounted(() => {
  loadSessions();
  ensureDefaultMessage();
  hydrateStreamProgress();
});
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

/* 上下文选择器样式 */
.context-selector-container {
  margin-bottom: 10px;
  max-height: 200px;
  overflow: hidden;
}

.input-actions {
  display: flex;
  gap: 10px;
}

/* 上下文按钮样式 */
.context-btn {
  width: 120px;
  background-color: #c540dd;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.context-btn:hover {
  background-color: #ba6ddb;
}

.context-btn:disabled {
  background-color: #d09bd9;
  cursor: not-allowed;
}

.image-upload-btn {
  width: 100px;
  background-color: #79c951ff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.image-upload-btn:hover {
  background-color: #52b326;
}

.image-upload-btn:disabled {
  background-color: #a9d98f;
  cursor: not-allowed;
}

.image-input {
  display: none;
}

</style>