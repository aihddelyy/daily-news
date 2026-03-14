/**
 * Kimi API 工具
 * 封装 Kimi 翻译调用
 */
const https = require('https');
const KIMI_API_KEY = process.env.KIMI_API_KEY || '';
const KIMI_API_HOST = 'api.moonshot.cn';

/**
 * 使用 Kimi 翻译文本
 */
async function kimi_translate(text, targetLang = '中文') {
  const apiKey = process.env.KIMI_API_KEY || KIMI_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ KIMI_API_KEY 未配置，返回原文');
    return text;
  }
  if (!text || text.trim() === '') return text;

  const requestBody = {
    model: 'moonshot-v1-8k',
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
    temperature: 0.3
  };

  const data = JSON.stringify(requestBody);
  const options = {
    hostname: KIMI_API_HOST,
    port: 443,
    path: '/v1/chat/completions',
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
          if (parsedData.error) {
            resolve(text);
            return;
          }
          const translated = parsedData.choices?.[0]?.message?.content?.trim() || text;
          resolve(translated);
        } catch (error) {
          resolve(text);
        }
      });
    });
    req.on('error', () => resolve(text));
    req.write(data);
    req.end();
  });
}

/**
 * 批量翻译新闻条目
 */
async function kimi_translate_batch(items) {
  const apiKey = process.env.KIMI_API_KEY || KIMI_API_KEY;
  if (!apiKey || !items || items.length === 0) return items;

  const translatedItems = [];
  for (const item of items) {
    try {
      const translatedTitle = await kimi_translate(item.title);
      const summaryToTranslate = item.summary?.substring(0, 500) || '';
      const translatedSummary = await kimi_translate(summaryToTranslate);
      
      translatedItems.push({
        ...item,
        title: translatedTitle || item.title,
        summary: translatedSummary?.substring(0, 200) || item.summary?.substring(0, 200) || ''
      });
      await new Promise(r => setTimeout(r, 300));
    } catch (error) {
      translatedItems.push(item);
    }
  }
  return translatedItems;
}

module.exports = {
  kimi_translate,
  kimi_translate_batch
};
