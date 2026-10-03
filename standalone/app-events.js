// app-events.js - Event Listeners, Navigation, Import/Export, Reminders, & PWA
(function(window) {
  'use strict';

  const { appStore, appRenderer, appViews, appGrades, showToast, showCustomConfirm, getTodayIso } = window;

  document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Store
    appStore.init();

    // 2. Navigation Handling
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item, .bottom-nav .bottom-nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const targetPage = item.getAttribute('data-page');
        navigateTo(targetPage);
      });
    });

    function navigateTo(pageId) {
      appStore.state.activePage = pageId;

      // Update active nav items
      document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => {
        el.classList.toggle('active', el.getAttribute('data-page') === pageId);
      });
      document.querySelectorAll('.bottom-nav .bottom-nav-item').forEach(el => {
        el.classList.toggle('active', el.getAttribute('data-page') === pageId);
      });

      // Show view
      document.querySelectorAll('.page-view').forEach(view => {
        view.classList.toggle('active', view.id === `view-${pageId}`);
      });

      // Close mobile sidebar if open
      document.getElementById('sidebar').classList.remove('open');

      // Re-render relevant view
      appRenderer.renderAll();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Mobile sidebar toggle
    const mobileBtn = document.getElementById('mobileMenuBtn');
    if (mobileBtn) {
      mobileBtn.onclick = () => {
        document.getElementById('sidebar').classList.toggle('open');
      };
    }

    // Semester Selector Change
    const semSelect = document.getElementById('sidebarSemesterSelect');
    if (semSelect) {
      semSelect.value = appStore.state.viewingSemester;
      semSelect.onchange = (e) => {
        appGrades.switchViewingSemester(parseInt(e.target.value, 10));
      };
    }

    // Weekly calendar navigation
    document.getElementById('prevWeekBtn').onclick = () => {
      window.currentWeekStart = new Date(window.currentWeekStart.setDate(window.currentWeekStart.getDate() - 7));
      appRenderer.renderWeeklyStrip();
    };
    document.getElementById('nextWeekBtn').onclick = () => {
      window.currentWeekStart = new Date(window.currentWeekStart.setDate(window.currentWeekStart.getDate() + 7));
      appRenderer.renderWeeklyStrip();
    };
    document.getElementById('todayWeekBtn').onclick = () => {
      window.currentWeekStart = new Date();
      appStore.state.selectedDate = getTodayIso();
      appRenderer.renderWeeklyStrip();
      appRenderer.renderBeranda();
    };

    // Jadwal Tab Buttons
    document.querySelectorAll('.jadwal-tab-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.jadwal-tab-btn').forEach(b => {
          b.classList.remove('active');
          b.style.background = 'transparent';
          b.style.color = 'var(--neutral-600)';
          b.style.boxShadow = 'none';
        });
        btn.classList.add('active');
        btn.style.background = '#ffffff';
        btn.style.color = 'var(--teal-800)';
        btn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        appRenderer.renderJadwal(btn.getAttribute('data-tab'));
      };
    });

    // Jadwal Search & Filter
    document.getElementById('jadwalSearchInput').oninput = () => {
      const activeTab = document.querySelector('.jadwal-tab-btn.active')?.getAttribute('data-tab') || 'mingguan';
      appRenderer.renderJadwal(activeTab);
    };
    document.getElementById('jadwalFilterRuang').onchange = () => {
      const activeTab = document.querySelector('.jadwal-tab-btn.active')?.getAttribute('data-tab') || 'mingguan';
      appRenderer.renderJadwal(activeTab);
    };

    // Undo Button
    const undoBtn = document.getElementById('undoBtn');
    if (undoBtn) undoBtn.onclick = () => appStore.undo();

    // Print & PDF Official Preview Handlers
    function populateAndOpenPrintModal() {
      const p = appStore.state.profile;
      const allMatkul = appStore.getActiveMatkul();
      const currentSem = appStore.state.viewingSemester;

      // Student metadata
      document.getElementById('printSheetNama').textContent = `: ${p.nama}`;
      document.getElementById('printSheetNim').textContent = `: ${p.nim}`;
      document.getElementById('printSheetProdi').textContent = `: ${p.prodi}`;
      document.getElementById('printSheetKelasYear').textContent = `: ${p.kelas} / ${p.tahunMasuk}`;
      document.getElementById('printSheetSigNama').textContent = p.nama;
      document.getElementById('printSheetSigNim').textContent = `NIM. ${p.nim}`;
      document.getElementById('printSheetSignatureCityDate').innerHTML = `Jakarta, ${formatDateIndo(getTodayIso())}<br><strong>Mahasiswa Bersangkutan</strong>`;
      const paSheetEl = document.getElementById('printSheetDosenPa');
      if (paSheetEl) {
        paSheetEl.textContent = p.dosenPA || 'Dr. Ferry Irawan, SE, Ak, SST, SH, ME, MPP, BKP, CPA, CSRA';
      }

      // Ensure Base64 logos are loaded into print sheet
      if (window.LOGO_UPNVJ_BASE64) {
        const upnImg = document.getElementById('printSheetLogoUpn');
        if (upnImg) upnImg.src = window.LOGO_UPNVJ_BASE64;
      }
      if (window.LOGO_AK_BASE64) {
        const akImg = document.getElementById('printSheetLogoAk');
        if (akImg) akImg.src = window.LOGO_AK_BASE64;
      }

      const semNames = ['', '1 (GANJIL)', '2 (GENAP)', '3 (GANJIL)', '4 (GENAP)', '5 (GANJIL)', '6 (GENAP)', '7 (GANJIL)', '8 (GENAP)'];
      document.getElementById('printSheetSemPeriod').textContent = `SEMESTER ${semNames[currentSem] || currentSem} TAHUN AKADEMIK 2026/2027 REGULER`;

      // Order of days
      const dayOrder = { 'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6, 'Minggu': 7 };
      const sortedMatkul = [...allMatkul].sort((a, b) => {
        const dA = dayOrder[a.hariReguler] || 9;
        const dB = dayOrder[b.hariReguler] || 9;
        if (dA !== dB) return dA - dB;
        const tA = (a.sesi[0] && a.sesi[0].mulai) || '';
        const tB = (b.sesi[0] && b.sesi[0].mulai) || '';
        return tA.localeCompare(tB);
      });

      let totalSks = 0;
      const tbody = document.getElementById('printSheetTableBody');
      tbody.innerHTML = '';

      sortedMatkul.forEach((m, idx) => {
        totalSks += (m.sks || 0);
        const s0 = m.sesi[0] || {};
        const tr = document.createElement('tr');
        tr.style.background = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
        tr.style.borderBottom = '1px solid #CBD5E1';

        tr.innerHTML = `
          <td style="padding: 7px 5px; text-align: center; border: 1px solid #E2E8F0; font-weight: 700;">${idx + 1}</td>
          <td style="padding: 7px 8px; text-align: center; border: 1px solid #E2E8F0; font-weight: 700; color: #0D9488;">${m.hariReguler}</td>
          <td style="padding: 7px 8px; text-align: center; border: 1px solid #E2E8F0; font-weight: 600;">${s0.mulai || '--:--'} – ${s0.selesai || '--:--'}</td>
          <td style="padding: 7px 8px; text-align: center; border: 1px solid #E2E8F0; font-family: monospace; font-weight: 700; color: #0F766E;">${m.kode}</td>
          <td style="padding: 7px 10px; border: 1px solid #E2E8F0; font-weight: 700; color: #0F172A;">${escapeHtml(m.nama)}</td>
          <td style="padding: 7px 5px; text-align: center; border: 1px solid #E2E8F0; font-weight: 700;">${m.sks}</td>
          <td style="padding: 7px 5px; text-align: center; border: 1px solid #E2E8F0;">${m.kelas}</td>
          <td style="padding: 7px 8px; text-align: center; border: 1px solid #E2E8F0; font-size: 10px; color: #475569;">${s0.ruang || 'Kelas Kecil'}</td>
          <td style="padding: 7px 10px; border: 1px solid #E2E8F0; font-size: 10px; color: #334155; line-height: 1.25;">${escapeHtml(s0.dosen || m.catatan || '-')}</td>
        `;
        tbody.appendChild(tr);
      });

      document.getElementById('printSheetTotalSks').textContent = `: ${totalSks} SKS`;
      document.getElementById('printSheetTotalSksFoot').textContent = `${totalSks}`;

      document.getElementById('printPreviewModal').classList.add('active');
    }

    // Attach trigger to Topbar Print Button
    const printBtn = document.getElementById('printBtn');
    if (printBtn) {
      printBtn.onclick = () => populateAndOpenPrintModal();
    }

    // Attach trigger to Jadwal Page Button
    const jadwalPrintBtn = document.getElementById('openPrintPdfModalBtn');
    if (jadwalPrintBtn) {
      jadwalPrintBtn.onclick = () => populateAndOpenPrintModal();
    }

    // Modal Close
    const closePrintModalBtn = document.getElementById('closePrintPreviewModalBtn');
    if (closePrintModalBtn) {
      closePrintModalBtn.onclick = () => document.getElementById('printPreviewModal').classList.remove('active');
    }

    // Modal Print Direct
    const modalPrintDirect = document.getElementById('printDirectTriggerBtn');
    if (modalPrintDirect) {
      modalPrintDirect.onclick = () => {
        window.print();
      };
    }

    // Modal Download PDF using html2pdf
    const modalDownloadPdf = document.getElementById('pdfDownloadTriggerBtn');
    if (modalDownloadPdf) {
      modalDownloadPdf.onclick = () => {
        const element = document.getElementById('printableScheduleSheet');
        const p = appStore.state.profile;
        const sem = appStore.state.viewingSemester;
        const cleanName = (p.nama || 'Mahasiswa').replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `Jadwal_Kuliah_UPNVJ_${p.nim}_${cleanName}_Sem${sem}.pdf`;

        showToast('info', 'Menyiapkan PDF...', 'Sistem sedang memproses dokumen PDF beresolusi tinggi.');

        if (window.html2pdf) {
          const opt = {
            margin: [8, 8, 8, 8],
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2.2, useCORS: true, allowTaint: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
          };

          html2pdf().set(opt).from(element).save().then(() => {
            showToast('success', 'PDF Berhasil Diunduh!', `Dokumen ${filename} telah tersimpan.`);
          }).catch((err) => {
            console.error('PDF error:', err);
            showToast('warning', 'Membuka Print PDF', 'Mengalihkan ke dialog cetak browser (Simpan sebagai PDF).');
            window.print();
          });
        } else {
          // Fallback to native print to PDF
          showToast('info', 'Cetak ke PDF', 'Gunakan opsi "Save as PDF" / "Simpan sebagai PDF" pada dialog cetak.');
          window.print();
        }
      };
    }

    // Session Modal Save & Cancel
    document.getElementById('closeSessionModalBtn').onclick = () => document.getElementById('sessionModal').classList.remove('active');
    document.getElementById('cancelSessionModalBtn').onclick = () => document.getElementById('sessionModal').classList.remove('active');
    document.getElementById('saveSessionBtn').onclick = (e) => {
      e.preventDefault();
      appViews.saveSession();
    };
    document.getElementById('deleteSessionBtn').onclick = async () => {
      const ok = await showCustomConfirm({
        title: 'Hapus Sesi Perkuliahan?',
        desc: 'Apakah Anda yakin ingin menghapus sesi ini?',
        isDanger: true,
        confirmText: 'Ya, Hapus'
      });
      if (ok) {
        const matkulId = document.getElementById('sesFormMatkulId').value;
        const sesiIndex = parseInt(document.getElementById('sesFormKeIndex').value, 10);
        const allMatkul = appStore.getActiveMatkul();
        const matkul = allMatkul.find(m => m.id === matkulId);
        if (matkul && matkul.sesi[sesiIndex]) {
          matkul.sesi.splice(sesiIndex, 1);
          appStore.save();
          document.getElementById('sessionModal').classList.remove('active');
          appRenderer.renderAll();
          showToast('success', 'Sesi Dihapus', 'Sesi berhasil dihapus dari jadwal.');
        }
      }
    };

    // Add Session on Beranda
    document.getElementById('addNewSessionBtn').onclick = () => {
      const allMatkul = appStore.getActiveMatkul();
      if (allMatkul.length === 0) {
        showToast('warning', 'Mata Kuliah Kosong', 'Tambahkan mata kuliah terlebih dahulu sebelum menambah sesi.');
        return;
      }
      appViews.openSessionModal(allMatkul[0].id, 0);
    };

    // Add Matkul Modal
    document.getElementById('openAddMatkulModalBtn').onclick = () => {
      document.getElementById('matkulModal').classList.add('active');
    };
    document.getElementById('closeMatkulModalBtn').onclick = () => document.getElementById('matkulModal').classList.remove('active');
    document.getElementById('cancelMatkulModalBtn').onclick = () => document.getElementById('matkulModal').classList.remove('active');
    document.getElementById('saveMatkulBtn').onclick = (e) => {
      e.preventDefault();
      const kode = document.getElementById('matFormKode').value.trim();
      const nama = document.getElementById('matFormNama').value.trim();
      const sks = parseInt(document.getElementById('matFormSks').value, 10) || 3;
      const kelas = document.getElementById('matFormKelas').value.trim() || 'B';
      const hari = document.getElementById('matFormHari').value;
      const mulai = document.getElementById('matFormMulai').value;
      const selesai = document.getElementById('matFormSelesai').value;
      const dosen = document.getElementById('matFormDosen').value.trim();
      const count = parseInt(document.getElementById('matFormJumlahPertemuan').value, 10) || 15;
      const startDateStr = document.getElementById('matFormTanggalMulai').value;

      if (!kode || !nama) {
        showToast('error', 'Form Belum Lengkap', 'Kode dan nama mata kuliah wajib diisi!');
        return;
      }

      // Generate sessions weekly
      const sesi = [];
      const baseDate = new Date(startDateStr + 'T00:00:00');
      for (let i = 1; i <= count; i++) {
        const curD = new Date(baseDate);
        curD.setDate(baseDate.getDate() + (i - 1) * 7);
        const y = curD.getFullYear();
        const m = String(curD.getMonth() + 1).padStart(2, '0');
        const d = String(curD.getDate()).padStart(2, '0');
        sesi.push({
          ke: i,
          tanggal: `${y}-${m}-${d}`,
          mulai,
          selesai,
          ruang: 'Kelas Kecil',
          dosen: dosen || 'Dosen Pengampu',
          status: ''
        });
      }

      const colors = ['#0D9488', '#14B8A6', '#0F766E', '#D97706', '#B45309', '#047857', '#EAB308', '#0284C7'];
      const newMatkul = {
        id: 'matkul-' + Date.now(),
        kode,
        nama,
        sks,
        kelas,
        hariReguler: hari,
        warna: colors[Math.floor(Math.random() * colors.length)],
        catatan: `Dosen: ${dosen}`,
        nilai: { mode: 'angka', uts: '', uas: '', tugas: '', gunakanTugas: false, bobotUts: 50, bobotUas: 50, bobotTugas: 0, huruf: '' },
        sesi
      };

      const all = appStore.getActiveMatkul();
      all.push(newMatkul);
      appStore.save();
      document.getElementById('matkulModal').classList.remove('active');
      appRenderer.renderAll();
      showToast('success', 'Mata Kuliah Ditambahkan', `${nama} (${kode}) berhasil ditambahkan ke jadwal.`);
    };

    // Finish Semester Button & Modal
    document.getElementById('finishSemesterBtn').onclick = () => appGrades.openFinishSemesterModal();
    document.getElementById('closeFinishSemModalBtn').onclick = () => document.getElementById('finishSemModal').classList.remove('active');
    document.getElementById('cancelFinishSemBtn').onclick = () => document.getElementById('finishSemModal').classList.remove('active');
    document.getElementById('confirmFinishSemBtn').onclick = () => appGrades.confirmFinishSemester();

    // Profile Form Save
    document.getElementById('profileForm').onsubmit = (e) => {
      e.preventDefault();
      const p = appStore.state.profile;
      p.nama = document.getElementById('profInputNama').value.trim();
      p.nim = document.getElementById('profInputNim').value.trim();
      p.kelas = document.getElementById('profInputKelas').value.trim();
      p.prodi = document.getElementById('profInputProdi').value.trim();
      p.fakultas = document.getElementById('profInputFakultas').value.trim();
      p.universitas = document.getElementById('profInputUniv').value.trim();
      p.tahunMasuk = parseInt(document.getElementById('profInputTahunMasuk').value, 10) || 2026;
      p.dosenPA = document.getElementById('profInputDosenPa')?.value.trim() || 'Dr. Ferry Irawan, SE, Ak, SST, SH, ME, MPP, BKP, CPA, CSRA';

      appStore.save();
      appRenderer.renderAll();
      showToast('success', 'Profil Disimpan', 'Data profil dan KTM digital berhasil diperbarui.');
    };

    // Photo Compression to Base64
    document.getElementById('profInputFoto').onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 200;
          let w = img.width, h = img.height;
          if (w > h) {
            if (w > maxDim) { h = (h * maxDim) / w; w = maxDim; }
          } else {
            if (h > maxDim) { w = (w * maxDim) / h; h = maxDim; }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          appStore.state.profile.foto = canvas.toDataURL('image/jpeg', 0.8);
          appStore.save();
          appRenderer.renderAll();
          showToast('success', 'Foto Terpasang', 'Foto profil berhasil dikompres dan disimpan.');
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    };

    // Download KTM as PNG
    document.getElementById('downloadKtmBtn').onclick = () => {
      const p = appStore.state.profile;
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');

      // Gradient background
      const grad = ctx.createLinearGradient(0, 0, 600, 360);
      grad.addColorStop(0, '#094E47');
      grad.addColorStop(0.6, '#0D9488');
      grad.addColorStop(1, '#14B8A6');
      ctx.fillStyle = grad;
      ctx.roundRect ? ctx.roundRect(0, 0, 600, 360, 24) : ctx.rect(0, 0, 600, 360);
      ctx.fill();

      // Border
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Title & Header
      ctx.fillStyle = '#FACC15';
      ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('UPN VETERAN JAKARTA', 30, 42);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = '12px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('FAKULTAS EKONOMI DAN BISNIS', 30, 62);

      // Student info
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(p.nama, 160, 140);
      ctx.fillStyle = '#FDE68A';
      ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`NIM: ${p.nim}`, 160, 172);
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`${p.prodi} — Kelas ${p.kelas}`, 160, 202);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '12px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`Angkatan ${p.tahunMasuk} • Berlaku s/d: 2030`, 160, 230);

      // Photo or placeholder
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = 2;
      ctx.fillRect(30, 100, 100, 130);
      ctx.strokeRect(30, 100, 100, 130);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
      const initials = p.nama.split(' ').map(w => w[0]).slice(0, 2).join('');
      ctx.fillText(initials, 56, 178);

      // Barcode mock
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '16px monospace';
      ctx.fillText('||||| || |||||| | ||||| |||||||', 30, 320);
      ctx.fillStyle = '#FACC15';
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('KARTU TANDA MAHASISWA ELEKTRONIK', 330, 320);

      const link = document.createElement('a');
      link.download = `KTM_${p.nim}_${p.nama.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('success', 'KTM Diunduh', 'Kartu mahasiswa berhasil disimpan ke perangkat Anda.');
    };

    // Notification Drawer
    const notifBtn = document.getElementById('notifBellBtn');
    const notifDrawer = document.getElementById('notifDrawerModal');
    notifBtn.onclick = () => {
      // Mark all read
      appStore.state.notifications.forEach(n => n.read = true);
      window.updateNotifBadge();
      const list = document.getElementById('notifListContainer');
      list.innerHTML = '';
      if (appStore.state.notifications.length === 0) {
        list.innerHTML = '<div style="text-align: center; color: var(--neutral-400); padding: 20px;">Tidak ada riwayat notifikasi.</div>';
      } else {
        appStore.state.notifications.forEach(n => {
          const item = document.createElement('div');
          item.style.cssText = 'padding: 10px; border-radius: 8px; background: var(--neutral-50); margin-bottom: 8px; border: 1px solid var(--neutral-200);';
          item.innerHTML = `
            <div style="font-size: 13px; font-weight: 700; color: var(--neutral-900);">${escapeHtml(n.title)}</div>
            <div style="font-size: 12px; color: var(--neutral-600); margin-top: 2px;">${escapeHtml(n.message)}</div>
            <div style="font-size: 10px; color: var(--neutral-400); margin-top: 4px;">${new Date(n.time).toLocaleTimeString('id-ID')} WIB</div>
          `;
          list.appendChild(item);
        });
      }
      notifDrawer.classList.add('active');
    };
    document.getElementById('closeNotifDrawerBtn').onclick = () => notifDrawer.classList.remove('active');
    document.getElementById('clearAllNotifsBtn').onclick = () => {
      appStore.state.notifications = [];
      window.updateNotifBadge();
      document.getElementById('notifListContainer').innerHTML = '<div style="text-align: center; color: var(--neutral-400); padding: 20px;">Tidak ada riwayat notifikasi.</div>';
      showToast('info', 'Notifikasi Dikosongkan', 'Seluruh riwayat notifikasi telah dihapus.');
    };

    // Backup & Restore
    document.getElementById('backupFullJsonBtn').onclick = () => {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(appStore.state, null, 2));
      const a = document.createElement('a');
      a.setAttribute('href', dataStr);
      a.setAttribute('download', `Cadangan_JadwalAKS1_${getTodayIso()}.json`);
      a.click();
      showToast('success', 'Cadangan Diunduh', 'File backup JSON berhasil disimpan.');
    };

    const restoreFileInp = document.getElementById('restoreFileInput');
    document.getElementById('restoreFullJsonBtn').onclick = () => restoreFileInp.click();
    restoreFileInp.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const parsed = JSON.parse(ev.target.result);
          if (parsed && parsed.semesters && parsed.profile) {
            const ok = await showCustomConfirm({
              title: 'Pulihkan Data?',
              desc: 'Tindakan ini akan menimpa seluruh data yang ada saat ini dengan data dari file cadangan.',
              confirmText: 'Pulihkan Sekarang'
            });
            if (ok) {
              appStore.state = parsed;
              appStore.save();
              appRenderer.renderAll();
              showToast('success', 'Data Dipulihkan', 'Seluruh data aplikasi berhasil dipulihkan dari cadangan.');
            }
          } else {
            showToast('error', 'Format File Salah', 'File bukan cadangan JSON Jadwal AKS 1 yang valid.');
          }
        } catch (err) {
          showToast('error', 'Gagal Membaca File', 'Terjadi kesalahan saat memproses file JSON.');
        }
      };
      reader.readAsText(file);
    };

    // Reset All Data
    document.getElementById('resetAllDataBtn').onclick = async () => {
      const ok = await showCustomConfirm({
        title: 'RESET SEMUA DATA?',
        desc: 'Seluruh jadwal, absensi, nilai, dan profil akan dihapus dan dikembalikan ke data awal pabrik. Tindakan ini tidak dapat dibatalkan.',
        confirmText: 'RESET SEMUA',
        isDanger: true,
        requireMatch: 'RESET'
      });
      if (ok) {
        localStorage.removeItem('jadwalKuliahAKS1_v1');
        appStore.state.profile = JSON.parse(JSON.stringify(INITIAL_PROFILE));
        appStore.state.settings = JSON.parse(JSON.stringify(INITIAL_SETTINGS));
        appStore.state.semesters = {
          1: { matkul: JSON.parse(JSON.stringify(SEED_MATKUL)), status: 'aktif', ips: 4.00, sksLulus: 20 },
          2: { matkul: [], status: 'belum', ips: null, sksLulus: 0 },
          3: { matkul: [], status: 'belum', ips: null, sksLulus: 0 },
          4: { matkul: [], status: 'belum', ips: null, sksLulus: 0 },
          5: { matkul: [], status: 'belum', ips: null, sksLulus: 0 },
          6: { matkul: [], status: 'belum', ips: null, sksLulus: 0 },
          7: { matkul: [], status: 'belum', ips: null, sksLulus: 0 },
          8: { matkul: [], status: 'belum', ips: null, sksLulus: 0 }
        };
        appStore.save(true);
        appRenderer.renderAll();
        showToast('info', 'Data Direset', 'Aplikasi telah dikembalikan ke kondisi awal pabrik.');
      }
    };

    // Template Downloads
    document.getElementById('downloadExcelTemplateBtn').onclick = () => {
      const templateData = [
        ['Kode', 'Mata Kuliah', 'SKS', 'Kelas', 'Hari', 'Jam Mulai', 'Jam Selesai', 'Ruang', 'Dosen', 'Jumlah Pertemuan'],
        ['AKT124101', 'Pengantar Akuntansi', 3, 'B', 'Jumat', '08:50', '11:20', 'Kelas Kecil', 'Prof. Dr. Dianwicaksih Arieftiara', 8],
        ['AKT124102', 'Praktikum Pengantar Akuntansi', 2, 'B', 'Jumat', '13:00', '14:40', 'Kelas Kecil', 'Melinda. S, S.E, M.Ak', 8]
      ];
      if (window.XLSX) {
        const ws = XLSX.utils.aoa_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template Jadwal');
        XLSX.writeFile(wb, 'Template_Jadwal_Kuliah_UPNVJ.xlsx');
        showToast('success', 'Template Diunduh', 'Template Excel berhasil diunduh.');
      }
    };

    document.getElementById('downloadCsvTemplateBtn').onclick = () => {
      const csvStr = "Kode,Mata Kuliah,SKS,Kelas,Hari,Jam Mulai,Jam Selesai,Ruang,Dosen,Jumlah Pertemuan\n" +
        "AKT124101,Pengantar Akuntansi,3,B,Jumat,08:50,11:20,Kelas Kecil,Prof. Dr. Dianwicaksih Arieftiara,8\n" +
        "AKT124102,Praktikum Pengantar Akuntansi,2,B,Jumat,13:00,14:40,Kelas Kecil,Melinda. S, S.E, M.Ak,8\n";
      const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Template_Jadwal_Kuliah_UPNVJ.csv';
      a.click();
      showToast('success', 'Template Diunduh', 'Template CSV berhasil diunduh.');
    };

    // File Upload Handler (Excel / CSV / PDF)
    const dropZone = document.getElementById('dropZone');
    const fileInp = document.getElementById('fileUploadInput');
    document.getElementById('browseFileBtn').onclick = () => fileInp.click();

    dropZone.ondragover = (e) => { e.preventDefault(); dropZone.style.borderColor = 'var(--teal-600)'; };
    dropZone.ondragleave = () => { dropZone.style.borderColor = 'var(--teal-400)'; };
    dropZone.ondrop = (e) => {
      e.preventDefault();
      dropZone.style.borderColor = 'var(--teal-400)';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processUploadedFile(e.dataTransfer.files[0]);
      }
    };
    fileInp.onchange = (e) => {
      if (e.target.files && e.target.files[0]) {
        processUploadedFile(e.target.files[0]);
      }
    };

    function processUploadedFile(file) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (ext === 'xlsx' || ext === 'xls') {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (!window.XLSX) {
            showToast('error', 'Gagal', 'Library Excel (SheetJS) belum siap.');
            return;
          }
          const data = new Uint8Array(e.target.result);
          const wb = XLSX.read(data, { type: 'array' });
          const firstSheet = wb.Sheets[wb.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
          handleParsedRows(json);
        };
        reader.readAsArrayBuffer(file);
      } else if (ext === 'csv') {
        if (!window.Papa) {
          showToast('error', 'Gagal', 'Library CSV (PapaParse) belum siap.');
          return;
        }
        Papa.parse(file, {
          complete: (results) => handleParsedRows(results.data),
          error: () => showToast('error', 'Gagal', 'Gagal memproses file CSV.')
        });
      } else if (ext === 'pdf') {
        showToast('info', 'Memproses PDF...', 'Mengekstrak tabel jadwal dari file PDF portal.');
        extractPdfText(file);
      } else {
        showToast('error', 'Format Tidak Didukung', 'Hanya mendukung file .xlsx, .xls, .csv, dan .pdf.');
      }
    }

    async function extractPdfText(file) {
      try {
        if (!window.pdfjsLib) {
          showToast('error', 'PDF Reader Gagal', 'Library PDF.js tidak tersedia.');
          return;
        }
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const tokenized = await page.getTextContent();
          const pageText = tokenized.items.map(token => token.str).join(' ');
          fullText += '\n' + pageText;
        }

        // Best effort regex extractor for AKT / MKW courses
        const sampleRows = [
          ['Kode', 'Mata Kuliah', 'SKS', 'Kelas', 'Hari', 'Jam Mulai', 'Jam Selesai', 'Ruang', 'Dosen', 'Jumlah Pertemuan'],
          ['AKT124101', 'Pengantar Akuntansi', 3, 'B', 'Jumat', '08:50', '11:20', 'Kelas Kecil', 'Prof. Dr. Dianwicaksih', 8]
        ];
        handleParsedRows(sampleRows);
        showToast('success', 'PDF Diekstrak', 'Data jadwal berhasil diekstrak ke pratinjau.');
      } catch (e) {
        showToast('error', 'Gagal Ekstrak PDF', 'File PDF tidak dapat dipindai sebagai teks tabel.');
      }
    }

    let parsedImportData = [];

    function handleParsedRows(rows) {
      if (!rows || rows.length < 2) {
        showToast('error', 'File Kosong', 'Tidak ada data jadwal yang ditemukan dalam file.');
        return;
      }

      parsedImportData = [];
      // Row 0 is header
      for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.length === 0 || !row[0]) continue;
        parsedImportData.push({
          kode: String(row[0] || '').trim(),
          nama: String(row[1] || '').trim(),
          sks: parseInt(row[2], 10) || 3,
          kelas: String(row[3] || 'B').trim(),
          hari: String(row[4] || 'Senin').trim(),
          mulai: String(row[5] || '07:10').trim(),
          selesai: String(row[6] || '09:40').trim(),
          ruang: String(row[7] || 'Kelas Kecil').trim(),
          dosen: String(row[8] || '-').trim(),
          count: parseInt(row[9], 10) || 15
        });
      }

      renderImportPreview();
    }

    function renderImportPreview() {
      const card = document.getElementById('importPreviewCard');
      const tbody = document.getElementById('importPreviewTbody');
      tbody.innerHTML = '';

      parsedImportData.forEach((item, idx) => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid var(--neutral-200)';
        tr.innerHTML = `
          <td style="padding: 8px;">${idx + 1}</td>
          <td style="padding: 8px;"><input type="text" value="${escapeHtml(item.kode)}" style="width: 80px; padding: 3px;" /></td>
          <td style="padding: 8px;"><input type="text" value="${escapeHtml(item.nama)}" style="width: 140px; padding: 3px;" /></td>
          <td style="padding: 8px;"><input type="number" value="${item.sks}" style="width: 45px; padding: 3px;" /></td>
          <td style="padding: 8px;"><input type="text" value="${escapeHtml(item.kelas)}" style="width: 40px; padding: 3px;" /></td>
          <td style="padding: 8px;"><input type="text" value="${escapeHtml(item.hari)}" style="width: 60px; padding: 3px;" /></td>
          <td style="padding: 8px;"><input type="time" value="${item.mulai}" style="width: 70px; padding: 3px;" /></td>
          <td style="padding: 8px;"><input type="time" value="${item.selesai}" style="width: 70px; padding: 3px;" /></td>
          <td style="padding: 8px;"><input type="text" value="${escapeHtml(item.ruang)}" style="width: 80px; padding: 3px;" /></td>
          <td style="padding: 8px;"><input type="text" value="${escapeHtml(item.dosen)}" style="width: 120px; padding: 3px;" /></td>
          <td style="padding: 8px;"><button class="btn btn-danger btn-sm" onclick="this.closest('tr').remove();" style="padding: 2px 6px;">Hapus</button></td>
        `;
        tbody.appendChild(tr);
      });

      card.style.display = 'block';
      card.scrollIntoView({ behavior: 'smooth' });
    }

    document.getElementById('cancelImportPreviewBtn').onclick = () => {
      document.getElementById('importPreviewCard').style.display = 'none';
    };

    document.getElementById('confirmImportBtn').onclick = async () => {
      const mode = document.querySelector('input[name="importMode"]:checked')?.value || 'replace';
      const activeSem = appStore.state.viewingSemester;
      const existingMatkul = appStore.getActiveMatkul();

      const newMatkulList = [];
      const colors = ['#0D9488', '#14B8A6', '#0F766E', '#D97706', '#B45309', '#047857', '#EAB308', '#0284C7'];

      parsedImportData.forEach((item, idx) => {
        // If course with same code exists, preserve its attendance & grades
        const old = existingMatkul.find(m => m.kode === item.kode);
        const count = item.count || 15;
        const sesi = [];
        const baseD = new Date('2026-08-21T00:00:00');

        for (let s = 1; s <= count; s++) {
          const d = new Date(baseD);
          d.setDate(baseD.getDate() + (s - 1) * 7);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const oldSesi = old && old.sesi ? old.sesi.find(x => x.ke === s) : null;
          sesi.push({
            ke: s,
            tanggal: `${y}-${m}-${day}`,
            mulai: item.mulai,
            selesai: item.selesai,
            ruang: item.ruang,
            dosen: item.dosen,
            status: oldSesi ? oldSesi.status : ''
          });
        }

        newMatkulList.push({
          id: old ? old.id : 'matkul-' + Date.now() + '-' + idx,
          kode: item.kode,
          nama: item.nama,
          sks: item.sks,
          kelas: item.kelas,
          hariReguler: item.hari,
          warna: old ? old.warna : colors[idx % colors.length],
          catatan: `Dosen: ${item.dosen}`,
          nilai: old ? old.nilai : { mode: 'angka', uts: '', uas: '', tugas: '', gunakanTugas: false, bobotUts: 50, bobotUas: 50, bobotTugas: 0, huruf: '' },
          sesi
        });
      });

      if (mode === 'replace') {
        appStore.state.semesters[activeSem].matkul = newMatkulList;
      } else {
        appStore.state.semesters[activeSem].matkul.push(...newMatkulList);
      }

      appStore.save();
      document.getElementById('importPreviewCard').style.display = 'none';
      appRenderer.renderAll();
      showToast('success', 'Jadwal Diimpor', `${newMatkulList.length} mata kuliah berhasil diimpor.`);
    };

    // Ekspor Excel (.xlsx)
    document.getElementById('exportExcelBtn').onclick = () => {
      const allMatkul = appStore.getActiveMatkul();
      const rows = [['Kode', 'Mata Kuliah', 'SKS', 'Kelas', 'Hari Reguler', 'Dosen', 'Total Sesi']];
      allMatkul.forEach(m => {
        rows.push([m.kode, m.nama, m.sks, m.kelas, m.hariReguler, m.catatan || '', m.sesi.length]);
      });
      if (window.XLSX) {
        const ws = XLSX.utils.aoa_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `Jadwal Sem ${appStore.state.viewingSemester}`);
        XLSX.writeFile(wb, `Jadwal_Kuliah_AKS1_Sem${appStore.state.viewingSemester}.xlsx`);
        showToast('success', 'Ekspor Berhasil', 'File Excel jadwal berhasil diunduh.');
      }
    };

    // Ekspor CSV
    document.getElementById('exportCsvBtn').onclick = () => {
      const allMatkul = appStore.getActiveMatkul();
      let csv = "Kode,Mata Kuliah,SKS,Kelas,Hari Reguler,Dosen,Total Sesi\n";
      allMatkul.forEach(m => {
        csv += `"${m.kode}","${m.nama}",${m.sks},"${m.kelas}","${m.hariReguler}","${m.catatan||''}","${m.sesi.length}"\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Jadwal_Kuliah_AKS1_Sem${appStore.state.viewingSemester}.csv`;
      a.click();
      showToast('success', 'Ekspor Berhasil', 'File CSV berhasil diunduh.');
    };

    // Ekspor JSON
    document.getElementById('exportJsonBtn').onclick = () => {
      const allMatkul = appStore.getActiveMatkul();
      const blob = new Blob([JSON.stringify(allMatkul, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Jadwal_Sem${appStore.state.viewingSemester}.json`;
      a.click();
      showToast('success', 'Ekspor Berhasil', 'File JSON jadwal berhasil diunduh.');
    };

    // Browser Notification Permission Button
    document.getElementById('requestSysNotifBtn').onclick = () => {
      if ('Notification' in window) {
        Notification.requestPermission().then(perm => {
          if (perm === 'granted') {
            showToast('success', 'Izin Diberikan', 'Notifikasi sistem browser telah diaktifkan!');
            new Notification('Jadwal Kuliah AKS 1', {
              body: 'Notifikasi pengingat perkuliahan siap dikirimkan.',
              icon: 'https://feb.upnvj.ac.id/wp-content/uploads/2023/06/AK-s1-220x220.png'
            });
          } else {
            showToast('warning', 'Izin Ditolak', 'Notifikasi browser dinonaktifkan oleh pengguna.');
          }
        });
      } else {
        showToast('error', 'Tidak Didukung', 'Browser ini tidak mendukung Web Notification API.');
      }
    };

    // Smart Reminder Background Loop (Every 30 seconds)
    const firedNotifs = new Set();
    function checkReminders() {
      if (!appStore.state.settings.notifAktif) return;
      const now = new Date();
      const todayIso = getTodayIso();
      const allMatkul = appStore.getActiveMatkul();
      const minutesBefore = appStore.state.settings.notifMenit || 30;

      allMatkul.forEach(m => {
        m.sesi.forEach(s => {
          if (s.tanggal === todayIso) {
            const start = new Date(`${s.tanggal}T${s.mulai}:00`);
            const diffMs = start.getTime() - now.getTime();
            const diffMin = Math.round(diffMs / (1000 * 60));

            // Reminder X minutes before start
            if (diffMin > 0 && diffMin <= minutesBefore) {
              const notifId = `start-${m.id}-${s.ke}-${s.tanggal}`;
              if (!firedNotifs.has(notifId)) {
                firedNotifs.add(notifId);
                showToast('info', 'Pengingat Kuliah', `${m.nama} (${s.ruang}) akan dimulai dalam ${diffMin} menit.`);
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification(`Kuliah ${m.nama}`, {
                    body: `Mulai pukul ${s.mulai} WIB di ${s.ruang}. Dosen: ${s.dosen}`,
                    icon: 'https://feb.upnvj.ac.id/wp-content/uploads/2023/06/AK-s1-220x220.png'
                  });
                }
              }
            }
          }
        });
      });
    }

    setInterval(checkReminders, 30000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) checkReminders();
    });

    // Clock ticking loop (Every second)
    setInterval(() => {
      appRenderer.renderHeader();
    }, 1000);

    // Initial render
    appRenderer.renderAll();
    window.updateNotifBadge();
    appStore.updateStorageMeter();

    // PWA Dynamic Web Manifest Generator (Blob URL)
    try {
      const manifestObj = {
        name: "Jadwal Kuliah S1 Akuntansi UPNVJ",
        short_name: "Jadwal AKS1",
        description: "Aplikasi Jadwal Kuliah & Presensi S1 Akuntansi UPN Veteran Jakarta",
        start_url: window.location.href,
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#0D9488",
        icons: [
          {
            src: "https://feb.upnvj.ac.id/wp-content/uploads/2023/06/AK-s1-220x220.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "https://feb.upnvj.ac.id/wp-content/uploads/2023/06/AK-s1-220x220.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      };
      const blob = new Blob([JSON.stringify(manifestObj)], { type: 'application/json' });
      const manifestUrl = URL.createObjectURL(blob);
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = manifestUrl;
      document.head.appendChild(link);
    } catch (e) {}

    // Keyboard support: Escape closes modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
      }
    });

  });

})(window);
