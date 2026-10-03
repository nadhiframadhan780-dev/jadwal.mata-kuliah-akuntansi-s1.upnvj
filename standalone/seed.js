// Seed Data Semester 1 Tahun Akademik 2026/2027 Ganjil Reguler
// S1 Akuntansi - UPN Veteran Jakarta
const INITIAL_PROFILE = {
  nama: "Nadhif Aulia Ramadhan",
  nim: "2610112058",
  kelas: "B",
  prodi: "S1 Akuntansi",
  fakultas: "Fakultas Ekonomi dan Bisnis",
  universitas: "UPN \"Veteran\" Jakarta",
  tahunMasuk: 2026,
  dosenPA: "Dr. Ferry Irawan, SE, Ak, SST, SH, ME, MPP, BKP, CPA, CSRA",
  foto: "", // Base64 avatar placeholder
  semesterAktif: 1,
  targetIpk: 3.51
};

const INITIAL_SETTINGS = {
  minKehadiran: 75,
  notifAktif: true,
  notifMenit: 30,
  suaraAktif: true,
  ringkasanMalamJam: 20,
  skalaNilai: [
    { huruf: "A", min: 80, bobot: 4.0 },
    { huruf: "B", min: 70, bobot: 3.0 },
    { huruf: "C", min: 60, bobot: 2.0 },
    { huruf: "D", min: 50, bobot: 1.0 },
    { huruf: "E", min: 0, bobot: 0.0 }
  ]
};

const SEED_MATKUL = [
  {
    id: "matkul-1",
    kode: "AKT124101",
    nama: "Pengantar Akuntansi",
    sks: 3,
    kelas: "B",
    hariReguler: "Jumat",
    warna: "#0D9488", // Teal 600
    catatan: "Dosen: Prof. Dr. Dianwicaksih Arieftiara, S.E., Ak., M.Ak., CA., CSRS., GRCE",
    nilai: { mode: "angka", uts: "", uas: "", tugas: "", gunakanTugas: false, bobotUts: 50, bobotUas: 50, bobotTugas: 0, huruf: "" },
    sesi: [
      { ke: 1, tanggal: "2026-08-21", mulai: "08:50", selesai: "11:20", ruang: "Kelas Kecil", dosen: "Prof. Dr. Dianwicaksih Arieftiara, S.E., Ak., M.Ak., CA., CSRS., GRCE", status: "hadir" },
      { ke: 2, tanggal: "2026-08-28", mulai: "08:50", selesai: "11:20", ruang: "Kelas Kecil", dosen: "Prof. Dr. Dianwicaksih Arieftiara, S.E., Ak., M.Ak., CA., CSRS., GRCE", status: "hadir" },
      { ke: 3, tanggal: "2026-09-04", mulai: "08:50", selesai: "11:20", ruang: "Kelas Kecil", dosen: "Prof. Dr. Dianwicaksih Arieftiara, S.E., Ak., M.Ak., CA., CSRS., GRCE", status: "hadir" },
      { ke: 4, tanggal: "2026-09-11", mulai: "08:50", selesai: "11:20", ruang: "Kelas Kecil", dosen: "Prof. Dr. Dianwicaksih Arieftiara, S.E., Ak., M.Ak., CA., CSRS., GRCE", status: "hadir" },
      { ke: 5, tanggal: "2026-09-18", mulai: "08:50", selesai: "11:20", ruang: "Kelas Kecil", dosen: "Prof. Dr. Dianwicaksih Arieftiara, S.E., Ak., M.Ak., CA., CSRS., GRCE", status: "" },
      { ke: 6, tanggal: "2026-09-25", mulai: "08:50", selesai: "11:20", ruang: "Kelas Kecil", dosen: "Prof. Dr. Dianwicaksih Arieftiara, S.E., Ak., M.Ak., CA., CSRS., GRCE", status: "" },
      { ke: 7, tanggal: "2026-10-02", mulai: "08:50", selesai: "11:20", ruang: "Kelas Kecil", dosen: "Prof. Dr. Dianwicaksih Arieftiara, S.E., Ak., M.Ak., CA., CSRS., GRCE", status: "" },
      { ke: 8, tanggal: "2026-10-09", mulai: "08:50", selesai: "11:20", ruang: "Kelas Kecil", dosen: "Prof. Dr. Dianwicaksih Arieftiara, S.E., Ak., M.Ak., CA., CSRS., GRCE", status: "" }
    ]
  },
  {
    id: "matkul-2",
    kode: "AKT124102",
    nama: "Praktikum Pengantar Akuntansi",
    sks: 2,
    kelas: "B",
    hariReguler: "Jumat",
    warna: "#14B8A6", // Teal 500
    catatan: "Dosen: Melinda. S, S.E, M.Ak",
    nilai: { mode: "angka", uts: "", uas: "", tugas: "", gunakanTugas: false, bobotUts: 50, bobotUas: 50, bobotTugas: 0, huruf: "" },
    sesi: [
      { ke: 1, tanggal: "2026-08-21", mulai: "13:00", selesai: "14:40", ruang: "Kelas Kecil", dosen: "Melinda. S, S.E, M.Ak", status: "hadir" },
      { ke: 2, tanggal: "2026-08-28", mulai: "13:00", selesai: "14:40", ruang: "Kelas Kecil", dosen: "Melinda. S, S.E, M.Ak", status: "hadir" },
      { ke: 3, tanggal: "2026-09-04", mulai: "13:00", selesai: "14:40", ruang: "Kelas Kecil", dosen: "Melinda. S, S.E, M.Ak", status: "hadir" },
      { ke: 4, tanggal: "2026-09-11", mulai: "13:00", selesai: "14:40", ruang: "Kelas Kecil", dosen: "Melinda. S, S.E, M.Ak", status: "hadir" },
      { ke: 5, tanggal: "2026-09-18", mulai: "13:00", selesai: "14:40", ruang: "Kelas Kecil", dosen: "Melinda. S, S.E, M.Ak", status: "" },
      { ke: 6, tanggal: "2026-09-25", mulai: "13:00", selesai: "14:40", ruang: "Kelas Kecil", dosen: "Melinda. S, S.E, M.Ak", status: "" },
      { ke: 7, tanggal: "2026-10-02", mulai: "13:00", selesai: "14:40", ruang: "Kelas Kecil", dosen: "Melinda. S, S.E, M.Ak", status: "" },
      { ke: 8, tanggal: "2026-10-09", mulai: "13:00", selesai: "14:40", ruang: "Kelas Kecil", dosen: "Melinda. S, S.E, M.Ak", status: "" }
    ]
  },
  {
    id: "matkul-3",
    kode: "AKT124103",
    nama: "Pengantar Ilmu Ekonomi",
    sks: 3,
    kelas: "C",
    hariReguler: "Senin",
    warna: "#0F766E", // Teal 700
    catatan: "Dosen: Achmad Nur Hidayat, SE., M.PP / Khusnul Khatimah, S.P., M.Si.",
    nilai: { mode: "angka", uts: "", uas: "", tugas: "", gunakanTugas: false, bobotUts: 50, bobotUas: 50, bobotTugas: 0, huruf: "" },
    sesi: [
      { ke: 1, tanggal: "2026-08-24", mulai: "13:00", selesai: "15:40", ruang: "Kelas Kecil", dosen: "Achmad Nur Hidayat, SE., M.PP", status: "hadir" },
      { ke: 2, tanggal: "2026-08-31", mulai: "13:00", selesai: "15:40", ruang: "Kelas Kecil", dosen: "Achmad Nur Hidayat, SE., M.PP", status: "hadir" },
      { ke: 3, tanggal: "2026-09-07", mulai: "13:00", selesai: "15:30", ruang: "Kelas Kecil", dosen: "Achmad Nur Hidayat, SE., M.PP", status: "hadir" },
      { ke: 4, tanggal: "2026-09-14", mulai: "13:00", selesai: "15:30", ruang: "Kelas Kecil", dosen: "Achmad Nur Hidayat, SE., M.PP", status: "" },
      { ke: 5, tanggal: "2026-09-21", mulai: "07:10", selesai: "09:40", ruang: "Kelas Besar", dosen: "Dr. Raden Parianom, SE., M.SE", status: "" },
      { ke: 6, tanggal: "2026-09-28", mulai: "13:00", selesai: "15:30", ruang: "Kelas Kecil", dosen: "Achmad Nur Hidayat, SE., M.PP", status: "" },
      { ke: 7, tanggal: "2026-10-05", mulai: "13:00", selesai: "15:30", ruang: "Kelas Kecil", dosen: "Achmad Nur Hidayat, SE., M.PP", status: "" },
      { ke: 8, tanggal: "2026-10-12", mulai: "13:00", selesai: "15:30", ruang: "Kelas Kecil", dosen: "Achmad Nur Hidayat, SE., M.PP", status: "" },
      { ke: 9, tanggal: "2026-10-19", mulai: "13:00", selesai: "15:30", ruang: "Kelas Kecil", dosen: "Khusnul Khatimah, S.P., M.Si.", status: "" },
      { ke: 10, tanggal: "2026-10-26", mulai: "13:00", selesai: "15:30", ruang: "Kelas Kecil", dosen: "Khusnul Khatimah, S.P., M.Si.", status: "" },
      { ke: 11, tanggal: "2026-11-02", mulai: "13:00", selesai: "15:30", ruang: "Kelas Kecil", dosen: "Khusnul Khatimah, S.P., M.Si.", status: "" },
      { ke: 12, tanggal: "2026-11-09", mulai: "13:00", selesai: "15:30", ruang: "Kelas Kecil", dosen: "Khusnul Khatimah, S.P., M.Si.", status: "" },
      { ke: 13, tanggal: "2026-11-16", mulai: "13:00", selesai: "15:30", ruang: "Kelas Kecil", dosen: "Khusnul Khatimah, S.P., M.Si.", status: "" },
      { ke: 14, tanggal: "2026-11-23", mulai: "13:00", selesai: "15:30", ruang: "Kelas Kecil", dosen: "Khusnul Khatimah, S.P., M.Si.", status: "" },
      { ke: 15, tanggal: "2026-11-30", mulai: "13:00", selesai: "15:30", ruang: "Kelas Kecil", dosen: "Khusnul Khatimah, S.P., M.Si.", status: "" }
    ]
  },
  {
    id: "matkul-4",
    kode: "AKT124104",
    nama: "Bahasa Inggris Ekonomi dan Bisnis",
    sks: 3,
    kelas: "B",
    hariReguler: "Selasa",
    warna: "#D97706", // Amber 600
    catatan: "Dosen: Kania Mayastika, Ph.D / Rachmi, S.Pd., M.Pd",
    nilai: { mode: "angka", uts: "", uas: "", tugas: "", gunakanTugas: false, bobotUts: 50, bobotUas: 50, bobotTugas: 0, huruf: "" },
    sesi: [
      { ke: 1, tanggal: "2026-08-18", mulai: "13:00", selesai: "15:30", ruang: "Kelas Kecil", dosen: "Kania Mayastika, Ph.D", status: "" },
      { ke: 2, tanggal: "2026-08-29", mulai: "13:00", selesai: "15:30", ruang: "Kelas Kecil", dosen: "Kania Mayastika, Ph.D", status: "hadir" }, // Sabtu pengganti
      { ke: 3, tanggal: "2026-09-01", mulai: "13:00", selesai: "15:30", ruang: "Kelas Kecil", dosen: "Kania Mayastika, Ph.D", status: "" },
      { ke: 4, tanggal: "2026-09-08", mulai: "13:00", selesai: "15:30", ruang: "Kelas Kecil", dosen: "Kania Mayastika, Ph.D", status: "hadir" },
      { ke: 5, tanggal: "2026-09-15", mulai: "13:00", selesai: "15:30", ruang: "Kelas Kecil", dosen: "Kania Mayastika, Ph.D", status: "" },
      { ke: 6, tanggal: "2026-09-22", mulai: "13:00", selesai: "15:30", ruang: "Kelas Kecil", dosen: "Kania Mayastika, Ph.D", status: "" },
      { ke: 7, tanggal: "2026-09-29", mulai: "13:00", selesai: "15:30", ruang: "Kelas Kecil", dosen: "Kania Mayastika, Ph.D", status: "" },
      { ke: 8, tanggal: "2026-10-06", mulai: "13:00", selesai: "15:30", ruang: "Kelas Kecil", dosen: "Kania Mayastika, Ph.D", status: "" },
      { ke: 9, tanggal: "2026-10-13", mulai: "13:00", selesai: "15:30", ruang: "Kelas Kecil", dosen: "Rachmi, S.Pd., M.Pd", status: "" },
      { ke: 10, tanggal: "2026-10-20", mulai: "13:00", selesai: "15:30", ruang: "Kelas Kecil", dosen: "Rachmi, S.Pd., M.Pd", status: "" },
      { ke: 11, tanggal: "2026-10-27", mulai: "13:00", selesai: "15:30", ruang: "Kelas Kecil", dosen: "Rachmi, S.Pd., M.Pd", status: "" },
      { ke: 12, tanggal: "2026-11-03", mulai: "13:00", selesai: "15:30", ruang: "Kelas Kecil", dosen: "Rachmi, S.Pd., M.Pd", status: "" },
      { ke: 13, tanggal: "2026-11-10", mulai: "13:00", selesai: "15:30", ruang: "Kelas Kecil", dosen: "Rachmi, S.Pd., M.Pd", status: "" },
      { ke: 14, tanggal: "2026-11-17", mulai: "13:00", selesai: "15:30", ruang: "Kelas Kecil", dosen: "Rachmi, S.Pd., M.Pd", status: "" },
      { ke: 15, tanggal: "2026-11-24", mulai: "13:00", selesai: "15:30", ruang: "Kelas Kecil", dosen: "Rachmi, S.Pd., M.Pd", status: "" }
    ]
  },
  {
    id: "matkul-5",
    kode: "AKT124105",
    nama: "Pengantar Manajemen dan Bisnis",
    sks: 3,
    kelas: "B",
    hariReguler: "Kamis",
    warna: "#B45309", // Warm Amber
    catatan: "Dosen: Agus Kusmana, SE, MM, CHCSA / Dr. Yudi Nur Supriadi",
    nilai: { mode: "angka", uts: "", uas: "", tugas: "", gunakanTugas: false, bobotUts: 50, bobotUas: 50, bobotTugas: 0, huruf: "" },
    sesi: [
      { ke: 1, tanggal: "2026-08-20", mulai: "07:10", selesai: "09:40", ruang: "Kelas Kecil", dosen: "Agus Kusmana, SE, MM, CHCSA", status: "hadir" },
      { ke: 2, tanggal: "2026-08-27", mulai: "07:10", selesai: "09:40", ruang: "Kelas Kecil", dosen: "Agus Kusmana, SE, MM, CHCSA", status: "hadir" },
      { ke: 3, tanggal: "2026-09-03", mulai: "07:10", selesai: "09:40", ruang: "Kelas Kecil", dosen: "Agus Kusmana, SE, MM, CHCSA", status: "hadir" },
      { ke: 4, tanggal: "2026-09-10", mulai: "07:10", selesai: "09:40", ruang: "Kelas Kecil", dosen: "Agus Kusmana, SE, MM, CHCSA", status: "hadir" },
      { ke: 5, tanggal: "2026-09-14", mulai: "07:10", selesai: "09:40", ruang: "Kelas Besar", dosen: "Dr. Yudi Nur Supriadi, S.Sos.I, M.M.", status: "" }, // Senin Kelas Besar
      { ke: 6, tanggal: "2026-09-24", mulai: "07:10", selesai: "09:40", ruang: "Kelas Kecil", dosen: "Munasiron Miftah, S.E., M.M., CRP", status: "" },
      { ke: 7, tanggal: "2026-10-01", mulai: "07:10", selesai: "09:40", ruang: "Kelas Kecil", dosen: "Agus Kusmana, SE, MM, CHCSA", status: "" },
      { ke: 8, tanggal: "2026-10-08", mulai: "07:10", selesai: "09:40", ruang: "Kelas Kecil", dosen: "Agus Kusmana, SE, MM, CHCSA", status: "" }
    ]
  },
  {
    id: "matkul-6",
    kode: "MKW124101",
    nama: "Agama",
    sks: 2,
    kelas: "E",
    hariReguler: "Jumat",
    warna: "#047857", // Emerald / Teal deep
    catatan: "Dosen: Dr. Badruddin, S.Pd.I., M.Pd / Dr. Hasan Basri",
    nilai: { mode: "angka", uts: "", uas: "", tugas: "", gunakanTugas: false, bobotUts: 50, bobotUas: 50, bobotTugas: 0, huruf: "" },
    sesi: [
      { ke: 1, tanggal: "2026-08-21", mulai: "07:10", selesai: "08:50", ruang: "Kelas Kecil", dosen: "Dr. Badruddin, S.Pd.I., M.Pd", status: "hadir" },
      { ke: 2, tanggal: "2026-08-28", mulai: "07:10", selesai: "08:50", ruang: "Kelas Kecil", dosen: "Dr. Badruddin, S.Pd.I., M.Pd", status: "hadir" },
      { ke: 3, tanggal: "2026-09-04", mulai: "07:10", selesai: "08:50", ruang: "Kelas Kecil", dosen: "Dr. Badruddin, S.Pd.I., M.Pd", status: "hadir" },
      { ke: 4, tanggal: "2026-09-11", mulai: "07:10", selesai: "08:50", ruang: "Kelas Kecil", dosen: "Dr. Badruddin, S.Pd.I., M.Pd", status: "hadir" },
      { ke: 5, tanggal: "2026-09-18", mulai: "07:10", selesai: "08:50", ruang: "Kelas Besar", dosen: "Dr. Hasan Basri, S.Sy., M.Pd.I", status: "" },
      { ke: 6, tanggal: "2026-09-25", mulai: "07:10", selesai: "08:50", ruang: "Kelas Besar", dosen: "Dr. Hasan Basri, S.Sy., M.Pd.I", status: "" },
      { ke: 7, tanggal: "2026-10-02", mulai: "07:10", selesai: "08:50", ruang: "Kelas Kecil", dosen: "Dr. Badruddin, S.Pd.I., M.Pd", status: "" },
      { ke: 8, tanggal: "2026-10-09", mulai: "07:10", selesai: "08:50", ruang: "Kelas Kecil", dosen: "Dr. Badruddin, S.Pd.I., M.Pd", status: "" },
      { ke: 9, tanggal: "2026-10-16", mulai: "07:10", selesai: "08:50", ruang: "Kelas Kecil", dosen: "Dr. Badruddin, S.Pd.I., M.Pd", status: "" },
      { ke: 10, tanggal: "2026-10-23", mulai: "07:10", selesai: "08:50", ruang: "Kelas Kecil", dosen: "Dr. Badruddin, S.Pd.I., M.Pd", status: "" },
      { ke: 11, tanggal: "2026-10-30", mulai: "07:10", selesai: "08:50", ruang: "Kelas Kecil", dosen: "Dr. Badruddin, S.Pd.I., M.Pd", status: "" },
      { ke: 12, tanggal: "2026-11-06", mulai: "07:10", selesai: "08:50", ruang: "Kelas Kecil", dosen: "Dr. Badruddin, S.Pd.I., M.Pd", status: "" },
      { ke: 13, tanggal: "2026-11-13", mulai: "07:10", selesai: "08:50", ruang: "Kelas Kecil", dosen: "Dr. Badruddin, S.Pd.I., M.Pd", status: "" },
      { ke: 14, tanggal: "2026-11-20", mulai: "07:10", selesai: "08:50", ruang: "Kelas Kecil", dosen: "Dr. Badruddin, S.Pd.I., M.Pd", status: "" },
      { ke: 15, tanggal: "2026-11-27", mulai: "07:10", selesai: "08:50", ruang: "Kelas Kecil", dosen: "Dr. Badruddin, S.Pd.I., M.Pd", status: "" }
    ]
  },
  {
    id: "matkul-7",
    kode: "MKW124104",
    nama: "Pendidikan Bela Negara",
    sks: 2,
    kelas: "E",
    hariReguler: "Selasa",
    warna: "#EAB308", // Yellow 500
    catatan: "Dosen: Agus Kusmana, SE, MM, CHCSA / Dr. Jubei Levianto",
    nilai: { mode: "angka", uts: "", uas: "", tugas: "", gunakanTugas: false, bobotUts: 50, bobotUas: 50, bobotTugas: 0, huruf: "" },
    sesi: [
      { ke: 1, tanggal: "2026-08-18", mulai: "07:10", selesai: "08:50", ruang: "Kelas Kecil", dosen: "Agus Kusmana, SE, MM, CHCSA", status: "hadir" },
      { ke: 2, tanggal: "2026-08-29", mulai: "07:10", selesai: "08:50", ruang: "Kelas Kecil", dosen: "Agus Kusmana, SE, MM, CHCSA", status: "hadir" }, // Sabtu
      { ke: 3, tanggal: "2026-09-01", mulai: "08:50", selesai: "09:30", ruang: "Kelas Kecil", dosen: "Agus Kusmana, SE, MM, CHCSA", status: "hadir", catatanKhusus: "Sesuai portal (08:50-09:30)" },
      { ke: 4, tanggal: "2026-09-08", mulai: "07:10", selesai: "08:50", ruang: "Kelas Kecil", dosen: "Agus Kusmana, SE, MM, CHCSA", status: "hadir" },
      { ke: 5, tanggal: "2026-09-15", mulai: "08:50", selesai: "10:30", ruang: "Kelas Besar", dosen: "Dr. Jubei Levianto, S.Sos., M.M", status: "" },
      { ke: 6, tanggal: "2026-09-22", mulai: "08:50", selesai: "10:30", ruang: "Kelas Besar", dosen: "Dr. Jubei Levianto, S.Sos., M.M", status: "" },
      { ke: 7, tanggal: "2026-09-29", mulai: "07:10", selesai: "08:50", ruang: "Kelas Kecil", dosen: "Agus Kusmana, SE, MM, CHCSA", status: "" },
      { ke: 8, tanggal: "2026-10-06", mulai: "07:10", selesai: "08:50", ruang: "Kelas Kecil", dosen: "Agus Kusmana, SE, MM, CHCSA", status: "" },
      { ke: 9, tanggal: "2026-10-13", mulai: "07:10", selesai: "08:50", ruang: "Kelas Kecil", dosen: "Agus Kusmana, SE, MM, CHCSA", status: "" },
      { ke: 10, tanggal: "2026-10-20", mulai: "07:10", selesai: "08:50", ruang: "Kelas Kecil", dosen: "Agus Kusmana, SE, MM, CHCSA", status: "" },
      { ke: 11, tanggal: "2026-10-27", mulai: "07:10", selesai: "08:50", ruang: "Kelas Kecil", dosen: "Agus Kusmana, SE, MM, CHCSA", status: "" },
      { ke: 12, tanggal: "2026-11-03", mulai: "07:10", selesai: "08:50", ruang: "Kelas Kecil", dosen: "Agus Kusmana, SE, MM, CHCSA", status: "" },
      { ke: 13, tanggal: "2026-11-10", mulai: "07:10", selesai: "08:50", ruang: "Kelas Kecil", dosen: "Agus Kusmana, SE, MM, CHCSA", status: "" },
      { ke: 14, tanggal: "2026-11-17", mulai: "07:10", selesai: "08:05", ruang: "Kelas Kecil", dosen: "Agus Kusmana, SE, MM, CHCSA", status: "", catatanKhusus: "Sesuai portal (07:10-08:05)" },
      { ke: 15, tanggal: "2026-11-24", mulai: "07:10", selesai: "08:50", ruang: "Kelas Kecil", dosen: "Agus Kusmana, SE, MM, CHCSA", status: "" }
    ]
  },
  {
    id: "matkul-8",
    kode: "MKW124107",
    nama: "Kewarganegaraan",
    sks: 2,
    kelas: "E",
    hariReguler: "Rabu",
    warna: "#0284C7", // Sky/Teal-blue
    catatan: "Dosen: Hairunnisa BR. Sagala, S.Sos., MA / Dr. Lutfi Hardiyanto",
    nilai: { mode: "angka", uts: "", uas: "", tugas: "", gunakanTugas: false, bobotUts: 50, bobotUas: 50, bobotTugas: 0, huruf: "" },
    sesi: [
      { ke: 1, tanggal: "2026-08-19", mulai: "07:10", selesai: "08:50", ruang: "Kelas Kecil", dosen: "Hairunnisa BR. Sagala, S.Sos., MA", status: "" },
      { ke: 2, tanggal: "2026-08-26", mulai: "07:10", selesai: "08:50", ruang: "Kelas Kecil", dosen: "Hairunnisa BR. Sagala, S.Sos., MA", status: "" },
      { ke: 3, tanggal: "2026-09-02", mulai: "07:10", selesai: "08:50", ruang: "Kelas Kecil", dosen: "Hairunnisa BR. Sagala, S.Sos., MA", status: "" },
      { ke: 4, tanggal: "2026-09-09", mulai: "07:10", selesai: "08:50", ruang: "Kelas Kecil", dosen: "Hairunnisa BR. Sagala, S.Sos., MA", status: "" },
      { ke: 5, tanggal: "2026-09-16", mulai: "08:50", selesai: "10:30", ruang: "Kelas Besar", dosen: "Dr. Lutfi Hardiyanto, S.Sos, MM", status: "" },
      { ke: 6, tanggal: "2026-09-23", mulai: "08:50", selesai: "10:30", ruang: "Kelas Besar", dosen: "Dr. Lutfi Hardiyanto, S.Sos, MM", status: "" },
      { ke: 7, tanggal: "2026-09-30", mulai: "07:10", selesai: "08:50", ruang: "Kelas Kecil", dosen: "Hairunnisa BR. Sagala, S.Sos., MA", status: "" },
      { ke: 8, tanggal: "2026-10-07", mulai: "07:10", selesai: "08:50", ruang: "Kelas Kecil", dosen: "Hairunnisa BR. Sagala, S.Sos., MA", status: "" },
      { ke: 9, tanggal: "2026-10-14", mulai: "07:10", selesai: "08:50", ruang: "Kelas Kecil", dosen: "Hairunnisa BR. Sagala, S.Sos., MA", status: "" },
      { ke: 10, tanggal: "2026-10-21", mulai: "07:10", selesai: "08:50", ruang: "Kelas Kecil", dosen: "Hairunnisa BR. Sagala, S.Sos., MA", status: "" },
      { ke: 11, tanggal: "2026-10-28", mulai: "07:10", selesai: "08:50", ruang: "Kelas Kecil", dosen: "Hairunnisa BR. Sagala, S.Sos., MA", status: "" },
      { ke: 12, tanggal: "2026-11-04", mulai: "07:10", selesai: "08:50", ruang: "Kelas Kecil", dosen: "Hairunnisa BR. Sagala, S.Sos., MA", status: "" },
      { ke: 13, tanggal: "2026-11-11", mulai: "07:10", selesai: "08:50", ruang: "Kelas Kecil", dosen: "Hairunnisa BR. Sagala, S.Sos., MA", status: "" },
      { ke: 14, tanggal: "2026-11-18", mulai: "07:10", selesai: "08:50", ruang: "Kelas Kecil", dosen: "Hairunnisa BR. Sagala, S.Sos., MA", status: "" },
      { ke: 15, tanggal: "2026-11-25", mulai: "07:10", selesai: "08:50", ruang: "Kelas Kecil", dosen: "Hairunnisa BR. Sagala, S.Sos., MA", status: "" }
    ]
  }
];
