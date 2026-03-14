# AI Daily News (AI 行业 Daily News)

> 🌐 **实时预览**: [https://aihddelyy.github.io/daily-news/](https://aihddelyy.github.io/daily-news/)

🚀 一个基于 Node.js 的自动化 AI 行业及科技动态日报生成系统。利用 Tavily 搜索最新资讯，并通过 MiniMax 模型进行智能汇总与翻译。

## ✨ 功能特性

- **多领域覆盖**：涵盖 AI 行业动态、商业财经、汽车出行、半导体芯片、生物医药、智能手机、游戏娱乐及环保能源 8 大垂直领域。
- **智能汇总**：集成 MiniMax 2.5 模型，对海量新闻进行结构化提炼和多语言翻译。
- **自动搜索**：利用 Tavily Search API 定时抓取全球范围内的最新真实资讯。
- **GitHub Actions 赋能**：实现全自动化流程，每日定时运行，自动生成 HTML 并部署至 GitHub Pages。
- **极简前端**：提供美观、响应式的单页面 Web 应用，支持分类筛选和一键复制汇总文本。

## 🛠️ 技术栈

- **Backend**: Node.js
- **Search**: [Tavily API](https://tavily.com/)
- **LLM**: [MiniMax API](https://platform.minimax.chat/) (MiniMax-M2.5-highspeed)
- **Frontend**: Vanilla HTML/CSS/JS (Glassmorphism design)
- **CI/CD**: GitHub Actions

## 📦 快速开始

### 1. 配置环境变量

在本地开发时，请在项目根目录创建 `.env` 文件：

```env
TAVILY_API_KEY=你的_Tavily_Key
MINIMAX_API_KEY=你的_MiniMax_Key
MINIMAX_GROUP_ID=你的_MiniMax_GroupID
```

### 2. 安装依赖

```bash
npm install
```

### 3. 本地预览抓取

```bash
# 执行真实抓取并生成汇总
node backend/scraper/generate.js --real
```

## 🚀 部署指南

### 设置 GitHub Secrets
在 GitHub 仓库的 `Settings` -> `Secrets and variables` -> `Actions` 中添加以下密钥：
- `TAVILY_API_KEY`
- `MINIMAX_API_KEY`
- `MINIMAX_GROUP_ID`

### 开启 GitHub Pages
1. 在仓库 `Settings` -> `Pages` 中。
2. 将 `Build and deployment` -> `Source` 设置为 `Deploy from a branch`。
3. 选择 `master` 分支下的 `/docs` 文件夹并保存。

## 📅 工作流说明
系统工作流（`.github/workflows/daily-news.yml`）默认每天北京时间早上 8:00 自动运行。你也可以在 Actions 页面点击 "Run workflow" 手动触发。

---
*Inspired by [ibywind/ai-daily-news](https://github.com/ibywind/ai-daily-news)*
