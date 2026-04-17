// public/decrypt.js
(function() {
  const CACHE_KEY_PREFIX = 'decrypted_';
  const CACHE_EXPIRY_MS = 10 * 60 * 1000; // 10分钟

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

  async function showDecryptedContent(container, slug, html, password) {
    const passwordCard = container.querySelector('.password-card');
    const decryptedContent = container.querySelector('.decrypted-content');
    if (!passwordCard || !decryptedContent) return;

    // 生成编辑按钮
    const editButton = `<div class="flex justify-end mb-4"><a href="/write?slug=${slug}" class="btn btn-primary btn-sm text-white">✏️ 编辑文章</a></div>`;
    decryptedContent.innerHTML = editButton + `<div class="prose prose-lg prose-code:text-base max-w-none text-justify prose-headings:scroll-mt-20 prose-img:rounded-2xl prose-img:mx-auto prose-img:cursor-pointer">${html}</div>`;
    passwordCard.style.display = 'none';
    decryptedContent.style.display = 'block';
    container.setAttribute('data-decrypted', 'true');

    // 保存缓存
    saveCache(slug, html, password);
  }

  async function decryptAndShow(container, slug, encryptedData, password, passwordInput, errorMsg, passwordCard, decryptedContent) {
    try {
      const html = await decryptWithWebCrypto(encryptedData, password);
      await showDecryptedContent(container, slug, html, password);
    } catch (err) {
      console.error(err);
      errorMsg.textContent = '解密失败，密码错误或内容损坏';
      errorMsg.classList.remove('hidden');
    }
  }

  function init() {
    const container = document.querySelector('[data-encrypted]');
    if (!container) {
      console.warn('Container not found, retrying in 100ms...');
      setTimeout(init, 100);
      return;
    }
    if (container.getAttribute('data-decrypted') === 'true') return;

    const storedPassword = container.getAttribute('data-password');
    const encryptedData = container.getAttribute('data-encrypted');
    const slug = container.getAttribute('data-slug');
    const passwordInput = document.getElementById('password-input');
    const decryptBtn = document.getElementById('decrypt-btn');
    const errorMsg = document.getElementById('error-msg');
    const passwordCard = container.querySelector('.password-card');
    const decryptedContent = container.querySelector('.decrypted-content');

    if (!passwordInput || !decryptBtn || !errorMsg || !passwordCard || !decryptedContent) {
      console.warn('Missing elements, retrying...');
      setTimeout(init, 100);
      return;
    }

    // 检查缓存
    const cache = getCache(slug);
    if (cache && cache.html && cache.password === storedPassword) {
      // 直接显示缓存内容
      showDecryptedContent(container, slug, cache.html, storedPassword);
      return;
    }

    // 绑定验证按钮事件
    const decryptAndShowHandler = async () => {
      const userPassword = passwordInput.value;
      if (!userPassword) {
        errorMsg.textContent = '请输入密码';
        errorMsg.classList.remove('hidden');
        return;
      }
      if (userPassword === storedPassword) {
        await decryptAndShow(container, slug, encryptedData, userPassword, passwordInput, errorMsg, passwordCard, decryptedContent);
      } else {
        errorMsg.textContent = '密码错误，请重试';
        errorMsg.classList.remove('hidden');
      }
    };

    // 移除旧的监听器避免重复绑定（如果重新初始化）
    decryptBtn.removeEventListener('click', decryptAndShowHandler);
    decryptBtn.addEventListener('click', decryptAndShowHandler);
    passwordInput.removeEventListener('keypress', passwordInput._keyHandler);
    const keyHandler = (e) => {
      if (e.key === 'Enter') decryptAndShowHandler();
    };
    passwordInput.addEventListener('keypress', keyHandler);
    passwordInput._keyHandler = keyHandler;
  }

  // 确保在页面完全加载后执行（兼容 Astro 导航）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  // 额外保险：如果 Astro 使用客户端路由，监听页面换肤事件（可选）
  document.addEventListener('astro:page-load', init);
})();
