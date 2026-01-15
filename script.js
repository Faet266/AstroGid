// ===== СИСТЕМА УПРАВЛЕНИЯ ПОЛЬЗОВАТЕЛЯМИ И КОНТЕНТОМ =====

// Глобальное состояние приложения
const AppState = {
  currentUser: null,
  isGuest: false,
  users: [],
  posts: [],
  news: [],
  articles: []
};

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', function() {
  loadDataFromStorage();
  initializeEventListeners();
  initializeFAQ();
  initializeContactForm();
  updateNavigation();
  
  // Если пользователь уже вошел, показываем его интерфейс
  if (AppState.currentUser) {
    showProfile();
  }
  
  // Добавляем скрытые функции для разработки
  const logo = document.querySelector('.AstroGid');
  if (logo) {
    let clickCount = 0;
    logo.addEventListener('click', function() {
      clickCount++;
      setTimeout(() => { clickCount = 0; }, 1000);
      
      if (clickCount === 3) {
        showContactMessagesAdmin();
        clickCount = 0;
      } else if (clickCount === 5) {
        showAccountsList();
        clickCount = 0;
      }
    });
  }
});

// ===== КАСТОМНЫЕ МОДАЛЬНЫЕ ОКНА =====
function showCustomAlert(message, type = 'info') {
  const modal = document.createElement('div');
  modal.className = 'custom-alert-modal';
  
  let icon = '';
  let iconClass = '';
  
  switch(type) {
    case 'success':
      icon = '✓';
      iconClass = 'success-icon';
      break;
    case 'error':
      icon = '✕';
      iconClass = 'error-icon';
      break;
    case 'warning':
      icon = '⚠';
      iconClass = 'warning-icon';
      break;
    default:
      icon = 'ℹ';
      iconClass = 'info-icon';
  }
  
  modal.innerHTML = `
    <div class="custom-alert-content">
      <div class="alert-icon ${iconClass}">${icon}</div>
      <p class="alert-message">${message}</p>
      <button class="alert-btn" onclick="this.closest('.custom-alert-modal').remove(); document.body.style.overflow='auto';">Понятно</button>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  
  // Анимация появления
  setTimeout(() => modal.classList.add('show'), 10);
  
  return modal;
}

function showCustomConfirm(message, onConfirm, onCancel) {
  const modal = document.createElement('div');
  modal.className = 'custom-confirm-modal';
  
  modal.innerHTML = `
    <div class="custom-confirm-content">
      <div class="confirm-icon">?</div>
      <p class="confirm-message">${message}</p>
      <div class="confirm-buttons">
        <button class="confirm-btn confirm-yes">Да</button>
        <button class="confirm-btn confirm-no">Отмена</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  
  // Анимация появления
  setTimeout(() => modal.classList.add('show'), 10);
  
  const yesBtn = modal.querySelector('.confirm-yes');
  const noBtn = modal.querySelector('.confirm-no');
  
  yesBtn.onclick = () => {
    modal.remove();
    document.body.style.overflow = 'auto';
    if (onConfirm) onConfirm();
  };
  
  noBtn.onclick = () => {
    modal.remove();
    document.body.style.overflow = 'auto';
    if (onCancel) onCancel();
  };
  
  return modal;
}

// ===== ЗАГРУЗКА ДАННЫХ ИЗ LOCALSTORAGE =====
function loadDataFromStorage() {
  const savedUsers = localStorage.getItem('astrogid_users');
  const savedPosts = localStorage.getItem('astrogid_posts');
  const savedNews = localStorage.getItem('astrogid_news');
  const savedArticles = localStorage.getItem('astrogid_articles');
  const savedCurrentUser = localStorage.getItem('astrogid_current_user');
  
  if (savedUsers) AppState.users = JSON.parse(savedUsers);
  if (savedPosts) AppState.posts = JSON.parse(savedPosts);
  if (savedNews) AppState.news = JSON.parse(savedNews);
  if (savedArticles) AppState.articles = JSON.parse(savedArticles);
  
  if (savedCurrentUser) {
    const currentUser = JSON.parse(savedCurrentUser);
    AppState.isGuest = currentUser.isGuest || false;
    
    // Если это не гость, загружаем актуальные данные из массива пользователей
    if (!AppState.isGuest && currentUser.id !== 'guest') {
      const actualUser = AppState.users.find(u => u.id === currentUser.id);
      if (actualUser) {
        AppState.currentUser = actualUser;
      } else {
        // Если пользователь не найден, используем сохраненные данные
        AppState.currentUser = currentUser;
      }
    } else {
      // Для гостя используем сохраненные данные
      AppState.currentUser = currentUser;
    }
  }
  
  // Добавляем тестовые данные если их нет
  if (AppState.news.length === 0) {
    addTestNews();
  }
  if (AppState.articles.length === 0) {
    addTestArticles();
  }
}

// ===== СОХРАНЕНИЕ ДАННЫХ =====
function saveToStorage() {
  localStorage.setItem('astrogid_users', JSON.stringify(AppState.users));
  localStorage.setItem('astrogid_posts', JSON.stringify(AppState.posts));
  localStorage.setItem('astrogid_news', JSON.stringify(AppState.news));
  localStorage.setItem('astrogid_articles', JSON.stringify(AppState.articles));
  
  if (AppState.currentUser) {
    // Если это зарегистрированный пользователь, сохраняем актуальные данные из массива
    if (!AppState.isGuest && AppState.currentUser.id !== 'guest') {
      const actualUser = AppState.users.find(u => u.id === AppState.currentUser.id);
      if (actualUser) {
        localStorage.setItem('astrogid_current_user', JSON.stringify(actualUser));
      } else {
        localStorage.setItem('astrogid_current_user', JSON.stringify(AppState.currentUser));
      }
    } else {
      // Для гостя сохраняем как есть
      localStorage.setItem('astrogid_current_user', JSON.stringify(AppState.currentUser));
    }
  } else {
    localStorage.removeItem('astrogid_current_user');
  }
}

// ===== ОБНОВЛЕНИЕ НАВИГАЦИИ =====
function updateNavigation() {
  const nav = document.querySelector('nav ul');
  
  if (AppState.currentUser) {
    // Пользователь вошел (гость или зарегистрированный)
    nav.innerHTML = `
      <li><a href="#profile" onclick="showProfile()">Профиль</a></li>
      <li><a href="#feed" onclick="showFeed()">Лента</a></li>
      <li><a href="#news" onclick="showNews()">Новости</a></li>
      <li><a href="#articles" onclick="showArticles()">Статьи</a></li>
      <li><a href="#" onclick="logout()" class="guest-btn">Выйти</a></li>
    `;
  } else {
    // Режим ознакомления
    nav.innerHTML = `
      <li><a href="#hero">Главная</a></li>
      <li><a href="#about-site">О сайте</a></li>
      <li><a href="#faq">Вопросы</a></li>
      <li><a href="#contact">Контакты</a></li>
      <li><a href="#guest-mode" class="guest-btn" onclick="enterAsGuest()">Гость</a></li>
    `;
  }
}

// ===== ИНИЦИАЛИЗАЦИЯ СЛУШАТЕЛЕЙ =====
function initializeEventListeners() {
  // Плавная прокрутка
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#' || href === '#guest-mode' || href === '#profile' || 
          href === '#feed' || href === '#news' || href === '#articles') {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      const targetElement = document.querySelector(href);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// ===== FAQ АККОРДЕОН =====
function initializeFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      faqItems.forEach(otherItem => otherItem.classList.remove('active'));
      if (!isActive) item.classList.add('active');
    });
  });
}

// ===== ФОРМА КОНТАКТОВ =====
function initializeContactForm() {
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      handleContactFormSubmit(e);
    });
  }
}

// ===== ОБРАБОТКА ОТПРАВКИ ФОРМЫ ОБРАТНОЙ СВЯЗИ =====
function handleContactFormSubmit(e) {
  const form = e.target;
  const formData = new FormData(form);
  
  // Получаем данные из формы
  const contactData = {
    name: formData.get('name') || document.getElementById('name').value,
    email: formData.get('email') || document.getElementById('email').value,
    message: formData.get('message') || document.getElementById('message').value,
    terms: document.getElementById('terms').checked,
    timestamp: new Date().toISOString(),
    id: Date.now()
  };
  
  // Валидация
  if (!validateContactForm(contactData)) {
    return;
  }
  
  // Показываем индикатор загрузки
  const submitBtn = form.querySelector('.submit-btn');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Подготовка...';
  submitBtn.disabled = true;
  
  // Используем простой способ отправки через mailto
  setTimeout(() => {
    sendEmailDirect(contactData, form, submitBtn, originalText);
  }, 800);
}

// ===== ПРЯМАЯ ОТПРАВКА EMAIL =====
function sendEmailDirect(contactData, form, submitBtn, originalText) {
  // Создаем mailto ссылку
  const subject = encodeURIComponent(`Сообщение с сайта AstroGid от ${contactData.name}`);
  const body = encodeURIComponent(`
Здравствуйте!

Получено новое сообщение с сайта AstroGid Faet:

👤 Имя: ${contactData.name}
📧 Email: ${contactData.email}
🕐 Время: ${new Date().toLocaleString('ru-RU')}

💬 Сообщение:
${contactData.message}

---
Это сообщение отправлено через форму обратной связи на сайте AstroGid Faet.
Для ответа используйте email: ${contactData.email}
  `);
  
  const mailtoLink = `mailto:faet2782@gmail.com?subject=${subject}&body=${body}`;
  
  // Сохраняем сообщение локально
  saveContactMessage(contactData);
  
  // Восстанавливаем кнопку
  submitBtn.textContent = originalText;
  submitBtn.disabled = false;
  
  // Очищаем форму
  form.reset();
  
  // Показываем подтверждение с выбором
  showEmailConfirmation(contactData, mailtoLink);
}

// ===== ПОДТВЕРЖДЕНИЕ ОТПРАВКИ EMAIL =====
function showEmailConfirmation(contactData, mailtoLink) {
  const modal = document.createElement('div');
  modal.className = 'custom-confirm-modal';
  
  modal.innerHTML = `
    <div class="custom-confirm-content">
      <div class="confirm-icon">📧</div>
      <h3 style="color: #ffffff; margin-bottom: 20px;">Отправить сообщение?</h3>
      <p class="confirm-message">
        Ваше сообщение готово к отправке на <strong style="color: #4a8fe7;">faet2782@gmail.com</strong><br><br>
        <strong>От:</strong> ${contactData.name} (${contactData.email})<br>
        <strong>Сообщение:</strong> ${contactData.message.substring(0, 100)}${contactData.message.length > 100 ? '...' : ''}
      </p>
      <div class="confirm-buttons">
        <button class="confirm-btn confirm-yes" onclick="openEmailClient('${mailtoLink}', this)">Отправить Email</button>
        <button class="confirm-btn confirm-no" onclick="closeEmailModal(this)">Отмена</button>
      </div>
      <p style="font-size: 14px; color: #9b72cb; margin-top: 20px; text-align: center;">
        Откроется ваш почтовый клиент для отправки
      </p>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  
  // Анимация появления
  setTimeout(() => modal.classList.add('show'), 10);
}

// ===== ОТКРЫТИЕ ПОЧТОВОГО КЛИЕНТА =====
function openEmailClient(mailtoLink, button) {
  // Открываем почтовый клиент
  window.location.href = decodeURIComponent(mailtoLink);
  
  // Закрываем модальное окно
  const modal = button.closest('.custom-confirm-modal');
  if (modal) {
    modal.remove();
  }
  document.body.style.overflow = 'auto';
  
  // Показываем успешное сообщение
  setTimeout(() => {
    showCustomAlert(
      'Почтовый клиент открыт! Проверьте, что сообщение отправилось, и при необходимости нажмите "Отправить" в вашей почтовой программе.',
      'success'
    );
  }, 500);
}

// ===== ЗАКРЫТИЕ МОДАЛЬНОГО ОКНА EMAIL =====
function closeEmailModal(button) {
  const modal = button.closest('.custom-confirm-modal');
  if (modal) {
    modal.remove();
  }
  document.body.style.overflow = 'auto';
}

// ===== ВАЛИДАЦИЯ ФОРМЫ =====
function validateContactForm(data) {
  // Проверка имени
  if (!data.name || data.name.trim().length < 2) {
    showCustomAlert('Пожалуйста, введите ваше имя (минимум 2 символа)', 'warning');
    return false;
  }
  
  // Проверка email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email)) {
    showCustomAlert('Пожалуйста, введите корректный email адрес', 'warning');
    return false;
  }
  
  // Проверка сообщения
  if (!data.message || data.message.trim().length < 10) {
    showCustomAlert('Пожалуйста, введите сообщение (минимум 10 символов)', 'warning');
    return false;
  }
  
  // Проверка согласия с условиями
  if (!data.terms) {
    showCustomAlert('Необходимо принять условия обслуживания', 'warning');
    return false;
  }
  
  return true;
}

// ===== СОХРАНЕНИЕ СООБЩЕНИЯ =====
function saveContactMessage(messageData) {
  let messages = [];
  
  // Загружаем существующие сообщения
  const savedMessages = localStorage.getItem('astrogid_contact_messages');
  if (savedMessages) {
    messages = JSON.parse(savedMessages);
  }
  
  // Добавляем новое сообщение
  messages.unshift(messageData);
  
  // Ограничиваем количество сохраненных сообщений (последние 50)
  if (messages.length > 50) {
    messages = messages.slice(0, 50);
  }
  
  // Сохраняем обратно
  localStorage.setItem('astrogid_contact_messages', JSON.stringify(messages));
}

// ===== ПОЛУЧЕНИЕ СООБЩЕНИЙ (для админки) =====
function getContactMessages() {
  const savedMessages = localStorage.getItem('astrogid_contact_messages');
  return savedMessages ? JSON.parse(savedMessages) : [];
}

// ===== ПОКАЗАТЬ АДМИН ПАНЕЛЬ СООБЩЕНИЙ (для разработки) =====
function showContactMessagesAdmin() {
  const messages = getContactMessages();
  
  if (messages.length === 0) {
    showCustomAlert('Сообщений пока нет', 'info');
    return;
  }
  
  let adminContent = `
    <div style="max-height: 400px; overflow-y: auto; text-align: left;">
      <h3 style="color: #4a8fe7; margin-bottom: 20px;">Сообщения обратной связи (${messages.length})</h3>
  `;
  
  messages.forEach((msg, index) => {
    const date = new Date(msg.timestamp).toLocaleString('ru-RU');
    adminContent += `
      <div style="background: rgba(30,36,54,0.8); padding: 15px; margin-bottom: 15px; border-radius: 10px; border-left: 3px solid #4a8fe7;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <strong style="color: #ffffff;">${msg.name}</strong>
          <small style="color: #9b72cb;">${date}</small>
        </div>
        <div style="color: #4a8fe7; margin-bottom: 8px; font-size: 14px;">${msg.email}</div>
        <div style="color: #d1d5e8; line-height: 1.5;">${msg.message}</div>
      </div>
    `;
  });
  
  adminContent += `
      <div style="text-align: center; margin-top: 20px;">
        <button onclick="clearContactMessages()" style="background: #ff6b6b; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
          Очистить все сообщения
        </button>
      </div>
    </div>
  `;
  
  // Создаем модальное окно для админки
  const modal = document.createElement('div');
  modal.className = 'custom-alert-modal';
  modal.innerHTML = `
    <div class="custom-alert-content" style="max-width: 800px;">
      ${adminContent}
      <button class="alert-btn" onclick="this.closest('.custom-alert-modal').remove(); document.body.style.overflow='auto';">Закрыть</button>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  setTimeout(() => modal.classList.add('show'), 10);
}

// ===== ОЧИСТКА СООБЩЕНИЙ =====
function clearContactMessages() {
  if (confirm('Вы уверены, что хотите удалить все сообщения?')) {
    localStorage.removeItem('astrogid_contact_messages');
    showCustomAlert('Все сообщения удалены', 'success');
    // Закрываем админ панель
    const modal = document.querySelector('.custom-alert-modal');
    if (modal) modal.remove();
    document.body.style.overflow = 'auto';
  }
}

// ===== ПОКАЗАТЬ СПИСОК АККАУНТОВ (для разработки) =====
function showAccountsList() {
  const users = AppState.users.filter(u => !u.isGuest);
  
  if (users.length === 0) {
    showCustomAlert('Зарегистрированных аккаунтов пока нет', 'info');
    return;
  }
  
  let accountsContent = `
    <div style="max-height: 400px; overflow-y: auto; text-align: left;">
      <h3 style="color: #4a8fe7; margin-bottom: 20px;">Зарегистрированные аккаунты (${users.length})</h3>
  `;
  
  users.forEach((user, index) => {
    const date = new Date(user.registeredAt).toLocaleDateString('ru-RU');
    const postsCount = AppState.posts.filter(p => p.userId === user.id).length;
    
    accountsContent += `
      <div style="background: rgba(30,36,54,0.8); padding: 15px; margin-bottom: 15px; border-radius: 10px; border-left: 3px solid #4a8fe7;">
        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 10px;">
          <img src="${user.avatar}" alt="${user.name}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
          <div>
            <strong style="color: #ffffff; display: block;">${user.name}</strong>
            <small style="color: #4a8fe7;">${user.email}</small>
          </div>
        </div>
        <div style="color: #d1d5e8; font-size: 14px;">
          📅 Регистрация: ${date}<br>
          📝 Публикаций: ${postsCount}<br>
          💬 Описание: ${user.bio || 'Не указано'}
        </div>
        <button onclick="quickLogin('${user.email}')" style="background: #4a8fe7; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; margin-top: 10px; font-size: 12px;">
          Быстрый вход
        </button>
      </div>
    `;
  });
  
  accountsContent += `
      <div style="text-align: center; margin-top: 20px;">
        <button onclick="clearAllAccounts()" style="background: #ff6b6b; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
          Удалить все аккаунты
        </button>
      </div>
    </div>
  `;
  
  // Создаем модальное окно для списка аккаунтов
  const modal = document.createElement('div');
  modal.className = 'custom-alert-modal';
  modal.innerHTML = `
    <div class="custom-alert-content" style="max-width: 600px;">
      ${accountsContent}
      <button class="alert-btn" onclick="this.closest('.custom-alert-modal').remove(); document.body.style.overflow='auto';">Закрыть</button>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  setTimeout(() => modal.classList.add('show'), 10);
}

// ===== БЫСТРЫЙ ВХОД =====
function quickLogin(email) {
  const user = AppState.users.find(u => u.email === email);
  if (user) {
    AppState.currentUser = user;
    AppState.isGuest = false;
    
    saveToStorage();
    updateNavigation();
    showProfile();
    
    // Закрываем модальное окно
    const modal = document.querySelector('.custom-alert-modal');
    if (modal) modal.remove();
    document.body.style.overflow = 'auto';
    
    showCustomAlert(`Вход выполнен как ${user.name}`, 'success');
  }
}

// ===== ОЧИСТКА ВСЕХ АККАУНТОВ =====
function clearAllAccounts() {
  if (confirm('Вы уверены, что хотите удалить ВСЕ аккаунты и данные? Это действие нельзя отменить!')) {
    // Очищаем все данные
    AppState.users = [];
    AppState.posts = [];
    AppState.news = [];
    AppState.articles = [];
    AppState.currentUser = null;
    AppState.isGuest = false;
    
    // Очищаем localStorage
    localStorage.removeItem('astrogid_users');
    localStorage.removeItem('astrogid_posts');
    localStorage.removeItem('astrogid_news');
    localStorage.removeItem('astrogid_articles');
    localStorage.removeItem('astrogid_current_user');
    
    // Добавляем тестовые данные обратно
    addTestNews();
    addTestArticles();
    saveToStorage();
    
    updateNavigation();
    returnToMain();
    
    showCustomAlert('Все аккаунты и данные удалены', 'success');
    
    // Закрываем модальное окно
    const modal = document.querySelector('.custom-alert-modal');
    if (modal) modal.remove();
    document.body.style.overflow = 'auto';
  }
}

// ===== МОДАЛЬНОЕ ОКНО РЕГИСТРАЦИИ =====
function showRegistration() {
  document.getElementById('registration-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
  
  // Инициализируем форму регистрации
  const registerForm = document.getElementById('register-form');
  registerForm.onsubmit = handleRegistration;
  
  // Инициализируем форму входа
  const loginForm = document.getElementById('login-form');
  loginForm.onsubmit = handleLogin;
  
  // Устанавливаем активную вкладку
  switchAuthTab('register');
}

// ===== ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК =====
function switchAuthTab(tabType) {
  // Убираем активный класс со всех вкладок
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Скрываем все опции
  document.querySelectorAll('.option-card').forEach(card => {
    card.style.display = 'none';
  });
  
  // Показываем нужную вкладку и опцию
  if (tabType === 'register') {
    document.querySelector('.auth-tab:nth-child(1)').classList.add('active');
    document.querySelector('.register-option').style.display = 'flex';
    document.querySelector('.guest-option').style.display = 'flex';
  } else if (tabType === 'login') {
    document.querySelector('.auth-tab:nth-child(2)').classList.add('active');
    document.querySelector('.login-option').style.display = 'flex';
    document.querySelector('.guest-option').style.display = 'flex';
  } else if (tabType === 'guest') {
    document.querySelector('.auth-tab:nth-child(3)').classList.add('active');
    document.querySelector('.guest-option').style.display = 'flex';
  }
}

// ===== ВХОД В АККАУНТ =====
function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;
  
  // Проверяем, что поля заполнены
  if (!email || !password) {
    showCustomAlert('Пожалуйста, заполните все поля', 'warning');
    return;
  }
  
  // Ищем пользователя в базе
  const user = AppState.users.find(u => u.email === email && u.password === password);
  
  if (user) {
    // Успешный вход
    AppState.currentUser = user;
    AppState.isGuest = false;
    
    saveToStorage();
    closeRegistration();
    updateNavigation();
    showProfile();
    
    showCustomAlert(`Добро пожаловать обратно, ${user.name}!`, 'success');
  } else {
    // Проверяем, существует ли пользователь с таким email
    const emailExists = AppState.users.some(u => u.email === email);
    
    if (emailExists) {
      showCustomAlert('Неверный пароль. Попробуйте еще раз.', 'error');
    } else {
      showCustomAlert('Аккаунт с таким email не найден. Проверьте email или зарегистрируйтесь.', 'warning');
    }
  }
}

function closeRegistration() {
  document.getElementById('registration-modal').style.display = 'none';
  document.body.style.overflow = 'auto';
}

// ===== РЕГИСТРАЦИЯ =====
function handleRegistration(e) {
  e.preventDefault();
  
  const name = e.target.querySelector('input[type="text"]').value.trim();
  const email = e.target.querySelector('input[type="email"]').value.trim().toLowerCase();
  const password = e.target.querySelector('input[type="password"]').value;
  
  // Проверка уникальности email
  const emailExists = AppState.users.some(user => user.email === email);
  if (emailExists) {
    showCustomAlert('Этот email уже зарегистрирован! Пожалуйста, используйте другой.', 'error');
    return;
  }
  
  // Создаем нового пользователя
  const newUser = {
    id: Date.now(),
    name: name,
    email: email,
    password: password,
    avatar: 'images/гость.png',
    bio: '',
    isGuest: false,
    registeredAt: new Date().toISOString()
  };
  
  AppState.users.push(newUser);
  AppState.currentUser = newUser;
  AppState.isGuest = false;
  
  saveToStorage();
  closeRegistration();
  updateNavigation();
  showProfile();
  
  showCustomAlert('Регистрация успешна! Добро пожаловать, ' + name + '!', 'success');
}

// ===== ВХОД КАК ГОСТЬ =====
function enterAsGuest() {
  AppState.currentUser = {
    id: 'guest',
    name: 'Гость',
    isGuest: true,
    avatar: 'images/гость.png'
  };
  AppState.isGuest = true;
  
  saveToStorage();
  closeRegistration();
  updateNavigation();
  showFeed();
}

// ===== ВЫХОД =====
function logout() {
  showCustomConfirm('Вы уверены, что хотите выйти?', () => {
    AppState.currentUser = null;
    AppState.isGuest = false;
    saveToStorage();
    updateNavigation();
    returnToMain();
  });
}

// ===== ВОЗВРАТ НА ГЛАВНУЮ =====
function returnToMain() {
  hideAllSections();
  
  // Восстанавливаем скролл если он был заблокирован
  document.body.style.overflow = 'auto';
  
  document.querySelectorAll('main, section:not(.user-section), footer').forEach(el => {
    el.style.display = 'block';
  });
  document.getElementById('hero').scrollIntoView({ behavior: 'smooth' });
}

// ===== СКРЫТЬ ВСЕ СЕКЦИИ =====
function hideAllSections() {
  document.querySelectorAll('main, section, footer').forEach(el => {
    el.style.display = 'none';
  });
}

// ===== ПОКАЗАТЬ ПРОФИЛЬ =====
function showProfile() {
  hideAllSections();
  
  // Восстанавливаем скролл если он был заблокирован
  document.body.style.overflow = 'auto';
  
  let userSection = document.querySelector('.user-section');
  if (!userSection) {
    userSection = document.createElement('section');
    userSection.className = 'user-section';
    document.querySelector('footer').before(userSection);
  }
  
  if (AppState.isGuest) {
    // Профиль гостя (только просмотр)
    userSection.innerHTML = `
      <div class="profile-container">
        <div class="profile-header">
          <div class="profile-avatar">
            <img src="${AppState.currentUser.avatar}" alt="Гость">
          </div>
          <div class="profile-info-text">
            <h1>Гость</h1>
            <p>Режим ограниченного доступа</p>
            <p class="guest-notice">Зарегистрируйтесь, чтобы получить возможность публиковать контент и редактировать профиль</p>
            <button class="btn" onclick="logout(); showRegistration();">Зарегистрироваться</button>
          </div>
        </div>
      </div>
    `;
  } else {
    // Профиль зарегистрированного пользователя
    const userPosts = AppState.posts.filter(p => p.userId === AppState.currentUser.id);
    
    userSection.innerHTML = `
      <div class="profile-container">
        <div class="profile-header">
          <div class="profile-avatar">
            <img src="${AppState.currentUser.avatar}" alt="${AppState.currentUser.name}" id="profile-avatar-img">
            <button class="change-avatar-btn" onclick="changeAvatar()">Изменить фото</button>
            <input type="file" id="avatar-upload" accept="image/*" style="display:none" onchange="handleAvatarUpload(event)">
          </div>
          <div class="profile-info-text">
            <h1>${AppState.currentUser.name}</h1>
            <p>${AppState.currentUser.email}</p>
            <div class="profile-bio">
              <h3>О себе:</h3>
              <textarea id="bio-textarea" placeholder="Расскажите о себе...">${AppState.currentUser.bio || ''}</textarea>
              <button class="btn" onclick="saveBio()">Сохранить описание</button>
            </div>
          </div>
        </div>
        
        <div class="profile-actions">
          <button class="btn" onclick="showPublishModal()">Опубликовать</button>
        </div>
        
        <div class="profile-posts">
          <h2>Мои публикации (${userPosts.length})</h2>
          <div class="posts-grid">
            ${userPosts.length > 0 ? userPosts.map(post => `
              <div class="post-card">
                <img src="${post.image}" alt="${post.title}">
                <div class="post-content">
                  <span class="post-category">${post.category}</span>
                  <h3>${post.title}</h3>
                  <p>${post.description}</p>
                  <small>${new Date(post.createdAt).toLocaleDateString('ru-RU')}</small>
                  <button class="delete-btn" onclick="deletePost(${post.id})">Удалить</button>
                </div>
              </div>
            `).join('') : '<p class="no-posts">У вас пока нет публикаций</p>'}
          </div>
        </div>
      </div>
    `;
  }
  
  userSection.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== ИЗМЕНЕНИЕ АВАТАРА =====
function changeAvatar() {
  document.getElementById('avatar-upload').click();
}

function handleAvatarUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const newAvatar = e.target.result;
      
      // Обновляем аватар в текущем пользователе
      AppState.currentUser.avatar = newAvatar;
      
      // Обновляем в массиве пользователей
      const userIndex = AppState.users.findIndex(u => u.id === AppState.currentUser.id);
      if (userIndex !== -1) {
        AppState.users[userIndex].avatar = newAvatar;
      }
      
      // Обновляем аватар во всех постах пользователя
      AppState.posts.forEach(post => {
        if (post.userId === AppState.currentUser.id) {
          post.userAvatar = newAvatar;
        }
      });
      
      AppState.news.forEach(news => {
        if (news.userId === AppState.currentUser.id) {
          news.userAvatar = newAvatar;
        }
      });
      
      AppState.articles.forEach(article => {
        if (article.userId === AppState.currentUser.id) {
          article.userAvatar = newAvatar;
        }
      });
      
      // Сохраняем все изменения
      saveToStorage();
      
      // Обновляем изображение на странице
      const avatarImg = document.getElementById('profile-avatar-img');
      if (avatarImg) {
        avatarImg.src = newAvatar;
      }
      
      showCustomAlert('Фото профиля обновлено!', 'success');
    };
    reader.readAsDataURL(file);
  }
}

// ===== СОХРАНЕНИЕ ОПИСАНИЯ =====
function saveBio() {
  const bioText = document.getElementById('bio-textarea').value;
  
  // Обновляем в текущем пользователе
  AppState.currentUser.bio = bioText;
  
  // Обновляем в массиве пользователей
  const userIndex = AppState.users.findIndex(u => u.id === AppState.currentUser.id);
  if (userIndex !== -1) {
    AppState.users[userIndex].bio = bioText;
  }
  
  saveToStorage();
  showCustomAlert('Описание сохранено!', 'success');
}

// ===== МОДАЛЬНОЕ ОКНО ПУБЛИКАЦИИ =====
function showPublishModal() {
  // Удаляем старое модальное окно если оно есть
  const existingModal = document.querySelector('.publish-modal');
  if (existingModal) {
    existingModal.remove();
  }
  
  const modal = document.createElement('div');
  modal.className = 'publish-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close-modal" onclick="closePublishModal()">&times;</span>
      <h2>Новая публикация</h2>
      <form id="publish-form" onsubmit="handlePublish(event)">
        <div class="form-group">
          <label>Категория:</label>
          <select id="post-category" required>
            <option value="">Выберите категорию</option>
            <option value="Астрофото">Астрофото</option>
            <option value="Новость">Новость</option>
            <option value="Пост">Пост</option>
            <option value="Статья">Статья</option>
            <option value="Обсуждение">Обсуждение</option>
          </select>
        </div>
        <div class="form-group">
          <label>Название:</label>
          <input type="text" id="post-title" required placeholder="Введите название">
        </div>
        <div class="form-group">
          <label>Описание:</label>
          <textarea id="post-description" required placeholder="Опишите вашу публикацию" rows="4"></textarea>
        </div>
        <div class="form-group">
          <label>Изображение:</label>
          <input type="file" id="post-image" accept="image/*" required>
        </div>
        <button type="submit" class="btn">Опубликовать</button>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  
  // Закрытие при клике вне модального окна
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closePublishModal();
    }
  });
}

// ===== ЗАКРЫТИЕ МОДАЛЬНОГО ОКНА ПУБЛИКАЦИИ =====
function closePublishModal() {
  const modal = document.querySelector('.publish-modal');
  if (modal) {
    modal.remove();
  }
  document.body.style.overflow = 'auto';
}

// ===== ПУБЛИКАЦИЯ ПОСТА =====
function handlePublish(e) {
  e.preventDefault();
  
  const category = document.getElementById('post-category').value;
  const title = document.getElementById('post-title').value;
  const description = document.getElementById('post-description').value;
  const imageFile = document.getElementById('post-image').files[0];
  
  if (!imageFile) {
    showCustomAlert('Пожалуйста, выберите изображение', 'warning');
    return;
  }
  
  // Показываем индикатор загрузки
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Публикация...';
  submitBtn.disabled = true;
  
  const reader = new FileReader();
  reader.onload = function(event) {
    const newPost = {
      id: Date.now(),
      userId: AppState.currentUser.id,
      userName: AppState.currentUser.name,
      userAvatar: AppState.currentUser.avatar,
      category: category,
      title: title,
      description: description,
      image: event.target.result,
      createdAt: new Date().toISOString(),
      likes: 0
    };
    
    AppState.posts.unshift(newPost);
    
    // Если это новость или статья, добавляем в соответствующий раздел
    if (category === 'Новость') {
      AppState.news.unshift(newPost);
    } else if (category === 'Статья') {
      AppState.articles.unshift(newPost);
    }
    
    saveToStorage();
    
    // Закрываем модальное окно и восстанавливаем скролл
    closePublishModal();
    
    // Показываем уведомление
    showCustomAlert('Публикация успешно добавлена!', 'success');
    
    // Обновляем профиль
    showProfile();
  };
  
  reader.onerror = function() {
    showCustomAlert('Ошибка при загрузке изображения. Попробуйте снова.', 'error');
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  };
  
  reader.readAsDataURL(imageFile);
}

// ===== УДАЛЕНИЕ ПОСТА =====
function deletePost(postId) {
  showCustomConfirm('Вы уверены, что хотите удалить эту публикацию?', () => {
    AppState.posts = AppState.posts.filter(p => p.id !== postId);
    AppState.news = AppState.news.filter(p => p.id !== postId);
    AppState.articles = AppState.articles.filter(p => p.id !== postId);
    saveToStorage();
    showProfile();
    showCustomAlert('Публикация удалена', 'success');
  });
}

// ===== ПОКАЗАТЬ ЛЕНТУ =====
function showFeed() {
  hideAllSections();
  
  // Восстанавливаем скролл если он был заблокирован
  document.body.style.overflow = 'auto';
  
  let userSection = document.querySelector('.user-section');
  if (!userSection) {
    userSection = document.createElement('section');
    userSection.className = 'user-section';
    document.querySelector('footer').before(userSection);
  }
  
  const feedPosts = AppState.posts.filter(p => 
    p.category === 'Астрофото' || p.category === 'Пост' || p.category === 'Обсуждение'
  );
  
  userSection.innerHTML = `
    <div class="feed-container">
      <h1>Лента</h1>
      <p class="section-description">Фотографии и посты от сообщества</p>
      ${!AppState.isGuest ? '<button class="btn" onclick="showPublishModal()">Добавить публикацию</button>' : ''}
      
      <div class="feed-grid">
        ${feedPosts.length > 0 ? feedPosts.map(post => `
          <div class="feed-card">
            <div class="feed-card-header">
              <img src="${post.userAvatar}" alt="${post.userName}" class="user-avatar-small">
              <div>
                <strong>${post.userName}</strong>
                <small>${new Date(post.createdAt).toLocaleDateString('ru-RU')}</small>
              </div>
            </div>
            <img src="${post.image}" alt="${post.title}" class="feed-image">
            <div class="feed-card-content">
              <span class="post-category">${post.category}</span>
              <h3>${post.title}</h3>
              <p>${post.description}</p>
            </div>
          </div>
        `).join('') : '<p class="no-content">Пока нет публикаций в ленте</p>'}
      </div>
    </div>
  `;
  
  userSection.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

//новости
function showNews() {
  hideAllSections();
  
  //восстанавливаем скролл если он был заблокирован
  document.body.style.overflow = 'auto';
  
  let userSection = document.querySelector('.user-section');
  if (!userSection) {
    userSection = document.createElement('section');
    userSection.className = 'user-section';
    document.querySelector('footer').before(userSection);
  }
  
  userSection.innerHTML = `
    <div class="news-container">
      <h1>Новости астрономии</h1>
      <p class="section-description">Последние события из мира космоса и астрономии</p>
      ${!AppState.isGuest ? '<button class="btn" onclick="showPublishModal()">Добавить новость</button>' : ''}
      
      <div class="news-list">
        ${AppState.news.length > 0 ? AppState.news.map(news => `
          <div class="news-item">
            <div class="news-header">
              <img src="${news.userAvatar}" alt="${news.userName}" class="user-avatar-small">
              <div>
                <strong>${news.userName}</strong>
                <small>${new Date(news.createdAt).toLocaleDateString('ru-RU')}</small>
              </div>
            </div>
            <div class="news-content">
              <img src="${news.image}" alt="${news.title}" class="news-image">
              <div class="news-text">
                <h3>${news.title}</h3>
                <p>${news.description}</p>
              </div>
            </div>
          </div>
        `).join('') : '<p class="no-content">Пока нет новостей</p>'}
      </div>
    </div>
  `;
  
  userSection.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== ПОКАЗАТЬ СТАТЬИ =====
function showArticles() {
  hideAllSections();
  
  // Восстанавливаем скролл если он был заблокирован
  document.body.style.overflow = 'auto';
  
  let userSection = document.querySelector('.user-section');
  if (!userSection) {
    userSection = document.createElement('section');
    userSection.className = 'user-section';
    document.querySelector('footer').before(userSection);
  }
  
  userSection.innerHTML = `
    <div class="articles-container">
      <h1>Статьи</h1>
      <p class="section-description">Образовательные материалы и исследования</p>
      ${!AppState.isGuest ? '<button class="btn" onclick="showPublishModal()">Добавить статью</button>' : ''}
      
      <div class="articles-grid">
        ${AppState.articles.length > 0 ? AppState.articles.map(article => `
          <div class="article-card">
            <img src="${article.image}" alt="${article.title}">
            <div class="article-content">
              <h3>${article.title}</h3>
              <p>${article.description}</p>
              <div class="article-footer">
                <img src="${article.userAvatar}" alt="${article.userName}" class="user-avatar-small">
                <span>${article.userName}</span>
                <small>${new Date(article.createdAt).toLocaleDateString('ru-RU')}</small>
              </div>
            </div>
          </div>
        `).join('') : '<p class="no-content">Пока нет статей</p>'}
      </div>
    </div>
  `;
  
  userSection.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== ТЕСТОВЫЕ ДАННЫЕ =====
function addTestNews() {
  AppState.news = [
    {
      id: 1,
      userId: 'system',
      userName: 'AstroGid',
      userAvatar: 'images/гость.png',
      category: 'Новость',
      title: 'Телескоп Джеймса Уэбба обнаружил новые галактики',
      description: 'Космический телескоп Джеймса Уэбба продолжает удивлять астрономов, обнаружив несколько ранее неизвестных галактик на краю наблюдаемой Вселенной.',
      image: 'images/м101.png',
      createdAt: new Date(2026, 0, 10).toISOString(),
      likes: 0
    },
    {
      id: 2,
      userId: 'system',
      userName: 'AstroGid',
      userAvatar: 'images/гость.png',
      category: 'Новость',
      title: 'Открыта новая экзопланета в обитаемой зоне',
      description: 'Астрономы обнаружили экзопланету размером с Землю, находящуюся в обитаемой зоне своей звезды, что делает её потенциально пригодной для жизни.',
      image: 'images/82151757866745.jpg',
      createdAt: new Date(2026, 0, 8).toISOString(),
      likes: 0
    }
  ];
  saveToStorage();
}

function addTestArticles() {
  AppState.articles = [
    {
      id: 101,
      userId: 'system',
      userName: 'AstroGid',
      userAvatar: 'images/гость.png',
      category: 'Статья',
      title: 'Как начать заниматься астрофотографией',
      description: 'Подробное руководство для начинающих: выбор оборудования, настройка камеры, обработка снимков и советы по съёмке различных объектов ночного неба.',
      image: 'images/ngc2024.jpg',
      createdAt: new Date(2026, 0, 5).toISOString(),
      likes: 0
    },
    {
      id: 102,
      userId: 'system',
      userName: 'AstroGid',
      userAvatar: 'images/гость.png',
      category: 'Статья',
      title: 'Туманности: типы и особенности',
      description: 'Изучаем различные типы туманностей - эмиссионные, отражательные, тёмные и планетарные. Узнайте, как они формируются и почему так важны для понимания эволюции звёзд.',
      image: 'images/ЛАГУНА.jpg',
      createdAt: new Date(2026, 0, 3).toISOString(),
      likes: 0
    },
    {
      id: 103,
      userId: 'system',
      userName: 'AstroGid',
      userAvatar: 'images/гость.png',
      category: 'Статья',
      title: 'Выбор первого телескопа',
      description: 'Какой телескоп выбрать новичку? Рассматриваем рефракторы, рефлекторы и катадиоптрики, их преимущества и недостатки для различных задач наблюдения.',
      image: 'images/М51.png',
      createdAt: new Date(2026, 0, 1).toISOString(),
      likes: 0
    },
    {
      id: 104,
      userId: 'system',
      userName: 'AstroGid',
      userAvatar: 'images/гость.png',
      category: 'Статья',
      title: 'Наблюдение планет Солнечной системы',
      description: 'Лучшее время для наблюдения каждой планеты, что можно увидеть в любительский телескоп и как правильно настроить оборудование для планетарных наблюдений.',
      image: 'images/М20.jpg',
      createdAt: new Date(2025, 11, 28).toISOString(),
      likes: 0
    }
  ];
  saveToStorage();
}

/* ===== КОММЕНТАРИИ К ФУНКЦИЯМ =====

=== СИСТЕМА ИНИЦИАЛИЗАЦИИ ===
- loadDataFromStorage(): Загружает все сохраненные данные из localStorage браузера при запуске
- saveToStorage(): Сохраняет текущее состояние приложения в localStorage
- updateNavigation(): Динамически меняет навигационное меню в зависимости от статуса пользователя
- initializeEventListeners(): Настраивает обработчики событий для плавной прокрутки
- initializeFAQ(): Инициализирует аккордеон для раздела вопросов-ответов

=== СИСТЕМА ПОЛЬЗОВАТЕЛЕЙ ===
- handleRegistration(): Обрабатывает регистрацию новых пользователей с проверкой уникальности email
- handleLogin(): Авторизует существующих пользователей по email и паролю
- enterAsGuest(): Создает временного пользователя-гостя с ограниченными правами
- logout(): Выход из аккаунта с подтверждением и очисткой данных сессии
- switchAuthTab(): Переключает вкладки в модальном окне (Регистрация/Вход/Гость)

=== УПРАВЛЕНИЕ ПРОФИЛЕМ ===
- showProfile(): Отображает профиль пользователя с возможностью редактирования
- changeAvatar(): Открывает диалог выбора файла для смены аватара
- handleAvatarUpload(): Обрабатывает загрузку и сохранение нового аватара
- saveBio(): Сохраняет описание пользователя в профиле

=== СИСТЕМА ПУБЛИКАЦИЙ ===
- showPublishModal(): Открывает модальное окно для создания новой публикации
- handlePublish(): Обрабатывает создание публикации с изображением и категорией
- deletePost(): Удаляет публикацию пользователя с подтверждением
- closePublishModal(): Закрывает модальное окно публикации

=== КОНТЕНТ-СЕКЦИИ ===
- showFeed(): Отображает ленту публикаций (астрофото, посты, обсуждения)
- showNews(): Показывает раздел новостей астрономии
- showArticles(): Отображает образовательные статьи в виде карточек
- hideAllSections(): Скрывает все основные секции сайта
- returnToMain(): Возвращает на главную страницу сайта

=== ОБРАТНАЯ СВЯЗЬ ===
- initializeContactForm(): Настраивает форму обратной связи с валидацией
- handleContactFormSubmit(): Обрабатывает отправку сообщения через форму
- validateContactForm(): Проверяет корректность заполнения полей формы
- sendEmailDirect(): Создает mailto ссылку для отправки email
- showEmailConfirmation(): Показывает подтверждение перед отправкой email
- saveContactMessage(): Сохраняет сообщение в локальное хранилище

=== КАСТОМНЫЕ УВЕДОМЛЕНИЯ ===
- showCustomAlert(): Показывает стильное уведомление вместо стандартного alert()
- showCustomConfirm(): Отображает диалог подтверждения с кастомным дизайном

=== МОДАЛЬНЫЕ ОКНА ===
- showRegistration(): Открывает модальное окно регистрации/входа
- closeRegistration(): Закрывает модальное окно регистрации
- openEmailClient(): Открывает почтовый клиент для отправки сообщения
- closeEmailModal(): Закрывает модальное окно email

=== АДМИН ФУНКЦИИ ===
- showContactMessagesAdmin(): Показывает все сообщения обратной связи (3 клика по логотипу)
- showAccountsList(): Отображает список всех зарегистрированных аккаунтов (5 кликов)
- quickLogin(): Быстрый вход в любой аккаунт из админ панели
- clearContactMessages(): Очищает все сообщения обратной связи
- clearAllAccounts(): Удаляет все аккаунты и данные приложения

=== ТЕСТОВЫЕ ДАННЫЕ ===
- addTestNews(): Добавляет примеры новостей астрономии при первом запуске
- addTestArticles(): Создает образцы статей для демонстрации функциональности

=== УТИЛИТЫ ===
- getContactMessages(): Получает все сохраненные сообщения из localStorage
- Все функции работают с глобальным объектом AppState для управления состоянием
- Данные автоматически синхронизируются между памятью и localStorage
- Интерфейс адаптируется под статус пользователя (гость/зарегистрированный/неавторизованный)

*/