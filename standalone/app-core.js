// app-core.js - State Management, Utilities, Audio, Toast, & Confirm Modals
(function(window) {
  'use strict';

  const STORAGE_KEY = 'jadwalKuliahAKS1_v1';
  let undoStack = [];
  let redoStack = [];

  // Web Audio Context for subtle gentle synthesizer chime
  let audioCtx = null;
  function playNotificationChime() {
    try {
      if (!appStore.state.settings.suaraAktif) return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!audioCtx) audioCtx = new AudioContext();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      
      const now = audioCtx.currentTime;
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.36);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  // Indonesian Date & Time Utilities
  const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  function formatDateIndo(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    const dayName = DAYS_ID[d.getDay()];
    const day = d.getDate();
    const month = MONTHS_ID[d.getMonth()];
    const year = d.getFullYear();
    return `${dayName}, ${day} ${month} ${year}`;
  }

  function formatShortDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return `${d.getDate()} ${MONTHS_ID[d.getMonth()].slice(0, 3)}`;
  }

  function getTodayIso() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // App Store with LocalStorage Persistence
  const appStore = {
    state: {
      profile: JSON.parse(JSON.stringify(INITIAL_PROFILE)),
      settings: JSON.parse(JSON.stringify(INITIAL_SETTINGS)),
      semesters: {
        1: { matkul: JSON.parse(JSON.stringify(SEED_MATKUL)), status: 'aktif', ips: 4.00, sksLulus: 20 },
        2: { matkul: [], status: 'belum', ips: null, sksLulus: 0 },
        3: { matkul: [], status: 'belum', ips: null, sksLulus: 0 },
        4: { matkul: [], status: 'belum', ips: null, sksLulus: 0 },
        5: { matkul: [], status: 'belum', ips: null, sksLulus: 0 },
        6: { matkul: [], status: 'belum', ips: null, sksLulus: 0 },
        7: { matkul: [], status: 'belum', ips: null, sksLulus: 0 },
        8: { matkul: [], status: 'belum', ips: null, sksLulus: 0 }
      },
      notifications: [
        { id: 'notif-init-1', title: 'Selamat Datang!', message: 'Aplikasi jadwal kuliah S1 Akuntansi UPNVJ siap digunakan.', time: new Date().toISOString(), read: false }
      ],
      selectedDate: '2026-08-21', // Initial seed date for demo or today
      activePage: 'beranda',
      viewingSemester: 1
    },

    saveTimer: null,

    init() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.semesters && parsed.profile) {
            this.state = Object.assign(this.state, parsed);
          }
        }
      } catch (err) {
        console.warn('Gagal membaca localStorage:', err);
      }

      // Check if selectedDate matches realistic context
      const today = getTodayIso();
      // If today falls in 2026 semester 1 range, default to today
      if (today.startsWith('2026')) {
        this.state.selectedDate = today;
      }
    },

    save(skipUndo = false) {
      if (!skipUndo) {
        this.pushUndoSnapshot();
      }
      clearTimeout(this.saveTimer);
      this.saveTimer = setTimeout(() => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
          this.updateStorageMeter();
        } catch (e) {
          showToast('error', 'Penyimpanan Penuh', 'Kapasitas Local Storage browser penuh!');
        }
      }, 250);
    },

    pushUndoSnapshot() {
      try {
        const snapshot = JSON.stringify({
          semesters: this.state.semesters,
          profile: this.state.profile,
          settings: this.state.settings
        });
        undoStack.push(snapshot);
        if (undoStack.length > 25) undoStack.shift();
        const undoBtn = document.getElementById('undoBtn');
        if (undoBtn) undoBtn.style.display = 'flex';
      } catch (e) {}
    },

    undo() {
      if (undoStack.length === 0) return;
      const last = undoStack.pop();
      try {
        const parsed = JSON.parse(last);
        this.state.semesters = parsed.semesters;
        this.state.profile = parsed.profile;
        this.state.settings = parsed.settings;
        this.save(true);
        window.appRenderer.renderAll();
        showToast('info', 'Dibatalkan', 'Perubahan sebelumnya telah dibatalkan.');
        if (undoStack.length === 0) {
          const undoBtn = document.getElementById('undoBtn');
          if (undoBtn) undoBtn.style.display = 'none';
        }
      } catch (e) {}
    },

    getActiveMatkul() {
      const sem = this.state.viewingSemester || this.state.profile.semesterAktif;
      return (this.state.semesters[sem] && this.state.semesters[sem].matkul) || [];
    },

    updateStorageMeter() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY) || '';
        const bytes = new Blob([raw]).size;
        const kb = (bytes / 1024).toFixed(1);
        const text = document.getElementById('storageUsageText');
        const bar = document.getElementById('storageUsageBar');
        if (text) text.textContent = `${kb} KB / ~5 MB`;
        if (bar) bar.style.width = Math.min(100, Math.max(1, (bytes / (5 * 1024 * 1024)) * 100)) + '%';
      } catch (e) {}
    }
  };

  // Toast System
  function showToast(type, title, message, actionText = null, onAction = null) {
    playNotificationChime();
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
    } else if (type === 'warning') {
      iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
    } else {
      iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    }

    toast.innerHTML = `
      <div class="toast-icon">${iconSvg}</div>
      <div class="toast-content">
        <div class="toast-title">${escapeHtml(title)}</div>
        <div class="toast-message">${escapeHtml(message)}</div>
        ${actionText ? `<button class="btn btn-sm btn-secondary" style="margin-top: 6px; padding: 3px 8px; font-size: 11px;">${escapeHtml(actionText)}</button>` : ''}
      </div>
      <div class="toast-progress"></div>
    `;

    if (actionText && onAction) {
      const btn = toast.querySelector('button');
      if (btn) btn.onclick = () => { onAction(); toast.remove(); };
    }

    container.appendChild(toast);

    // Add to notification history
    appStore.state.notifications.unshift({
      id: 'notif-' + Date.now(),
      title,
      message,
      time: new Date().toISOString(),
      read: false
    });
    if (appStore.state.notifications.length > 50) appStore.state.notifications.pop();
    updateNotifBadge();

    // Auto dismiss after 4.5s
    const progress = toast.querySelector('.toast-progress');
    if (progress) {
      progress.style.transition = 'width 4.5s linear';
      setTimeout(() => { progress.style.width = '0%'; }, 10);
    }

    setTimeout(() => {
      toast.style.transition = 'opacity 0.25s, transform 0.25s';
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(40px)';
      setTimeout(() => toast.remove(), 260);
    }, 4500);
  }

  // Custom Modal Confirm Dialog
  function showCustomConfirm(options) {
    return new Promise((resolve) => {
      const modal = document.getElementById('customConfirmModal');
      const titleEl = document.getElementById('confirmModalTitle');
      const descEl = document.getElementById('confirmModalDesc');
      const cancelBtn = document.getElementById('confirmModalCancelBtn');
      const proceedBtn = document.getElementById('confirmModalProceedBtn');
      const promptBox = document.getElementById('confirmPromptInputContainer');
      const promptInput = document.getElementById('confirmPromptInput');

      titleEl.textContent = options.title || 'Konfirmasi';
      descEl.textContent = options.desc || 'Lanjutkan tindakan?';
      proceedBtn.textContent = options.confirmText || 'Lanjutkan';
      proceedBtn.className = options.isDanger ? 'btn btn-danger' : 'btn btn-primary';

      if (options.requireMatch) {
        promptBox.style.display = 'block';
        promptInput.value = '';
        promptInput.placeholder = `Ketik "${options.requireMatch}" untuk konfirmasi`;
      } else {
        promptBox.style.display = 'none';
      }

      modal.classList.add('active');

      function cleanup(res) {
        modal.classList.remove('active');
        cancelBtn.onclick = null;
        proceedBtn.onclick = null;
        resolve(res);
      }

      cancelBtn.onclick = () => cleanup(false);
      proceedBtn.onclick = () => {
        if (options.requireMatch && promptInput.value.trim() !== options.requireMatch) {
          showToast('error', 'Gagal', `Harus mengetik "${options.requireMatch}" persis.`);
          return;
        }
        cleanup(true);
      };
    });
  }

  function updateNotifBadge() {
    const unread = appStore.state.notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notifBadge');
    if (badge) {
      if (unread > 0) {
        badge.style.display = 'flex';
        badge.textContent = unread > 9 ? '9+' : unread;
      } else {
        badge.style.display = 'none';
      }
    }
    const drawerCount = document.getElementById('drawerNotifCount');
    if (drawerCount) drawerCount.textContent = unread;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Expose core to global
  window.appStore = appStore;
  window.showToast = showToast;
  window.showCustomConfirm = showCustomConfirm;
  window.updateNotifBadge = updateNotifBadge;
  window.formatDateIndo = formatDateIndo;
  window.formatShortDate = formatShortDate;
  window.getTodayIso = getTodayIso;
  window.escapeHtml = escapeHtml;
  window.DAYS_ID = DAYS_ID;
  window.MONTHS_ID = MONTHS_ID;

})(window);
