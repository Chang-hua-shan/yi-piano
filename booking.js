/* === 預約系統核心 JavaScript === */

document.addEventListener('DOMContentLoaded', () => {
  // 初始化 LocalStorage 資料庫
  initDatabase();

  // DOM 元素選取
  const authView = document.getElementById('authView');
  const dashboardView = document.getElementById('dashboardView');
  const loginFormSection = document.getElementById('loginFormSection');
  const signUpFormSection = document.getElementById('signUpFormSection');

  const toSignUpLink = document.getElementById('toSignUp');
  const toLoginLink = document.getElementById('toLogin');

  const loginForm = document.getElementById('loginForm');
  const signUpForm = document.getElementById('signUpForm');

  const welcomeMsg = document.getElementById('welcomeMsg');
  const userRoleText = document.getElementById('userRoleText');
  const logoutBtn = document.getElementById('logoutBtn');
  const quickAdminBtn = document.getElementById('quickAdminBtn');

  // Tabs 切換元素
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');
  const tabAdminBtn = document.getElementById('tabAdminBtn');

  // 預約表單元素
  const bookingForm = document.getElementById('bookingForm');
  const bookingTeacher = document.getElementById('bookingTeacher');
  const bookingDate = document.getElementById('bookingDate');
  const timeSlotsContainer = document.getElementById('timeSlotsContainer');
  const bookingNotes = document.getElementById('bookingNotes');
  const submitBookingBtn = document.getElementById('submitBookingBtn');
  const courseCards = document.querySelectorAll('.course-opt-card');

  // 我的預約列表
  const myBookingsList = document.getElementById('myBookingsList');

  // 管理者表格與篩選器
  const adminBookingsTableBody = document.getElementById('adminBookingsTableBody');
  const filterTeacher = document.getElementById('filterTeacher');
  const filterStatus = document.getElementById('filterStatus');
  const adminStatsText = document.getElementById('adminStatsText');

  // 全域狀態變數
  let currentUser = null;
  let selectedTimeSlot = null;

  // 限制預約日期從明天開始，至 30 天內
  setupDatePicker();

  // 檢查是否已登入
  checkSession();

  /* ==========================================
     1. 資料庫初始化 (Seeding Demo Data)
     ========================================== */
  function initDatabase() {
    if (!localStorage.getItem('yipiano_users')) {
      const defaultUsers = [
        { name: '管理員', email: 'admin@yipiano.com', password: 'admin123', isAdmin: true },
        { name: '陳小美', email: 'xiaomei@mail.com', password: 'password123', isAdmin: false },
        { name: '王大同', email: 'datong@mail.com', password: 'password123', isAdmin: false }
      ];
      localStorage.setItem('yipiano_users', JSON.stringify(defaultUsers));
    }

    if (!localStorage.getItem('yipiano_bookings')) {
      const defaultBookings = [
        {
          id: 'b1',
          userEmail: 'xiaomei@mail.com',
          userName: '陳小美',
          course: '兒童鋼琴課',
          teacher: 'Yi 老師',
          date: getRelativeDateString(1), // 明天
          time: '10:35 - 11:25',
          notes: '小朋友有彈過一年，希望能學宮崎駿音樂。',
          status: 'confirmed',
          createdAt: new Date().toISOString()
        },
        {
          id: 'b2',
          userEmail: 'datong@mail.com',
          userName: '王大同',
          course: '成人鋼琴課',
          teacher: 'Yi 老師',
          date: getRelativeDateString(2), // 後天
          time: '18:30 - 19:20',
          notes: '初學者，以前完全沒接觸過。',
          status: 'pending',
          createdAt: new Date().toISOString()
        },
        {
          id: 'b3',
          userEmail: 'xiaomei@mail.com',
          userName: '陳小美',
          course: '長笛課程',
          teacher: 'Flora 老師',
          date: getRelativeDateString(3), // 大後天
          time: '13:30 - 14:20',
          notes: '想要練習口型吹氣。',
          status: 'pending',
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem('yipiano_bookings', JSON.stringify(defaultBookings));
    }
  }

  function getRelativeDateString(daysOffset) {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  }

  function getUsers() {
    return JSON.parse(localStorage.getItem('yipiano_users')) || [];
  }

  function getBookings() {
    return JSON.parse(localStorage.getItem('yipiano_bookings')) || [];
  }

  function saveBookings(bookings) {
    localStorage.setItem('yipiano_bookings', JSON.stringify(bookings));
  }

  /* ==========================================
     2. 註冊、登入與 Session 管理
     ========================================== */
  // 切換註冊/登入介面
  toSignUpLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginFormSection.style.display = 'none';
    signUpFormSection.style.display = 'block';
  });

  toLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    signUpFormSection.style.display = 'none';
    loginFormSection.style.display = 'block';
  });

  // 登入送出
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    const users = getUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      showToast('此電子信箱尚未註冊', 'error');
      return;
    }

    if (user.password !== password) {
      showToast('密碼輸入錯誤，請重試', 'error');
      return;
    }

    // 登入成功
    login(user);
  });

  // 註冊送出
  signUpForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('signUpName').value.trim();
    const email = document.getElementById('signUpEmail').value.trim();
    const password = document.getElementById('signUpPassword').value;

    const users = getUsers();
    if (users.some(u => u.email === email)) {
      showToast('該電子信箱已被註冊', 'error');
      return;
    }

    const newUser = {
      name,
      email,
      password,
      isAdmin: email.toLowerCase() === 'admin@yipiano.com' // 自動判定特定的 admin 信箱
    };

    users.push(newUser);
    localStorage.setItem('yipiano_users', JSON.stringify(users));

    showToast('註冊成功！已為您自動登入', 'success');
    login(newUser);
  });

  // 執行登入
  function login(user) {
    currentUser = user;
    sessionStorage.setItem('yipiano_session', JSON.stringify(user));
    
    // 更新介面
    authView.style.display = 'none';
    dashboardView.style.display = 'block';
    
    welcomeMsg.textContent = `您好，${user.name} ${user.isAdmin ? '老師' : '學員'}！`;
    
    if (user.isAdmin) {
      userRoleText.textContent = '系統管理員 / 教師端後台';
      tabAdminBtn.style.display = 'inline-block';
      quickAdminBtn.style.display = 'none';
      switchTab('adminPanel');
      renderAdminBookings();
    } else {
      userRoleText.textContent = '學員預約大廳 - 探索音樂旅程';
      tabAdminBtn.style.display = 'none';
      
      // 提供一般使用者快速測試管理員的便利按鈕
      quickAdminBtn.style.display = 'inline-block';
      
      switchTab('bookPanel');
      resetBookingForm();
      renderMyBookings();
    }
  }

  // 檢查現有 Session
  function checkSession() {
    const session = sessionStorage.getItem('yipiano_session');
    if (session) {
      login(JSON.parse(session));
    } else {
      authView.style.display = 'block';
      dashboardView.style.display = 'none';
    }
  }

  // 登出
  logoutBtn.addEventListener('click', () => {
    currentUser = null;
    sessionStorage.removeItem('yipiano_session');
    
    // 清除登入表單輸入內容
    loginForm.reset();
    signUpForm.reset();

    showToast('您已成功登出系統', 'info');
    checkSession();
  });

  // 便利功能：快速切換至管理員，以便審核自己做出的預約
  quickAdminBtn.addEventListener('click', () => {
    const users = getUsers();
    const adminUser = users.find(u => u.isAdmin) || { name: '管理員', email: 'admin@yipiano.com', password: 'admin123', isAdmin: true };
    login(adminUser);
    showToast('已切換為管理員帳號 (admin@yipiano.com)', 'success');
  });

  /* ==========================================
     3. 儀表板分頁 (Tab Switching)
     ========================================== */
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      switchTab(target);
    });
  });

  function switchTab(panelId) {
    tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.target === panelId);
    });

    tabPanels.forEach(panel => {
      panel.classList.toggle('active', panel.id === panelId);
    });

    // 切換分頁時重新渲染對應列表
    if (panelId === 'myBookingsPanel') {
      renderMyBookings();
    } else if (panelId === 'adminPanel') {
      renderAdminBookings();
    }
  }

  /* ==========================================
     4. 線上預約系統邏輯 (Booking Flow)
     ========================================== */
  // 設置日期選擇器限制
  function setupDatePicker() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);

    bookingDate.min = tomorrow.toISOString().split('T')[0];
    bookingDate.max = maxDate.toISOString().split('T')[0];
  }

  // 課程單選卡片點擊樣式切換
  courseCards.forEach(card => {
    card.addEventListener('click', () => {
      courseCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      const radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    });
  });

  // 當選擇日期與老師時，顯示並刷新時段卡片
  bookingDate.addEventListener('change', refreshTimeSlots);
  bookingTeacher.addEventListener('change', refreshTimeSlots);

  function refreshTimeSlots() {
    const date = bookingDate.value;
    const teacher = bookingTeacher.value;

    if (!date || !teacher) {
      timeSlotsContainer.style.display = 'none';
      submitBookingBtn.disabled = true;
      return;
    }

    selectedTimeSlot = null;
    timeSlotsContainer.style.display = 'block';
    
    const allSlotCards = timeSlotsContainer.querySelectorAll('.time-slot-card');
    const bookings = getBookings();

    allSlotCards.forEach(card => {
      card.classList.remove('selected', 'disabled');
      const slotTime = card.dataset.time;

      // 檢查此時段是否已被該老師佔用 (狀態不為已取消)
      const isTaken = bookings.some(b => 
        b.teacher === teacher && 
        b.date === date && 
        b.time === slotTime && 
        b.status !== 'cancelled'
      );

      if (isTaken) {
        card.classList.add('disabled');
      }
    });

    submitBookingBtn.disabled = true;
  }

  // 點選時段卡片
  const timeSlotCards = document.querySelectorAll('.time-slot-card');
  timeSlotCards.forEach(card => {
    card.addEventListener('click', () => {
      if (card.classList.contains('disabled')) return;

      timeSlotCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedTimeSlot = card.dataset.time;
      
      // 開啟確認送出按鈕
      submitBookingBtn.disabled = false;
    });
  });

  // 送出預約
  bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const course = document.querySelector('input[name="bookingCourse"]:checked').value;
    const teacher = bookingTeacher.value;
    const date = bookingDate.value;
    const notes = bookingNotes.value.trim();

    if (!date || !selectedTimeSlot) {
      showToast('請務必選擇日期與上課時段', 'error');
      return;
    }

    const bookings = getBookings();
    
    // 再防禦性確認一次是否衝突
    const hasConflict = bookings.some(b => 
      b.teacher === teacher && 
      b.date === date && 
      b.time === selectedTimeSlot && 
      b.status !== 'cancelled'
    );

    if (hasConflict) {
      showToast('抱歉，此時段剛被其他學員預約，請選擇其他時段。', 'error');
      refreshTimeSlots();
      return;
    }

    const newBooking = {
      id: 'b_' + Date.now(),
      userEmail: currentUser.email,
      userName: currentUser.name,
      course,
      teacher,
      date,
      time: selectedTimeSlot,
      notes,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    bookings.push(newBooking);
    saveBookings(bookings);

    showToast('預約申請送出成功！請靜待老師確認。', 'success');
    
    // 重設預約表單並切換至「我的預約」
    resetBookingForm();
    switchTab('myBookingsPanel');
  });

  // 重置預約表單
  function resetBookingForm() {
    bookingForm.reset();
    selectedTimeSlot = null;
    timeSlotsContainer.style.display = 'none';
    submitBookingBtn.disabled = true;

    // 還原課程預設選項樣式
    courseCards.forEach((c, idx) => {
      c.classList.toggle('selected', idx === 0);
    });
    const firstRadio = document.querySelector('input[name="bookingCourse"]');
    if (firstRadio) firstRadio.checked = true;
  }

  /* ==========================================
     5. 學員預約清單渲染與取消
     ========================================== */
  function renderMyBookings() {
    if (!currentUser) return;
    const bookings = getBookings().filter(b => b.userEmail === currentUser.email);
    
    // 依日期排序，由近到遠
    bookings.sort((a, b) => new Date(a.date + 'T' + a.time.split(' ')[0]) - new Date(b.date + 'T' + b.time.split(' ')[0]));

    if (bookings.length === 0) {
      myBookingsList.innerHTML = `
        <div class="empty-state">
          <span class="empty-state-icon">📅</span>
          <p>目前尚無任何預約紀錄。趕快前往「線上預約」預訂一堂體驗課吧！</p>
        </div>
      `;
      return;
    }

    myBookingsList.innerHTML = bookings.map(b => {
      let statusClass = 'pending';
      let statusText = '待老師確認';
      if (b.status === 'confirmed') {
        statusClass = 'confirmed';
        statusText = '已確認預約';
      } else if (b.status === 'cancelled') {
        statusClass = 'cancelled';
        statusText = '已取消';
      }

      const showCancelBtn = b.status !== 'cancelled';

      return `
        <div class="booking-item-card ${statusClass}">
          <div class="booking-item-details">
            <h3 class="booking-item-title">${b.course}</h3>
            <div class="booking-item-meta">
              <span>📅 ${b.date}</span>
              <span>⏰ ${b.time}</span>
              <span>👤 授課：${b.teacher}</span>
            </div>
            ${b.notes ? `<div style="font-size:0.85rem; color:#888; margin-top:8px; border-left: 2px solid #ddd; padding-left: 8px;">備註：${escapeHTML(b.notes)}</div>` : ''}
          </div>
          <div class="booking-item-status-actions">
            <span class="status-badge ${statusClass}">${statusText}</span>
            ${showCancelBtn ? `<button class="btn-cancel" data-id="${b.id}">取消預約</button>` : ''}
          </div>
        </div>
      `;
    }).join('');

    // 監聽取消預約按鈕
    myBookingsList.querySelectorAll('.btn-cancel').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        if (confirm('確定要取消這一堂預約嗎？')) {
          cancelBooking(id);
        }
      });
    });
  }

  function cancelBooking(id) {
    const bookings = getBookings();
    const idx = bookings.findIndex(b => b.id === id);
    if (idx !== -1) {
      bookings[idx].status = 'cancelled';
      saveBookings(bookings);
      showToast('已取消該筆預約項目', 'info');
      renderMyBookings();
    }
  }

  /* ==========================================
     6. 教師管理端 (Admin Table) 邏輯
     ========================================== */
  filterTeacher.addEventListener('change', renderAdminBookings);
  filterStatus.addEventListener('change', renderAdminBookings);

  function renderAdminBookings() {
    if (!currentUser || !currentUser.isAdmin) return;

    let bookings = getBookings();
    
    // 排序：待確認最優先，接著按日期從近到遠
    bookings.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return new Date(a.date + 'T' + a.time.split(' ')[0]) - new Date(b.date + 'T' + b.time.split(' ')[0]);
    });

    // 過濾條件
    const tFilter = filterTeacher.value;
    const sFilter = filterStatus.value;

    if (tFilter !== 'all') {
      bookings = bookings.filter(b => b.teacher === tFilter);
    }
    if (sFilter !== 'all') {
      bookings = bookings.filter(b => b.status === sFilter);
    }

    adminStatsText.textContent = `篩選出 ${bookings.length} 筆預約 / 全體資料共 ${getBookings().length} 筆`;

    if (bookings.length === 0) {
      adminBookingsTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: #888; padding: 30px;">
            無合乎篩選條件的預約紀錄。
          </td>
        </tr>
      `;
      return;
    }

    adminBookingsTableBody.innerHTML = bookings.map(b => {
      let statusText = '待確認';
      let statusClass = 'pending';
      if (b.status === 'confirmed') {
        statusText = '已確認';
        statusClass = 'confirmed';
      } else if (b.status === 'cancelled') {
        statusText = '已取消';
        statusClass = 'cancelled';
      }

      const showActions = b.status === 'pending';

      return `
        <tr>
          <td style="font-weight: 500;">${b.date}</td>
          <td>${b.time}</td>
          <td>${escapeHTML(b.userName)}<br/><span style="font-size:0.75rem; color:#888;">${b.userEmail}</span></td>
          <td>${b.course}</td>
          <td>${b.teacher}</td>
          <td><span class="status-badge ${statusClass}">${statusText}</span></td>
          <td>
            <div class="admin-actions">
              ${showActions ? `
                <button class="btn-approve" data-id="${b.id}">核准</button>
                <button class="btn-reject" data-id="${b.id}">取消</button>
              ` : `
                ${b.status !== 'cancelled' ? `<button class="btn-reject" data-id="${b.id}">取消</button>` : '<span style="color:#aaa;">無操作</span>'}
              `}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // 監聽管理員核准/取消操作
    adminBookingsTableBody.querySelectorAll('.btn-approve').forEach(btn => {
      btn.addEventListener('click', (e) => {
        changeBookingStatus(e.target.dataset.id, 'confirmed');
      });
    });

    adminBookingsTableBody.querySelectorAll('.btn-reject').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (confirm('確定要取消此學員的預約時段嗎？')) {
          changeBookingStatus(e.target.dataset.id, 'cancelled');
        }
      });
    });
  }

  function changeBookingStatus(id, newStatus) {
    const bookings = getBookings();
    const idx = bookings.findIndex(b => b.id === id);
    if (idx !== -1) {
      bookings[idx].status = newStatus;
      saveBookings(bookings);
      
      const statusWord = newStatus === 'confirmed' ? '已核准確認' : '已取消';
      showToast(`預約項目 ${statusWord}`, newStatus === 'confirmed' ? 'success' : 'info');
      
      renderAdminBookings();
    }
  }

  /* ==========================================
     7. Toast 通知輔助函式
     ========================================== */
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    // 強制重繪觸發動畫
    toast.offsetHeight;
    toast.classList.add('show');

    // 3秒後移除
    setTimeout(() => {
      toast.classList.remove('show');
      toast.addEventListener('transitionend', () => {
        toast.remove();
      });
    }, 3000);
  }

  // 安全防護轉義 HTML 避免 XSS
  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
