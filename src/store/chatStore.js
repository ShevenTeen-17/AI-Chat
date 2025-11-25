// src/store/chatStore.js
import { reactive } from 'vue';

const chatStore = reactive({
  messages: [],
  messageStates: {}, // 存储消息状态: loading/error
   global: {
    isSending: false,
    currentSessionId: 'session_' + Date.now()
  },
  // 添加消息
  addMessage(message) {
    this.messages.push(message);
    this.saveToLocalStorage();
  },
  
  // 更新消息状态
  updateMessageState(id, state) {
    this.messageStates[id] = state;
  },
  
  // 本地存储相关方法（后续扩展用）
  saveToLocalStorage() {
    localStorage.setItem('chatHistory', JSON.stringify(this.messages));
  },
  
  loadFromLocalStorage() {
    const saved = localStorage.getItem('chatHistory');
    if (saved) {
      this.messages = JSON.parse(saved);
    }
  }
});


// 定义操作状态的“方法”（修改状态需通过方法，避免直接修改）
const chatActions = {
  // 设置单条消息的状态（如AI加载时设为loading，回复成功设为success）
 setMessageState(messageId, state) {
    if (!messageId || !['loading', 'success', 'error'].includes(state)) return;
    chatStore.updateMessageState(messageId, state); // 调用内部方法
  },
  // 设置全局“是否正在发送”状态（AI加载时true，回复完成/失败时false）
  setIsSending(isSending) {
    chatStore.global.isSending = isSending;
  },
  // 重置当前会话（如新建会话时，清空消息状态）
  resetSession(newSessionId) {
    chatStore.global.currentSessionId = newSessionId || 'session_' + Date.now();
    chatStore.messageStates = {}; // 清空历史消息状态
    chatStore.global.isSending = false;
  }
};

// 导出状态和操作方法（供组件使用）
export { chatStore, chatActions };