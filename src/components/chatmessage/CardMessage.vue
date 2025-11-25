<template>
  <div class="card-message" :class="subtype">
    <div class="card-header">
      {{ title }}
      <span v-if="subtype === 'article'" class="link-icon">🔗</span>
      <span v-if="subtype === 'contact'" class="contact-icon">👤</span>
    </div>
    <div class="card-body">
      {{ content }}
      <!-- 联系方式卡片额外信息 -->
      <div v-if="subtype === 'contact'" class="contact-info">
        <p>邮箱: {{ contact }}</p>
        <p>电话: {{ phone }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>


const props = defineProps({
  type: {
    type: String,
    default: 'card'
  },
  subtype: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  // 文章卡片特有属性
  url: {
    type: String
  },
  // 联系方式卡片特有属性
  contact: {
    type: String
  },
  phone: {
    type: String
  },
  state: {
    type: String,
    default: 'success'
  }
})
</script>

<style scoped>
.card-message {
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.card-message:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.card-header {
  padding: 8px 15px;
  background-color: #f5f5f5;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-body {
  padding: 10px 15px;
  font-size: 14px;
  line-height: 1.5;
}

.contact-info {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #eee;
  font-size: 13px;
}

.article .card-header {
  background-color: #e8f4fd;
}

.contact .card-header {
  background-color: #fef3c7;
}
</style>