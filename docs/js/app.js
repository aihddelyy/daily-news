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

function initCategoryFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const categorySections = document.querySelectorAll('.category-section');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.dataset.category;
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      categorySections.forEach(section => {
        section.style.display = (category === 'all' || section.dataset.category === category) ? 'block' : 'none';
      });
      updateNavActiveState(category);
    });
  });
}

function updateNavActiveState(category) {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    if (category === 'all' && link.getAttribute('href') === '#') link.classList.add('active');
    else if (link.getAttribute('href') === '#' + category) link.classList.add('active');
  });
}

function initSearchHighlight() {
  const searchInput = document.querySelector('.search-input');
  if (!searchInput) return;
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    document.querySelectorAll('.news-card').forEach(card => {
      const title = card.querySelector('.news-title').textContent.toLowerCase();
      const summary = card.querySelector('.news-summary').textContent.toLowerCase();
      card.style.opacity = (query === '' || title.includes(query) || summary.includes(query)) ? '1' : '0.3';
    });
  });
  searchInput.addEventListener('blur', () => {
    if (searchInput.value === '') document.querySelectorAll('.news-card').forEach(card => { card.style.opacity = '1'; });
  });
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        if (targetElement.style.display === 'none') {
          document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.category === 'all') btn.classList.add('active');
          });
          document.querySelectorAll('.category-section').forEach(section => { section.style.display = 'block'; });
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

function showDailySummary() {
  if (!summaryData) {
    alert('暂无 AI 汇总数据。请确保配置了 MINIMAX_API_KEY 且生成任务成功运行（且使用了 --real 参数）。');
    return;
  }

  const modal = document.createElement('div');
  modal.id = 'summary-modal';
  modal.style.cssText = `
    position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,0.8); backdrop-filter: blur(10px);
  `;

  const content = document.createElement('div');
  content.style.cssText = `
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 24px; max-width: 800px; max-height: 85vh;
    width: 90%; overflow-y: auto; padding: 2rem; position: relative;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  `;

  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '✕';
  closeBtn.style.cssText = `
    position: absolute; top: 1rem; right: 1rem; background: rgba(255,255,255,0.1);
    border: none; color: #94a3b8; font-size: 1.5rem; cursor: pointer; width: 40px; height: 40px;
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
  `;
  closeBtn.onmouseover = () => { closeBtn.style.background = 'rgba(255,255,255,0.2)'; closeBtn.style.color = '#fff'; };
  closeBtn.onmouseout = () => { closeBtn.style.background = 'rgba(255,255,255,0.1)'; closeBtn.style.color = '#94a3b8'; };
  closeBtn.onclick = () => modal.remove();

  const title = document.createElement('h2');
  title.innerHTML = `✨ ${summaryData.date} AI Daily News 智能汇总`;
  title.style.cssText = 'font-size: 1.75rem; font-weight: 800; margin-bottom: 1.5rem; text-align: center; background: linear-gradient(135deg, #8b5cf6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent;';

  const overall = document.createElement('p');
  overall.textContent = summaryData.overallSummary;
  overall.style.cssText = 'color: #f8fafc; font-size: 1.1rem; line-height: 1.8; margin-bottom: 2rem; padding: 1.5rem; background: rgba(139, 92, 246, 0.1); border-radius: 12px; border-left: 4px solid #8b5cf6;';

  const categoriesHTML = summaryData.categories.map(cat => `
    <div style="margin-bottom: 1.5rem; padding: 1.25rem; background: rgba(255,255,255,0.03); border-radius: 12px;">
      <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
        <span>${cat.icon}</span> <span>${cat.name}</span>
      </h3>
      <p style="color: #94a3b8; font-size: 0.95rem; margin-bottom: 0.75rem; line-height: 1.6;">${cat.categorySummary}</p>
      <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem;">
        ${cat.keyPoints.map(kp => `<span style="background: rgba(139, 92, 246, 0.2); color: #a78bfa; padding: 0.25rem 0.75rem; border-radius: 100px; font-size: 0.8rem;">${kp}</span>`).join('')}
      </div>
    </div>
  `).join('');

  content.appendChild(closeBtn);
  content.appendChild(title);
  content.appendChild(overall);
  content.innerHTML += categoriesHTML;

  // Actions Area (NEW)
  const actionsDiv = document.createElement('div');
  actionsDiv.style.cssText = `
    margin-top: 2.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.05);
    display: flex; gap: 1rem; justify-content: center;
  `;

  const copyBtn = document.createElement('button');
  copyBtn.innerHTML = '📋 复制全文';
  copyBtn.style.cssText = `
    background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; border: none;
    padding: 0.75rem 1.5rem; border-radius: 12px; font-weight: 600; cursor: pointer;
    transition: all 0.2s; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  `;
  copyBtn.onclick = () => {
    let text = `✨ ${summaryData.date} AI 日报智能汇总\n\n`;
    text += `【今日摘要】\n${summaryData.overallSummary}\n\n`;
    summaryData.categories.forEach(cat => {
      text += `--- ${cat.icon} ${cat.name} ---\n`;
      text += `摘要：${cat.categorySummary}\n`;
      text += `关键点：${cat.keyPoints.join('、')}\n\n`;
    });
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.innerHTML = '✅ 已复制';
      setTimeout(() => { copyBtn.innerHTML = '📋 复制全文'; }, 2000);
      window.AIDailyNews.showToast('已复制到剪贴板');
    });
  };

  const footerCloseBtn = document.createElement('button');
  footerCloseBtn.innerHTML = '关闭窗口';
  footerCloseBtn.style.cssText = `
    background: rgba(255,255,255,0.05); color: #94a3b8; border: 1px solid rgba(255,255,255,0.1);
    padding: 0.75rem 1.5rem; border-radius: 12px; font-weight: 600; cursor: pointer;
    transition: all 0.2s;
  `;
  footerCloseBtn.onclick = () => modal.remove();
  footerCloseBtn.onmouseover = () => { footerCloseBtn.style.background = 'rgba(255,255,255,0.1)'; footerCloseBtn.style.color = '#fff'; };
  footerCloseBtn.onmouseout = () => { footerCloseBtn.style.background = 'rgba(255,255,255,0.05)'; footerCloseBtn.style.color = '#94a3b8'; };

  actionsDiv.appendChild(copyBtn);
  actionsDiv.appendChild(footerCloseBtn);
  content.appendChild(actionsDiv);

  modal.appendChild(content);

  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  modal.addEventListener('transitionend', () => {}, { once: true });
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toast.style.cssText = 'position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%); background: rgba(139,92,246,0.95); color: #fff; padding: 12px 24px; border-radius: 100px; font-size: 0.9rem; font-weight: 500; z-index: 1000; animation: fadeInUp 0.3s ease; backdrop-filter: blur(10px);';
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.animation = 'fadeOut 0.3s ease'; setTimeout(() => toast.remove(), 300); }, 2000);
}

const style = document.createElement('style');
style.textContent = '@keyframes fadeInUp{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}@keyframes fadeOut{from{opacity:1}to{opacity:0}}';
document.head.appendChild(style);

window.AIDailyNews = { formatDate, showToast, showDailySummary };
