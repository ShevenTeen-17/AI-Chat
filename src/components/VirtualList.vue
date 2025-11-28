<template>
  <div 
    class="virtual-list-container" 
    ref="containerRef"
    @scroll="handleScroll"
  >
    <div 
      class="virtual-list-spacer" 
      :style="{ height: `${topSpacerHeight}px` }"
    ></div>
    <div 
      v-for="item in visibleItems" 
      :key="item.data.id"
      :ref="el => setItemRef(el, item.index)"
      class="virtual-list-item"
    >
      <slot :item="item.data" :index="item.index" />
    </div>
    <div 
      class="virtual-list-spacer" 
      :style="{ height: `${bottomSpacerHeight}px` }"
    ></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';

const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  itemHeight: {
    type: Number,
    default: 100 // 估算的默认高度
  },
  overscan: {
    type: Number,
    default: 5 // 额外渲染的项目数量
  }
});

const containerRef = ref(null);
const itemRefs = ref(new Map());
const scrollTop = ref(0);
const containerHeight = ref(0);
const itemHeights = ref(new Map()); // 缓存实际高度

// 计算可见范围
const visibleRange = computed(() => {
  let start = 0;
  let end = props.items.length;
  let currentTop = 0;

  // 找到起始索引
  for (let i = 0; i < props.items.length; i++) {
    const height = itemHeights.value.get(i) || props.itemHeight;
    if (currentTop + height > scrollTop.value) {
      start = Math.max(0, i - props.overscan);
      break;
    }
    currentTop += height;
  }

  // 找到结束索引
  let visibleTop = 0;
  for (let i = 0; i < props.items.length; i++) {
    const height = itemHeights.value.get(i) || props.itemHeight;
    if (i < start) {
      visibleTop += height;
      continue;
    }
    if (visibleTop > scrollTop.value + containerHeight.value) {
      end = Math.min(props.items.length, i + props.overscan);
      break;
    }
    visibleTop += height;
  }

  return { start, end };
});

// 计算顶部占位符高度
const topSpacerHeight = computed(() => {
  let height = 0;
  for (let i = 0; i < visibleRange.value.start; i++) {
    height += itemHeights.value.get(i) || props.itemHeight;
  }
  return height;
});

// 计算底部占位符高度
const bottomSpacerHeight = computed(() => {
  let height = 0;
  for (let i = visibleRange.value.end; i < props.items.length; i++) {
    height += itemHeights.value.get(i) || props.itemHeight;
  }
  return height;
});

// 可见的项目
const visibleItems = computed(() => {
  const result = [];
  for (let i = visibleRange.value.start; i < visibleRange.value.end; i++) {
    if (props.items[i]) {
      result.push({
        data: props.items[i],
        index: i
      });
    }
  }
  return result;
});

// 设置项目引用并测量高度
function setItemRef(el, index) {
  if (el) {
    itemRefs.value.set(index, el);
    measureItem(index, el);
  } else {
    itemRefs.value.delete(index);
  }
}

// 测量项目高度
let measureTimeout = null;
function measureItem(index, element) {
  if (!element) return;
  
  // 使用防抖来避免频繁测量
  if (measureTimeout) {
    clearTimeout(measureTimeout);
  }
  
  measureTimeout = setTimeout(() => {
    const height = element.offsetHeight;
    const oldHeight = itemHeights.value.get(index);
    
    if (oldHeight !== height && height > 0) {
      itemHeights.value.set(index, height);
    }
  }, 50);
}

// 使用 requestAnimationFrame 优化滚动性能
let scrollRafId = null;
function handleScroll(event) {
  if (scrollRafId) {
    cancelAnimationFrame(scrollRafId);
  }
  
  scrollRafId = requestAnimationFrame(() => {
    scrollTop.value = event.target.scrollTop;
    scrollRafId = null;
  });
}

// 更新容器高度
function updateContainerHeight() {
  if (containerRef.value) {
    containerHeight.value = containerRef.value.clientHeight;
  }
}

// 滚动到底部
function scrollToBottom() {
  if (containerRef.value) {
    nextTick(() => {
      containerRef.value.scrollTop = containerRef.value.scrollHeight;
    });
  }
}

// 监听窗口大小变化
let resizeObserver = null;
onMounted(() => {
  updateContainerHeight();
  
  // 使用 ResizeObserver 监听容器大小变化
  if (window.ResizeObserver && containerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      updateContainerHeight();
    });
    resizeObserver.observe(containerRef.value);
  }

  // 初始测量所有可见项目
  nextTick(() => {
    itemRefs.value.forEach((el, index) => {
      measureItem(index, el);
    });
  });
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  if (measureTimeout) {
    clearTimeout(measureTimeout);
  }
  if (scrollRafId) {
    cancelAnimationFrame(scrollRafId);
  }
});

// 监听 items 变化，重新测量可见项目
watch(() => props.items.length, (newLength, oldLength) => {
  // 如果新增了项目，测量新项目
  if (newLength > oldLength) {
    nextTick(() => {
      for (let i = Math.max(0, oldLength - 1); i < newLength; i++) {
        const el = itemRefs.value.get(i);
        if (el) {
          measureItem(i, el);
        }
      }
    });
  }
});

// 监听可见范围变化，确保新出现的项目被测量
watch(visibleRange, () => {
  nextTick(() => {
    for (let i = visibleRange.value.start; i < visibleRange.value.end; i++) {
      const el = itemRefs.value.get(i);
      if (el) {
        measureItem(i, el);
      }
    }
  });
}, { immediate: true });

// 监听 items 内容变化，重新测量可见项目（用于流式渲染等场景）
watch(() => props.items, () => {
  nextTick(() => {
    for (let i = visibleRange.value.start; i < visibleRange.value.end; i++) {
      const el = itemRefs.value.get(i);
      if (el) {
        measureItem(i, el);
      }
    }
  });
}, { deep: true });

// 暴露方法给父组件
defineExpose({
  scrollToBottom,
  scrollToTop: () => {
    if (containerRef.value) {
      containerRef.value.scrollTop = 0;
    }
  },
  scrollToIndex: (index) => {
    if (containerRef.value && index >= 0 && index < props.items.length) {
      let offset = 0;
      for (let i = 0; i < index; i++) {
        offset += itemHeights.value.get(i) || props.itemHeight;
      }
      containerRef.value.scrollTop = offset;
    }
  }
});
</script>

<style scoped>
.virtual-list-container {
  height: 100%;
  overflow-y: auto;
  position: relative;
}

.virtual-list-spacer {
  width: 100%;
}

.virtual-list-item {
  width: 100%;
}
</style>
