// public/decrypt.js
(function() {
  function init() {
    const container = document.querySelector('[data-encrypted]');
    if (!container) return;
    if (container.getAttribute('data-decrypted') === 'true') return;

    const storedPassword = container.getAttribute('data-password');
    const encryptedData = container.getAttribute('data-encrypted');
    const slug = container.getAttribute('data-slug');
    const passwordInput = document.getElementById('password-input');
    const decryptBtn = document.getElementById('decrypt-btn');
    const errorMsg = document.getElementById('error-msg');
    const passwordCard = container.querySelector('.password-card');
    const decryptedContent = container.querySelector('.decrypted-content');

    if (!passwordInput || !decryptBtn || !errorMsg || !passwordCard || !decryptedContent) return;

    // 检查本地存储是否有未过期的缓存
    const cacheKey = `decrypt_cache_${slug}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        if (data.expire > Date.now()) {
          // 缓存未过期，直接显示内容
          decryptedContent.innerHTML = data.html;
          passwordCard.style.display = 'none';
          decryptedContent.style.display = 'block';
          container.setAttribute('data-decrypted', 'true');
          return;
        } else {
          localStorage.removeItem(cacheKey);
        }
      } catch(e) {}
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

    async function decryptAndShow() {
      const userPassword = passwordInput.value;
      if (!userPassword) {
        errorMsg.textContent = '请输入密码';
        errorMsg.classList.remove('hidden');
        return;
      }
      if (userPassword === storedPassword) {
        try {
          const html = await decryptWithWebCrypto(encryptedData, userPassword);
          const editButton = `<div class="flex justify-end mb-4"><a href="/write?slug=${slug}" class="btn btn-primary btn-sm text-white">✏️ 编辑文章</a></div>`;
          const fullHtml = editButton + `<div class="prose prose-lg prose-code:text-base max-w-none text-justify prose-headings:scroll-mt-20 prose-img:rounded-2xl prose-img:mx-auto prose-img:cursor-pointer">${html}</div>`;
          decryptedContent.innerHTML = fullHtml;
          passwordCard.style.display = 'none';
          decryptedContent.style.display = 'block';
          container.setAttribute('data-decrypted', 'true');
          
          // 缓存解密后的HTML，有效期10分钟
          const expire = Date.now() + 10 * 60 * 1000;
          localStorage.setItem(cacheKey, JSON.stringify({ html: fullHtml, expire }));
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

    decryptBtn.addEventListener('click', decryptAndShow);
    passwordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') decryptAndShow();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
