/**
 * 日报汇总生成器 - MiniMax 版本
 * 使用 MiniMax API 生成结构化的日报汇总
 */
const fs = require('fs').promises;
const path = require('path');
const https = require('https');

const MINIMAX_API_URL = 'api.minimax.chat';
const MINIMAX_GROUP_ID = process.env.MINIMAX_GROUP_ID || '';

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
 * 调用 MiniMax API 生成汇总
 */
async function generateSummary(newsData) {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ MINIMAX_API_KEY 未配置，跳过生成智能汇总');
    return null;
  }
  
  const prompt = buildPrompt(newsData);
  console.log('🤖 正在调用 MiniMax API 生成汇总...');
  
  const requestBody = {
    model: 'abab6.5-chat',
    messages: [
      {
        role: 'system',
        content: `你是一个专业的新闻编辑和分析师。请根据提供的新闻数据，生成一份结构化的日报汇总。
要求：
1. 整体摘要：用2-3句话概括今日所有分类的核心动态
2. 按分类汇总：
   - 为每个分类生成1-2句话的分类摘要
   - 提取3-4个该分类的关键点/趋势
   - 为每条新闻生成精简摘要（30-50字）
   - 提取每条新闻的1个关键洞察
3. 必须输出纯 JSON 格式，尽量不要包含任何 Markdown 格式、代码块标记（如 \`\`\`json）或额外的解释文字。
4. 语言风格：简洁、专业、易读

JSON 结构如下：
{
  "date": "日期",
  "overallSummary": "整体摘要",
  "categories": [
    {
      "name": "分类名称",
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
            console.error(`[MiniMax] 汇总错误: ${parsedData.base_resp.status_msg}`);
            resolve(null);
            return;
          }
          
          let content = parsedData.choices?.[0]?.message?.content?.trim() || '';
          
          // 增强型 JSON 提取：兼容 markdown 代码块
          let jsonStr = content;
          if (content.includes('```')) {
            const matches = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (matches && matches[1]) {
              jsonStr = matches[1];
            }
          } else {
            const matches = content.match(/\{[\s\S]*\}/);
            if (matches) {
              jsonStr = matches[0];
            }
          }
          
          try {
            const summary = JSON.parse(jsonStr);
            resolve(fixSummaryIds(summary, newsData));
          } catch (parseError) {
            console.warn('⚠️ MiniMax 返回的内容无法解析为 JSON');
            console.log('--- MiniMax 原始内容 ---');
            console.log(content);
            console.log('--- 结束 ---');
            resolve(null);
          }
        } catch (error) {
          console.error(`[MiniMax] 汇总解析失败: ${error.message}`);
          resolve(null);
        }
      });
    });
    req.on('error', (e) => {
      console.error(`[MiniMax] 汇总请求失败: ${e.message}`);
      resolve(null);
    });
    req.write(data);
    req.end();
  });
}

module.exports = { generateSummary };
