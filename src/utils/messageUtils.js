/**
 * 消息内容处理工具函数
 */

/**
 * 规范化AI回复内容
 * @param {*} mockResult - getMockAnswer 返回的结果
 * @returns {string|object} - 规范化后的内容
 */
export function normalizeAiContent(mockResult) {
  if (typeof mockResult === 'object' && mockResult !== null) {
    if (mockResult.type === 'card') {
      // 卡片类型，直接返回对象
      return mockResult;
    }
    if (mockResult.raw) {
      // 文本类型，使用 raw 字段（原始文本用于流式渲染）
      return mockResult.raw;
    }
    return JSON.stringify(mockResult);
  }
  return typeof mockResult === 'string' ? mockResult : String(mockResult);
}
