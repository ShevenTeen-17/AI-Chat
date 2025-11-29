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

.input-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
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
  border: 1px solid #e0e0e0;
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
  background-color: rgba(0,0,0,0.5);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  line-height: 1;
}
</style>