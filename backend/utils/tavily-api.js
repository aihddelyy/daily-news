/**
 * Tavily Search API 封装
 */

const https = require('https');

/**
 * Tavily 搜索
 * @param {Object} options - 搜索选项
 * @param {string} options.query - 搜索关键词
 * @param {number} [options.count=10] - 返回结果数量
 * @param {boolean} [options.include_answer=false] - 是否包含AI答案
 * @param {boolean} [options.include_raw_content=false] - 是否包含原始内容
 * @param {string} [options.search_depth='basic'] - 搜索深度: ultra-fast, fast, basic, advanced
 * @returns {Promise<Object>} 搜索结果
 */
async function tavilySearch(options) {
  const {
    query,
    count = 10,
    include_answer = false,
    include_raw_content = false,
    search_depth = 'basic'
  } = options;
  
  const apiKey = process.env.TAVILY_API_KEY;
  
  if (!apiKey) {
    throw new Error('TAVILY_API_KEY 环境变量未设置');
  }
  
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      query,
      max_results: count,
      include_answer,
      include_raw_content,
      search_depth
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
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (e) {
          reject(new Error('解析响应失败: ' + e.message));
        }
      });
    });
    
    req.on('error', reject);
    
    req.write(postData);
    req.end();
  });
}

module.exports = { tavilySearch };
