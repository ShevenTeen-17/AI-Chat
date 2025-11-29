<template>
  <div class="input-container">
    <div class="input-wrapper">
      <textarea
        v-model="inputContent"
        class="input-textarea"
        placeholder="请输入消息或上传图片..."
        rows="3"
        @keydown.enter.prevent="handleSend"
        :disabled="isSending"  
      ></textarea>
      <!-- 图片上传区域 -->
      <div class="image-upload-area">
        <input 
          type="file" 
          id="image-upload" 
          accept="image/*" 
          @change="handleImageUpload"
          class="image-upload-input"
          :disabled="isSending"
        >
        
      </div>
    </div>
    <button 
      class="send-btn" 
      @click="handleSend"
      :disabled="isSending || (!inputContent && !previewUrl)" 
    >
      {{ isSending ? '发送中...' : '发送' }}
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  isSending: {
    type: Boolean,
    default: false
  }
})

const emits = defineEmits(['send', 'send-image'])
const inputContent = ref('')
const previewUrl = ref('')
const fileData = ref(null)

const handleImageUpload = (e) => {
  const file = e.target.files[0]
  if (file) {
    // 验证文件类型和大小
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过5MB')
      return
    }
    
    fileData.value = file
    // 生成预览URL
    const reader = new FileReader()
    reader.onload = (event) => {
      previewUrl.value = event.target.result
    }
    reader.readAsDataURL(file)
  }
}

const clearImage = () => {
  previewUrl.value = ''
  fileData.value = null
  document.getElementById('image-upload').value = ''
}


const handleSend = () => {
  if (props.isSending) return;
  
  // 同时存在文本和图片时，先发送图片再发送文本
  let hasContentToSend = false;
  
  // 发送图片
  if (previewUrl.value) {
    emits('send-image', {
      file: fileData.value,
      url: previewUrl.value
    });
    clearImage();
    hasContentToSend = true;
  }
  
  // 发送文本
  const content = inputContent.value.trim();
  if (content) {
    emits('send', content);
    inputContent.value = '';
    hasContentToSend = true;
  }
  
  // 如果有内容发送，触发清空动画或反馈
  if (hasContentToSend) {
    // 可以添加发送成功的视觉反馈
  }
};
</script>


<style scoped>

.input-container {
  display: flex;
  gap: 10px;
  align-items: center;
  flex: 1;
}

.input-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-textarea {
  width: 100%;
  min-height: 44px;
  max-height: 140px;
  resize: vertical;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--muted-border);
  background: var(--card-bg);
  font-size: 14px;
  line-height: 1.4;
  color: var(--text);
  box-shadow: inset 0 1px 0 var(--inset);
}

.input-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 6px 18px var(--shadow);
}

.image-upload-area {
  display: flex;
  align-items: center;
  gap: 10px;
}

.image-upload-input {
  display: none;
}

.upload-btn {
  padding: 4px 10px;
  border: 1px solid var(--muted-border);
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.upload-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.image-preview {
  position: relative;
  width: 80px;
  height: 60px;
  border-radius: 4px;
  overflow: hidden;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: var(--overlay);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  line-height: 1;
}

.send-btn {
  background: linear-gradient(90deg, var(--primary), var(--accent));
  color: var(--on-primary);
  border: none;
  padding: 10px 14px;
  border-radius: 10px;
  cursor: pointer;
  min-width: 84px;
  box-shadow: 0 8px 20px var(--shadow);
  font-weight: 600;
  align-self: center;
  margin: 0;
}

.send-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

@media (max-width: 800px) {
  .input-container { gap: 8px; }
  .send-btn { padding: 8px 10px; min-width: 72px; }
}
</style>