// 应用常量配置
export const STORAGE_KEYS = {
  CHAT_SESSIONS: 'chat_sessions_v2'
};

export const VIRTUAL_SCROLL_THRESHOLD = 200;

export const STREAM_CONFIG = {
  INTERVAL: 50, // 流式渲染间隔（毫秒）
  PROGRESS_STEP: 2 // 每次增加的进度百分比
};

export const DEFAULT_MESSAGES = {
  WELCOME: '你好！我是AI助手，有什么可以帮你的？',
  LOADING: 'AI正在思考...',
  ERROR: '抱歉，回复失败，请点击重试~',
  RETRY_ERROR: '抱歉，回复仍失败，请稍后再试~'
};

// 控制模拟回复失败的概率（0.0 - 1.0），开发时可设置为 0 以禁用失败
export const SIMULATE_FAILURE_RATE = 0;

export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  CARD: 'card'
};