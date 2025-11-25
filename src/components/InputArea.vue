<template>
  <div class="input-container">
    <textarea
      v-model="inputContent"
      class="input-textarea"
      placeholder="请输入消息..."
      rows="3"
      @keydown.enter.prevent="handleSend"
      :disabled="isSending"  
    ></textarea>
    <button 
      class="send-btn" 
      @click="handleSend"
      :disabled="isSending" 
    >
      {{ isSending ? '发送中...' : '发送' }}
    </button>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue'

const props = defineProps({
  isSending: {
    type: Boolean,
    default: false
  }
})

const emits = defineEmits(['send'])
const inputContent = ref('')

const handleSend = () => {
  const content = inputContent.value.trim()
  if (!content || props.isSending) return
  
  emits('send', content)
  inputContent.value = ''
}
</script>

<style scoped>
.input-container {
  display: flex;
  gap: 10px;
}

.input-textarea {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  resize: none;
  font-size: 14px;
}

.input-textarea:focus {
  outline: none;
  border-color: #409eff;
}

.send-btn {
  width: 100px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.send-btn:hover {
  background-color: #3086d6;
}

.input-textarea:disabled, .send-btn:disabled {
  background-color: #f5f5f5;
  color: #999;
  cursor: not-allowed;
  border-color: #e0e0e0;
}
</style>