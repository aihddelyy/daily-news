/**
 * News Scraper Module - Tavily Search Version
 * 真实数据抓取模块 - 使用 Tavily Search API
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const { tavilySearchBatch } = require('../utils/tavily-api');

// ============================================
// 精选 8 大分类配置（英文搜索 + 中文显示）
// ============================================
const SOURCES = {
  ai_industry: {
    name: 'AI行业动态',
    icon: '🧠',
    queries: [
      'artificial intelligence industry business news',
      'OpenAI Microsoft Anthropic Google partnerships',
      'enterprise AI investment trends',
      'AI policy and regulation news'
    ],
    keywords: ['AI行业', '大模型', 'OpenAI', '算力', '人工智能', '大厂动态'],
    tagMapping: { 'OpenAI': 'OpenAI', 'Microsoft': '微软', 'Google': 'Google' }
  },
  business_finance: {
    name: '商业财经',
    icon: '📊',
    queries: [
      'global business finance market news',
      'Wall Street Journal business highlights',
      'central bank interest rates trends',
      'top corporate earnings news'
    ],
    keywords: ['财经', '财报', '美联储', '降息', '华尔街', '宏观经济'],
    tagMapping: { 'Fed': '美联储', 'Earnings': '财报', 'Market': '市场' }
  },
  auto_ev: {
    name: '汽车出行',
    icon: '🚗',
    queries: [
      'electric vehicles EV industry news today',
      'autonomous driving Tesla FSD latest',
      'BYD Xiaomi Auto market expansion',
      'solid-state battery for EV news'
    ],
    keywords: ['汽车', '电动车', 'EV', '特斯拉', '比亚迪', '自动驾驶', '小米汽车'],
    tagMapping: { 'Tesla': 'Tesla', 'BYD': '比亚迪', 'EV': '电动', 'Autonomous': '智驾' }
  },
  semiconductor: {
    name: '半导体芯片',
    icon: '💻',
    queries: [
      'semiconductor industry chip technology news',
      'NVIDIA GPU Blackwell AI chip updates',
      'TSMC Intel Samsung foundry news',
      'ASML photolithography tech trends'
    ],
    keywords: ['半导体', '芯片', '英伟达', '台积电', '光刻机', 'ASML', 'GPU'],
    tagMapping: { 'NVIDIA': 'NVIDIA', 'TSMC': '台积电', 'Intel': 'Intel', 'GPU': '芯片' }
  },
  biopharma: {
    name: '生物医药',
    icon: '🧬',
    queries: [
      'biopharmaceutical drug development news',
      'GLP-1 weight loss drug market latest',
      'cancer research immunotherapy updates',
      'FDA pharma approval today'
    ],
    keywords: ['生物医药', 'GLP-1', '创新药', '癌症研究', 'FDA', '阿兹海默'],
    tagMapping: { 'FDA': 'FDA', 'Cancer': '肿瘤', 'Drug': '药物' }
  },
  smartphone: {
    name: '智能手机',
    icon: '📱',
    queries: [
      'smartphone mobile technology latest news',
      'Apple iPhone 17 18 rumors leaks',
      'Android Snapdragon Dimensity chipset news',
      'Huawei Mate Xiaomi Vivo foldable phones'
    ],
    keywords: ['智能手机', '苹果', '安卓', '高通', '折叠屏', '鸿蒙'],
    tagMapping: { 'iPhone': 'iPhone', 'Android': '安卓', 'Mobile': '手机' }
  },
  entertainment: {
    name: '游戏娱乐',
    icon: '🎮',
    queries: [
      'gaming industry news AAA titles news',
      'Nintendo Sony Xbox latest updates',
      'Netflix Disney streaming market news',
      'esports tournament major results'
    ],
    keywords: ['游戏', '影视', '任天堂', '索尼', 'Xbox', '流媒体', '电竞'],
    tagMapping: { 'Nintendo': '任天堂', 'Sony': '索尼', 'Game': '游戏' }
  },
  clean_energy: {
    name: '环保能源',
    icon: '🌿',
    queries: [
      'clean energy renewable solar wind news',
      'energy storage battery green hydrogen',
      'climate change policy global updates',
      'carbon capture technology trends'
    ],
    keywords: ['清洁能源', '光伏', '风电', '储能', '氢能', '碳中和'],
    tagMapping: { 'Solar': '光伏', 'Hydrogen': '氢能', 'Green': '环保' }
  }
};

function extractDomain(url) {
  if (!url) return null;
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
  } catch { return null; }
}

function getMockImage(category, index) {
  const seeds = { 
    ai_industry: 'brain',
    business_finance: 'biz',
    auto_ev: 'auto',
    semiconductor: 'chip',
    biopharma: 'bio',
    smartphone: 'phone',
    entertainment: 'game',
    clean_energy: 'green'
  };
  return `https://picsum.photos/seed/${seeds[category] || 'news'}${index}/400/250`;
}

function formatSearchResults(results, category) {
  const config = SOURCES[category];
  return results.map((item, index) => {
    let tag = '资讯';
    for (const [key, value] of Object.entries(config.tagMapping)) {
      if (item.title?.toLowerCase().includes(key.toLowerCase()) ||
          item.summary?.toLowerCase().includes(key.toLowerCase())) {
        tag = value;
        break;
      }
    }
    const source = item.source || extractDomain(item.url) || '网络';
    return {
      title: item.title || '',
      summary: item.content?.substring(0, 200) + '...' || item.summary || '',
      content: item.rawContent || '',
      source: source,
      url: item.url || '#',
      time: '今日',
      tag: tag,
      image: item.image || getMockImage(category, index)
    };
  }).filter(item => item.title && item.title.length > 0);
}

function getTodayInfo() {
  // 强制北京时间 (UTC+8)
  const now = new Date();
  const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  
  // 使用 beijingTime 生成日期字符串
  const dateStr = beijingTime.toISOString().split('T')[0];
  
  // 格式化显示日期 (也使用北京时区)
  return {
    date: dateStr,
    display: beijingTime.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      weekday: 'long',
      timeZone: 'UTC' // 因为已经手动加了 8 小时，这里用 UTC 即可
    }),
    timestamp: now.toISOString() // 原始时间戳用于系统参考
  };
}

function getMockNews(category) {
  const mockDB = {
    ai_industry: [
      { title: 'AGI 评估标准委员会今日成立', summary: '旨在为日益增强的通用人工智能提供客观的多维评估框架。', source: 'AI行业资讯', url: '#', time: '今日', tag: '行业' }
    ],
    business_finance: [
      { title: '美联储暗示下季度降息路径', summary: '最新议息会议纪要显示，多数官员支持逐步恢复中性利率。', source: '华尔街日报', url: '#', time: '今日', tag: '宏调' }
    ],
    auto_ev: [
      { title: '全固态电池汽车开启公开路测', summary: '某头部车企宣布其固态电池原型车已完成 5000 公里无故障路跑。', source: '电车志', url: '#', time: '今日', tag: '电池' }
    ],
    semiconductor: [
      { title: '2nm 工艺芯片正式进入试产阶段', summary: '半导体巨头宣布 2nm 节点良率突破预期，预计明年量产。', source: '芯榜', url: '#', time: '今日', tag: '工艺' }
    ],
    biopharma: [
      { title: '通用型流感疫苗临床试验结果乐观', summary: '该疫苗可涵盖过去十年的主流变种，有效性大幅提升。', source: '医学周刊', url: '#', time: '今日', tag: '疫苗' }
    ],
    smartphone: [
      { title: '新型柔性屏技术解决折叠痕迹难题', summary: '通过更换铰链支撑结构和像素补偿，折叠屏寿命延长一倍。', source: '机圈网', url: '#', time: '今日', tag: '硬件' }
    ],
    entertainment: [
      { title: '某 3A 大作发售首日销量破千万', summary: '凭借极致的画面表现和沉浸感，该作刷新了单机游戏销售记录。', source: '游戏机', url: '#', time: '今日', tag: '游戏' }
    ],
    clean_energy: [
      { title: '海上风电单机容量突破 25MW', summary: '超大型海上风机顺利并网，标志着清洁能源装备进入新纪元。', source: '绿色电力', url: '#', time: '今日', tag: '风电' }
    ]
  };
  
  const items = mockDB[category] || [];
  return items.map((item, idx) => ({
    ...item,
    image: getMockImage(category, idx)
  }));
}

async function fetchNews(category, limit = 6) {
  console.log(`\n📡 正在抓取 [${SOURCES[category].name}] 新闻...`);
  const config = SOURCES[category];
  
  if (!process.env.TAVILY_API_KEY) {
    console.log('  ℹ️ 未配置 TAVILY_API_KEY，使用模拟数据');
    return getMockNews(category).slice(0, limit);
  }
  
  try {
    const results = await tavilySearchBatch(config.queries, 3);
    if (results.length === 0) {
      console.log('  ⚠️ 无结果，使用模拟数据');
      return getMockNews(category).slice(0, limit);
    }
    let formatted = formatSearchResults(results.slice(0, limit), category);
    
    // 集成 MiniMax 翻译
    if (process.env.MINIMAX_API_KEY) {
      const { minimax_translate_batch } = require('../utils/minimax-api');
      formatted = await minimax_translate_batch(formatted);
    }

    console.log(`  ✅ ${config.name}: ${formatted.length} 条`);
    return formatted;
  } catch (error) {
    console.warn(`  ⚠️ 搜索失败: ${error.message}`);
    return getMockNews(category).slice(0, limit);
  }
}

async function generateDailyNews(useRealSearch = false) {
  const today = getTodayInfo();
  console.log(`\n🚀 AI 日报生成器 v3.0`);
  console.log(`📅 ${today.display}\n`);
  
  const hasTavilyKey = !!process.env.TAVILY_API_KEY;
  const categories = [];
  
  for (const [key, config] of Object.entries(SOURCES)) {
    let items;
    if (useRealSearch && hasTavilyKey) {
      items = await fetchNews(key, 6);
    } else {
      items = getMockNews(key);
    }
    
    // 始终推送分类，确保导航栏完整展示
    categories.push({ id: key, name: config.name, icon: config.icon, items: items || [] });
  }
  
  return {
    date: today,
    categories: categories,
    generatedAt: today.timestamp,
    version: '3.0.0',
    source: (useRealSearch && hasTavilyKey) ? 'tavily' : 'mock'
  };
}

function saveData(data, outputPath) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`💾 数据已保存: ${outputPath}`);
}

module.exports = { SOURCES, getTodayInfo, fetchNews, generateDailyNews, saveData };
