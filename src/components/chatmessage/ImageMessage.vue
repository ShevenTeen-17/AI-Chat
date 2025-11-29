<template>
  <div class="image-message-container">
    <img 
      :src="imageUrl" 
      alt="用户上传图片" 
      class="message-image"
      :class="{ loading: state === 'loading' }"
      @load="handleImageLoad"
    >
    <div v-if="state === 'loading'" class="image-loading">
      <div class="spinner"></div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  imageUrl: {
    type: String,
    required: true
  },
  state: {
    type: String,
    default: 'success'
  }
});

const isLoaded = ref(false);

const handleImageLoad = () => {
  isLoaded.value = true;
};
</script>

<style scoped>
.image-message-container {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  max-width: 300px;
  max-height: 400px;
}

.message-image {
  width: 100%;
  height: auto;
  border-radius: 8px;
  display: none;
}

.message-image.loading {
  display: block;
  opacity: 0.5;
}

.message-image:not(.loading) {
  display: block;
}

.image-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255,255,255,0.7);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>