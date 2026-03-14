/**
 * 发送日报邮件脚本
 * 需要配置 Gmail API 或使用 gog CLI
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUTPUT_DIR = path.join(__dirname, 'output');
const EMAIL_TO = process.env.EMAIL_TO || 'aihdde@gmail.com';
const DATE_STR = new Date().toLocaleDateString('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

/**
 * 获取最新的日报文件
 */
function getLatestReport() {
  const files = fs.readdirSync(OUTPUT_DIR)
    .filter(f => f.startsWith('daily_news_') && f.endsWith('.html'))
    .sort()
    .reverse();
  
  if (files.length === 0) {
    throw new Error('没有找到日报文件');
  }
  
  return path.join(OUTPUT_DIR, files[0]);
}

/**
 * 发送邮件 (使用 gog gmail send)
 */
function sendEmailWithGog(htmlPath) {
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  
  // 提取纯文本摘要用于邮件正文
  const plainText = htmlContent
    .replace(/<[^>]+>/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .substring(0, 2000);
  
  const subject = `📰 每日资讯简报 - ${DATE_STR}`;
  const tempHtmlFile = path.join(__dirname, 'temp_report.html');
  
  // 写入临时文件
  fs.writeFileSync(tempHtmlFile, htmlContent, 'utf-8');
  
  try {
    // 使用 gog gmail send 发送
    const cmd = `gog gmail send --to "${EMAIL_TO}" --subject "${subject}" --body-html-file "${tempHtmlFile}"`;
    console.log('📤 发送邮件中...');
    execSync(cmd, { encoding: 'utf-8' });
    console.log('✅ 邮件发送成功!');
  } catch (error) {
    console.error('❌ 发送失败:', error.message);
    throw error;
  } finally {
    // 清理临时文件
    if (fs.existsSync(tempHtmlFile)) {
      fs.unlinkSync(tempHtmlFile);
    }
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('📧 日报邮件发送脚本\n');
  console.log(`📅 日期: ${DATE_STR}`);
  console.log(`📬 收件人: ${EMAIL_TO}\n`);
  
  try {
    // 获取最新日报
    const reportPath = getLatestReport();
    console.log(`📄 日报文件: ${path.basename(reportPath)}`);
    
    // 发送邮件
    sendEmailWithGog(reportPath);
    
    console.log('\n🎉 完成!');
  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    process.exit(1);
  }
}

main();
