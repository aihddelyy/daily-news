/**
 * HTML Generator
 * 生成静态日报页面 - 包含 AI 汇总
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { generateDailyNews, saveData } = require('./scraper');

const PATHS = {
  data: path.join(__dirname, '../../data/daily.json'),
  summary: path.join(__dirname, '../../data/daily-summary.json'),
  output: path.join(__dirname, '../../docs'),
  archive: path.join(__dirname, '../../docs/archive')
};

const TEMPLATE = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
  <link rel="stylesheet" href="{{base}}css/style.css">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📰</text></svg>">
</head>
<body>
  <header class="header">
    <div class="nav-container">
      <a href="{{base}}" class="logo">
        <div class="logo-icon">📰</div>
        <span class="logo-text">AI 日报</span>
      </a>
      <nav class="nav-links">
        <a href="{{base}}#" class="nav-link active" data-category="all">首页</a>
        {{navCategories}}
        <a href="{{base}}archive/" class="nav-link">存档</a>
      </nav>
      <div class="nav-actions">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input type="text" class="search-input" placeholder="搜索资讯...">
        </div>
      </div>
    </div>
  </header>

  <section class="hero">
    <div class="hero-card">
      <div class="hero-image"></div>
      <div class="hero-content">
        <span class="hero-tag">
          <span>📅</span> 今日日报
        </span>
        <h1 class="hero-title">全域前沿行业日报</h1>
        <p class="hero-title" style="font-size: 1.5rem; color: var(--text-secondary); margin-bottom: 1rem;">{{dateDisplay}}</p>
        <div class="hero-meta">
          <div class="hero-author">
            <div class="author-avatar">AI</div>
            <span>AI 智能助手</span>
          </div>
          <span>•</span>
          <span>{{totalNews}} 条精选资讯</span>
          <span>•</span>
          <span>{{categoryCount}} 大领域</span>
        </div>
      </div>
    </div>
  </section>

    <div class="main">
      <div class="stats-bar">
        <div class="stat-item">
          <div class="stat-value">{{totalNews}}</div>
          <div class="stat-label">今日资讯</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{categoryCount}}</div>
          <div class="stat-label">分类板块</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">24h</div>
          <div class="stat-label">实时更新</div>
        </div>
      </div>
  
      <!-- AI 汇总按钮 -->
      <div style="display: flex; justify-content: center; margin-bottom: 2.5rem;">
        <button class="summary-btn" onclick="window.AIDailyNews.showDailySummary()">
          <span>✨</span> AI 智能汇总
        </button>
      </div>
  
      {{content}}
    </div>

  <footer class="footer">
    <div class="footer-container">
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="footer-logo">
            <div class="logo-icon">📰</div>
            <span class="logo-text">AI 日报</span>
          </div>
          <p class="footer-desc">
            每日自动抓取前沿科技、商业财经等领域热点，由 AI 自动排版并生成精美摘要。
          </p>
          <p class="footer-contact">由 AI 自动生成 • {{updateTime}}</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p class="footer-copyright">© 2026 AI Daily News. All rights reserved.</p>
      </div>
    </div>
  </footer>

  <script src="{{base}}js/app.js"></script>
</body>
</html>`;

function generateNewsContent(data) {
  const tagColors = {
    ai_industry: 'ai_industry',
    business_finance: 'business_finance',
    auto_ev: 'auto_ev',
    semiconductor: 'semiconductor',
    biopharma: 'biopharma',
    smartphone: 'smartphone',
    entertainment: 'entertainment',
    clean_energy: 'clean_energy'
  };

  return data.categories.map(cat => {
    const newsHTML = cat.items.map(item => `
      <a href="${item.url}" class="news-card-link" target="_blank" rel="noopener">
        <article class="news-card">
          <div class="news-image">
            <img src="${item.image}" alt="${item.title}" loading="lazy">
            <span class="news-category-tag ${tagColors[cat.id]}">${item.tag || '资讯'}</span>
          </div>
          <div class="news-content">
            <h3 class="news-title">${item.title}</h3>
            <p class="news-summary">${item.summary}</p>
            <div class="news-meta">
              <div class="news-author"><span>📰 ${item.source}</span></div>
              <span class="news-date">${item.time}</span>
            </div>
          </div>
        </article>
      </a>
    `).join('');

    return `
    <section class="category-section" data-category="${cat.id}" id="${cat.id}">
      <div class="category-header">
        <h2 class="category-title">
          <span class="category-icon">${cat.icon}</span>${cat.name}
        </h2>
        <span class="category-count">${cat.items.length} 条</span>
      </div>
      <div class="news-grid">${newsHTML}</div>
    </section>`;
  }).join('');
}

function generateHTML(data, isArchive = false) {
  const base = isArchive ? '../' : './';
  const totalNews = data.categories.reduce((sum, cat) => sum + cat.items.length, 0);
  const categoryCount = data.categories.filter(cat => cat.items.length > 0).length;

  const navCategories = data.categories.map(cat => 
    `<a href="${base}#${cat.id}" class="nav-link" data-category="${cat.id}">${cat.name}</a>`
  ).join('');

  return TEMPLATE
    .replace(/{{base}}/g, base)
    .replace('{{title}}', `AI 日报 - ${data.date.date}`)
    .replace('{{dateDisplay}}', data.date.display)
    .replace(/{{totalNews}}/g, totalNews)
    .replace(/{{categoryCount}}/g, categoryCount)
    .replace('{{navCategories}}', navCategories)
    .replace('{{content}}', generateNewsContent(data))
    .replace('{{updateTime}}', new Date(data.generatedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
}

function saveArchive(data) {
  if (!fs.existsSync(PATHS.archive)) {
    fs.mkdirSync(PATHS.archive, { recursive: true });
  }
  const archiveFile = path.join(PATHS.archive, `${data.date.date}.html`);
  fs.writeFileSync(archiveFile, generateHTML(data, true), 'utf-8');
  updateArchiveIndex();
}

function updateArchiveIndex() {
  if (!fs.existsSync(PATHS.archive)) return;
  const files = fs.readdirSync(PATHS.archive).filter(f => f.endsWith('.html') && f !== 'index.html').sort().reverse();
  const listHTML = files.map(file => {
    const date = file.replace('.html', '');
    const displayDate = new Date(date + 'T00:00:00Z').toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      weekday: 'long',
      timeZone: 'Asia/Shanghai' 
    });
    return `<a href="${file}" class="archive-item"><span class="archive-date">${displayDate}</span><span class="archive-link">查看 →</span></a>`;
  }).join('');

  const indexHTML = `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>AI 日报 - 历史存档</title><link rel="stylesheet" href="../css/style.css"></head>
<body><header class="header"><div class="nav-container"><a href="../" class="logo"><div class="logo-icon">📰</div><span class="logo-text">AI 日报</span></a><nav class="nav-links"><a href="../" class="nav-link">今日日报</a><a href="#" class="nav-link active">历史存档</a></nav></div></header>
<div class="main"><section class="hero" style="padding: 2rem;"><h1 style="text-align: center; margin-bottom: 2rem;">📁 历史存档</h1><div class="archive-list">${listHTML || '<p style="text-align: center; color: var(--text-muted);">暂无历史存档</p>'}</div><div style="text-align: center; margin-top: 2rem;"><a href="../" class="summary-btn" style="display:inline-flex;">← 返回今日日报</a></div></section></div></body></html>`;
  fs.writeFileSync(path.join(PATHS.archive, 'index.html'), indexHTML, 'utf-8');
}

async function main() {
  console.log('🚀 AI 日报生成器 v3.0\n');
  const useReal = process.argv.includes('--real') || process.argv.includes('-r');
  const archiveFlag = process.argv.includes('--archive') || process.argv.includes('-a');

  try {
    const data = await generateDailyNews(useReal);

    // Save JSON data
    const dataDir = path.dirname(PATHS.data);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    saveData(data, PATHS.data);

    // Ensure output dir
    if (!fs.existsSync(PATHS.output)) fs.mkdirSync(PATHS.output, { recursive: true });
    fs.writeFileSync(path.join(PATHS.output, 'index.html'), generateHTML(data), 'utf-8');

    // Generate Summary using MiniMax API
    if (useReal && process.env.MINIMAX_API_KEY) {
      console.log('\n📋 正在生成智能日报汇总 (MiniMax)...');
      const { generateSummary } = require('./generate-summary');
      const summaryData = await generateSummary(data);
      if (summaryData) {
        fs.writeFileSync(PATHS.summary, JSON.stringify(summaryData, null, 2), 'utf-8');
        
        // Copy to docs/data for frontend access
        const docsDataDir = path.join(PATHS.output, 'data');
        if (!fs.existsSync(docsDataDir)) fs.mkdirSync(docsDataDir, { recursive: true });
        fs.copyFileSync(PATHS.summary, path.join(docsDataDir, 'daily-summary.json'));
        console.log(`✅ 智能汇总已生成并复制到前端`);
      }
    }

    if (archiveFlag) saveArchive(data);
    console.log('\n🎉 完成！');
  } catch (error) {
    console.error('❌ 发生错误:', error.message);
  }
}

module.exports = { generateHTML };

if (require.main === module) {
  main();
}
