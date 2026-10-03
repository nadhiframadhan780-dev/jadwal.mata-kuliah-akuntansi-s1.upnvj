// app-grades.js - Nilai, IPK, Semester, Profil & KTM, Impor/Ekspor, & PWA
(function(window) {
  'use strict';

  const { appStore, appRenderer, showToast, showCustomConfirm, escapeHtml, formatDateIndo } = window;

  const appGrades = {
    renderNilai() {
      const allMatkul = appStore.getActiveMatkul();
      const listEl = document.getElementById('nilaiMatkulList');
      if (!listEl) return;
      listEl.innerHTML = '';

      let totalMutu = 0;
      let totalSks = 0;

      allMatkul.forEach(m => {
        if (!m.nilai) {
          m.nilai = { mode: 'angka', uts: '', uas: '', tugas: '', gunakanTugas: false, bobotUts: 50, bobotUas: 50, bobotTugas: 0, huruf: '' };
        }

        const n = m.nilai;
        let finalScore = 0;
        let letter = '';
        let bobot = 0;

        if (n.mode === 'huruf') {
          letter = (n.huruf || '').toUpperCase();
          bobot = this.getBobotFromLetter(letter);
        } else {
          // Weighted numeric calculation
          const uts = parseFloat(n.uts) || 0;
          const uas = parseFloat(n.uas) || 0;
          const tugas = parseFloat(n.tugas) || 0;

          if (n.gunakanTugas) {
            const bT = n.bobotTugas || 20;
            const bU = n.bobotUts || 40;
            const bA = n.bobotUas || 40;
            finalScore = (tugas * bT + uts * bU + uas * bA) / 100;
          } else {
            const bU = n.bobotUts || 50;
            const bA = n.bobotUas || 50;
            finalScore = (uts * bU + uas * bA) / (bU + bA);
          }

          if (n.uts !== '' || n.uas !== '') {
            letter = this.getLetterFromScore(finalScore);
            bobot = this.getBobotFromLetter(letter);
          }
        }

        if (letter) {
          totalMutu += (bobot * m.sks);
          totalSks += m.sks;
        }

        const card = document.createElement('div');
        card.className = 'card';
        card.style.cssText = 'padding: 18px 20px;';

        card.innerHTML = `
          <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 12px; border-bottom: 1px solid var(--neutral-100); padding-bottom: 10px;">
            <div>
              <span style="font-size: 11px; font-weight: 700; color: var(--teal-700);">${m.kode} &bull; ${m.sks} SKS &bull; Kelas ${m.kelas}</span>
              <h4 style="font-size: 15px; font-weight: 800; color: var(--neutral-900);">${escapeHtml(m.nama)}</h4>
            </div>

            <!-- Grade Result Badge -->
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="text-align: right;">
                <div style="font-size: 11px; color: var(--neutral-500);">NILAI AKHIR</div>
                <div style="font-size: 18px; font-weight: 800; color: var(--teal-700);">
                  ${letter ? `${letter} (${bobot.toFixed(2)})` : '--'}
                </div>
              </div>
            </div>
          </div>

          <!-- Mode Toggle -->
          <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 12px; font-size: 12px;">
            <label style="cursor: pointer; display: flex; align-items: center; gap: 4px;">
              <input type="radio" name="mode-${m.id}" value="angka" ${n.mode !== 'huruf' ? 'checked' : ''} />
              <span>Input Nilai Angka (UTS, UAS, Tugas)</span>
            </label>
            <label style="cursor: pointer; display: flex; align-items: center; gap: 4px;">
              <input type="radio" name="mode-${m.id}" value="huruf" ${n.mode === 'huruf' ? 'checked' : ''} />
              <span>Input Huruf Langsung (A, B, C, D, E)</span>
            </label>
          </div>

          <!-- Inputs -->
          ${n.mode === 'huruf' ? `
            <div style="display: flex; align-items: center; gap: 10px; max-width: 220px;">
              <label style="font-size: 12px; font-weight: 700; color: var(--neutral-700);">Huruf Mutu:</label>
              <select class="grade-letter-select" style="flex: 1; padding: 6px 10px; border-radius: var(--radius-md); border: 1px solid var(--neutral-300); font-weight: 700;">
                <option value="">-- Pilih --</option>
                <option value="A" ${n.huruf === 'A' ? 'selected' : ''}>A (4.00)</option>
                <option value="B" ${n.huruf === 'B' ? 'selected' : ''}>B (3.00)</option>
                <option value="C" ${n.huruf === 'C' ? 'selected' : ''}>C (2.00)</option>
                <option value="D" ${n.huruf === 'D' ? 'selected' : ''}>D (1.00)</option>
                <option value="E" ${n.huruf === 'E' ? 'selected' : ''}>E (0.00)</option>
              </select>
            </div>
          ` : `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px;">
              <div>
                <label style="display: block; font-size: 11px; font-weight: 700; color: var(--neutral-600); margin-bottom: 3px;">UTS (50%)</label>
                <input type="number" class="grade-input-uts" value="${n.uts}" placeholder="0-100" min="0" max="100" style="width: 100%; padding: 6px 10px; border-radius: var(--radius-md); border: 1px solid var(--neutral-300); font-weight: 700;" />
              </div>
              <div>
                <label style="display: block; font-size: 11px; font-weight: 700; color: var(--neutral-600); margin-bottom: 3px;">UAS (50%)</label>
                <input type="number" class="grade-input-uas" value="${n.uas}" placeholder="0-100" min="0" max="100" style="width: 100%; padding: 6px 10px; border-radius: var(--radius-md); border: 1px solid var(--neutral-300); font-weight: 700;" />
              </div>
              <div>
                <label style="display: block; font-size: 11px; font-weight: 700; color: var(--neutral-600); margin-bottom: 3px;">TUGAS (Opsional)</label>
                <input type="number" class="grade-input-tugas" value="${n.tugas}" placeholder="0-100" min="0" max="100" style="width: 100%; padding: 6px 10px; border-radius: var(--radius-md); border: 1px solid var(--neutral-300); font-weight: 700;" />
              </div>
            </div>
          `}
        `;

        // Listeners for mode change
        card.querySelectorAll(`input[name="mode-${m.id}"]`).forEach(radio => {
          radio.onchange = () => {
            n.mode = radio.value;
            appStore.save();
            this.renderNilai();
          };
        });

        // Numeric inputs
        const utsInp = card.querySelector('.grade-input-uts');
        const uasInp = card.querySelector('.grade-input-uas');
        const tugasInp = card.querySelector('.grade-input-tugas');
        if (utsInp) {
          utsInp.onchange = () => { n.uts = utsInp.value; appStore.save(); this.renderNilai(); };
        }
        if (uasInp) {
          uasInp.onchange = () => { n.uas = uasInp.value; appStore.save(); this.renderNilai(); };
        }
        if (tugasInp) {
          tugasInp.onchange = () => { n.tugas = tugasInp.value; appStore.save(); this.renderNilai(); };
        }

        // Letter select
        const letterSel = card.querySelector('.grade-letter-select');
        if (letterSel) {
          letterSel.onchange = () => { n.huruf = letterSel.value; appStore.save(); this.renderNilai(); };
        }

        listEl.appendChild(card);
      });

      // Calculate IPS
      const activeSem = appStore.state.viewingSemester;
      const ips = totalSks > 0 ? (totalMutu / totalSks) : 4.00; // default 4.00 for seed
      if (appStore.state.semesters[activeSem]) {
        appStore.state.semesters[activeSem].ips = parseFloat(ips.toFixed(2));
        appStore.state.semesters[activeSem].sksLulus = totalSks;
      }

      const ipsEl = document.getElementById('nilaiIpsActive');
      if (ipsEl) ipsEl.textContent = ips.toFixed(2);
      const sksEl = document.getElementById('nilaiSksActive');
      if (sksEl) sksEl.textContent = `Beban: ${totalSks} SKS Dinilai`;

      // Calculate Cumulative IPK
      let cumMutu = 0;
      let cumSks = 0;
      Object.keys(appStore.state.semesters).forEach(sNum => {
        const sem = appStore.state.semesters[sNum];
        if (sem.ips !== null && sem.sksLulus > 0) {
          cumMutu += (sem.ips * sem.sksLulus);
          cumSks += sem.sksLulus;
        }
      });
      const ipk = cumSks > 0 ? (cumMutu / cumSks) : ips;
      const ipkEl = document.getElementById('nilaiIpkKumulatif');
      if (ipkEl) ipkEl.textContent = ipk.toFixed(2);
      const cumSksEl = document.getElementById('nilaiTotalSksLulus');
      if (cumSksEl) cumSksEl.textContent = `Total: ${cumSks} SKS Lulus`;

      // Predicate
      const predEl = document.getElementById('nilaiPredikatKelulusan');
      if (predEl) {
        if (ipk >= 3.51) predEl.textContent = '🌟 Dengan Pujian (Cum Laude)';
        else if (ipk >= 3.01) predEl.textContent = 'Sangat Memuaskan';
        else if (ipk >= 2.76) predEl.textContent = 'Memuaskan';
        else predEl.textContent = 'Cukup';
      }

      // Populate Target UAS Simulator
      const simSelect = document.getElementById('simulasiMatkulSelect');
      if (simSelect && simSelect.options.length !== allMatkul.length) {
        simSelect.innerHTML = allMatkul.map(m => `<option value="${m.id}">${escapeHtml(m.nama)}</option>`).join('');
      }
      this.calculateSimulation();

      // Render Trend Chart & Manual Table
      this.renderTrendChart();
      this.renderManualIpsTable();
    },

    getLetterFromScore(score) {
      const skala = appStore.state.settings.skalaNilai;
      for (let s of skala) {
        if (score >= s.min) return s.huruf;
      }
      return 'E';
    },

    getBobotFromLetter(letter) {
      const skala = appStore.state.settings.skalaNilai;
      const item = skala.find(s => s.huruf === letter);
      return item ? item.bobot : 0;
    },

    calculateSimulation() {
      const matkulId = document.getElementById('simulasiMatkulSelect')?.value;
      const targetScore = parseFloat(document.getElementById('simulasiTargetSelect')?.value || 80);
      const allMatkul = appStore.getActiveMatkul();
      const matkul = allMatkul.find(m => m.id === matkulId);
      const resEl = document.getElementById('simulasiResultText');
      if (!resEl) return;

      if (!matkul || !matkul.nilai) {
        resEl.textContent = '--';
        return;
      }

      const uts = parseFloat(matkul.nilai.uts) || 0;
      // Formula: (Target - UTS * 0.5) / 0.5
      const neededUas = (targetScore - (uts * 0.5)) / 0.5;

      if (neededUas > 100) {
        resEl.innerHTML = `<span style="color: var(--danger-600);">${neededUas.toFixed(1)} (Melebihi 100, sulit diraih)</span>`;
      } else if (neededUas <= 0) {
        resEl.innerHTML = `<span style="color: var(--teal-700);">&le; 0 (Nilai UTS sudah mencukupi!)</span>`;
      } else {
        resEl.innerHTML = `<span style="color: var(--teal-700);">${neededUas.toFixed(1)}</span> / 100`;
      }
    },

    renderTrendChart() {
      const canvas = document.getElementById('ipkChartCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const width = canvas.parentElement.clientWidth;
      const height = 220;
      canvas.width = width;
      canvas.height = height;

      ctx.clearRect(0, 0, width, height);

      // Collect semester 1-8 points
      const labels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8'];
      const ipsData = [];
      const ipkData = [];

      let runningMutu = 0;
      let runningSks = 0;

      for (let i = 1; i <= 8; i++) {
        const sem = appStore.state.semesters[i];
        if (sem && sem.ips !== null) {
          ipsData.push(sem.ips);
          runningMutu += (sem.ips * (sem.sksLulus || 20));
          runningSks += (sem.sksLulus || 20);
          ipkData.push(parseFloat((runningMutu / runningSks).toFixed(2)));
        } else {
          // Future projection
          ipsData.push(null);
          ipkData.push(null);
        }
      }

      // Draw Grid
      const padLeft = 40;
      const padRight = 20;
      const padTop = 20;
      const padBottom = 30;
      const chartW = width - padLeft - padRight;
      const chartH = height - padTop - padBottom;

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.fillStyle = '#64748b';
      ctx.font = '10px "Plus Jakarta Sans", sans-serif';

      // Y-axis 0 to 4.0
      for (let yVal = 0; yVal <= 4.0; yVal += 1.0) {
        const yPos = padTop + chartH - (yVal / 4.0) * chartH;
        ctx.beginPath();
        ctx.moveTo(padLeft, yPos);
        ctx.lineTo(width - padRight, yPos);
        ctx.stroke();
        ctx.fillText(yVal.toFixed(1), 10, yPos + 3);
      }

      // X-axis
      const stepX = chartW / 7;
      labels.forEach((lbl, i) => {
        const xPos = padLeft + i * stepX;
        ctx.fillText(lbl, xPos - 12, height - 10);
      });

      // Draw IPS Line (Teal)
      this.drawLineSeries(ctx, ipsData, padLeft, padTop, chartH, stepX, '#0D9488', '#0D9488');
      // Draw IPK Line (Yellow)
      this.drawLineSeries(ctx, ipkData, padLeft, padTop, chartH, stepX, '#F59E0B', '#FACC15');
    },

    drawLineSeries(ctx, data, padLeft, padTop, chartH, stepX, strokeColor, fillColor) {
      ctx.beginPath();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 3;
      let started = false;

      data.forEach((val, i) => {
        if (val !== null) {
          const x = padLeft + i * stepX;
          const y = padTop + chartH - (val / 4.0) * chartH;
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      });
      ctx.stroke();

      // Dots
      data.forEach((val, i) => {
        if (val !== null) {
          const x = padLeft + i * stepX;
          const y = padTop + chartH - (val / 4.0) * chartH;
          ctx.beginPath();
          ctx.fillStyle = fillColor;
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });
    },

    renderManualIpsTable() {
      const tbody = document.getElementById('manualIpsTableBody');
      if (!tbody) return;
      tbody.innerHTML = '';

      for (let i = 1; i <= 8; i++) {
        const sem = appStore.state.semesters[i] || { status: 'belum', ips: null, sksLulus: 0 };
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid var(--neutral-100)';

        tr.innerHTML = `
          <td style="padding: 10px 12px; font-weight: 700;">Semester ${i}</td>
          <td style="padding: 10px 12px;">
            <span style="padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; background: ${sem.status === 'aktif' ? 'var(--teal-100)' : (sem.status === 'arsip' ? 'var(--neutral-100)' : 'var(--yellow-100)')}; color: ${sem.status === 'aktif' ? 'var(--teal-800)' : (sem.status === 'arsip' ? 'var(--neutral-600)' : 'var(--yellow-800)')};">
              ${sem.status.toUpperCase()}
            </span>
          </td>
          <td style="padding: 10px 12px;">
            <input type="number" class="manual-sks" value="${sem.sksLulus || 20}" min="0" max="24" style="width: 60px; padding: 4px 6px; border-radius: 4px; border: 1px solid var(--neutral-300);" /> SKS
          </td>
          <td style="padding: 10px 12px;">
            <input type="number" class="manual-ips" value="${sem.ips !== null ? sem.ips : ''}" placeholder="4.00" step="0.01" min="0" max="4.0" style="width: 70px; padding: 4px 6px; border-radius: 4px; border: 1px solid var(--neutral-300); font-weight: 700;" />
          </td>
          <td style="padding: 10px 12px;">
            <button class="btn btn-secondary btn-sm save-manual-sem-btn">Simpan</button>
          </td>
        `;

        const btn = tr.querySelector('.save-manual-sem-btn');
        const sksInp = tr.querySelector('.manual-sks');
        const ipsInp = tr.querySelector('.manual-ips');

        btn.onclick = () => {
          const valIps = parseFloat(ipsInp.value);
          const valSks = parseInt(sksInp.value, 10) || 0;
          if (!isNaN(valIps)) {
            sem.ips = parseFloat(valIps.toFixed(2));
            sem.sksLulus = valSks;
            if (sem.status === 'belum') sem.status = 'arsip';
            appStore.save();
            this.renderNilai();
            showToast('success', 'IPS Disimpan', `IPS Semester ${i} dicatat ${valIps.toFixed(2)}.`);
          }
        };

        tbody.appendChild(tr);
      }
    },

    renderSemester() {
      const activeSem = appStore.state.profile.semesterAktif;
      const semObj = appStore.state.semesters[activeSem] || {};

      const titleEl = document.getElementById('heroSemTitle');
      const descEl = document.getElementById('heroSemDesc');
      const btnText = document.getElementById('finishSemesterBtnText');
      if (titleEl) titleEl.textContent = `Semester ${activeSem} • Periode Aktif`;
      if (descEl) descEl.textContent = `Saat ini Anda berada di Semester ${activeSem}. Setelah seluruh perkuliahan selesai, klik tombol di bawah untuk mengarsipkan data dan melangkah ke semester baru.`;
      if (btnText) btnText.textContent = `🎓 Selesaikan Semester ${activeSem}`;

      const grid = document.getElementById('semesterRoadmapGrid');
      if (!grid) return;
      grid.innerHTML = '';

      for (let s = 1; s <= 8; s++) {
        const item = appStore.state.semesters[s] || { status: 'belum', ips: null, sksLulus: 0, matkul: [] };
        const isCurrent = (s === activeSem);
        const card = document.createElement('div');
        card.className = 'card';
        card.style.cssText = `
          padding: 18px;
          border: 1px solid ${isCurrent ? 'var(--teal-500)' : 'var(--neutral-200)'};
          background: ${isCurrent ? 'linear-gradient(135deg, #ffffff, var(--teal-50))' : '#ffffff'};
        `;

        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h4 style="font-size: 15px; font-weight: 800; color: var(--teal-900);">Semester ${s}</h4>
            <span style="font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; background: ${isCurrent ? 'var(--teal-600)' : 'var(--neutral-100)'}; color: ${isCurrent ? '#fff' : 'var(--neutral-600)'};">
              ${isCurrent ? 'AKTIF' : item.status.toUpperCase()}
            </span>
          </div>
          <div style="font-size: 12.5px; color: var(--neutral-600); margin-bottom: 12px;">
            ${item.matkul.length} Mata Kuliah &bull; ${item.sksLulus || 20} SKS
          </div>
          <div style="font-size: 14px; font-weight: 800; color: var(--teal-800); margin-bottom: 12px;">
            IPS: ${item.ips !== null ? item.ips.toFixed(2) : '--'}
          </div>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-secondary btn-sm" onclick="window.appGrades.switchViewingSemester(${s})" style="flex: 1;">
              ${s === appStore.state.viewingSemester ? 'Sedang Dilihat' : 'Lihat Jadwal'}
            </button>
          </div>
        `;
        grid.appendChild(card);
      }
    },

    switchViewingSemester(s) {
      appStore.state.viewingSemester = s;
      document.getElementById('sidebarSemesterSelect').value = s;
      appRenderer.renderAll();
      showToast('info', 'Semester Berganti', `Melihat data jadwal Semester ${s}.`);
    },

    openFinishSemesterModal() {
      const activeSem = appStore.state.profile.semesterAktif;
      const semObj = appStore.state.semesters[activeSem] || {};
      const allMatkul = semObj.matkul || [];

      document.getElementById('finishSemTitle').textContent = `Selesaikan Semester ${activeSem}?`;
      document.getElementById('finishModalSks').textContent = `${semObj.sksLulus || 20} SKS`;
      document.getElementById('finishModalIps').textContent = (semObj.ips || 4.00).toFixed(2);
      document.getElementById('finishModalIpsInput').value = (semObj.ips || 4.00).toFixed(2);

      let totalSesi = 0, totalHadir = 0;
      allMatkul.forEach(m => {
        m.sesi.forEach(s => {
          totalSesi++;
          if (s.status === 'hadir') totalHadir++;
        });
      });
      const pct = totalSesi > 0 ? Math.round((totalHadir / totalSesi) * 100) : 85;
      document.getElementById('finishModalPresensi').textContent = `${pct}%`;

      document.getElementById('finishSemModal').classList.add('active');
    },

    confirmFinishSemester() {
      const activeSem = appStore.state.profile.semesterAktif;
      const semObj = appStore.state.semesters[activeSem];
      const finalIps = parseFloat(document.getElementById('finishModalIpsInput').value) || 4.00;

      semObj.status = 'arsip';
      semObj.ips = finalIps;

      // Celebrate with confetti
      this.triggerConfetti();

      if (activeSem >= 8) {
        // Graduation Screen!
        document.getElementById('finishSemModal').classList.remove('active');
        showToast('success', 'Selamat Wisuda!', 'Anda telah menuntaskan seluruh 8 semester di S1 Akuntansi UPNVJ!');
        appStore.save();
        appRenderer.renderAll();
        return;
      }

      // Advance to next semester
      const nextSem = activeSem + 1;
      appStore.state.profile.semesterAktif = nextSem;
      appStore.state.viewingSemester = nextSem;
      if (appStore.state.semesters[nextSem]) {
        appStore.state.semesters[nextSem].status = 'aktif';
        // Fresh schedule & attendance reset for the new semester
        appStore.state.semesters[nextSem].matkul = [];
      }

      document.getElementById('sidebarSemesterSelect').value = nextSem;
      appStore.save();
      document.getElementById('finishSemModal').classList.remove('active');
      appRenderer.renderAll();
      showToast('success', 'Semester Selesai!', `Selamat! Semester ${activeSem} diarsipkan. Selamat datang di Semester ${nextSem}!`);
    },

    triggerConfetti() {
      const canvas = document.getElementById('confettiCanvas');
      if (!canvas) return;
      canvas.style.display = 'block';
      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const pieces = [];
      const colors = ['#0D9488', '#14B8A6', '#FACC15', '#F59E0B', '#0F766E', '#FEF08A'];
      for (let i = 0; i < 120; i++) {
        pieces.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height - canvas.height,
          size: Math.random() * 8 + 4,
          speed: Math.random() * 4 + 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360
        });
      }

      let frame = 0;
      function anim() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        pieces.forEach(p => {
          p.y += p.speed;
          p.rotation += 4;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        });
        frame++;
        if (frame < 180) {
          requestAnimationFrame(anim);
        } else {
          canvas.style.display = 'none';
        }
      }
      anim();
    },

    renderProfil() {
      const p = appStore.state.profile;
      document.getElementById('sidebarUserName').textContent = p.nama;
      document.getElementById('sidebarUserNim').textContent = `${p.nim} • ${p.prodi}`;

      // KTM display
      document.getElementById('ktmNamaText').textContent = p.nama;
      document.getElementById('ktmNimText').textContent = `NIM: ${p.nim}`;
      document.getElementById('ktmProdiText').textContent = `${p.prodi} — ${p.fakultas}`;
      document.getElementById('ktmKelasYearText').textContent = `Kelas ${p.kelas} • Angkatan ${p.tahunMasuk}`;

      // Photo
      const photoContainer = document.getElementById('ktmPhotoContainer');
      const photoInitial = document.getElementById('ktmPhotoInitial');
      const sidebarAvatar = document.getElementById('sidebarAvatar');

      if (p.foto) {
        photoContainer.innerHTML = `<img src="${p.foto}" alt="${escapeHtml(p.nama)}" style="width: 100%; height: 100%; object-fit: cover;" />`;
        sidebarAvatar.innerHTML = `<img src="${p.foto}" alt="${escapeHtml(p.nama)}" style="width: 100%; height: 100%; object-fit: cover;" />`;
      } else {
        const initials = p.nama.split(' ').map(w => w[0]).slice(0, 2).join('');
        photoContainer.innerHTML = `<span style="font-size: 26px; font-weight: 800; color: #fff;">${initials}</span>`;
        sidebarAvatar.innerHTML = `<span>${initials}</span>`;
      }

      // Calculations: Graduation Year = Tahun Masuk + 4
      const gradYear = (parseInt(p.tahunMasuk, 10) || 2026) + 4;
      document.getElementById('projTahunLulus').textContent = `Tahun ${gradYear}`;

      // Cum Laude calculation
      let totalMutu = 0, totalSks = 0;
      Object.keys(appStore.state.semesters).forEach(num => {
        const sem = appStore.state.semesters[num];
        if (sem.ips !== null && sem.sksLulus > 0) {
          totalMutu += sem.ips * sem.sksLulus;
          totalSks += sem.sksLulus;
        }
      });
      const curIpk = totalSks > 0 ? (totalMutu / totalSks) : 4.00;
      const targetIpk = appStore.state.settings.targetIpk || 3.51;

      const badge = document.getElementById('cumLaudeBadge');
      if (badge) {
        if (curIpk >= targetIpk) {
          badge.textContent = '🌟 On Track Cum Laude';
          badge.style.background = 'var(--teal-100)';
          badge.style.color = 'var(--teal-800)';
        } else if (curIpk >= 3.00) {
          badge.textContent = 'Perlu Ditingkatkan';
          badge.style.background = 'var(--yellow-100)';
          badge.style.color = 'var(--yellow-800)';
        } else {
          badge.textContent = 'Belum Memenuhi';
          badge.style.background = 'var(--danger-100)';
          badge.style.color = 'var(--danger-600)';
        }
      }

      // Form fill
      document.getElementById('profInputNama').value = p.nama;
      document.getElementById('profInputNim').value = p.nim;
      document.getElementById('profInputKelas').value = p.kelas;
      document.getElementById('profInputProdi').value = p.prodi;
      document.getElementById('profInputFakultas').value = p.fakultas;
      document.getElementById('profInputUniv').value = p.universitas;
      document.getElementById('profInputTahunMasuk').value = p.tahunMasuk;
      const paInput = document.getElementById('profInputDosenPa');
      if (paInput) paInput.value = p.dosenPA || 'Dr. Ferry Irawan, SE, Ak, SST, SH, ME, MPP, BKP, CPA, CSRA';
    }
  };

  window.appGrades = appGrades;

})(window);
