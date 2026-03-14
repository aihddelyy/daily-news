/**
 * MiniMax API 工具
 * 封装 MiniMax 翻译调用
 */
const https = require('https');

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';
const MINIMAX_GROUP_ID = process.env.MINIMAX_GROUP_ID || '';
const MINIMAX_API_URL = 'api.minimaxi.com';

/**
 * 使用 MiniMax 翻译文本
 * 采用 OpenAI 兼容接口格式
 */
async function minimax_translate(text, targetLang = '中文') {
  const apiKey = process.env.MINIMAX_API_KEY || MINIMAX_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ MINIMAX_API_KEY 未配置，返回原文');
    return text;
  }
  if (!text || text.trim() === '') return text;

  const requestBody = {
    model: 'MiniMax-M2.5', // 使用最新的 MiniMax 2.5 模型
    messages: [
      {
        role: 'system',
        content: `你是一个专业的新闻翻译专家。请将以下英文内容翻译成${targetLang}，要求：\n1. 翻译要准确、流畅、符合中文表达习惯\n2. 保留专有名词、公司名、产品名等英文原名\n3. 只输出翻译结果，不要添加任何解释`
      },
      {
        role: 'user',
        content: text
      }
    ],
    temperature: 0.1
  };

  const data = JSON.stringify(requestBody);
  const options = {
    hostname: MINIMAX_API_URL,
    port: 443,
    path: `/v1/text/chatcompletion_v2?GroupId=${MINIMAX_GROUP_ID}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          if (parsedData.base_resp && parsedData.base_resp.status_code !== 0) {
            console.error(`[MiniMax] 错误: ${parsedData.base_resp.status_msg}`);
            resolve(text);
            return;
          }
          const translated = parsedData.choices?.[0]?.message?.content?.trim() || text;
          resolve(translated);
        } catch (error) {
          console.error(`[MiniMax] 解析失败: ${error.message}`);
          resolve(text);
        }
      });
    });
    req.on('error', (e) => {
      console.error(`[MiniMax] 请求失败: ${e.message}`);
      resolve(text);
    });
    req.write(data);
    req.end();
  });
}

/**
 * 批量翻译新闻条目
 */
async function minimax_translate_batch(items) {
  const apiKey = process.env.MINIMAX_API_KEY || MINIMAX_API_KEY;
  if (!apiKey || !items || items.length === 0) return items;

  console.log(`🤖 正在使用 MiniMax 翻译 ${items.length} 条新闻...`);
  const translatedItems = [];
  for (const item of items) {
    try {
      const translatedTitle = await minimax_translate(item.title);
      const summaryToTranslate = item.summary?.substring(0, 500) || '';
      const translatedSummary = await minimax_translate(summaryToTranslate);
      
      translatedItems.push({
        ...item,
        title: translatedTitle || item.title,
        summary: translatedSummary?.substring(0, 200) || item.summary?.substring(0, 200) || ''
      });
      // 适度延迟，避免频率限制
      await new Promise(r => setTimeout(r, 200));
    } catch (error) {
      translatedItems.push(item);
    }
  }
  return translatedItems;
}

module.exports = {
  minimax_translate,
  minimax_translate_batch
};
