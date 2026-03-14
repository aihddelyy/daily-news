/**
 * Tavily Search API 工具
 * 封装 Tavily 搜索调用
 */
const https = require('https');

/**
 * Tavily 单次搜索
 */
async function tavilySearch(query, count = 10) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error('TAVILY_API_KEY 未设置');
  }
  
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      api_key: apiKey,  // 修复：必须在 Body 中传递 API Key
      query,
      max_results: count,
      include_answer: true,
      include_raw_content: false,
      search_depth: 'basic'
    });
    
    const options = {
      hostname: 'api.tavily.com',
      path: '/search',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode !== 200) {
            reject(new Error(`Tavily API 报错 (${res.statusCode}): ${parsed.detail || data}`));
            return;
          }
          resolve(parsed);
        } catch (e) {
          reject(new Error(`解析 Tavily 响应失败: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Tavily 批量搜索（带去重和延迟）
 */
async function tavilySearchBatch(queries, countPerQuery = 3) {
  const results = [];
  for (const query of queries) {
    try {
      const result = await tavilySearch(query, countPerQuery);
      if (result.results && result.results.length > 0) {
        results.push(...result.results);
      }
    } catch (error) {
      console.warn(`搜索失败: ${error.message}`);
    }
    // 限制频率
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // URL 去重
  const seen = new Set();
  return results.filter(item => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

module.exports = {
  tavilySearch,
  tavilySearchBatch
};
