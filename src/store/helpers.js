import mockData from '../mock/ai-answers.json';
import { marked } from 'marked';
// 根据用户消息匹配Mock中的AI答案
export function getMockAnswer(userInput) {
  const matchedItem = mockData.mockAnswers.find(item => {
    return userInput.toLowerCase().includes(item.userQuestion.toLowerCase());
  });

  if (matchedItem) {
    const aiAnswer = matchedItem.aiAnswer;
    
    // 如果 aiAnswer 是对象（卡片类型），直接返回
    if (typeof aiAnswer === 'object' && aiAnswer !== null && aiAnswer.type === 'card') {
      return aiAnswer;
    }
    
    // 如果是字符串，返回 { raw, html } 格式用于流式渲染
    const answerText = typeof aiAnswer === 'string' ? aiAnswer : String(aiAnswer);
    return {
      raw: answerText, // 原始文本（用于后续打字机效果）
      html: marked.parse(answerText) // 解析后的 HTML
    };
  } else {
    const defaultAnswer = mockData.mockAnswers.find(item => item.userQuestion === "默认回复");
    const content = defaultAnswer ? defaultAnswer.aiAnswer : "抱歉，暂无相关回复~";
    
    // 同样处理默认回复
    if (typeof content === 'object' && content !== null && content.type === 'card') {
      return content;
    }
    
    const contentText = typeof content === 'string' ? content : String(content);
    return { raw: contentText, html: marked.parse(contentText) };
  }
}