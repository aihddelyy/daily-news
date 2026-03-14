/**
 * 日报汇总生成器
 * 使用 Kimi API 生成结构化的日报汇总
 */
const fs = require('fs').promises;
const path = require('path');
const https = require('https');

const KIMI_API_HOST = 'api.moonshot.cn';

/**
 * 构建提示词
 */
function buildPrompt(newsData) {
  let prompt = `日期：${newsData.date.display}\n\n`;
  newsData.categories.forEach(cat => {
    prompt += `【${cat.name}】\n`;
    cat.items.forEach((item, index) => {
      prompt += `${index + 1}. 标题：${item.title}\n`;
      prompt += `   摘要：${item.summary}\n`;
      if (item.content) {
        prompt += `   内容：${item.content.substring(0, 500)}...\n`;
      }
      prompt += `   来源：${item.source}\n\n`;
    });
    prompt += '\n';
  });
  return prompt;
}

/**
 * 修复汇总中的分类ID和图标
 */
function fixSummaryIds(summary, newsData) {
  const categoryMap = {};
  newsData.categories.forEach(cat => {
    categoryMap[cat.name] = { id: cat.id, icon: cat.icon };
  });
  
  summary.categories.forEach(cat => {
    const original = categoryMap[cat.name];
    if (original) {
      cat.id = original.id;
      cat.icon = original.icon;
    }
  });
  
  return summary;
}

/**
 * 调用 Kimi API 生成汇总
 */
async function generateSummary(newsData) {
  const apiKey = process.env.KIMI_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ KIMI_API_KEY 未配置，跳过生成智能汇总');
    return null;
  }
  
  const prompt = buildPrompt(newsData);
  console.log('🤖 正在调用 Kimi API 生成汇总...');
  
  const requestBody = {
    model: 'moonshot-v1-32k',
    messages: [
      {
        role: 'system',
        content: `你是一个专业的新闻编辑和分析师。请根据提供的新闻数据，生成一份结构化的日报汇总。
要求：
1. 整体摘要：用2-3句话概括今日所有分类的核心动态
2. 按分类汇总：
   - 为每个分类生成1-2句话的分类摘要
   - 提取3-5个该分类的关键点/趋势
   - 为每条新闻生成精简摘要（30-50字）
   - 提取每条新闻的1-2个关键洞察
   - 必须包含所有新闻，不要遗漏任何一条
3. 语言风格：简洁、专业、易读
请严格按照以下JSON格式返回：
{
  "date": "日期",
  "overallSummary": "整体摘要",
  "categories": [
    {
      "id": "分类ID",
      "name": "分类名称",
      "icon": "图标",
      "categorySummary": "分类摘要",
      "keyPoints": ["关键点1", "关键点2"],
      "news": [
        {
          "title": "新闻标题",
          "summary": "精简摘要",
          "keyInsights": ["关键洞察1"]
        }
      ]
    }
  ]
}`
      },
      {
        role: 'user',
        content: prompt
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
            console.error(`[Kimi] 错误: ${parsedData.error.message}`);
            resolve(null);
            return;
          }
          
          const content = parsedData.choices?.[0]?.message?.content?.trim() || '';
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          
          if (jsonMatch) {
            const summary = JSON.parse(jsonMatch[0]);
            resolve(fixSummaryIds(summary, newsData));
          } else {
            resolve(null);
          }
        } catch (error) {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.write(data);
    req.end();
  });
}

module.exports = { generateSummary };
