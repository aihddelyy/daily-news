/**
 * 智能日报系统 - 主生成器
 * 支持12个主题的每日资讯聚合
 */

const fs = require('fs');
const path = require('path');
const { tavilySearch } = require('../utils/tavily-api');

// 加载配置
const config = require('../../config/topics.json');

// 存储所有资讯
let allNews = [];

/**
 * 为每个主题搜索资讯
 */
async function searchTopicNews(topic) {
  console.log(`\n📰 搜索主题: ${topic.name}...`);
  
  const newsItems = [];
  
  for (const query of topic.search_queries) {
    try {
      const results = await tavilySearch({
        query: query,
        count: 3,
        include_answer: true,
        include_raw_content: false
      });
      
      if (results && results.results) {
        for (const item of results.results) {
          // 避免重复
          const exists = newsItems.find(n => n.title === item.title);
          if (!exists && item.title && item.url) {
            newsItems.push({
              title: item.title,
              url: item.url,
              source: extractSource(item.url),
              snippet: item.content?.substring(0, 150) + '...' || '',
              topic: topic.name
            });
          }
        }
      }
    } catch (error) {
      console.error(`  ❌ 搜索 "${query}" 失败:`, error.message);
    }
    
    // 避免请求过快
    await sleep(500);
  }
  
  // 限制数量
  return newsItems.slice(0, config.settings.items_per_topic);
}

/**
 * 从URL提取来源
 */
function extractSource(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');
    const sourceMap = {
      'ithome.com': 'IT之家',
      '36kr.com': '36Kr',
      'ke.com': '氪财经',
      'caixin.com': '财新',
      'sina.com.cn': '新浪',
      'finance.sina.com.cn': '新浪财经',
      'thepaper.cn': '澎湃',
      'huanqiu.com': '环球时报',
      'xinhuanet.com': '新华网',
      'cctv.com': '央视',
      'bbc.com': 'BBC',
      'reuters.com': '路透社',
      'bloomberg.com': '彭博社',
      'wsj.com': '华尔街日报',
      'ft.com': '金融时报'
    };
    return sourceMap[hostname] || hostname;
  } catch {
    return '未知来源';
  }
}

/**
 * 延时函数
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 生成HTML日报
 */
function generateHTML(newsByTopic, dateStr) {
  const topics = config.topics;
  
  let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>每日资讯简报 ${dateStr}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container { max-width: 900px; margin: 0 auto; }
    .header {
      text-align: center;
      padding: 40px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 20px;
      margin-bottom: 30px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .header h1 {
      color: white;
      font-size: 2.5em;
      margin-bottom: 10px;
      text-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }
    .header .date { color: rgba(255,255,255,0.9); font-size: 1.2em; }
    .header .stats { 
      margin-top: 15px; 
      color: rgba(255,255,255,0.8);
      font-size: 0.95em;
    }
    .topic-card {
      background: white;
      border-radius: 16px;
      margin-bottom: 20px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      transition: transform 0.3s ease;
    }
    .topic-card:hover { transform: translateY(-5px); }
    .topic-header {
      padding: 20px 25px;
      display: flex;
      align-items: center;
      gap: 15px;
      border-bottom: 1px solid #f0f0f0;
    }
    .topic-icon { font-size: 2em; }
    .topic-name { 
      font-size: 1.4em; 
      font-weight: 700;
      color: #1a1a2e;
    }
    .topic-count {
      margin-left: auto;
      background: #f5f5f5;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 0.85em;
      color: #666;
    }
    .news-list { padding: 15px 25px; }
    .news-item {
      padding: 15px 0;
      border-bottom: 1px solid #f5f5f5;
    }
    .news-item:last-child { border-bottom: none; }
    .news-item a {
      color: #333;
      text-decoration: none;
      font-size: 1.05em;
      line-height: 1.5;
      display: block;
      transition: color 0.2s;
    }
    .news-item a:hover { color: #667eea; }
    .news-meta {
      margin-top: 8px;
      font-size: 0.85em;
      color: #999;
      display: flex;
      gap: 15px;
    }
    .news-source { 
      background: #f0f0f0;
      padding: 2px 10px;
      border-radius: 10px;
    }
    .footer {
      text-align: center;
      padding: 30px;
      color: rgba(255,255,255,0.6);
      font-size: 0.9em;
    }
    @media (max-width: 600px) {
      .header h1 { font-size: 1.8em; }
      .topic-header { padding: 15px 20px; }
      .news-list { padding: 10px 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📰 每日资讯简报</h1>
      <div class="date">${dateStr} • 星期六</div>
      <div class="stats">共 ${newsByTopic.reduce((sum, t) => sum + t.news.length, 0)} 条资讯 • ${newsByTopic.length} 个主题</div>
    </div>
`;

  for (const topic of newsByTopic) {
    if (topic.news.length === 0) continue;
    
    const topicConfig = topics.find(t => t.id === topic.id);
    const icon = topicConfig?.icon || '📌';
    const name = topicConfig?.name || topic.id;
    
    html += `
    <div class="topic-card">
      <div class="topic-header">
        <span class="topic-icon">${icon}</span>
        <span class="topic-name">${name}</span>
        <span class="topic-count">${topic.news.length} 条</span>
      </div>
      <div class="news-list">
`;
    
    for (const item of topic.news) {
      html += `
        <div class="news-item">
          <a href="${item.url}" target="_blank" rel="noopener">${item.title}</a>
          <div class="news-meta">
            <span class="news-source">${item.source}</span>
          </div>
        </div>
`;
    }
    
    html += `
      </div>
    </div>
`;
  }

  html += `
    <div class="footer">
      <p>由 AI 日报系统自动生成 • ${dateStr}</p>
    </div>
  </div>
</body>
</html>`;

  return html;
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 智能日报系统启动...\n');
  console.log(`📅 日期: ${new Date().toLocaleDateString('zh-CN')}`);
  console.log(`📊 主题数量: ${config.topics.length}`);
  
  const dateStr = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const newsByTopic = [];
  
  // 遍历每个主题
  for (const topic of config.topics) {
    const news = await searchTopicNews(topic);
    if (news.length > 0) {
      newsByTopic.push({
        id: topic.id,
        name: topic.name,
        news: news
      });
      console.log(`  ✅ 获取 ${news.length} 条资讯`);
    }
  }
  
  // 生成HTML
  console.log('\n📝 生成HTML报表...');
  const html = generateHTML(newsByTopic, dateStr);
  
  // 保存文件
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const filename = `daily_news_${new Date().toISOString().split('T')[0]}.html`;
  const filepath = path.join(outputDir, filename);
  
  fs.writeFileSync(filepath, html, 'utf-8');
  console.log(`✅ 已保存: ${filepath}`);
  
  // 同时保存为 index.html 方便查看
  const indexPath = path.join(outputDir, 'index.html');
  fs.writeFileSync(indexPath, html, 'utf-8');
  console.log(`✅ 已保存: ${indexPath}`);
  
  console.log('\n🎉 完成!');
  
  return filepath;
}

// 导出模块
module.exports = { main, searchTopicNews, generateHTML };

// 如果直接运行
if (require.main === module) {
  main().catch(console.error);
}
