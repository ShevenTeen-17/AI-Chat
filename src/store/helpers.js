import mockData from '../mock/ai-answers.json';
import { marked } from 'marked';
// 根据用户消息匹配Mock中的AI答案
export function getMockAnswer(userInput) {
  const matchedItem = mockData.mockAnswers.find(item => {
    return userInput.toLowerCase().includes(item.userQuestion.toLowerCase());
  });

  if (matchedItem) {
    // 对 AI 回复进行 Markdown 解析（转为 HTML）
    return {
      raw: matchedItem.aiAnswer, // 原始文本（用于后续打字机效果）
      html: marked.parse(matchedItem.aiAnswer) // 解析后的 HTML
    };
  } else {
    const defaultAnswer = mockData.mockAnswers.find(item => item.userQuestion === "默认回复");
    const content = defaultAnswer ? defaultAnswer.aiAnswer : "抱歉，暂无相关回复~";
    return { raw: content, html: marked.parse(content) };
  }
}