import mockData from '../mock/ai-answers.json';

// 根据用户消息匹配Mock中的AI答案
export function getMockAnswer(userInput) {
  const matchedItem = mockData.mockAnswers.find(item => {
    return userInput.toLowerCase().includes(item.userQuestion.toLowerCase());
  });

  if (matchedItem) {
    return matchedItem.aiAnswer;
  } else {
    const defaultAnswer = mockData.mockAnswers.find(item => item.userQuestion === "默认回复");
    return defaultAnswer ? defaultAnswer.aiAnswer : "抱歉，暂无相关回复~";
  }
}