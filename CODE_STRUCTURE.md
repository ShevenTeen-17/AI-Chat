# 代码结构说明

## 项目结构

```
src/
├── components/          # Vue 组件
│   ├── App.vue          # 主应用组件（已优化，代码量减少 70%）
│   ├── Sidebar.vue      # 侧边栏组件
│   ├── InputArea.vue    # 输入区域组件
│   ├── VirtualList.vue  # 虚拟滚动组件
│   ├── message/         # 消息相关组件
│   │   └── MessageItem.vue  # 消息项组件（提取自 App.vue）
│   └── chatmessage/     # 消息内容组件
│       ├── Index.vue    # 消息内容入口
│       ├── TextMessage.vue  # 文本消息组件
│       └── CardMessage.vue  # 卡片消息组件
│
├── composables/         # 组合式函数（业务逻辑）
│   ├── useSessions.js   # 会话管理逻辑
│   └── useMessages.js   # 消息处理逻辑
│
├── config/              # 配置文件
│   └── constants.js     # 应用常量
│
├── store/               # 状态管理
│   ├── chatStore.js     # 聊天状态存储
│   └── helpers.js       # 辅助函数（Mock 数据）
│
├── utils/               # 工具函数
│   ├── formatter.js     # 格式化工具
│   ├── messageUtils.js  # 消息处理工具
│   └── storage.js       # 存储工具
│
├── mock/                # Mock 数据
│   └── ai-answers.json  # AI 回复数据
│
└── main.js              # 应用入口
```

## 代码优化说明

### 1. 组件拆分
- **MessageItem.vue**: 将消息项从 App.vue 中提取，消除重复代码
- 虚拟滚动和普通渲染共享同一个消息项组件

### 2. Composables 模式
- **useSessions.js**: 会话管理相关逻辑（创建、切换、删除、持久化）
- **useMessages.js**: 消息处理逻辑（发送、重试、复制、重新生成、流式渲染）

### 3. 常量配置
- **constants.js**: 集中管理应用常量（存储键、阈值、配置等）

### 4. 工具函数
- **messageUtils.js**: 消息内容处理工具函数

## 优化效果

- **App.vue 代码量**: 从 700+ 行减少到 200+ 行（减少约 70%）
- **代码复用性**: 消息项组件可在多处复用
- **可维护性**: 逻辑分离，职责清晰
- **可测试性**: Composables 可独立测试
- **可扩展性**: 新功能易于添加

## 使用方式

### 会话管理
```javascript
const {
  sessions,
  currentSessionId,
  createNewSession,
  switchSession,
  deleteSession
} = useSessions();
```

### 消息处理
```javascript
const {
  messages,
  handleSend,
  handleRetry,
  handleCopy,
  handleRegenerate
} = useMessages(sessions, currentSessionId, updateSessionMessages, updateSessionStates);
```

## 后续优化建议

1. 添加 TypeScript 支持
2. 添加单元测试
3. 使用 Pinia 替代 reactive store
4. 添加错误边界处理
5. 优化虚拟滚动性能
