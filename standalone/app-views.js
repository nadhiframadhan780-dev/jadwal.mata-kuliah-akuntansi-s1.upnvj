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
        card.style.cssText = `
          border-left: 6px solid ${matkul.warna || 'var(--teal-600)'};
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: relative;
        `;

        // Status badge colors
        let statusBadge = '';
        if (state.status === 'sedang_berlangsung') {
          statusBadge = `
            <span style="background: var(--teal-100); color: var(--teal-800); font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 9999px; display: inline-flex; align-items: center; gap: 4px;">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: var(--teal-600); animation: pulseDot 1.5s infinite;"></span> Sedang Berlangsung (${state.progress}%)
            </span>
          `;
        } else if (state.status === 'selesai') {
          statusBadge = `<span style="background: var(--neutral-100); color: var(--neutral-600); font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 9999px;">Selesai</span>`;
        } else {
          statusBadge = `<span style="background: var(--yellow-100); color: var(--yellow-700); font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 9999px;">Akan Datang</span>`;
        }

        // Attendance active button highlight
        const attStatus = sesi.status || '';

        card.innerHTML = `
          <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 8px;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span style="font-size: 14px; font-weight: 800; color: var(--teal-800);">${sesi.mulai} – ${sesi.selesai} WIB</span>
                ${statusBadge}
                <span style="font-size: 11px; color: var(--neutral-500); font-weight: 600;">Pertemuan Ke-${sesi.ke} dari ${matkul.sesi.length}</span>
              </div>
              <h4 style="font-size: 16px; font-weight: 800; color: var(--neutral-900);">${escapeHtml(matkul.nama)}</h4>
              <div style="font-size: 12px; color: var(--neutral-500); margin-top: 2px;">
                <strong style="color: var(--teal-700);">${matkul.kode}</strong> &bull; Kelas ${matkul.kelas} &bull; ${matkul.sks} SKS &bull; <span style="background: var(--teal-50); color: var(--teal-800); padding: 1px 6px; border-radius: 4px; font-weight: 600;">${escapeHtml(sesi.ruang)}</span>
              </div>
            </div>

            <button class="btn btn-secondary btn-sm edit-session-btn" title="Edit atau Pindahkan Sesi Ini">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              <span>Edit / Pindah</span>
            </button>
          </div>

          ${state.status === 'sedang_berlangsung' ? `
            <div style="width: 100%; height: 5px; background: var(--neutral-200); border-radius: 9999px; overflow: hidden;">
              <div style="width: ${state.progress}%; height: 100%; background: linear-gradient(90deg, var(--teal-500), var(--teal-600));"></div>
            </div>
          ` : ''}

          <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px; border-top: 1px solid var(--neutral-100); padding-top: 10px;">
            <div style="font-size: 12px; color: var(--neutral-600); display: flex; align-items: center; gap: 6px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span>Dosen: <strong>${escapeHtml(sesi.dosen || matkul.catatan || 'Dosen Pengampu')}</strong></span>
            </div>

            <!-- Quick Attendance Toggle Buttons -->
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 11px; font-weight: 600; color: var(--neutral-400); margin-right: 2px;">Presensi:</span>
              <button class="btn btn-sm att-quick-btn ${attStatus === 'hadir' ? 'btn-primary' : 'btn-secondary'}" data-status="hadir" style="padding: 4px 8px; font-size: 11px;">Hadir</button>
              <button class="btn btn-sm att-quick-btn ${attStatus === 'izin' ? 'btn-accent' : 'btn-secondary'}" data-status="izin" style="padding: 4px 8px; font-size: 11px;">Izin</button>
              <button class="btn btn-sm att-quick-btn ${attStatus === 'sakit' ? 'btn-secondary' : 'btn-secondary'}" data-status="sakit" style="padding: 4px 8px; font-size: 11px; ${attStatus === 'sakit' ? 'background: #0284C7; color: #fff;' : ''}">Sakit</button>
              <button class="btn btn-sm att-quick-btn ${attStatus === 'alpa' ? 'btn-danger' : 'btn-secondary'}" data-status="alpa" style="padding: 4px 8px; font-size: 11px; ${attStatus === 'alpa' ? 'background: var(--danger-600); color: #fff;' : ''}">Alpa</button>
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

    renderJadwal(activeTab = 'mingguan') {
      const container = document.getElementById('jadwalTabContent');
      if (!container) return;
      container.innerHTML = '';

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
            <div style="background: var(--danger-50); border: 1px solid var(--danger-100); color: var(--danger-600); padding: 12px 16px; border-radius: var(--radius-md); font-size: 12.5px; display: flex; align-items: center; gap: 8px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span><strong>Perhatian: Terdeteksi ${clashes.length} bentrok jadwal!</strong> ${clashes[0].desc}</span>
            </div>
          `;
        } else {
          clashEl.style.display = 'none';
        }
      }

      if (activeTab === 'mingguan') {
        this.renderJadwalMingguan(container, allMatkul, searchQuery, ruangFilter);
      } else if (activeTab === 'perhari') {
        this.renderJadwalPerHari(container, allMatkul, searchQuery, ruangFilter);
      } else if (activeTab === 'permatkul') {
        this.renderJadwalPerMatkul(container, allMatkul, searchQuery, ruangFilter);
      } else if (activeTab === 'semuapertemuan') {
        this.renderJadwalSemuaPertemuan(container, allMatkul, searchQuery, ruangFilter);
      }
    },

    renderJadwalMingguan(container, allMatkul, search, ruang) {
      const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;';

      days.forEach(day => {
        const dayCard = document.createElement('div');
        dayCard.className = 'card';
        dayCard.style.cssText = 'padding: 16px; min-height: 200px; display: flex; flex-direction: column; gap: 10px; background: #ffffff;';

        dayCard.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--neutral-100); padding-bottom: 8px;">
            <h4 style="font-size: 15px; font-weight: 800; color: var(--teal-900);">${day}</h4>
            <span style="font-size: 11px; background: var(--teal-50); color: var(--teal-700); padding: 1px 8px; border-radius: 9999px; font-weight: 700;" class="day-count-badge">0 Matkul</span>
          </div>
          <div class="day-sessions-container" data-day="${day}" style="display: flex; flex-direction: column; gap: 8px; flex: 1;"></div>
        `;

        const sessionsContainer = dayCard.querySelector('.day-sessions-container');
        let count = 0;

        allMatkul.forEach(m => {
          if (m.hariReguler === day) {
            // Apply search & ruang filter
            if (search && !m.nama.toLowerCase().includes(search) && !m.kode.toLowerCase().includes(search) && !(m.catatan||'').toLowerCase().includes(search)) return;
            if (ruang !== 'all') {
              const hasRuang = m.sesi.some(s => s.ruang === ruang);
              if (!hasRuang) return;
            }

            count++;
            const sItem = document.createElement('div');
            sItem.draggable = true;
            sItem.style.cssText = `
              padding: 10px 12px;
              border-radius: var(--radius-md);
              background: var(--neutral-50);
              border-left: 4px solid ${m.warna || 'var(--teal-600)'};
              border: 1px solid var(--neutral-200);
              border-left-width: 4px;
              cursor: grab;
              transition: all 0.15s ease;
            `;

            const firstSesi = m.sesi[0] || {};
            sItem.innerHTML = `
              <div style="font-size: 11px; font-weight: 700; color: var(--teal-700);">${firstSesi.mulai || '07:10'} – ${firstSesi.selesai || '09:40'}</div>
              <div style="font-size: 13px; font-weight: 700; color: var(--neutral-900); margin: 2px 0;">${escapeHtml(m.nama)}</div>
              <div style="font-size: 11px; color: var(--neutral-500);">${m.kode} &bull; ${m.sks} SKS &bull; Kelas ${m.kelas}</div>
            `;

            // Drag and drop events
            sItem.ondragstart = (e) => {
              e.dataTransfer.setData('text/plain', m.id);
            };

            sItem.onclick = () => {
              window.appViews.openSessionModal(m.id, 0);
            };

            sessionsContainer.appendChild(sItem);
          }
        });

        // Drop zone handlers
        dayCard.ondragover = (e) => e.preventDefault();
        dayCard.ondrop = (e) => {
          e.preventDefault();
          const matkulId = e.dataTransfer.getData('text/plain');
          const targetMatkul = allMatkul.find(item => item.id === matkulId);
          if (targetMatkul && targetMatkul.hariReguler !== day) {
            window.appViews.shiftMatkulDay(targetMatkul, day);
          }
        };

        dayCard.querySelector('.day-count-badge').textContent = `${count} Matkul`;
        wrap.appendChild(dayCard);
      });

      container.appendChild(wrap);
    },

    renderJadwalPerHari(container, allMatkul, search, ruang) {
      const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display: flex; flex-direction: column; gap: 16px;';

      days.forEach(day => {
        const matkulThisDay = allMatkul.filter(m => m.hariReguler === day);
        if (matkulThisDay.length === 0) return;

        const sec = document.createElement('div');
        sec.className = 'card';
        sec.style.padding = '18px 20px';

        sec.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid var(--neutral-200); padding-bottom: 8px;">
            <h3 style="font-size: 16px; font-weight: 800; color: var(--teal-900);">${day}</h3>
            <span style="font-size: 12px; color: var(--neutral-500);">${matkulThisDay.length} Mata Kuliah Terjadwal</span>
          </div>
          <div class="day-list" style="display: flex; flex-direction: column; gap: 10px;"></div>
        `;

        const list = sec.querySelector('.day-list');
        matkulThisDay.forEach(m => {
          const row = document.createElement('div');
          row.style.cssText = `
            padding: 12px 14px;
            border-radius: var(--radius-md);
            background: var(--neutral-50);
            border: 1px solid var(--neutral-200);
            border-left: 4px solid ${m.warna};
            display: flex;
            justify-content: space-between;
            align-items: center;
          `;
          const s1 = m.sesi[0] || {};
          row.innerHTML = `
            <div>
              <div style="font-size: 12px; font-weight: 700; color: var(--teal-700);">${s1.mulai || ''} – ${s1.selesai || ''} WIB &bull; ${m.kode}</div>
              <div style="font-size: 14px; font-weight: 700; color: var(--neutral-900);">${escapeHtml(m.nama)}</div>
              <div style="font-size: 11.5px; color: var(--neutral-500);">Dosen: ${escapeHtml(s1.dosen || m.catatan || '-')} &bull; ${m.sks} SKS &bull; Kelas ${m.kelas}</div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="window.appViews.openSessionModal('${m.id}', 0)">Rincian</button>
          `;
          list.appendChild(row);
        });

        wrap.appendChild(sec);
      });

      container.appendChild(wrap);
    },

    renderJadwalPerMatkul(container, allMatkul, search, ruang) {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px;';

      allMatkul.forEach(m => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.cssText = `border-top: 5px solid ${m.warna}; padding: 18px 20px; display: flex; flex-direction: column; gap: 10px;`;

        const hadirCount = m.sesi.filter(s => s.status === 'hadir').length;
        const totalSesi = m.sesi.length;
        const pct = totalSesi > 0 ? Math.round((hadirCount / totalSesi) * 100) : 0;

        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <span style="font-size: 11px; font-weight: 700; color: var(--teal-700);">${m.kode} &bull; Kelas ${m.kelas} &bull; ${m.sks} SKS</span>
              <h4 style="font-size: 15px; font-weight: 800; color: var(--neutral-900);">${escapeHtml(m.nama)}</h4>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="window.appViews.openSessionModal('${m.id}', 0)">Ubah</button>
          </div>
          <div style="font-size: 12px; color: var(--neutral-600);">
            Hari Reguler: <strong>${m.hariReguler}</strong> &bull; Total ${totalSesi} Pertemuan
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
              ${m.sesi.map(s => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 6px; border-radius: 4px; background: var(--neutral-50); font-size: 11px;">
                  <span>Ke-${s.ke} (${formatShortDate(s.tanggal)})</span>
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

    renderJadwalSemuaPertemuan(container, allMatkul, search, ruang) {
      const wrap = document.createElement('div');
      wrap.className = 'card';
      wrap.style.padding = '20px';

      const allSessionsFlat = [];
      allMatkul.forEach(m => {
        m.sesi.forEach((s, idx) => {
          allSessionsFlat.push({ matkul: m, sesi: s, sesiIndex: idx });
        });
      });
      allSessionsFlat.sort((a, b) => a.sesi.tanggal.localeCompare(b.sesi.tanggal));

      wrap.innerHTML = `
        <h3 style="font-size: 16px; font-weight: 800; color: var(--teal-900); margin-bottom: 12px;">Kronologi Seluruh Pertemuan Semester Aktif</h3>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12.5px; text-align: left;">
            <thead>
              <tr style="background: var(--teal-50); color: var(--teal-900); border-bottom: 2px solid var(--teal-200);">
                <th style="padding: 8px 10px;">Tanggal</th>
                <th style="padding: 8px 10px;">Jam</th>
                <th style="padding: 8px 10px;">Mata Kuliah</th>
                <th style="padding: 8px 10px;">Ke-</th>
                <th style="padding: 8px 10px;">Ruang</th>
                <th style="padding: 8px 10px;">Dosen</th>
                <th style="padding: 8px 10px;">Kehadiran</th>
              </tr>
            </thead>
            <tbody>
              ${allSessionsFlat.map(item => `
                <tr style="border-bottom: 1px solid var(--neutral-200);">
                  <td style="padding: 8px 10px; font-weight: 600;">${formatDateIndo(item.sesi.tanggal)}</td>
                  <td style="padding: 8px 10px;">${item.sesi.mulai}–${item.sesi.selesai}</td>
                  <td style="padding: 8px 10px; font-weight: 700; color: var(--teal-800);">${escapeHtml(item.matkul.nama)}</td>
                  <td style="padding: 8px 10px;">Ke-${item.sesi.ke}</td>
                  <td style="padding: 8px 10px;">${escapeHtml(item.sesi.ruang)}</td>
                  <td style="padding: 8px 10px; font-size: 11.5px; color: var(--neutral-600);">${escapeHtml(item.sesi.dosen)}</td>
                  <td style="padding: 8px 10px;">
                    <span style="padding: 2px 6px; border-radius: 4px; font-size: 10.5px; font-weight: 700; background: ${item.sesi.status === 'hadir' ? 'var(--teal-100)' : 'var(--neutral-100)'}; color: ${item.sesi.status === 'hadir' ? 'var(--teal-800)' : 'var(--neutral-500)'};">
                      ${item.sesi.status ? item.sesi.status.toUpperCase() : 'BELUM'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
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

    shiftMatkulDay(matkul, newDayName) {
      matkul.hariReguler = newDayName;
      appStore.save();
      appRenderer.renderAll();
      showToast('success', 'Jadwal Digeser', `${matkul.nama} berhasil dipindahkan ke hari ${newDayName}.`);
    }
  };

  window.appRenderer = appRenderer;
  window.appViews = appViews;
  window.checkScheduleClashes = checkScheduleClashes;

})(window);
