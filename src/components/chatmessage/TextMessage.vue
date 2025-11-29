<template>
  <div class="message-content" ref="messageContent" v-html="renderedContent"></div>
</template>

<script setup>
import { computed, ref, watch, nextTick, onMounted } from 'vue';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css'; // 选择喜欢的高亮样式

const props = defineProps({
  content: {
    type: String,
    required: true
  },
  state: {
    type: String,
    default: 'success'
  },
  // 用于流式渲染的进度
  streamProgress: {
    type: Number,
    default: 100
  }
});

// 配置 marked，启用 GFM 与换行，并利用 highlight.js 生成高亮 HTML
marked.setOptions({
  highlight: (code, lang) => {
    const codeStr = typeof code === 'string' ? code : String(code ?? '');

    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(codeStr, { language: lang }).value;
    }
    return hljs.highlightAuto(codeStr).value;
  },
  // 为 code 标签增加 .hljs class，保证主题样式生效
  langPrefix: 'hljs language-',
  breaks: true,
  gfm: true
});

// 流式渲染内容
const renderedContent = computed(() => {
  // 确保 content 是字符串
  const contentStr = typeof props.content === 'string' ? props.content : String(props.content);
  
  // 根据进度截取内容进行渲染
  const displayContent = props.state === 'loading' && props.streamProgress < 100
    ? contentStr.substring(0, Math.floor(contentStr.length * props.streamProgress / 100))
    : contentStr;
  
  return marked.parse(displayContent) + (props.state === 'loading' && props.streamProgress < 100 ? '<span class="loading-spinner">⭕</span>' : '');
});

const messageContent = ref(null);

const highlightBlocks = () => {
  nextTick(() => {
    if (!messageContent.value) return;
    const blocks = messageContent.value.querySelectorAll('pre code');
    blocks.forEach(block => {
      hljs.highlightElement(block);
    });
  });
};

onMounted(highlightBlocks);

watch(renderedContent, () => {
  highlightBlocks();
});
</script>

<style scoped>
.message-content {
  padding: 10px 15px;
  line-height: 1.5;
  font-size: 14px;
  word-wrap: break-word;
  color: var(--text);
}

/* 代码块样式 */
.message-content pre {
  background-color: var(--panel-bg);
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 10px 0;
}

/* 行内代码样式 - 使用更具体的选择器 */
.message-content p code,
.message-content li code,
.message-content code:not(pre > code) {
  background-color: var(--panel-bg);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
  font-size: 0.9em;
  color: var(--accent);
  display: inline;
}

/* 代码块内的代码 */
.message-content pre code {
  background-color: transparent !important;
  padding: 0 !important;
  font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  color: inherit;
  display: block;
}

/* 斜体文本样式 */
.message-content em {
  font-style: italic;
  color: inherit;
}

/* 加粗文本样式 */
.message-content strong {
  font-weight: bold;
  color: inherit;
}

/* 加粗斜体文本 */
.message-content strong em,
.message-content em strong {
  font-weight: bold;
  font-style: italic;
}

.loading-spinner {
  display: inline-block;
  margin-left: 8px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>