# 📰 智能日报系统

> 每日自动抓取 12 大领域热点资讯，生成精美日报

![Preview](https://img.shields.io/badge/版本-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ 特性

- **12 大主题覆盖**: 科技前沿、商业财经、国际局势、汽车出行、半导体芯片、生物医药、消费零售、游戏娱乐、环保能源、智能手机、AI行业动态、物联网智能硬件
- **自动化采集**: 每日自动从全网抓取最新资讯
- **精美UI**: 现代化渐变设计，移动端适配
- **一键部署**: GitHub Actions 自动化部署到 GitHub Pages

## 🚀 快速开始

### 前置要求

- Node.js 18+
- Tavily API Key ([获取地址](https://tavily.com))

### 本地运行

```bash
# 1. 克隆或进入项目
cd daily-news-system

# 2. 安装依赖
npm install

# 3. 设置环境变量
export TAVILY_API_KEY=your_api_key_here

# 4. 运行生成器
npm run generate
```

### Docker 运行

```bash
docker build -t daily-news .
docker run -e TAVILY_API_KEY=your_key daily-news
```

## 📊 支持的主题

| 编号 | 主题 | 英文 | 图标 |
|------|------|------|------|
| 1 | 科技前沿 | Tech Frontier | 🚀 |
| 2 | 商业财经 | Business & Finance | 📈 |
| 3 | 国际局势 | International Affairs | 🌍 |
| 4 | 汽车出行 | Auto & EV | 🚗 |
| 5 | 半导体芯片 | Semiconductor | 💻 |
| 6 | 生物医药 | Biopharma | 💊 |
| 7 | 消费零售 | Consumer & Retail | 🛒 |
| 8 | 游戏娱乐 | Gaming & Entertainment | 🎮 |
| 9 | 环保能源 | Clean Energy | ⚡ |
| 10 | 智能手机 | Smartphone | 📱 |
| 11 | AI行业动态 | AI Industry | 🤖 |
| 12 | 物联网智能硬件 | IoT & Smart Hardware | 🏠 |

## ⚙️ 配置

修改 `config/topics.json` 自定义主题和搜索关键词：

```json
{
  "topics": [
    {
      "id": "your_topic",
      "name": "你的主题",
      "icon": "🎯",
      "keywords": ["关键词1", "关键词2"],
      "search_queries": [
        "搜索语句1",
        "搜索语句2"
      ]
    }
  ]
}
```

## 🔄 自动化部署

### GitHub Actions (推荐)

1. Fork 本项目
2. 在 Repository Settings → Secrets 添加:
   - `TAVILY_API_KEY`: 你的 Tavily API Key
3. 开启 GitHub Pages: Settings → Pages → Source: GitHub Actions
4. 每天自动运行

### 定时任务 (本地/服务器)

```bash
# Linux/Mac crontab
0 7 * * * cd /path/to/daily-news-system && npm run generate

# Windows 任务计划
schtasks /create /tn "DailyNews" /tr "npm run generate" /sc daily /st 07:00
```

## 📁 项目结构

```
daily-news-system/
├── config/
│   └── topics.json          # 主题配置
├── backend/
│   ├── scraper/
│   │   └── generate.js     # 主生成器
│   └── utils/
│       └── tavily-api.js    # Tavily API 封装
├── output/                  # 生成的HTML输出
├── .github/
│   └── workflows/
│       └── daily-news.yml   # GitHub Actions 工作流
├── docs/                    # GitHub Pages 部署目录
└── package.json
```

## 📝 输出示例

生成的日报包含:
- 12 个主题分类
- 每个主题 5 条精选资讯
- 资讯来源标注
- 响应式 UI 设计
- 夜间模式适配

## 🤝 贡献

欢迎提交 Issue 和 PR！

## 📄 License

MIT License
