<template>
  <div class="message-content">
    <!-- 使用 v-html 渲染 Markdown 解析后的 HTML -->
    <div v-html="renderedContent" class="markdown-content"></div>
    
    <!-- 流式响应的打字机光标 -->
    <span v-if="state === 'loading'" class="loading-spinner">
      <span class="typing-cursor">|</span>
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css'; // 代码高亮样式

const props = defineProps({
  content: {
    type: [String, Object], // 支持字符串或 { raw, html } 对象
    required: true
  },
  state: {
    type: String,
    default: 'success'
  }
});

// 计算属性：解析 Markdown 并处理代码高亮
const renderedContent = computed(() => {
  // 如果是对象，直接使用预解析的 html
  if (typeof props.content === 'object' && props.content.html) {
    return props.content.html;
  }
  
  // 如果是字符串，进行 Markdown 解析
  const content = typeof props.content === 'object' ? props.content.raw : props.content;
  
  return marked.parse(content, {
    highlight: (code, lang) => {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return hljs.highlightAuto(code).value;
    }
  });
});
</script>

<style scoped>
/* 基础消息样式 */
.message-content {
  padding: 10px 15px;
  line-height: 1.5;
  font-size: 14px;
  word-wrap: break-word;
  border-radius: 16px;
}

/* Markdown 渲染样式 */
.markdown-content h1,
.markdown-content h2,
.markdown-content h3 {
  margin: 0.8em 0 0.4em;
  color: inherit;
}

.markdown-content p {
  margin: 0.5em 0;
}

.markdown-content strong {
  font-weight: 600;
}

.markdown-content em {
  font-style: italic;
}

.markdown-content ul,
.markdown-content ol {
  margin: 0.5em 0 0.5em 1.5em;
}

.markdown-content a {
  color: #409eff;
  text-decoration: underline;
}

/* 代码块样式 */
.markdown-content pre {
  position: relative;
  background-color: #2d2d2d;
  border-radius: 6px;
  padding: 1em;
  margin: 1em 0;
  overflow-x: auto;
}

.markdown-content code {
  font-family: 'Fira Code', monospace;
  font-size: 13px;
  line-height: 1.5;
}

/* 代码块复制按钮 */
.markdown-content pre::after {
  content: '复制';
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.markdown-content pre:hover::after {
  background-color: rgba(255, 255, 255, 0.3);
}

/* 打字机光标动画 */
.typing-cursor {
  display: inline-block;
  width: 10px;
  height: 1em;
  background-color: currentColor;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  from, to { opacity: 1; }
  50% { opacity: 0; }
}
</style>