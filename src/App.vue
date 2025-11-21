<template>
  <!-- 整个对话框容器 -->
  <div class="chat-container">
    <!-- 对话标题 -->
    <h1 class="chat-title">AI对话框（MVP版）</h1>

    <!-- 对话区域：显示消息列表，支持滚动 -->
    <div class="chat-messages" ref="messageContainer">
      <!-- 循环渲染每条消息 -->
      <div 
        v-for="msg in messages" 
        :key="msg.id"  
        :class="['message-item', msg.role === 'user' ? 'user-message' : 'ai-message']"
      >
        <!-- 消息角色（用户/AI） -->
        <div class="message-role">{{ msg.role === 'user' ? '我' : 'AI' }}</div>
        <!-- 消息内容 -->
        <div class="message-content">{{ msg.content }}</div>
        <!-- 消息时间戳 -->
        <div class="message-time">{{ msg.timestamp }}</div>
      </div>
    </div>

    <!-- 输入区域：多行输入框 + 发送按钮 -->
    <div class="input-container">
      <textarea
        v-model="inputContent" 
        class="input-textarea"
        placeholder="请输入消息..."
        rows="3" 
        @keydown.enter.prevent="handleSend"  
      ></textarea>
      <button class="send-btn" @click="handleSend">发送</button>
    </div>
  </div>
</template>

<script setup>
// 1. 导入Vue核心API：ref用于定义响应式变量
import { ref, nextTick } from 'vue';

// 2. 定义响应式变量
// - messages：存储所有对话消息（数组，每条消息是对象）
const messages = ref([
  // 初始欢迎消息（可选，让界面打开时有内容）
  {
    id: 1,
    role: 'assistant',  // assistant=AI，user=用户
    content: '你好！我是AI助手，有什么可以帮你的？',
    timestamp: formatTime(new Date())  // 格式化当前时间
  }
]);
// - inputContent：存储输入框内容
const inputContent = ref('');
// - messageContainer：获取对话区域DOM元素，用于自动滚动到底部
const messageContainer = ref(null);

// 3. 工具函数：格式化时间（如 "2024-05-20 14:30:25"）
function formatTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');  // 月份从0开始，补0成2位
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

// 4. 核心函数：发送消息
function handleSend() {
  // 4.1 校验输入：为空则不发送
  const content = inputContent.value.trim();
  if (!content) return;

  // 4.2 添加用户消息到列表
  const userMsg = {
    id: Date.now(),  // 用当前时间戳作为唯一ID（简单高效）
    role: 'user',
    content: content,
    timestamp: formatTime(new Date())
  };
  messages.value.push(userMsg);

  // 4.3 清空输入框
  inputContent.value = '';

  // 4.4 触发自动滚动到底部（nextTick确保DOM更新后再滚动）
  scrollToBottom();

  // 4.5 模拟AI加载状态：先添加"加载中"消息
  const loadingMsg = {
    id: Date.now() + 1,  // ID比用户消息大1，避免重复
    role: 'assistant',
    content: 'AI正在思考...',
    timestamp: formatTime(new Date())
  };
  messages.value.push(loadingMsg);
  scrollToBottom();  // 加载中消息也要滚动到底部

  // 4.6 模拟AI延迟回复（2秒后替换加载状态为真实回复）
  setTimeout(() => {
    // 移除加载中消息（找到最后一条消息并替换）
    messages.value.pop();
    // 模拟AI回复内容（可自定义，这里用固定句子+用户消息关键词）
    const aiReply = {
      id: Date.now() + 2,
      role: 'assistant',
      content: `你刚才说："${content}"。这是我模拟的回复，MVP版暂不支持真实AI逻辑~`,
      timestamp: formatTime(new Date())
    };
    messages.value.push(aiReply);
    scrollToBottom();  // 回复消息滚动到底部
  }, 2000);  // 2000毫秒=2秒延迟
}

// 5. 辅助函数：自动滚动对话区域到底部
function scrollToBottom() {
  nextTick(() => {
    // 当对话区域DOM存在时，设置滚动高度为最大（即到底部）
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
    }
  });
}
</script>

<style scoped>
/* 全局样式：重置默认margin/padding，统一字体 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Arial', sans-serif;
}

/* 对话框容器：居中显示，固定宽度 */
.chat-container {
  max-width: 800px;
  margin: 20px auto;
  padding: 0 20px;
}

/* 对话标题：居中，margin-bottom */
.chat-title {
  text-align: center;
  color: #333;
  margin-bottom: 20px;
}

/* 对话区域：固定高度，可滚动，边框 */
.chat-messages {
  height: 500px;
  overflow-y: auto;  /* 垂直滚动 */
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  background-color: #fafafa;
}

/* 单条消息容器：margin-bottom，flex布局 */
.message-item {
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
  max-width: 70%;  /* 消息最大宽度，避免过长 */
}

/* 用户消息：右对齐，背景色蓝色 */
.user-message {
  margin-left: auto;  /* 右对齐 */
}
.user-message .message-content {
  background-color: #409eff;
  color: white;
  border-radius: 16px 16px 4px 16px;  /* 右上角不圆角，区分方向 */
}

/* AI消息：左对齐，背景色灰色 */
.ai-message {
  margin-right: auto;  /* 左对齐 */
}
.ai-message .message-content {
  background-color: #e0e0e0;
  color: #333;
  border-radius: 16px 16px 16px 4px;  /* 左下角不圆角，区分方向 */
}

/* 消息角色：字体大小12px，margin-bottom 4px */
.message-role {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

/* 消息内容：padding，line-height，font-size */
.message-content {
  padding: 10px 15px;
  line-height: 1.5;
  font-size: 14px;
  word-wrap: break-word;  /* 自动换行，避免长单词溢出 */
}

/* 消息时间戳：font-size 10px，margin-top 4px，text-align右对齐 */
.message-time {
  font-size: 10px;
  color: #999;
  margin-top: 4px;
  text-align: right;
}

/* 输入区域：flex布局，输入框和按钮并排 */
.input-container {
  display: flex;
  gap: 10px;  /* 输入框和按钮间距 */
}

/* 输入框：flex占满剩余空间，边框，圆角 */
.input-textarea {
  flex: 1;  /* 占满剩余宽度 */
  padding: 10px 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  resize: none;  /* 禁止拉伸输入框 */
  font-size: 14px;
}
/* 输入框聚焦时：边框变色，去掉默认outline */
.input-textarea:focus {
  outline: none;
  border-color: #409eff;
}

/* 发送按钮：固定宽度，背景色蓝色，白色文字，圆角 */
.send-btn {
  width: 100px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;  /* 鼠标悬浮变指针 */
  font-size: 14px;
}
/* 按钮 hover 效果：背景色加深 */
.send-btn:hover {
  background-color: #3086d6;
}
</style>