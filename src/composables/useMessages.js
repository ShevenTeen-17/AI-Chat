import { ref, computed } from 'vue';
import { formatTime } from '../utils/formatter';
import { getMockAnswer } from '../store/helpers';
import { normalizeAiContent } from '../utils/messageUtils';
import { DEFAULT_MESSAGES, STREAM_CONFIG, SIMULATE_FAILURE_RATE } from '../config/constants';
import { chatStore, chatActions } from '../store/chatStore';

export function useMessages(sessions, currentSessionId, updateSessionMessages, updateSessionStates) {
  const streamProgress = ref({});

  // 获取当前会话的消息
  const messages = computed(() => {
    const session = sessions.value.find(s => s.id === currentSessionId.value);
    return session ? session.messages : [];
  });

  // 获取当前会话的消息状态
  const currentMessageStates = computed(() => {
    const session = sessions.value.find(s => s.id === currentSessionId.value);
    return session ? session.messageStates : {};
  });

  // 创建流式渲染动画
  function createAiStream(aiMessage, isReplySuccess) {
    streamProgress.value[aiMessage.id] = 0;
    let progress = 0;
    const interval = setInterval(() => {
      progress += STREAM_CONFIG.PROGRESS_STEP;
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
    }, STREAM_CONFIG.INTERVAL);
  }

  // 获取上一条用户消息内容
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

  // 发送文本消息
  function handleSend(content) {
    const userMsg = {
      id: Date.now(),
      role: 'user',
      type: 'text',
      content: content,
      timestamp: formatTime(new Date())
    };
    const currentMessages = [...messages.value, userMsg];
    updateSessionMessages(currentSessionId.value, currentMessages);
    
    const session = sessions.value.find(s => s.id === currentSessionId.value);
    if (session) {
      session.messageStates[userMsg.id] = 'success';
      chatActions.setMessageState(userMsg.id, 'success');
    }

    const loadingMsg = {
      id: Date.now() + 1,
      role: 'assistant',
      type: 'text',
      content: DEFAULT_MESSAGES.LOADING,
      timestamp: formatTime(new Date())
    };
    const messagesWithLoading = [...currentMessages, loadingMsg];
    updateSessionMessages(currentSessionId.value, messagesWithLoading);
    
    if (session) {
      session.messageStates[loadingMsg.id] = 'loading';
      chatActions.setMessageState(loadingMsg.id, 'loading');
    }
    chatActions.setIsSending(true);

    // 模拟AI回复
    setTimeout(() => {
      const currentMsgs = messages.value.filter(m => m.id !== loadingMsg.id);
      updateSessionMessages(currentSessionId.value, currentMsgs);
      
      const isReplySuccess = Math.random() > SIMULATE_FAILURE_RATE;
      const aiContent = isReplySuccess 
        ? normalizeAiContent(getMockAnswer(content))
        : DEFAULT_MESSAGES.ERROR;

      const aiReply = {
        id: Date.now() + 2,
        role: 'assistant',
        type: typeof aiContent === 'object' && aiContent.type === 'card' ? 'card' : 'text',
        content: aiContent,
        timestamp: formatTime(new Date())
      };
      const finalMessages = [...currentMsgs, aiReply];
      updateSessionMessages(currentSessionId.value, finalMessages);
      
      if (session) {
        session.messageStates[aiReply.id] = 'loading';
        chatActions.setMessageState(aiReply.id, 'loading');
      }
      
      createAiStream(aiReply, isReplySuccess);
    }, 2000);
  }

  // 发送图片消息
  function handleSendImage(imageData) {
    if (!imageData || !imageData.url) return; // 验证图片数据
    
    const userMsg = {
      id: Date.now(),
      role: 'user',
      type: 'image', // 图片类型
      content: imageData.url, // 存储图片URL或Base64
      timestamp: formatTime(new Date())
    };
    
    // 更新消息列表
    const currentMessages = [...messages.value, userMsg];
    updateSessionMessages(currentSessionId.value, currentMessages);
    
    // 更新消息状态
    const session = sessions.value.find(s => s.id === currentSessionId.value);
    if (session) {
      session.messageStates[userMsg.id] = 'success';
      chatActions.setMessageState(userMsg.id, 'success');
    }

    // 显示AI加载状态
    const loadingMsg = {
      id: Date.now() + 1,
      role: 'assistant',
      type: 'text',
      content: DEFAULT_MESSAGES.LOADING,
      timestamp: formatTime(new Date())
    };
    const messagesWithLoading = [...currentMessages, loadingMsg];
    updateSessionMessages(currentSessionId.value, messagesWithLoading);
    
    if (session) {
      session.messageStates[loadingMsg.id] = 'loading';
      chatActions.setMessageState(loadingMsg.id, 'loading');
    }
    chatActions.setIsSending(true);

    // 模拟AI处理图片后的回复
    setTimeout(() => {
      // 移除加载消息
      const currentMsgs = messages.value.filter(m => m.id !== loadingMsg.id);
      updateSessionMessages(currentSessionId.value, currentMsgs);
      
      // 生成AI回复
      const isReplySuccess = Math.random() > SIMULATE_FAILURE_RATE;
      const aiContent = isReplySuccess 
        ? normalizeAiContent(`我已收到你上传的图片。这是一张图片的描述信息。`)
        : DEFAULT_MESSAGES.ERROR;

      const aiReply = {
        id: Date.now() + 2,
        role: 'assistant',
        type: typeof aiContent === 'object' && aiContent.type === 'card' ? 'card' : 'text',
        content: aiContent,
        timestamp: formatTime(new Date())
      };
      
      // 更新最终消息列表
      const finalMessages = [...currentMsgs, aiReply];
      updateSessionMessages(currentSessionId.value, finalMessages);
      
      if (session) {
        session.messageStates[aiReply.id] = 'loading';
        chatActions.setMessageState(aiReply.id, 'loading');
      }
      
      // 启动流式渲染
      createAiStream(aiReply, isReplySuccess);
    }, 2000);
  }

  // 重试消息
  function handleRetry(failedMsg) {
    const msgState = currentMessageStates.value[failedMsg.id] || chatStore.messageStates[failedMsg.id];
    if (failedMsg.role !== 'assistant' || msgState !== 'error') return;

    chatActions.setMessageState(failedMsg.id, 'loading');
    chatActions.setIsSending(true);

    setTimeout(() => {
      const isReplySuccess = Math.random() > SIMULATE_FAILURE_RATE;
      const prompt = getPreviousUserContent(failedMsg.id);
      const newContent = isReplySuccess 
        ? normalizeAiContent(getMockAnswer(prompt || ''))
        : DEFAULT_MESSAGES.RETRY_ERROR;

      failedMsg.content = newContent;
      failedMsg.type = typeof newContent === 'object' && newContent.type === 'card' ? 'card' : 'text';
      failedMsg.timestamp = formatTime(new Date());
      
      const session = sessions.value.find(s => s.id === currentSessionId.value);
      if (session) {
        updateSessionMessages(currentSessionId.value, session.messages);
      }
      
      createAiStream(failedMsg, isReplySuccess);
    }, 1500);
  }

  // 复制消息
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

  // 重新生成消息
  function handleRegenerate(message) {
    if (message.role !== 'assistant') return;
    const prompt = getPreviousUserContent(message.id);
    if (!prompt) return;

    chatActions.setMessageState(message.id, 'loading');
    chatActions.setIsSending(true);

    setTimeout(() => {
      const isReplySuccess = Math.random() > SIMULATE_FAILURE_RATE;
      const newContent = isReplySuccess 
        ? normalizeAiContent(getMockAnswer(prompt))
        : DEFAULT_MESSAGES.ERROR;

      message.content = newContent;
      message.type = typeof newContent === 'object' && newContent.type === 'card' ? 'card' : 'text';
      message.timestamp = formatTime(new Date());

      const session = sessions.value.find(s => s.id === currentSessionId.value);
      if (session) {
        updateSessionMessages(currentSessionId.value, session.messages);
      }

      createAiStream(message, isReplySuccess);
    }, 1500);
  }

  // 初始化流式进度（用于加载历史消息）
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

  // 确保有默认消息
  function ensureDefaultMessage() {
    const currentMsgs = messages.value;
    if (!currentMsgs.length) {
      const welcome = {
        id: Date.now(),
        role: 'assistant',
        type: 'text',
        content: DEFAULT_MESSAGES.WELCOME,
        timestamp: formatTime(new Date())
      };
      updateSessionMessages(currentSessionId.value, [welcome]);
      chatActions.setMessageState(welcome.id, 'success');
    }
  }

  return {
    messages,
    currentMessageStates,
    streamProgress,
    handleSend,
    handleSendImage,  // 新增图片消息处理方法
    handleRetry,
    handleCopy,
    handleRegenerate,
    hydrateStreamProgress,
    ensureDefaultMessage
  };
}