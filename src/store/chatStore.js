// src/store/chatStore.js
import { reactive } from 'vue';

// 定义对话相关的所有状态（单条消息状态+全局状态）
const chatStore = reactive({
  // 1. 全局状态：控制输入框/发送按钮状态
  global: {
    isSending: false, // 是否正在发送（AI加载中时设为true，禁止重复发送）
    currentSessionId: 'session_' + Date.now() // 当前会话ID（后续持久化用，初始值为时间戳）
  },
  // 2. 消息状态映射：key=消息ID，value=消息状态（loading/success/error）
  messageStates: {}
});

// 定义操作状态的“方法”（修改状态需通过方法，避免直接修改）
const chatActions = {
  // 设置单条消息的状态（如AI加载时设为loading，回复成功设为success）
  setMessageState(messageId, state) {
    if (!messageId || !['loading', 'success', 'error'].includes(state)) return;
    chatStore.messageStates[messageId] = state;
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