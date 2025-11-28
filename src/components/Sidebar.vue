<template>
  <div class="sidebar" :class="{ 'sidebar-collapsed': isCollapsed }">
    <div class="sidebar-header">
      <button class="new-chat-btn" @click="handleNewChat">
        <span class="icon">+</span>
        <span class="text">新建对话</span>
      </button>
      <button class="toggle-btn" @click="toggleSidebar">
        <span class="icon">{{ isCollapsed ? '→' : '←' }}</span>
      </button>
    </div>
    
    <div class="sidebar-content" v-if="!isCollapsed">
      <div class="session-list">
        <div
          v-for="session in sessions"
          :key="session.id"
          :class="['session-item', { active: session.id === currentSessionId }]"
          @click="handleSwitchSession(session.id)"
        >
          <div class="session-info">
            <div class="session-title">{{ session.title || '新对话' }}</div>
            <div class="session-time">{{ session.updatedAt }}</div>
          </div>
          <button
            class="delete-btn"
            @click.stop="handleDeleteSession(session.id)"
            title="删除对话"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  sessions: {
    type: Array,
    required: true
  },
  currentSessionId: {
    type: String,
    required: true
  }
});

const emits = defineEmits(['new-chat', 'switch-session', 'delete-session', 'toggle']);

const isCollapsed = ref(false);

function toggleSidebar() {
  isCollapsed.value = !isCollapsed.value;
  emits('toggle', isCollapsed.value);
}

function handleNewChat() {
  emits('new-chat');
}

function handleSwitchSession(sessionId) {
  emits('switch-session', sessionId);
}

function handleDeleteSession(sessionId) {
  if (confirm('确定要删除这个对话吗？')) {
    emits('delete-session', sessionId);
  }
}
</script>

<style scoped>
.sidebar {
  width: 280px;
  height: 100vh;
  background-color: #f5f5f5;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
}

.sidebar-collapsed {
  width: 60px;
}

.sidebar-header {
  padding: 15px;
  display: flex;
  gap: 10px;
  border-bottom: 1px solid #e0e0e0;
  background-color: white;
}

.new-chat-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.new-chat-btn:hover {
  background-color: #3086d6;
}

.new-chat-btn .icon {
  font-size: 18px;
  font-weight: bold;
}

.toggle-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.toggle-btn:hover {
  background-color: #e0e0e0;
}

.toggle-btn .icon {
  font-size: 16px;
  color: #666;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.session-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.session-item:hover {
  background-color: #f9f9f9;
  border-color: #409eff;
}

.session-item.active {
  background-color: #e8f4fd;
  border-color: #409eff;
}

.session-info {
  flex: 1;
  min-width: 0;
}

.session-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-time {
  font-size: 12px;
  color: #999;
}

.delete-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 20px;
  color: #999;
  transition: all 0.2s;
  flex-shrink: 0;
}

.delete-btn:hover {
  background-color: #ff4d4f;
  color: white;
}

.sidebar-collapsed .new-chat-btn .text,
.sidebar-collapsed .session-item {
  display: none;
}

.sidebar-collapsed .new-chat-btn {
  flex: 0;
  width: 40px;
  padding: 10px;
}

.sidebar-collapsed .sidebar-content {
  display: none;
}
</style>
