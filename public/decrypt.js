// public/decrypt.js
(function() {
  // 存储遮罩层元素
  let modalOverlay = null;

  function createModalOverlay() {
    if (modalOverlay) return modalOverlay;
    const overlay = document.createElement('div');
    overlay.id = 'password-modal-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    overlay.style.backdropFilter = 'blur(8px)';
    overlay.style.zIndex = '40';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.padding = '1rem';
    document.body.appendChild(overlay);
    modalOverlay = overlay;
    return overlay;
  }

  // 确保导航栏的 z-index 高于遮罩层
  function ensureNavbarZIndex() {
    const navbars = document.querySelectorAll('nav, .navbar, header');
    navbars.forEach(nav => {
      const zIndex = window.getComputedStyle(nav).zIndex;
      if (zIndex === 'auto' || parseInt(zIndex) < 50) {
        nav.style.position = 'relative';
        nav.style.zIndex = '50';
      }
    });
  }

  // 将密码卡片移动到遮罩层内，并居中
  function moveCardToModal(card) {
    const overlay = createModalOverlay();
    // 清空遮罩层内容（可能已有其他内容）
    overlay.innerHTML = '';
    // 复制卡片样式（避免丢失原有样式）
    card.style.margin = '0';
    card.style.maxWidth = '28rem';
    card.style.width = '100%';
    overlay.appendChild(card);
    // 确保卡片在遮罩层内可见
    card.style.display = 'block';
  }

  // 恢复卡片到原位置（解密成功后）
  function restoreCardToOriginal(card, originalParent) {
    if (originalParent && originalParent.contains(card)) {
      // 如果卡片还在遮罩中，移回原位置
      originalParent.appendChild(card);
      card.style.margin = '2rem auto';
    }
    if (modalOverlay) {
      modalOverlay.remove();
      modalOverlay = null;
    }
  }

  function init() {
    const container = document.querySelector('[data-encrypted]');
    if (!container) return;
    if (container.getAttribute('data-decrypted') === 'true') return;

    const storedPassword = container.getAttribute('data-password');
    const encryptedData = container.getAttribute('data-encrypted');
    const passwordCard = container.querySelector('.password-card');
    const passwordInput = document.getElementById('password-input');
    const decryptBtn = document.getElementById('decrypt-btn');
    const errorMsg = document.getElementById('error-msg');
    const decryptedContent = container.querySelector('.decrypted-content');

    if (!passwordCard || !passwordInput || !decryptBtn || !errorMsg || !decryptedContent) return;

    // 保存卡片的原始父元素
    const originalParent = passwordCard.parentNode;
    // 创建遮罩并将卡片移入
    moveCardToModal(passwordCard);
    ensureNavbarZIndex();
    // 锁定页面滚动
    document.body.style.overflow = 'hidden';

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
          decryptedContent.innerHTML = `<div class="prose prose-lg prose-code:text-base max-w-none text-justify prose-headings:scroll-mt-20 prose-img:rounded-2xl prose-img:mx-auto prose-img:cursor-pointer">${html}</div>`;
          // 恢复卡片到原位置（虽然之后会被隐藏，但为了完整性）
          restoreCardToOriginal(passwordCard, originalParent);
          // 隐藏卡片（因为解密成功，卡片不再需要）
          passwordCard.style.display = 'none';
          decryptedContent.style.display = 'block';
          // 显示编辑按钮（如果有）
          const editButton = document.getElementById('edit-button-container');
          if (editButton) editButton.style.display = 'flex';
          container.setAttribute('data-decrypted', 'true');
          // 恢复页面滚动
          document.body.style.overflow = '';
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
