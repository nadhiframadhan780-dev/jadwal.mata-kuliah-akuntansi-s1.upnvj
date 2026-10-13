// app-views.js - View Renderers for Beranda, Jadwal, Absensi, and Modals
(function(window) {
  'use strict';

  const { appStore, formatDateIndo, formatShortDate, getTodayIso, showToast, showCustomConfirm, escapeHtml, DAYS_ID } = window;

  let currentWeekStart = getMonday(new Date());

  function getMonday(d) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }

  function getSessionStatus(sesDateStr, startTimeStr, endTimeStr) {
    const now = new Date();
    // Parse target date and times in local time
    const start = new Date(`${sesDateStr}T${startTimeStr}:00`);
    const end = new Date(`${sesDateStr}T${endTimeStr}:00`);

    if (now < start) {
      return { status: 'akan_datang', label: 'Akan Datang', progress: 0 };
    } else if (now >= start && now <= end) {
      const total = end.getTime() - start.getTime();
      const elapsed = now.getTime() - start.getTime();
      const progress = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
      return { status: 'sedang_berlangsung', label: 'Sedang Berlangsung', progress };
    } else {
      return { status: 'selesai', label: 'Selesai', progress: 100 };
    }
  }

  const appRenderer = {
    renderAll() {
      this.renderHeader();
      this.renderWeeklyStrip();
      this.renderBeranda();
      this.renderJadwal();
      this.renderAbsensi();
      if (window.appGrades) {
        window.appGrades.renderNilai();
        window.appGrades.renderSemester();
        window.appGrades.renderProfil();
      }
    },

    renderHeader() {
      const now = new Date();
      // Time string in WIB (Asia/Jakarta)
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');
      const timeStr = `${hours}:${mins}:${secs} WIB`;

      const clockEl = document.getElementById('liveClockText');
      if (clockEl) clockEl.textContent = timeStr;

      // Greeting
      let greeting = 'Selamat malam';
      const h = now.getHours();
      if (h >= 4 && h < 11) greeting = 'Selamat pagi';
      else if (h >= 11 && h < 15) greeting = 'Selamat siang';
      else if (h >= 15 && h < 18) greeting = 'Selamat sore';

      const firstName = (appStore.state.profile.nama || 'Nadhif').split(' ')[0];
      const greetingEl = document.getElementById('topbarGreeting');
      if (greetingEl) greetingEl.textContent = `${greeting}, ${firstName} 👋`;

      const dateStrEl = document.getElementById('topbarDateStr');
      if (dateStrEl) dateStrEl.textContent = formatDateIndo(getTodayIso());

      // Print info sync
      const printSub = document.getElementById('printStudentSub');
      if (printSub) {
        printSub.textContent = `${appStore.state.profile.nama} (${appStore.state.profile.nim}) • Kelas ${appStore.state.profile.kelas} • Semester ${appStore.state.viewingSemester}`;
      }
      const printDate = document.getElementById('printDateStamp');
      if (printDate) {
        printDate.textContent = `Dicetak: ${formatDateIndo(getTodayIso())}, ${timeStr}`;
      }
    },

    renderWeeklyStrip() {
      const grid = document.getElementById('weekDaysGrid');
      if (!grid) return;
      grid.innerHTML = '';

      const start = new Date(currentWeekStart);
      const todayIso = getTodayIso();
      const allMatkul = appStore.getActiveMatkul();

      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dayNum = String(d.getDate()).padStart(2, '0');
        const iso = `${y}-${m}-${dayNum}`;
        const dayName = DAYS_ID[d.getDay()];

        // Count sessions on this date
        let sessionCount = 0;
        allMatkul.forEach(m => {
          m.sesi.forEach(s => {
            if (s.tanggal === iso) sessionCount++;
          });
        });

        const isSelected = (iso === appStore.state.selectedDate);
        const isToday = (iso === todayIso);

        const pill = document.createElement('div');
        pill.className = `week-pill ${isSelected ? 'active' : ''} ${isToday ? 'today' : ''}`;
        pill.style.cssText = `
          padding: 8px 6px;
          border-radius: var(--radius-md);
          text-align: center;
          cursor: pointer;
          transition: all 0.15s ease;
          border: 1px solid ${isSelected ? 'var(--teal-600)' : (isToday ? 'var(--yellow-400)' : 'var(--neutral-200)')};
          background: ${isSelected ? 'linear-gradient(135deg, var(--teal-600), var(--teal-700))' : (isToday ? 'var(--yellow-50)' : '#ffffff')};
          color: ${isSelected ? '#ffffff' : 'var(--neutral-800)'};
        `;

        pill.innerHTML = `
          <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: ${isSelected ? 'var(--yellow-300)' : (isToday ? 'var(--yellow-700)' : 'var(--neutral-500)')};">${dayName.slice(0, 3)}</div>
          <div style="font-size: 15px; font-weight: 800; margin: 2px 0;">${d.getDate()}</div>
          <div style="display: flex; justify-content: center; gap: 3px; height: 5px;">
            ${sessionCount > 0 ? `<span style="width: 5px; height: 5px; border-radius: 50%; background: ${isSelected ? 'var(--yellow-400)' : 'var(--teal-600)'};"></span>` : ''}
          </div>
        `;

        pill.onclick = () => {
          appStore.state.selectedDate = iso;
          this.renderWeeklyStrip();
          this.renderBeranda();
        };

        grid.appendChild(pill);
      }

      // Range label
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const rangeEl = document.getElementById('weeklyRangeLabel');
      if (rangeEl) {
        rangeEl.textContent = `(${start.getDate()} ${MONTHS_ID[start.getMonth()].slice(0, 3)} – ${end.getDate()} ${MONTHS_ID[end.getMonth()].slice(0, 3)} ${end.getFullYear()})`;
      }
    },

    renderBeranda() {
      const selectedIso = appStore.state.selectedDate;
      const allMatkul = appStore.getActiveMatkul();

      const titleEl = document.getElementById('selectedDayTitle');
      const subEl = document.getElementById('selectedDaySubtitle');
      if (titleEl) {
        const isToday = selectedIso === getTodayIso();
        titleEl.textContent = isToday ? 'Jadwal Hari Ini' : `Jadwal: ${formatDateIndo(selectedIso)}`;
      }
      if (subEl) {
        subEl.textContent = `${formatDateIndo(selectedIso)}`;
      }

      // Collect all sessions on this date
      const sessions = [];
      allMatkul.forEach(m => {
        m.sesi.forEach((ses, idx) => {
          if (ses.tanggal === selectedIso) {
            sessions.push({ matkul: m, sesi: ses, sesiIndex: idx });
          }
        });
      });

      // Sort by start time
      sessions.sort((a, b) => a.sesi.mulai.localeCompare(b.sesi.mulai));

      // Update Top Summary Stats
      let totalSksToday = 0;
      sessions.forEach(item => { totalSksToday += (item.matkul.sks || 0); });

      const countEl = document.getElementById('statTodayCount');
      if (countEl) countEl.textContent = `${sessions.length} Matkul`;
      const hoursEl = document.getElementById('statTodayHours');
      if (hoursEl) hoursEl.textContent = `${totalSksToday} SKS`;

      // Semester attendance calculation
      let totalSesiAll = 0;
      let totalHadirAll = 0;
      allMatkul.forEach(m => {
        m.sesi.forEach(s => {
          totalSesiAll++;
          if (s.status === 'hadir') totalHadirAll++;
        });
      });
      const semRate = totalSesiAll > 0 ? Math.round((totalHadirAll / totalSesiAll) * 100) : 0;
      const semAttEl = document.getElementById('statSemesterAttendance');
      if (semAttEl) semAttEl.textContent = `${semRate}% (${totalHadirAll}/${totalSesiAll})`;

      const listEl = document.getElementById('todaySessionsList');
      if (!listEl) return;
      listEl.innerHTML = '';

      if (sessions.length === 0) {
        // Find next upcoming lecture across schedule
        let nextSession = null;
        const now = new Date();
        const allFuture = [];

        allMatkul.forEach(m => {
          m.sesi.forEach((s, idx) => {
            const dt = new Date(`${s.tanggal}T${s.mulai}:00`);
            if (dt > now) {
              allFuture.push({ matkul: m, sesi: s, dt });
            }
          });
        });
        allFuture.sort((a, b) => a.dt - b.dt);
        if (allFuture.length > 0) nextSession = allFuture[0];

        let countdownHtml = '';
        if (nextSession) {
          const diffMs = nextSession.dt - now;
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

          countdownHtml = `
            <div style="margin-top: 18px; padding: 14px 18px; background: var(--teal-50); border: 1px solid var(--teal-200); border-radius: var(--radius-lg); text-align: left; max-width: 520px; margin-left: auto; margin-right: auto;">
              <div style="font-size: 11px; font-weight: 700; color: var(--teal-700); text-transform: uppercase;">KULIAH BERIKUTNYA</div>
              <div style="font-size: 15px; font-weight: 800; color: var(--teal-900); margin: 3px 0;">${escapeHtml(nextSession.matkul.nama)} (${escapeHtml(nextSession.matkul.kode)})</div>
              <div style="font-size: 12.5px; color: var(--neutral-600);">${formatDateIndo(nextSession.sesi.tanggal)} &bull; ${nextSession.sesi.mulai}–${nextSession.sesi.selesai} WIB &bull; ${escapeHtml(nextSession.sesi.ruang)}</div>
              <div style="font-size: 12px; color: var(--neutral-500); margin-top: 4px;">Dosen: ${escapeHtml(nextSession.sesi.dosen)}</div>
              <div style="margin-top: 8px; font-size: 12px; font-weight: 700; color: var(--yellow-700); background: var(--yellow-100); display: inline-block; padding: 2px 10px; border-radius: 9999px;">
                Hitung mundur: ${diffDays} hari ${diffHours} jam ${diffMins} menit lagi
              </div>
            </div>
          `;
        }

        listEl.innerHTML = `
          <div class="card" style="text-align: center; padding: 36px 20px;">
            <div style="width: 56px; height: 56px; border-radius: 50%; background: var(--teal-100); color: var(--teal-700); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px auto;">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
            </div>
            <h4 style="font-size: 16px; font-weight: 800; color: var(--teal-900);">Tidak Ada Perkuliahan</h4>
            <p style="font-size: 13px; color: var(--neutral-600); margin-top: 4px;">Waktunya istirahat, mengulang materi, atau belajar mandiri! ✨</p>
            ${countdownHtml}
          </div>
        `;
        return;
      }

      // Render each session card
      sessions.forEach(item => {
        const { matkul, sesi, sesiIndex } = item;
        const state = getSessionStatus(sesi.tanggal, sesi.mulai, sesi.selesai);

        const card = document.createElement('div');
        card.className = 'card session-card';
        card.style.borderLeft = `5px solid ${matkul.warna || 'var(--teal-600)'}`;

        // Status badge colors
        let statusBadge = '';
        if (state.status === 'sedang_berlangsung') {
          statusBadge = `
            <span style="background: var(--teal-100); color: var(--teal-800); font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; display: inline-flex; align-items: center; gap: 4px;">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: var(--teal-600); animation: pulseDot 1.5s infinite;"></span> Sedang Berlangsung (${state.progress}%)
            </span>
          `;
        } else if (state.status === 'selesai') {
          statusBadge = `<span style="background: var(--neutral-100); color: var(--neutral-600); font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 9999px;">Selesai</span>`;
        } else {
          statusBadge = `<span style="background: var(--yellow-100); color: var(--yellow-800); font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px;">Akan Datang</span>`;
        }

        // Attendance active button highlight
        const attStatus = sesi.status || '';

        card.innerHTML = `
          <!-- Top Row: Time, Status, Ke- Pill, Edit Button -->
          <div class="session-top-row">
            <div class="session-time-status">
              <span class="session-time-badge">${sesi.mulai} – ${sesi.selesai} WIB</span>
              ${statusBadge}
            </div>
            <div class="session-actions">
              <span class="session-ke-pill">Ke-${sesi.ke}/${matkul.sesi.length}</span>
              <button class="session-edit-icon-btn edit-session-btn" title="Edit atau Pindahkan Sesi Ini">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                <span>Edit / Pindah</span>
              </button>
            </div>
          </div>

          <!-- Course Name & Meta Tags -->
          <div class="session-main-info">
            <h4 class="session-course-title">${escapeHtml(matkul.nama)}</h4>
            <div class="session-tags-row">
              <span class="badge-code">${matkul.kode}</span>
              <span class="badge-sks">${matkul.sks} SKS</span>
              <span class="badge-kelas">Kelas ${matkul.kelas}</span>
              <span class="badge-room">📍 ${escapeHtml(sesi.ruang || 'Kelas Kecil')}</span>
            </div>
          </div>

          ${state.status === 'sedang_berlangsung' ? `
            <div class="session-progress-bar">
              <div class="session-progress-fill" style="width: ${state.progress}%;"></div>
            </div>
          ` : ''}

          <!-- Lecturer Info -->
          <div class="session-lecturer-row">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>Dosen: <strong>${escapeHtml(sesi.dosen || matkul.catatan || 'Dosen Pengampu')}</strong></span>
          </div>

          <!-- Quick Attendance Toggle Buttons -->
          <div class="session-attendance-container">
            <div class="attendance-label">Presensi Kehadiran:</div>
            <div class="attendance-btn-grid">
              <button class="att-quick-btn att-hadir ${attStatus === 'hadir' ? 'active' : ''}" data-status="hadir">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Hadir</span>
              </button>
              <button class="att-quick-btn att-izin ${attStatus === 'izin' ? 'active' : ''}" data-status="izin">
                <span>Izin</span>
              </button>
              <button class="att-quick-btn att-sakit ${attStatus === 'sakit' ? 'active' : ''}" data-status="sakit">
                <span>Sakit</span>
              </button>
              <button class="att-quick-btn att-alpa ${attStatus === 'alpa' ? 'active' : ''}" data-status="alpa">
                <span>Alpa</span>
              </button>
            </div>
          </div>
        `;

        // Attendance click listener
        card.querySelectorAll('.att-quick-btn').forEach(b => {
          b.onclick = () => {
            const st = b.getAttribute('data-status');
            sesi.status = (sesi.status === st) ? '' : st;
            appStore.save();
            this.renderBeranda();
            this.renderAbsensi();
            showToast('success', 'Presensi Diperbarui', `${matkul.nama} (Pertemuan ${sesi.ke}) ditandai ${sesi.status || 'Belum Tercatat'}.`);
          };
        });

        // Edit session click
        const editBtn = card.querySelector('.edit-session-btn');
        if (editBtn) {
          editBtn.onclick = () => {
            window.appViews.openSessionModal(matkul.id, sesiIndex);
          };
        }

        listEl.appendChild(card);
      });
    },

    // Helper: Ambil jam mulai dan selesai matkul
    getMatkulStartTime(m) {
      if (m.sesi && m.sesi.length > 0 && m.sesi[0].mulai) return m.sesi[0].mulai;
      return '07:10';
    },

    getMatkulEndTime(m) {
      if (m.sesi && m.sesi.length > 0 && m.sesi[0].selesai) return m.sesi[0].selesai;
      return Number(m.sks) === 2 ? '08:50' : '09:40';
    },

    // Helper: Urutkan array matkul secara ketat sesuai jam mulai (mulai paling pagi ke sore)
    sortMatkulByTime(matkulArray) {
      return [...matkulArray].sort((a, b) => {
        const timeA = (a.sesi && a.sesi[0] && a.sesi[0].mulai) || '07:10';
        const timeB = (b.sesi && b.sesi[0] && b.sesi[0].mulai) || '07:10';
        if (timeA !== timeB) return timeA.localeCompare(timeB);
        return (a.nama || '').localeCompare(b.nama || '');
      });
    },

    renderJadwal(activeTab = null) {
      const container = document.getElementById('jadwalTabContent');
      if (!container) return;
      container.innerHTML = '';

      // Persist active model in store
      if (activeTab) {
        appStore.state.jadwalModel = activeTab;
      }
      const currentModel = appStore.state.jadwalModel || 'mingguan';

      // Sync active state on tabs and mobile selector
      document.querySelectorAll('.jadwal-tab-btn').forEach(btn => {
        const tab = btn.getAttribute('data-tab');
        const isActive = tab === currentModel;
        btn.classList.toggle('active', isActive);
        btn.style.background = isActive ? '#ffffff' : 'transparent';
        btn.style.color = isActive ? 'var(--teal-900)' : 'var(--neutral-600)';
        btn.style.boxShadow = isActive ? '0 1px 4px rgba(0,0,0,0.1)' : 'none';
        btn.style.fontWeight = isActive ? '800' : '700';
      });

      const mobileSel = document.getElementById('jadwalMobileModelSelect');
      if (mobileSel && mobileSel.value !== currentModel) {
        mobileSel.value = currentModel;
      }

      const allMatkul = appStore.getActiveMatkul();
      const searchQuery = (document.getElementById('jadwalSearchInput')?.value || '').toLowerCase().trim();
      const ruangFilter = document.getElementById('jadwalFilterRuang')?.value || 'all';

      // Check collision
      const clashes = checkScheduleClashes(allMatkul);
      const clashEl = document.getElementById('jadwalClashAlert');
      if (clashEl) {
        if (clashes.length > 0) {
          clashEl.style.display = 'block';
          clashEl.innerHTML = `
            <div style="background: var(--danger-50); border: 1px solid var(--danger-200); color: var(--danger-700); padding: 12px 18px; border-radius: var(--radius-xl); font-size: 13px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <span><strong>Terdeteksi ${clashes.length} Potensi Bentrok Jadwal!</strong> ${clashes[0].desc}</span>
              </div>
              <button class="btn btn-sm btn-primary" onclick="window.appViews.alignAllSchedulesSequentially()" style="font-weight: 800; padding: 6px 14px; font-size: 12px;">
                ✨ Selesaikan Otomatis (Urutkan Jam)
              </button>
            </div>
          `;
        } else {
          clashEl.style.display = 'none';
        }
      }

      if (currentModel === 'mingguan') {
        this.renderJadwalMingguan(container, allMatkul, searchQuery, ruangFilter);
      } else if (currentModel === 'matriks') {
        this.renderJadwalMatriks(container, allMatkul, searchQuery, ruangFilter);
      } else if (currentModel === 'timeline' || currentModel === 'perhari') {
        this.renderJadwalTimeline(container, allMatkul, searchQuery, ruangFilter);
      } else if (currentModel === 'kalender') {
        this.renderJadwalKalender(container, allMatkul, searchQuery, ruangFilter);
      } else if (currentModel === 'permatkul') {
        this.renderJadwalPerMatkul(container, allMatkul, searchQuery, ruangFilter);
      } else if (currentModel === 'semuapertemuan') {
        this.renderJadwalSemuaPertemuan(container, allMatkul, searchQuery, ruangFilter);
      } else {
        this.renderJadwalMingguan(container, allMatkul, searchQuery, ruangFilter);
      }
    },

    // MODEL 1: KOLOM MINGGUAN (KANBAN PER HARI DENGAN URUTAN JAM KETAT & DRAG-AND-DROP)
    renderJadwalMingguan(container, allMatkul, search, ruang) {
      const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

      // Mobile Day Filter Pills
      const dayNav = document.createElement('div');
      dayNav.className = 'jadwal-mobile-days-nav';
      dayNav.innerHTML = `
        <button class="jadwal-day-tab-btn active" data-day="all">Semua Hari</button>
        ${days.map(d => {
          const count = allMatkul.filter(m => m.hariReguler === d).length;
          return `<button class="jadwal-day-tab-btn" data-day="${d}">${d} (${count})</button>`;
        }).join('')}
      `;
      container.appendChild(dayNav);

      const wrap = document.createElement('div');
      wrap.className = 'jadwal-grid-wrap';
      wrap.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 16px;';

      days.forEach(day => {
        const dayCard = document.createElement('div');
        dayCard.className = 'card jadwal-day-card';
        dayCard.setAttribute('data-day', day);
        dayCard.style.cssText = 'padding: 16px; min-height: 160px; display: flex; flex-direction: column; gap: 10px; background: #ffffff; position: relative;';

        // Filter and STRICTLY SORT by start time
        let dayMatkuls = allMatkul.filter(m => m.hariReguler === day);
        if (search) {
          dayMatkuls = dayMatkuls.filter(m => m.nama.toLowerCase().includes(search) || m.kode.toLowerCase().includes(search) || (m.catatan||'').toLowerCase().includes(search));
        }
        if (ruang !== 'all') {
          dayMatkuls = dayMatkuls.filter(m => m.sesi && m.sesi.some(s => s.ruang === ruang));
        }
        dayMatkuls = this.sortMatkulByTime(dayMatkuls);

        dayCard.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--neutral-100); padding-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <h4 style="font-size: 15px; font-weight: 800; color: var(--teal-900); margin: 0;">${day}</h4>
              <span style="font-size: 11px; background: var(--teal-50); color: var(--teal-700); padding: 1px 8px; border-radius: 9999px; font-weight: 700;">${dayMatkuls.length} Matkul</span>
            </div>
            ${dayMatkuls.length > 0 ? `
              <button class="btn-reorder-day" onclick="window.appViews.alignDayScheduleSequentially('${day}')" title="Urutkan jam otomatis berurutan agar rapi">
                ✨ Urutkan Jam
              </button>
            ` : ''}
          </div>
          <div class="day-sessions-container" data-day="${day}" style="display: flex; flex-direction: column; gap: 10px; flex: 1;"></div>
        `;

        const sessionsContainer = dayCard.querySelector('.day-sessions-container');

        if (dayMatkuls.length === 0) {
          sessionsContainer.innerHTML = `
            <div style="font-size: 12px; color: var(--neutral-400); text-align: center; padding: 24px 0; font-style: italic; background: var(--neutral-50); border-radius: var(--radius-md); border: 1px dashed var(--neutral-200);">
              Tidak ada perkuliahan terjadwal di hari ${day}
            </div>
          `;
        } else {
          dayMatkuls.forEach((m, idx) => {
            const firstSesi = (m.sesi && m.sesi[0]) || {};
            const mulai = firstSesi.mulai || '07:10';
            const selesai = firstSesi.selesai || '09:40';
            const sItem = document.createElement('div');
            sItem.draggable = true;
            sItem.className = 'jadwal-mini-item session-card-item';
            sItem.setAttribute('data-matkul-id', m.id);
            sItem.style.cssText = `
              padding: 12px 14px;
              border-radius: var(--radius-lg);
              background: #ffffff;
              border: 1px solid var(--neutral-200);
              border-left: 5px solid ${m.warna || 'var(--teal-600)'};
              box-shadow: 0 1px 3px rgba(0,0,0,0.04);
              cursor: grab;
              transition: all 0.15s ease;
            `;

            sItem.innerHTML = `
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="font-size: 10px; font-weight: 800; background: var(--teal-900); color: #ffffff; padding: 1px 6px; border-radius: 4px;">Sesi ${idx + 1}</span>
                  <span style="font-size: 11.5px; font-weight: 800; color: var(--teal-800);">${mulai} – ${selesai} WIB</span>
                </div>
                <span style="font-size: 10px; font-weight: 800; background: var(--teal-100); color: var(--teal-800); padding: 1px 6px; border-radius: 4px;">${m.kode}</span>
              </div>
              <div style="font-size: 14px; font-weight: 800; color: var(--neutral-900); margin: 3px 0 4px; line-height: 1.25;">${escapeHtml(m.nama)}</div>
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--neutral-600); margin-bottom: 8px;">
                <span>Kelas ${m.kelas} &bull; ${m.sks} SKS</span>
                <span style="background: var(--yellow-100); color: var(--yellow-900); font-weight: 700; padding: 1px 6px; border-radius: 4px;">📍 ${escapeHtml(firstSesi.ruang || 'Kelas Kecil')}</span>
              </div>
              <div style="font-size: 10.5px; color: var(--neutral-500); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 8px;">
                ${escapeHtml(firstSesi.dosen || m.catatan || '-')}
              </div>
              <!-- Action Controls: Up/Down/Geser/Detail -->
              <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--neutral-100); padding-top: 6px;" onclick="event.stopPropagation();">
                <div style="display: flex; align-items: center; gap: 4px;">
                  <button type="button" class="btn btn-sm btn-secondary" onclick="window.appViews.moveCourseOrderInDay('${m.id}', 'up')" title="Geser urutan jam lebih awal" style="padding: 2px 6px; font-size: 10px;" ${idx === 0 ? 'disabled' : ''}>
                    ⬆️
                  </button>
                  <button type="button" class="btn btn-sm btn-secondary" onclick="window.appViews.moveCourseOrderInDay('${m.id}', 'down')" title="Geser urutan jam lebih akhir" style="padding: 2px 6px; font-size: 10px;" ${idx === dayMatkuls.length - 1 ? 'disabled' : ''}>
                    ⬇️
                  </button>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                  <button type="button" class="btn btn-sm btn-secondary" onclick="window.appViews.openGeserJadwalModal('${m.id}')" title="Geser jadwal ke hari lain atau atur jam" style="padding: 3px 8px; font-size: 10.5px; font-weight: 700; color: var(--teal-700);">
                    🔁 Geser
                  </button>
                  <button type="button" class="btn btn-sm btn-secondary" onclick="window.appViews.openSessionModal('${m.id}', 0)" title="Ubah detail sesi" style="padding: 3px 8px; font-size: 10.5px; font-weight: 700;">
                    Rincian
                  </button>
                </div>
              </div>
            `;

            // Drag and drop events
            sItem.ondragstart = (e) => {
              sItem.style.opacity = '0.5';
              e.dataTransfer.setData('text/plain', m.id);
            };
            sItem.ondragend = () => {
              sItem.style.opacity = '1';
            };

            sItem.onclick = () => {
              window.appViews.openSessionModal(m.id, 0);
            };

            sessionsContainer.appendChild(sItem);
          });
        }

        // Drop zone handlers
        dayCard.ondragover = (e) => {
          e.preventDefault();
          dayCard.style.outline = '2px dashed var(--teal-600)';
          dayCard.style.background = 'var(--teal-50)';
        };
        dayCard.ondragleave = () => {
          dayCard.style.outline = 'none';
          dayCard.style.background = '#ffffff';
        };
        dayCard.ondrop = (e) => {
          e.preventDefault();
          dayCard.style.outline = 'none';
          dayCard.style.background = '#ffffff';
          const matkulId = e.dataTransfer.getData('text/plain');
          const targetMatkul = allMatkul.find(item => item.id === matkulId);
          if (targetMatkul) {
            window.appViews.shiftMatkulDay(targetMatkul, day);
          }
        };

        wrap.appendChild(dayCard);
      });

      // Filter click handler
      dayNav.querySelectorAll('.jadwal-day-tab-btn').forEach(btn => {
        btn.onclick = () => {
          dayNav.querySelectorAll('.jadwal-day-tab-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const selectedDay = btn.getAttribute('data-day');
          wrap.querySelectorAll('.jadwal-day-card').forEach(card => {
            if (selectedDay === 'all' || card.getAttribute('data-day') === selectedDay) {
              card.style.display = 'flex';
            } else {
              card.style.display = 'none';
            }
          });
        };
      });

      container.appendChild(wrap);
    },

    // MODEL 2: MATRIKS JAM (TIMETABLE GRID 07:00 - 18:00 HARI SENIN S/D SABTU)
    renderJadwalMatriks(container, allMatkul, search, ruang) {
      const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const timeSlots = [
        { label: '07:10 – 08:50', title: 'Sesi Pagi 1A (2 SKS)', start: '07:10', end: '08:50' },
        { label: '08:50 – 09:40', title: 'Sesi Pagi 1B (Lanjutan 3 SKS)', start: '08:50', end: '09:40' },
        { label: '09:50 – 11:20', title: 'Sesi Pagi 2A', start: '09:50', end: '11:20' },
        { label: '11:20 – 12:20', title: 'Sesi Pagi 2B', start: '11:20', end: '12:20' },
        { label: '12:20 – 13:00', title: '⏸️ Istirahat & Sholat Dhuhur', isBreak: true },
        { label: '13:00 – 14:40', title: 'Sesi Siang 3A (2 SKS)', start: '13:00', end: '14:40' },
        { label: '14:40 – 15:30', title: 'Sesi Siang 3B (Lanjutan 3 SKS)', start: '14:40', end: '15:30' },
        { label: '15:40 – 17:20', title: 'Sesi Sore 4A', start: '15:40', end: '17:20' },
        { label: '17:20 – 18:10', title: 'Sesi Sore 4B', start: '17:20', end: '18:10' }
      ];

      const wrap = document.createElement('div');
      wrap.className = 'matrix-table-wrap card';
      wrap.style.cssText = 'padding: 16px 20px; overflow-x: auto; background: #ffffff;';

      wrap.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
          <div>
            <h3 style="font-size: 16px; font-weight: 800; color: var(--teal-900); margin: 0;">Matriks Jadwal Kuliah (Format SIAKAD)</h3>
            <p style="font-size: 12px; color: var(--neutral-500); margin: 2px 0 0;">Persebaran jam kuliah dari pagi hingga sore hari secara visual</p>
          </div>
          <button class="btn btn-sm btn-primary" onclick="window.appViews.alignAllSchedulesSequentially()" style="font-weight: 800;">
            ✨ Urutkan Semua Jam
          </button>
        </div>

        <table class="matrix-table" style="width: 100%; border-collapse: separate; border-spacing: 6px; min-width: 820px;">
          <thead>
            <tr>
              <th class="matrix-time-th" style="background: var(--neutral-100); padding: 10px; font-size: 12px; font-weight: 800; border-radius: 8px; width: 130px; text-align: center;">Jam / Waktu</th>
              ${days.map(d => `<th class="matrix-th" style="background: var(--teal-50); color: var(--teal-900); padding: 10px; font-size: 13px; font-weight: 800; border-radius: 8px; text-align: center;">${d}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${timeSlots.map(slot => {
              if (slot.isBreak) {
                return `
                  <tr>
                    <td style="background: var(--yellow-50); color: var(--yellow-800); font-weight: 800; font-size: 11px; padding: 8px; text-align: center; border-radius: 6px;" colspan="${days.length + 1}">
                      ${slot.title} (${slot.label})
                    </td>
                  </tr>
                `;
              }

              return `
                <tr>
                  <td style="background: var(--neutral-50); border: 1px solid var(--neutral-200); padding: 8px; font-size: 11px; font-weight: 800; text-align: center; border-radius: 6px; color: var(--teal-900);">
                    <div>${slot.label}</div>
                    <div style="font-size: 9.5px; font-weight: 600; color: var(--neutral-500);">${slot.title}</div>
                  </td>
                  ${days.map(day => {
                    // Find course active on this day and matching this time slot
                    const dayMatkuls = allMatkul.filter(m => m.hariReguler === day);
                    const matching = dayMatkuls.filter(m => {
                      const firstSesi = (m.sesi && m.sesi[0]) || {};
                      const mStart = firstSesi.mulai || '07:10';
                      const mEnd = firstSesi.selesai || '09:40';
                      // Overlap logic: startA < endB && endA > startB
                      return mStart < slot.end && mEnd > slot.start;
                    });

                    if (matching.length === 0) {
                      return `<td class="matrix-cell" style="background: var(--neutral-50); border: 1px dashed var(--neutral-200); border-radius: 6px; min-height: 48px; height: 48px;"></td>`;
                    }

                    return `
                      <td class="matrix-cell has-course" style="padding: 4px; border-radius: 6px; background: #ffffff; border: 1px solid var(--neutral-200); vertical-align: top;">
                        ${matching.map(m => `
                          <div class="matrix-course-badge" onclick="window.appViews.openSessionModal('${m.id}', 0)" style="background: ${m.warna || 'var(--teal-600)'}; color: #ffffff; padding: 6px 8px; border-radius: 6px; font-size: 11px; cursor: pointer; margin-bottom: 2px;">
                            <div style="font-weight: 800; line-height: 1.2;">${escapeHtml(m.nama)}</div>
                            <div style="font-size: 9.5px; opacity: 0.9; margin-top: 2px; display: flex; justify-content: space-between;">
                              <span>${m.sks} SKS &bull; Kls ${m.kelas}</span>
                              <span>📍 ${escapeHtml((m.sesi && m.sesi[0] && m.sesi[0].ruang) || 'Kelas Kecil')}</span>
                            </div>
                          </div>
                        `).join('')}
                      </td>
                    `;
                  }).join('')}
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;

      container.appendChild(wrap);
    },

    // MODEL 3: LINIMASA JAM (URUTAN JAM LINEAR PER HARI)
    renderJadwalTimeline(container, allMatkul, search, ruang) {
      const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const wrap = document.createElement('div');
      wrap.className = 'timeline-track-wrap';
      wrap.style.cssText = 'display: flex; flex-direction: column; gap: 16px;';

      days.forEach(day => {
        let dayMatkuls = allMatkul.filter(m => m.hariReguler === day);
        if (search) {
          dayMatkuls = dayMatkuls.filter(m => m.nama.toLowerCase().includes(search) || m.kode.toLowerCase().includes(search));
        }
        if (ruang !== 'all') {
          dayMatkuls = dayMatkuls.filter(m => m.sesi && m.sesi.some(s => s.ruang === ruang));
        }
        if (dayMatkuls.length === 0) return;

        // Sort strictly by start time
        dayMatkuls = this.sortMatkulByTime(dayMatkuls);

        const sec = document.createElement('div');
        sec.className = 'card timeline-day-card';
        sec.style.padding = '18px 20px';

        sec.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 2px solid var(--neutral-100); padding-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <h3 style="font-size: 16px; font-weight: 800; color: var(--teal-900); margin: 0;">${day}</h3>
              <span style="font-size: 11px; background: var(--teal-50); color: var(--teal-700); padding: 1px 8px; border-radius: 9999px; font-weight: 700;">${dayMatkuls.length} Mata Kuliah Terjadwal</span>
            </div>
            <button class="btn-reorder-day" onclick="window.appViews.alignDayScheduleSequentially('${day}')" title="Urutkan jam otomatis berurutan">
              ✨ Urutkan Jam
            </button>
          </div>
          <div class="timeline-strip" style="display: flex; flex-direction: column; gap: 10px;"></div>
        `;

        const list = sec.querySelector('.timeline-strip');
        dayMatkuls.forEach((m, idx) => {
          const s1 = (m.sesi && m.sesi[0]) || {};
          const row = document.createElement('div');
          row.className = 'timeline-item-row';
          row.style.cssText = `
            padding: 14px 16px;
            border-radius: var(--radius-lg);
            background: var(--neutral-50);
            border: 1px solid var(--neutral-200);
            border-left: 5px solid ${m.warna || 'var(--teal-600)'};
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
          `;

          row.innerHTML = `
            <div style="flex: 1; min-width: 240px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span style="font-size: 10px; font-weight: 800; background: var(--teal-900); color: #ffffff; padding: 1px 7px; border-radius: 4px;">Sesi ${idx + 1}</span>
                <span style="font-size: 12px; font-weight: 800; color: var(--teal-800);">${s1.mulai || '07:10'} – ${s1.selesai || '09:40'} WIB</span>
                <span style="font-size: 10px; font-weight: 800; background: var(--teal-100); color: var(--teal-800); padding: 1px 6px; border-radius: 4px;">${m.kode}</span>
              </div>
              <div style="font-size: 14.5px; font-weight: 800; color: var(--neutral-900); line-height: 1.25; margin-bottom: 4px;">${escapeHtml(m.nama)}</div>
              <div style="font-size: 11.5px; color: var(--neutral-600); display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">
                <span>Dosen: <strong>${escapeHtml(s1.dosen || m.catatan || '-')}</strong></span>
                <span>&bull;</span>
                <span>${m.sks} SKS</span>
                <span>&bull;</span>
                <span>Kelas ${m.kelas}</span>
                <span style="background: var(--yellow-100); color: var(--yellow-900); font-weight: 700; padding: 1px 6px; border-radius: 4px;">📍 ${escapeHtml(s1.ruang || 'Kelas Kecil')}</span>
              </div>
            </div>
            <div class="timeline-actions-wrap" style="display: flex; align-items: center; gap: 6px;">
              <button class="btn btn-secondary btn-sm" onclick="window.appViews.moveCourseOrderInDay('${m.id}', 'up')" title="Geser lebih awal" ${idx === 0 ? 'disabled' : ''}>⬆️</button>
              <button class="btn btn-secondary btn-sm" onclick="window.appViews.moveCourseOrderInDay('${m.id}', 'down')" title="Geser lebih akhir" ${idx === dayMatkuls.length - 1 ? 'disabled' : ''}>⬇️</button>
              <button class="btn btn-secondary btn-sm" onclick="window.appViews.openGeserJadwalModal('${m.id}')" style="font-weight: 700; color: var(--teal-700);">🔁 Geser</button>
              <button class="btn btn-secondary btn-sm" onclick="window.appViews.openSessionModal('${m.id}', 0)">Rincian</button>
            </div>
          `;
          list.appendChild(row);
        });

        wrap.appendChild(sec);
      });

      container.appendChild(wrap);
    },

    // MODEL 4: KALENDER BULANAN SEMESTER
    renderJadwalKalender(container, allMatkul, search, ruang) {
      const wrap = document.createElement('div');
      wrap.className = 'card';
      wrap.style.padding = '18px 20px';

      const months = [
        { label: 'Agustus 2026', y: 2026, m: 7 },
        { label: 'September 2026', y: 2026, m: 8 },
        { label: 'Oktober 2026', y: 2026, m: 9 },
        { label: 'November 2026', y: 2026, m: 10 },
        { label: 'Desember 2026', y: 2026, m: 11 }
      ];

      if (!window.activeCalendarMonthIdx) window.activeCalendarMonthIdx = 0;
      const currentMonth = months[window.activeCalendarMonthIdx] || months[0];

      wrap.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
          <div>
            <h3 style="font-size: 16px; font-weight: 800; color: var(--teal-900); margin: 0;">Kalender Akademik Semester 1</h3>
            <p style="font-size: 12px; color: var(--neutral-500); margin: 2px 0 0;">Klik tanggal untuk melihat perkuliahan dan status kehadiran</p>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; width: 100%; max-width: 400px;">
            <button class="btn btn-sm btn-secondary" id="calPrevMonthBtn" ${window.activeCalendarMonthIdx === 0 ? 'disabled' : ''} style="flex: 1; padding: 6px 8px; font-size: 11.5px; justify-content: center;">&larr; Prev</button>
            <span style="font-size: 13px; font-weight: 800; color: var(--teal-900); text-align: center; flex: 1.2; white-space: nowrap;">${currentMonth.label}</span>
            <button class="btn btn-sm btn-secondary" id="calNextMonthBtn" ${window.activeCalendarMonthIdx === months.length - 1 ? 'disabled' : ''} style="flex: 1; padding: 6px 8px; font-size: 11.5px; justify-content: center;">Next &rarr;</button>
          </div>
        </div>

        <div style="overflow-x: auto; -webkit-overflow-scrolling: touch; width: 100%;">
          <div style="min-width: 320px;">
            <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; text-align: center; font-weight: 800; font-size: 11px; color: var(--teal-900); margin-bottom: 6px;">
              <div style="color: var(--danger-600);">Min</div>
              <div>Sen</div>
              <div>Sel</div>
              <div>Rab</div>
              <div>Kam</div>
              <div>Jum</div>
              <div>Sab</div>
            </div>
            <div id="calendarGridDays" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px;"></div>
          </div>
        </div>
      `;

      const gridEl = wrap.querySelector('#calendarGridDays');
      const firstDay = new Date(currentMonth.y, currentMonth.m, 1).getDay();
      const totalDays = new Date(currentMonth.y, currentMonth.m + 1, 0).getDate();

      // Empty lead days
      for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.style.cssText = 'height: 85px; background: var(--neutral-50); border-radius: 6px; opacity: 0.4;';
        gridEl.appendChild(emptyCell);
      }

      // Populate days
      for (let d = 1; d <= totalDays; d++) {
        const dateStr = `${currentMonth.y}-${String(currentMonth.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayCell = document.createElement('div');
        dayCell.style.cssText = 'height: 85px; background: #ffffff; border: 1px solid var(--neutral-200); border-radius: 6px; padding: 4px; display: flex; flex-direction: column; overflow: hidden;';

        // Check sessions on this date
        const matchingSessions = [];
        allMatkul.forEach(m => {
          if (m.sesi) {
            m.sesi.forEach(s => {
              if (s.tanggal === dateStr) {
                matchingSessions.push({ matkul: m, sesi: s });
              }
            });
          }
        });

        dayCell.innerHTML = `
          <div style="font-size: 11px; font-weight: 800; color: ${matchingSessions.length > 0 ? 'var(--teal-800)' : 'var(--neutral-600)'}; text-align: right; margin-bottom: 2px;">
            ${d}
          </div>
          <div style="display: flex; flex-direction: column; gap: 2px; overflow-y: auto; flex: 1;">
            ${matchingSessions.map(ms => `
              <div onclick="window.appViews.openSessionModal('${ms.matkul.id}', 0)" title="${escapeHtml(ms.matkul.nama)} (${ms.sesi.mulai}-${ms.sesi.selesai})" style="background: ${ms.matkul.warna || 'var(--teal-600)'}; color: #ffffff; font-size: 9px; font-weight: 700; padding: 2px 4px; border-radius: 3px; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${escapeHtml(ms.matkul.nama)}
              </div>
            `).join('')}
          </div>
        `;

        gridEl.appendChild(dayCell);
      }

      // Prev / next buttons
      wrap.querySelector('#calPrevMonthBtn').onclick = () => {
        if (window.activeCalendarMonthIdx > 0) {
          window.activeCalendarMonthIdx--;
          appRenderer.renderJadwal('kalender');
        }
      };
      wrap.querySelector('#calNextMonthBtn').onclick = () => {
        if (window.activeCalendarMonthIdx < months.length - 1) {
          window.activeCalendarMonthIdx++;
          appRenderer.renderJadwal('kalender');
        }
      };

      container.appendChild(wrap);
    },

    // MODEL 5: KARTU PER MATKUL (LENGKAP DENGAN SKS, PROGRES KEHADIRAN & DETAIL SESI)
    renderJadwalPerMatkul(container, allMatkul, search, ruang) {
      const wrap = document.createElement('div');
      wrap.className = 'jadwal-permatkul-grid';
      wrap.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px;';

      allMatkul.forEach(m => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.cssText = `border-top: 5px solid ${m.warna}; padding: 18px 20px; display: flex; flex-direction: column; gap: 10px;`;

        const hadirCount = m.sesi ? m.sesi.filter(s => s.status === 'hadir').length : 0;
        const totalSesi = m.sesi ? m.sesi.length : 0;
        const pct = totalSesi > 0 ? Math.round((hadirCount / totalSesi) * 100) : 0;
        const firstS = (m.sesi && m.sesi[0]) || {};

        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <span style="font-size: 11px; font-weight: 700; color: var(--teal-700);">${m.kode} &bull; Kelas ${m.kelas} &bull; ${m.sks} SKS</span>
              <h4 style="font-size: 15px; font-weight: 800; color: var(--neutral-900); margin: 2px 0;">${escapeHtml(m.nama)}</h4>
            </div>
            <div style="display: flex; gap: 4px;">
              <button class="btn btn-secondary btn-sm" onclick="window.appViews.openGeserJadwalModal('${m.id}')" title="Geser jadwal matkul ini" style="font-weight: 700; color: var(--teal-700);">🔁 Geser</button>
              <button class="btn btn-secondary btn-sm" onclick="window.appViews.openSessionModal('${m.id}', 0)">Ubah</button>
            </div>
          </div>
          <div style="font-size: 12px; color: var(--neutral-600);">
            Hari: <strong>${m.hariReguler}</strong> &bull; Jam: <strong>${firstS.mulai || '07:10'} – ${firstS.selesai || '09:40'} WIB</strong> &bull; ${totalSesi} Pertemuan
          </div>
          <div style="font-size: 11.5px; color: var(--neutral-500); line-height: 1.3;">${escapeHtml(m.catatan || '')}</div>
          
          <div style="margin-top: 6px;">
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px;">
              <span style="color: var(--neutral-500);">Progres Kehadiran:</span>
              <span style="font-weight: 700; color: var(--teal-700);">${hadirCount} / ${totalSesi} (${pct}%)</span>
            </div>
            <div style="width: 100%; height: 6px; background: var(--neutral-200); border-radius: 9999px; overflow: hidden;">
              <div style="width: ${pct}%; height: 100%; background: ${pct >= 75 ? 'var(--teal-600)' : 'var(--danger-500)'};"></div>
            </div>
          </div>

          <details style="margin-top: 8px; font-size: 12px; border-top: 1px solid var(--neutral-100); padding-top: 6px;">
            <summary style="cursor: pointer; color: var(--teal-700); font-weight: 700;">Lihat Semua ${totalSesi} Pertemuan</summary>
            <div style="margin-top: 8px; display: flex; flex-direction: column; gap: 4px; max-height: 200px; overflow-y: auto;">
              ${(m.sesi || []).map(s => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 6px; border-radius: 4px; background: var(--neutral-50); font-size: 11px;">
                  <span>Ke-${s.ke} (${formatShortDate(s.tanggal)} &bull; ${s.mulai}-${s.selesai})</span>
                  <span style="font-weight: 600; color: ${s.status === 'hadir' ? 'var(--teal-700)' : 'var(--neutral-500)'};">${s.status ? s.status.toUpperCase() : 'BELUM'}</span>
                </div>
              `).join('')}
            </div>
          </details>
        `;

        wrap.appendChild(card);
      });

      container.appendChild(wrap);
    },

    // MODEL 6: TABEL SEMUA PERTEMUAN
    renderJadwalPerHari(container, allMatkul, search, ruang) {
      // Alias to Timeline model
      this.renderJadwalTimeline(container, allMatkul, search, ruang);
    },

    renderJadwalSemuaPertemuan(container, allMatkul, search, ruang) {
      const wrap = document.createElement('div');
      wrap.className = 'card';
      wrap.style.padding = '16px 20px';

      const allSessionsFlat = [];
      allMatkul.forEach(m => {
        m.sesi.forEach((s, idx) => {
          allSessionsFlat.push({ matkul: m, sesi: s, sesiIndex: idx });
        });
      });
      allSessionsFlat.sort((a, b) => a.sesi.tanggal.localeCompare(b.sesi.tanggal));

      wrap.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <h3 style="font-size: 15px; font-weight: 800; color: var(--teal-900); margin: 0;">Kronologi Seluruh Pertemuan Semester</h3>
          <span style="font-size: 11px; background: var(--teal-100); color: var(--teal-800); padding: 2px 8px; border-radius: 9999px; font-weight: 700;">${allSessionsFlat.length} Sesi</span>
        </div>

        <!-- Mobile Card List View -->
        <div class="mobile-meetings-list" style="display: flex; flex-direction: column; gap: 8px;">
          ${allSessionsFlat.map(item => `
            <div style="padding: 10px 12px; border-radius: 10px; background: var(--neutral-50); border: 1px solid var(--neutral-200); border-left: 4px solid ${item.matkul.warna || 'var(--teal-600)'};">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                <span style="font-size: 11px; font-weight: 800; color: var(--teal-800);">${formatShortDate(item.sesi.tanggal)} &bull; ${item.sesi.mulai}–${item.sesi.selesai} WIB</span>
                <span style="padding: 2px 7px; border-radius: 9999px; font-size: 10px; font-weight: 800; background: ${item.sesi.status === 'hadir' ? 'var(--teal-100)' : (item.sesi.status === 'izin' ? 'var(--yellow-100)' : 'var(--neutral-200)')}; color: ${item.sesi.status === 'hadir' ? 'var(--teal-800)' : (item.sesi.status === 'izin' ? 'var(--yellow-800)' : 'var(--neutral-600)')};">
                  ${item.sesi.status ? item.sesi.status.toUpperCase() : 'BELUM'}
                </span>
              </div>
              <div style="font-size: 13.5px; font-weight: 800; color: var(--neutral-900); line-height: 1.25;">${escapeHtml(item.matkul.nama)} (Ke-${item.sesi.ke})</div>
              <div style="font-size: 11px; color: var(--neutral-500); margin-top: 3px; display: flex; justify-content: space-between; align-items: center;">
                <span style="background: var(--yellow-100); color: var(--yellow-900); font-weight: 700; padding: 1px 6px; border-radius: 4px;">📍 ${escapeHtml(item.sesi.ruang || 'Kelas Kecil')}</span>
                <span>${escapeHtml(item.sesi.dosen || '-')}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      container.appendChild(wrap);
    },

    renderAbsensi() {
      const allMatkul = appStore.getActiveMatkul();
      const cardsList = document.getElementById('absensiCardsList');
      if (!cardsList) return;
      cardsList.innerHTML = '';

      let totalHadir = 0;
      let totalIzin = 0;
      let totalSakit = 0;
      let totalAlpa = 0;
      let totalPertemuan = 0;

      const lowAttMatkul = [];

      allMatkul.forEach(m => {
        let mHadir = 0, mIzin = 0, mSakit = 0, mAlpa = 0;
        m.sesi.forEach(s => {
          if (s.status === 'hadir') mHadir++;
          else if (s.status === 'izin') mIzin++;
          else if (s.status === 'sakit') mSakit++;
          else if (s.status === 'alpa') mAlpa++;
        });

        totalHadir += mHadir;
        totalIzin += mIzin;
        totalSakit += mSakit;
        totalAlpa += mAlpa;
        totalPertemuan += m.sesi.length;

        const pct = m.sesi.length > 0 ? Math.round((mHadir / m.sesi.length) * 100) : 0;
        if (pct < appStore.state.settings.minKehadiran && m.sesi.length > 0) {
          lowAttMatkul.push({ nama: m.nama, pct });
        }

        const card = document.createElement('div');
        card.className = 'card';
        card.style.cssText = 'padding: 20px; display: flex; flex-direction: column; gap: 14px;';

        card.innerHTML = `
          <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 10px;">
            <div>
              <div style="font-size: 11.5px; font-weight: 700; color: var(--teal-700);">${m.kode} &bull; Kelas ${m.kelas} &bull; ${m.sks} SKS</div>
              <h3 style="font-size: 16px; font-weight: 800; color: var(--neutral-900);">${escapeHtml(m.nama)}</h3>
              <div style="font-size: 11.5px; color: var(--neutral-500); margin-top: 2px;">Dosen: ${escapeHtml(m.catatan || '')}</div>
            </div>

            <div style="text-align: right;">
              <div style="font-size: 20px; font-weight: 800; color: ${pct >= 75 ? 'var(--teal-700)' : 'var(--danger-600)'};">${pct}%</div>
              <div style="font-size: 11px; color: var(--neutral-500);">${mHadir} dari ${m.sesi.length} Pertemuan</div>
            </div>
          </div>

          <!-- Progress Bar -->
          <div style="width: 100%; height: 7px; background: var(--neutral-200); border-radius: 9999px; overflow: hidden;">
            <div style="width: ${pct}%; height: 100%; background: ${pct >= 75 ? 'linear-gradient(90deg, var(--teal-500), var(--teal-600))' : 'var(--danger-500)'};"></div>
          </div>

          <!-- Counters with Big +/- Buttons -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 10px; background: var(--neutral-50); padding: 12px; border-radius: var(--radius-md);">
            <div style="text-align: center;">
              <div style="font-size: 11px; font-weight: 700; color: var(--teal-700);">HADIR</div>
              <div style="font-size: 18px; font-weight: 800; color: var(--teal-800); margin: 2px 0;">${mHadir}</div>
              <div style="display: flex; justify-content: center; gap: 4px;">
                <button class="btn btn-secondary btn-sm att-adj-btn" data-type="hadir" data-delta="-1" style="padding: 2px 8px;">-</button>
                <button class="btn btn-primary btn-sm att-adj-btn" data-type="hadir" data-delta="1" style="padding: 2px 8px;">+</button>
              </div>
            </div>

            <div style="text-align: center;">
              <div style="font-size: 11px; font-weight: 700; color: var(--yellow-700);">IZIN</div>
              <div style="font-size: 18px; font-weight: 800; color: var(--yellow-700); margin: 2px 0;">${mIzin}</div>
              <div style="display: flex; justify-content: center; gap: 4px;">
                <button class="btn btn-secondary btn-sm att-adj-btn" data-type="izin" data-delta="-1" style="padding: 2px 8px;">-</button>
                <button class="btn btn-accent btn-sm att-adj-btn" data-type="izin" data-delta="1" style="padding: 2px 8px;">+</button>
              </div>
            </div>

            <div style="text-align: center;">
              <div style="font-size: 11px; font-weight: 700; color: #0284C7;">SAKIT</div>
              <div style="font-size: 18px; font-weight: 800; color: #0284C7; margin: 2px 0;">${mSakit}</div>
              <div style="display: flex; justify-content: center; gap: 4px;">
                <button class="btn btn-secondary btn-sm att-adj-btn" data-type="sakit" data-delta="-1" style="padding: 2px 8px;">-</button>
                <button class="btn btn-secondary btn-sm att-adj-btn" data-type="sakit" data-delta="1" style="padding: 2px 8px; background: #0284C7; color: #fff;">+</button>
              </div>
            </div>

            <div style="text-align: center;">
              <div style="font-size: 11px; font-weight: 700; color: var(--danger-600);">ALPA</div>
              <div style="font-size: 18px; font-weight: 800; color: var(--danger-600); margin: 2px 0;">${mAlpa}</div>
              <div style="display: flex; justify-content: center; gap: 4px;">
                <button class="btn btn-secondary btn-sm att-adj-btn" data-type="alpa" data-delta="-1" style="padding: 2px 8px;">-</button>
                <button class="btn btn-danger btn-sm att-adj-btn" data-type="alpa" data-delta="1" style="padding: 2px 8px;">+</button>
              </div>
            </div>
          </div>

          <!-- Meeting-by-Meeting Sync Checklist -->
          <div>
            <div style="font-size: 12px; font-weight: 700; color: var(--neutral-700); margin-bottom: 6px;">Checklist Per Pertemuan (Sinkron Otomatis):</div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${m.sesi.map((s, idx) => `
                <button class="ses-check-btn btn btn-sm ${s.status === 'hadir' ? 'btn-primary' : (s.status === 'izin' ? 'btn-accent' : (s.status === 'sakit' ? 'btn-secondary' : (s.status === 'alpa' ? 'btn-danger' : 'btn-secondary')))}" data-matkul="${m.id}" data-idx="${idx}" style="padding: 4px 8px; font-size: 11px;">
                  Ke-${s.ke}
                </button>
              `).join('')}
            </div>
          </div>
        `;

        // +/- listeners
        card.querySelectorAll('.att-adj-btn').forEach(btn => {
          btn.onclick = () => {
            const type = btn.getAttribute('data-type');
            const delta = parseInt(btn.getAttribute('data-delta'), 10);
            if (delta > 0) {
              // Mark the first available unmarked meeting
              const unmarked = m.sesi.find(s => !s.status);
              if (unmarked) unmarked.status = type;
              else {
                // Change the last meeting
                if (m.sesi.length > 0) m.sesi[m.sesi.length - 1].status = type;
              }
            } else {
              // Unmark the last meeting of this type
              const lastOfType = [...m.sesi].reverse().find(s => s.status === type);
              if (lastOfType) lastOfType.status = '';
            }
            appStore.save();
            this.renderAbsensi();
            this.renderBeranda();
          };
        });

        // Meeting button click cycles status: '' -> hadir -> izin -> sakit -> alpa -> ''
        card.querySelectorAll('.ses-check-btn').forEach(btn => {
          btn.onclick = () => {
            const idx = parseInt(btn.getAttribute('data-idx'), 10);
            const ses = m.sesi[idx];
            const flow = ['', 'hadir', 'izin', 'sakit', 'alpa'];
            const curIdx = flow.indexOf(ses.status || '');
            ses.status = flow[(curIdx + 1) % flow.length];
            appStore.save();
            this.renderAbsensi();
            this.renderBeranda();
          };
        });

        cardsList.appendChild(card);
      });

      // Update Header Rekap Absensi
      const hEl = document.getElementById('rekapTotalHadir');
      const iEl = document.getElementById('rekapTotalIzin');
      const sEl = document.getElementById('rekapTotalSakit');
      const aEl = document.getElementById('rekapTotalAlpa');
      const avgEl = document.getElementById('rekapPersentaseAvg');

      if (hEl) hEl.textContent = totalHadir;
      if (iEl) iEl.textContent = totalIzin;
      if (sEl) sEl.textContent = totalSakit;
      if (aEl) aEl.textContent = totalAlpa;
      const avgPct = totalPertemuan > 0 ? Math.round((totalHadir / totalPertemuan) * 100) : 0;
      if (avgEl) avgEl.textContent = `${avgPct}%`;

      // Warning container
      const warnBox = document.getElementById('attendanceWarningContainer');
      if (warnBox) {
        if (lowAttMatkul.length > 0) {
          warnBox.innerHTML = `
            <div style="background: var(--danger-50); border: 1px solid var(--danger-100); color: var(--danger-600); padding: 14px 18px; border-radius: var(--radius-md); font-size: 13px;">
              <strong>⚠️ Peringatan Kehadiran Kritis:</strong> ${lowAttMatkul.map(l => `${l.nama} (${l.pct}%)`).join(', ')} berada di bawah batas minimal ${appStore.state.settings.minKehadiran}%. Segera koordinasikan dengan dosen pengampu!
            </div>
          `;
        } else {
          warnBox.innerHTML = '';
        }
      }
    }
  };

  // Clash Detection Helper
  function checkScheduleClashes(allMatkul) {
    const dateMap = {};
    const clashes = [];

    allMatkul.forEach(m => {
      m.sesi.forEach(s => {
        if (!dateMap[s.tanggal]) dateMap[s.tanggal] = [];
        dateMap[s.tanggal].push({ matkul: m, sesi: s });
      });
    });

    Object.keys(dateMap).forEach(date => {
      const items = dateMap[date];
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const a = items[i];
          const b = items[j];
          // Check overlap: startA < endB && endA > startB
          if (a.sesi.mulai < b.sesi.selesai && a.sesi.selesai > b.sesi.mulai) {
            clashes.push({
              date,
              desc: `${a.matkul.nama} (${a.sesi.mulai}-${a.sesi.selesai}) tumpang tindih dengan ${b.matkul.nama} (${b.sesi.mulai}-${b.sesi.selesai}) pada ${formatDateIndo(date)}.`
            });
          }
        }
      }
    });

    return clashes;
  }

  // Views & Modal Event Handlers
  const appViews = {
    openSessionModal(matkulId, sesiIndex) {
      const allMatkul = appStore.getActiveMatkul();
      const matkul = allMatkul.find(m => m.id === matkulId);
      if (!matkul) return;
      const sesi = matkul.sesi[sesiIndex] || matkul.sesi[0] || {};

      document.getElementById('sesFormMatkulId').value = matkulId;
      document.getElementById('sesFormKeIndex').value = sesiIndex;

      // Populate matkul select
      const select = document.getElementById('sesFormMatkulSelect');
      select.innerHTML = allMatkul.map(m => `<option value="${m.id}" ${m.id === matkulId ? 'selected' : ''}>${escapeHtml(m.nama)} (${m.kode})</option>`).join('');

      document.getElementById('sesFormKe').value = sesi.ke || 1;
      document.getElementById('sesFormTanggal').value = sesi.tanggal || getTodayIso();
      document.getElementById('sesFormMulai').value = sesi.mulai || '07:10';
      document.getElementById('sesFormSelesai').value = sesi.selesai || '09:40';
      document.getElementById('sesFormRuang').value = sesi.ruang || 'Kelas Kecil';
      document.getElementById('sesFormStatus').value = sesi.status || '';
      document.getElementById('sesFormDosen').value = sesi.dosen || '';

      document.getElementById('sessionModal').classList.add('active');
    },

    saveSession() {
      const matkulId = document.getElementById('sesFormMatkulId').value;
      const sesiIndex = parseInt(document.getElementById('sesFormKeIndex').value, 10);
      const allMatkul = appStore.getActiveMatkul();
      const matkul = allMatkul.find(m => m.id === matkulId);
      if (!matkul) return;

      const ke = parseInt(document.getElementById('sesFormKe').value, 10);
      const tanggal = document.getElementById('sesFormTanggal').value;
      const mulai = document.getElementById('sesFormMulai').value;
      const selesai = document.getElementById('sesFormSelesai').value;
      const ruang = document.getElementById('sesFormRuang').value;
      const status = document.getElementById('sesFormStatus').value;
      const dosen = document.getElementById('sesFormDosen').value;
      const moveScope = document.querySelector('input[name="moveScope"]:checked')?.value || 'single';

      if (selesai <= mulai) {
        showToast('error', 'Jam Tidak Valid', 'Jam selesai harus lebih akhir dari jam mulai!');
        return;
      }

      if (moveScope === 'all_future') {
        // Calculate new weekday from tanggal
        const targetDate = new Date(tanggal + 'T00:00:00');
        const newDayName = DAYS_ID[targetDate.getDay()];
        matkul.hariReguler = newDayName;

        // Shift future meetings
        const todayIso = getTodayIso();
        matkul.sesi.forEach((s, idx) => {
          if (idx >= sesiIndex || s.tanggal >= todayIso) {
            s.mulai = mulai;
            s.selesai = selesai;
            s.ruang = ruang;
            if (dosen) s.dosen = dosen;
          }
        });
      }

      // Update current session
      if (matkul.sesi[sesiIndex]) {
        Object.assign(matkul.sesi[sesiIndex], { ke, tanggal, mulai, selesai, ruang, status, dosen });
      }

      appStore.save();
      document.getElementById('sessionModal').classList.remove('active');
      appRenderer.renderAll();
      showToast('success', 'Jadwal Disimpan', `Perubahan jadwal untuk ${matkul.nama} berhasil disimpan.`);
    },

    // Menghitung slot waktu berurutan standar UPNVJ untuk mata kuliah dalam satu hari
    calculateSequentialSlots(matkulsInDay) {
      const result = [];
      matkulsInDay.forEach((m, idx) => {
        const sks = Number(m.sks) || 3;
        let mulai = '07:10';
        let selesai = sks === 2 ? '08:50' : '09:40';

        if (idx === 0) {
          mulai = '07:10';
          selesai = sks === 2 ? '08:50' : '09:40';
        } else if (idx === 1) {
          const prevEnd = result[0].selesai;
          if (prevEnd === '08:50') {
            mulai = '08:50';
            selesai = sks === 2 ? '10:30' : '11:20';
          } else {
            mulai = '09:50';
            selesai = sks === 2 ? '11:30' : '12:20';
          }
        } else if (idx === 2) {
          mulai = '13:00';
          selesai = sks === 2 ? '14:40' : '15:30';
        } else {
          mulai = '15:40';
          selesai = sks === 2 ? '17:20' : '18:10';
        }

        result.push({ matkul: m, mulai, selesai });
      });
      return result;
    },

    // Geser tanggal seluruh sesi ke hari baru dalam minggu akademik yang sama
    shiftSessionDates(sesiArray, targetDayName) {
      const DAYS_ORDER = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const targetDayIdx = DAYS_ORDER.indexOf(targetDayName);
      if (targetDayIdx === -1 || !sesiArray) return;

      sesiArray.forEach(s => {
        if (!s.tanggal) return;
        const d = new Date(s.tanggal + 'T00:00:00');
        if (isNaN(d.getTime())) return;
        const currentDayIdx = d.getDay();
        const diff = targetDayIdx - currentDayIdx;
        d.setDate(d.getDate() + diff);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        s.tanggal = `${y}-${m}-${day}`;
      });
    },

    // Otomatis urutkan jadwal suatu hari agar rapi dan berurutan sesuai jam
    alignDayScheduleSequentially(dayName, silent = false) {
      const allMatkul = appStore.getActiveMatkul();
      let dayMatkuls = allMatkul.filter(m => m.hariReguler === dayName);
      if (dayMatkuls.length === 0) return;

      dayMatkuls = appRenderer.sortMatkulByTime(dayMatkuls);
      const plannedSlots = this.calculateSequentialSlots(dayMatkuls);

      plannedSlots.forEach(plan => {
        const m = plan.matkul;
        if (m.sesi) {
          m.sesi.forEach(s => {
            s.mulai = plan.mulai;
            s.selesai = plan.selesai;
          });
        }
      });

      appStore.save();
      if (!silent) {
        appRenderer.renderAll();
        showToast('success', 'Jadwal Diurutkan Rapi', `Seluruh mata kuliah di hari ${dayName} (${dayMatkuls.length} matkul) berhasil diurutkan jamnya secara rapi & berurutan.`);
      }
    },

    // Otomatis urutkan jadwal seluruh hari Senin s/d Sabtu
    alignAllSchedulesSequentially() {
      const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      days.forEach(d => {
        this.alignDayScheduleSequentially(d, true);
      });
      appStore.save();
      appRenderer.renderAll();
      showToast('success', 'Semua Jadwal Diurutkan Rapi', 'Seluruh jadwal perkuliahan Senin s/d Sabtu telah diurutkan jamnya secara berurutan dan bebas dari bentrok!');
    },

    // Geser urutan matkul dalam satu hari (lebih awal / lebih akhir) dan otomatis sesuaikan jamnya
    moveCourseOrderInDay(matkulId, direction) {
      const allMatkul = appStore.getActiveMatkul();
      const target = allMatkul.find(m => m.id === matkulId);
      if (!target) return;

      const day = target.hariReguler;
      let dayMatkuls = appRenderer.sortMatkulByTime(allMatkul.filter(m => m.hariReguler === day));
      const currentIdx = dayMatkuls.findIndex(m => m.id === matkulId);

      if (direction === 'up' && currentIdx > 0) {
        const temp = dayMatkuls[currentIdx];
        dayMatkuls[currentIdx] = dayMatkuls[currentIdx - 1];
        dayMatkuls[currentIdx - 1] = temp;
      } else if (direction === 'down' && currentIdx < dayMatkuls.length - 1) {
        const temp = dayMatkuls[currentIdx];
        dayMatkuls[currentIdx] = dayMatkuls[currentIdx + 1];
        dayMatkuls[currentIdx + 1] = temp;
      } else {
        return;
      }

      // Hitung ulang slot waktu berurutan
      const planned = this.calculateSequentialSlots(dayMatkuls);
      planned.forEach(p => {
        if (p.matkul.sesi) {
          p.matkul.sesi.forEach(s => {
            s.mulai = p.mulai;
            s.selesai = p.selesai;
          });
        }
      });

      appStore.save();
      appRenderer.renderAll();
      showToast('success', 'Urutan Jam Digeser', `${target.nama} berhasil digeser ${direction === 'up' ? 'lebih awal' : 'lebih akhir'} dan jamnya otomatis disesuaikan berurutan.`);
    },

    // Memindahkan matkul ke hari lain (Drag & Drop atau Programmatic) dengan penyesuaian jam otomatis berurutan
    shiftMatkulDay(matkul, newDayName, customMulai = null, customSelesai = null) {
      const oldDay = matkul.hariReguler;
      matkul.hariReguler = newDayName;

      // Geser tanggal sesi agar kalender dan absensi sinkron dengan hari baru
      this.shiftSessionDates(matkul.sesi, newDayName);

      if (customMulai && customSelesai) {
        if (matkul.sesi) {
          matkul.sesi.forEach(s => {
            s.mulai = customMulai;
            s.selesai = customSelesai;
          });
        }
      } else {
        // Otomatis sesuaikan berurutan di hari tujuan
        this.alignDayScheduleSequentially(newDayName, true);
      }

      // Rapikan juga hari asal jika berbeda
      if (oldDay && oldDay !== newDayName) {
        this.alignDayScheduleSequentially(oldDay, true);
      }

      appStore.save();
      appRenderer.renderAll();
      const firstS = (matkul.sesi && matkul.sesi[0]) || {};
      showToast('success', 'Jadwal Berhasil Digeser', `${matkul.nama} berhasil dipindahkan ke hari ${newDayName} dan jam otomatis disesuaikan berurutan (${firstS.mulai || ''} – ${firstS.selesai || ''} WIB).`);
    },

    // Buka Modal Pergeseran Jadwal & Urutan Jam
    openGeserJadwalModal(matkulId = null) {
      const allMatkul = appStore.getActiveMatkul();
      if (allMatkul.length === 0) {
        showToast('info', 'Belum Ada Matkul', 'Silakan tambahkan mata kuliah terlebih dahulu.');
        return;
      }

      const modal = document.getElementById('modalGeserJadwal');
      if (!modal) return;

      const select = document.getElementById('geserMatkulSelect');
      const targetMatkulId = matkulId || allMatkul[0].id;

      select.innerHTML = allMatkul.map(m => `
        <option value="${m.id}" ${m.id === targetMatkulId ? 'selected' : ''}>
          ${escapeHtml(m.nama)} (${m.kode}) &bull; ${m.hariReguler}
        </option>
      `).join('');

      const activeMatkul = allMatkul.find(m => m.id === targetMatkulId) || allMatkul[0];
      const targetDayInput = document.getElementById('geserTargetDay');
      targetDayInput.value = activeMatkul.hariReguler || 'Senin';

      // Update pills
      document.querySelectorAll('.geser-day-pill').forEach(pill => {
        pill.classList.toggle('active', pill.getAttribute('data-day') === targetDayInput.value);
        if (pill.getAttribute('data-day') === targetDayInput.value) {
          pill.style.background = 'var(--teal-600)';
          pill.style.color = '#ffffff';
        } else {
          pill.style.background = 'var(--neutral-100)';
          pill.style.color = 'var(--neutral-700)';
        }
      });

      this.updateGeserPreview();
      modal.classList.add('active');
    },

    // Perbarui Pratinjau Urutan Jam di Modal Pergeseran
    updateGeserPreview() {
      const allMatkul = appStore.getActiveMatkul();
      const selId = document.getElementById('geserMatkulSelect')?.value;
      const targetDay = document.getElementById('geserTargetDay')?.value || 'Senin';
      const activeMatkul = allMatkul.find(m => m.id === selId);
      if (!activeMatkul) return;

      // Update current info
      const infoBox = document.getElementById('geserCurrentInfo');
      const s0 = (activeMatkul.sesi && activeMatkul.sesi[0]) || {};
      if (infoBox) {
        infoBox.innerHTML = `
          <strong>Status Saat Ini:</strong> Hari <strong>${activeMatkul.hariReguler}</strong>, Jam <strong>${s0.mulai || '07:10'} – ${s0.selesai || '09:40'} WIB</strong> (${activeMatkul.sks} SKS, Kelas ${activeMatkul.kelas})
        `;
      }

      // Compute simulated sequence on target day
      const otherInTargetDay = allMatkul.filter(m => m.hariReguler === targetDay && m.id !== activeMatkul.id);
      const simulatedList = [...otherInTargetDay, activeMatkul];
      const planned = this.calculateSequentialSlots(simulatedList);

      const previewBox = document.getElementById('geserPreviewList');
      if (previewBox) {
        previewBox.innerHTML = planned.map((p, idx) => {
          const isThis = p.matkul.id === activeMatkul.id;
          return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; border-radius: 6px; font-size: 11.5px; background: ${isThis ? 'var(--teal-50)' : 'var(--neutral-50)'}; border: 1px solid ${isThis ? 'var(--teal-300)' : 'var(--neutral-200)'};">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 10px; font-weight: 800; background: ${isThis ? 'var(--teal-700)' : 'var(--neutral-400)'}; color: #ffffff; padding: 1px 6px; border-radius: 4px;">Sesi ${idx + 1}</span>
                <span style="font-weight: 800; color: ${isThis ? 'var(--teal-900)' : 'var(--neutral-800)'};">${escapeHtml(p.matkul.nama)} ${isThis ? '👈 (Matkul Ini)' : ''}</span>
              </div>
              <span style="font-weight: 800; color: var(--teal-800);">${p.mulai} – ${p.selesai} WIB</span>
            </div>
          `;
        }).join('');
      }
    },

    // Terapkan Pergeseran dari Modal
    applyGeserJadwal() {
      const allMatkul = appStore.getActiveMatkul();
      const selId = document.getElementById('geserMatkulSelect')?.value;
      const targetDay = document.getElementById('geserTargetDay')?.value;
      const timeMode = document.querySelector('input[name="geserTimeMode"]:checked')?.value || 'auto_sequential';
      const targetMatkul = allMatkul.find(m => m.id === selId);

      if (!targetMatkul || !targetDay) return;

      let customMulai = null;
      let customSelesai = null;

      if (timeMode === 'choose_slot') {
        const slotVal = document.getElementById('geserSlotSelect')?.value || '07:10|09:40';
        const parts = slotVal.split('|');
        customMulai = parts[0];
        customSelesai = parts[1];
      } else if (timeMode === 'custom_time') {
        customMulai = document.getElementById('geserCustomMulai')?.value || '07:10';
        customSelesai = document.getElementById('geserCustomSelesai')?.value || '09:40';
        if (customSelesai <= customMulai) {
          showToast('error', 'Jam Tidak Valid', 'Jam selesai harus lebih akhir dari jam mulai!');
          return;
        }
      }

      this.shiftMatkulDay(targetMatkul, targetDay, customMulai, customSelesai);
      document.getElementById('modalGeserJadwal').classList.remove('active');
    }
  };

  window.appRenderer = appRenderer;
  window.appViews = appViews;
  window.checkScheduleClashes = checkScheduleClashes;

})(window);
