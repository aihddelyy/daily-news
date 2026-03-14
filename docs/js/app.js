/**
 * AI Daily News - Frontend Interaction
 */
document.addEventListener('DOMContentLoaded', () => { initApp(); });

function initApp() {
  initCategoryFilter();
  initSearchHighlight();
  initSmoothScroll();
  initSummaryModal();
}

/**
 * 分类过滤逻辑
 */
function initCategoryFilter() {
  const navLinks = document.querySelectorAll('.nav-link[data-category]');
  const categorySections = document.querySelectorAll('.category-section');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const category = link.dataset.category;
      if (!category) return;

      e.preventDefault();
      
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      categorySections.forEach(section => {
        section.style.display = (category === 'all' || section.dataset.category === category) ? 'block' : 'none';
      });

      if (category !== 'all') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
}

/**
 * 搜索高亮逻辑
 */
function initSearchHighlight() {
  const searchInput = document.querySelector('.search-input');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const cards = document.querySelectorAll('.news-card');
    
    cards.forEach(card => {
      const title = card.querySelector('.news-title').textContent.toLowerCase();
      const summary = card.querySelector('.news-summary').textContent.toLowerCase();
      const isMatch = query === '' || title.includes(query) || summary.includes(query);
      card.style.opacity = isMatch ? '1' : '0.3';
      card.style.transform = isMatch ? 'scale(1)' : 'scale(0.98)';
    });
  });

  searchInput.addEventListener('blur', () => {
    if (searchInput.value === '') {
      document.querySelectorAll('.news-card').forEach(card => { 
        card.style.opacity = '1'; 
        card.style.transform = 'scale(1)';
      });
    }
  });
}

/**
 * 平滑滚动逻辑 (移除冗余的 .filter-btn 引用)
 */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        e.preventDefault();
        // 如果目标分类被隐藏了（当前处于其他分类视图），则切换回“首页”视图
        if (targetElement.style.display === 'none') {
          const homeLink = document.querySelector('.nav-link[data-category="all"]');
          if (homeLink) homeLink.click();
        }
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// Summary Modal Functionality
let summaryData = null;

async function initSummaryModal() {
  try {
    const response = await fetch('data/daily-summary.json');
    if (response.ok) {
      summaryData = await response.json();
    }
  } catch (e) {
    console.log('No summary data available');
  }
}

/**
 * 显示 AI 汇总弹窗 (重构：使用 CSS 类名解耦样式)
 */
function showDailySummary() {
  if (!summaryData) {
    alert('暂无 AI 汇总数据。请确保配置了 MINIMAX_API_KEY 且生成任务成功运行。');
    return;
  }

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';

  const content = document.createElement('div');
  content.className = 'modal-content';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close';
  closeBtn.innerHTML = '✕';
  closeBtn.onclick = () => {
    modal.remove();
    document.body.style.overflow = '';
  };

  const title = document.createElement('h2');
  title.className = 'modal-title';
  title.innerHTML = `✨ AI 智能汇总 (${summaryData.date})`;

  const overall = document.createElement('p');
  overall.className = 'modal-summary';
  overall.textContent = summaryData.overallSummary;

  const categoriesHTML = summaryData.categories.map(cat => `
    <div class="modal-category">
      <h3 class="modal-category-title">
        <span>${cat.icon}</span> <span>${cat.name}</span>
      </h3>
      <p class="modal-category-text">${cat.categorySummary}</p>
      <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
        ${cat.keyPoints.map(kp => `<span class="keypoint-tag">${kp}</span>`).join('')}
      </div>
    </div>
  `).join('');

  content.appendChild(closeBtn);
  content.appendChild(title);
  content.appendChild(overall);
  content.insertAdjacentHTML('beforeend', categoriesHTML);

  // 操作区域
  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'modal-actions';

  const copyBtn = document.createElement('button');
  copyBtn.className = 'summary-btn';
  copyBtn.innerHTML = '📋 复制汇总全文';
  copyBtn.onclick = () => {
    let text = `✨ ${summaryData.date} AI 日报智能汇总\n\n`;
    text += `【核心摘要】\n${summaryData.overallSummary}\n\n`;
    summaryData.categories.forEach(cat => {
      text += `--- ${cat.icon} ${cat.name} ---\n`;
      text += `摘要：${cat.categorySummary}\n`;
      text += `关键点：${cat.keyPoints.join('、')}\n\n`;
    });
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.innerHTML = '✅ 已复制到剪贴板';
      setTimeout(() => { copyBtn.innerHTML = '📋 复制汇总全文'; }, 2000);
      showToast('已复制到剪贴板');
    });
  };

  const footerCloseBtn = document.createElement('button');
  footerCloseBtn.className = 'nav-link';
  footerCloseBtn.style.cssText = 'padding: 12px 24px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; cursor: pointer;';
  footerCloseBtn.innerHTML = '关闭';
  footerCloseBtn.onclick = () => closeBtn.click();

  actionsDiv.appendChild(copyBtn);
  actionsDiv.appendChild(footerCloseBtn);
  content.appendChild(actionsDiv);

  modal.appendChild(content);
  modal.onclick = (e) => { if (e.target === modal) closeBtn.click(); };
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
}

/**
 * 全局提点 Toast
 */
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
}

window.AIDailyNews = { formatDate, showToast, showDailySummary };
