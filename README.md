<<<<<<< HEAD
# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).
=======
# AI-Chat
前端模拟AI对话（Vue框架）
2025-11-21（MVP版）
核心功能：基础对话框架（发送消息，AI回复，时间戳，消息渲染，状态管理）
操作设计思路：
整体页面布局：分为对话区域和输入区域，对话区域中用户消息右对齐，蓝色背景；AI消息左对齐，灰色背景；每条消息下方显示时间戳。下方为输入区域，输入区域包括输入框和发送按钮
发送消息：1.在输入框中输入文本；2.点击发送btn或按Enter；3.输入框清空，对话区域显示你的消息
AI回复：1.发送消息后，对话区域显示“AI正在思考...”；2.等待2s后，替换为AI模拟回复（在本地mock中的预存回复）；3.新消息出现，对话区域自动滚动到底部
MVP功能清单：
消息数据结构：包含id（时间戳）、role（user/assistant）、content（文本）、timestamp
消息渲染：用户消息右对齐，蓝色背景；AI消息左对齐，灰色背景；每条消息下方显示时间戳
对话区域滚动：固定高度，支持垂直滚动，新消息自动滚到底部
输入部分：多行输入框，支持发送按钮或Enter键发送，发送后清空输入框
AI回复模拟：发送后显示加载状态，2s后替换为模拟回复
To-Do List：配置ai回答本地mock文件、实现 Markdown 渲染、代码块高亮、打字机效果、异常处理
2025-11-22 （添加回答库）
新增ai-answers.json文件，修改ai回答逻辑为：在mock文件中模糊查找，根据mock文件回答
>>>>>>> 5fe2bc072736b0ca1bea43c0022d83eb520d9fbd
