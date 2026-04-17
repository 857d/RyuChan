// public/decrypt.js
(function() {
  const CACHE_KEY_PREFIX = 'decrypted_';
  const CACHE_EXPIRY_MS = 10 * 60 * 1000; // 10分钟，可根据需要调整

  function saveCache(slug, html, password) {
    const cache = {
      html: html,
      password: password,
      expiry: Date.now() + CACHE_EXPIRY_MS
    };
    sessionStorage.setItem(CACHE_KEY_PREFIX + slug, JSON.stringify(cache));
  }

  function getCache(slug) {
    const raw = sessionStorage.getItem(CACHE_KEY_PREFIX + slug);
    if (!raw) return null;
    try {
      const cache = JSON.parse(raw);
      if (cache.expiry > Date.now()) {
        return cache;
      } else {
        sessionStorage.removeItem(CACHE_KEY_PREFIX + slug);
        return null;
      }
    } catch(e) {
      return null;
    }
  }

  async function decryptWithWebCrypto(encryptedData, password) {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted data format');
    const salt = Uint8Array.from(atob(parts[0]), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(parts[1]), c => c.charCodeAt(0));
    const ciphertext = Uint8Array.from(atob(parts[2]), c => c.charCodeAt(0));
    
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
    );
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-CBC', length: 256 },
      false,
      ['decrypt']
    );
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv },
      key,
      ciphertext.buffer
    );
    return new TextDecoder().decode(decrypted);
  }

  function showDecryptedContent(container, slug, html, password) {
    const passwordCard = container.querySelector('.password-card');
    const decryptedContent = container.querySelector('.decrypted-content');
    const editButton = document.getElementById('edit-button-container');
    if (!passwordCard || !decryptedContent) return;

    decryptedContent.innerHTML = `<div class="prose prose-lg prose-code:text-base max-w-none text-justify prose-headings:scroll-mt-20 prose-img:rounded-2xl prose-img:mx-auto prose-img:cursor-pointer">${html}</div>`;
    passwordCard.style.display = 'none';
    decryptedContent.style.display = 'block';
    if (editButton) editButton.style.display = 'flex';
    container.setAttribute('data-decrypted', 'true');

    // 保存缓存
    saveCache(slug, html, password);
  }

  async function init() {
    const container = document.querySelector('[data-encrypted]');
    if (!container) return;
    if (container.getAttribute('data-decrypted') === 'true') return;

    const storedPassword = container.getAttribute('data-password');
    const encryptedData = container.getAttribute('data-encrypted');
    const slug = container.getAttribute('data-slug');
    const passwordInput = document.getElementById('password-input');
    const decryptBtn = document.getElementById('decrypt-btn');
    const errorMsg = document.getElementById('error-msg');

    if (!passwordInput || !decryptBtn || !errorMsg) return;

    // 检查缓存
    const cache = getCache(slug);
    if (cache && cache.html && cache.password === storedPassword) {
      showDecryptedContent(container, slug, cache.html, storedPassword);
      return;
    }

    // 定义解密并显示的函数
    async function handleDecrypt() {
      const userPassword = passwordInput.value;
      if (!userPassword) {
        errorMsg.textContent = '请输入密码';
        errorMsg.classList.remove('hidden');
        return;
      }
      if (userPassword === storedPassword) {
        try {
          const html = await decryptWithWebCrypto(encryptedData, userPassword);
          showDecryptedContent(container, slug, html, userPassword);
        } catch (err) {
          console.error(err);
          errorMsg.textContent = '解密失败，密码错误或内容损坏';
          errorMsg.classList.remove('hidden');
        }
      } else {
        errorMsg.textContent = '密码错误，请重试';
        errorMsg.classList.remove('hidden');
      }
    }

    // 移除旧监听器，避免重复绑定（使用新的函数引用）
    // 但为了简单，直接重新绑定，先移除再添加
    const oldHandler = decryptBtn._handler;
    if (oldHandler) decryptBtn.removeEventListener('click', oldHandler);
    decryptBtn.addEventListener('click', handleDecrypt);
    decryptBtn._handler = handleDecrypt;

    const oldKeyHandler = passwordInput._keyHandler;
    if (oldKeyHandler) passwordInput.removeEventListener('keypress', oldKeyHandler);
    const keyHandler = (e) => {
      if (e.key === 'Enter') handleDecrypt();
    };
    passwordInput.addEventListener('keypress', keyHandler);
    passwordInput._keyHandler = keyHandler;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  // 支持 Astro 客户端导航
  document.addEventListener('astro:page-load', init);
})();
