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

    <!-- 输入区域：3行输入框 + 发送按钮 -->
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
// 1. 导入Vue核心API：ref用于定义响应式变量；导入mock文件：json文件用于生成ai回答
import { ref, nextTick } from 'vue';
import mockData from './mock/ai-answers.json'

// 2. 定义响应式变量
// - messages：存储所有对话消息（数组，每条消息是对象）
const messages = ref([
  // 初始欢迎消息
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

// 3. 工具函数：格式化时间
function formatTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

// 新增：工具函数：根据用户消息匹配Mock中的AI答案
function getMockAnswer(userInput) {
  // 1. 遍历Mock文件中的所有“问题-答案”对
  const matchedItem = mockData.mockAnswers.find(item => {
    // 匹配规则：用户输入包含Mock中的“userQuestion”（不区分大小写，提高匹配灵活性）
    return userInput.toLowerCase().includes(item.userQuestion.toLowerCase());
  });
  // 2. 有匹配的答案则返回，无匹配则返回“默认回复”
  if (matchedItem) {
    return matchedItem.aiAnswer;
  } else {
    // 从Mock中找“默认回复”（也可直接写固定文本，建议统一在Mock中管理）
    const defaultAnswer = mockData.mockAnswers.find(item => item.userQuestion === "默认回复");
    return defaultAnswer ? defaultAnswer.aiAnswer : "抱歉，暂无相关回复~";
  }
}

// 4. 核心函数：发送消息（原有代码保留，只修改setTimeout内的逻辑）
function handleSend() {
  // 4.1 校验输入：为空则不发送（原有代码保留）
  const content = inputContent.value.trim();
  if (!content) return;

  // 4.2 添加用户消息到列表（原有代码保留）
  const userMsg = {
    id: Date.now(),
    role: 'user',
    content: content,
    timestamp: formatTime(new Date())
  };
  messages.value.push(userMsg);

  // 4.3 清空输入框（原有代码保留）
  inputContent.value = '';

  // 4.4 触发自动滚动到底部（原有代码保留）
  scrollToBottom();

  // 4.5 模拟AI加载状态（原有代码保留）
  const loadingMsg = {
    id: Date.now() + 1,
    role: 'assistant',
    content: 'AI正在思考...',
    timestamp: formatTime(new Date())
  };
  messages.value.push(loadingMsg);
  scrollToBottom();

  // 4.6 模拟AI延迟回复：修改为从Mock文件获取答案（关键修改部分）
  setTimeout(() => {
    // 移除加载中消息（原有代码保留）
    messages.value.pop();
    // 关键：调用getMockAnswer，传入用户消息content，获取匹配的AI答案
    const aiAnswer = getMockAnswer(content);
    // 组装AI回复消息（原有结构保留，只替换content为aiAnswer）
    const aiReply = {
      id: Date.now() + 2,
      role: 'assistant',
      content: aiAnswer, // 不再是固定模板，而是Mock中的答案
      timestamp: formatTime(new Date())
    };
    messages.value.push(aiReply);
    scrollToBottom();
  }, 2000); // 2秒延迟不变，模拟AI思考时间
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