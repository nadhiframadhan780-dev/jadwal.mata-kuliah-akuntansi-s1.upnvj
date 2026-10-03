import fs from 'fs';
import path from 'path';

const root = process.cwd();
const templatePath = path.join(root, 'standalone', 'template.html');
const cssPath = path.join(root, 'standalone', 'styles.css');
const seedPath = path.join(root, 'standalone', 'seed.js');
const corePath = path.join(root, 'standalone', 'app-core.js');
const viewsPath = path.join(root, 'standalone', 'app-views.js');
const gradesPath = path.join(root, 'standalone', 'app-grades.js');
const eventsPath = path.join(root, 'standalone', 'app-events.js');

const template = fs.readFileSync(templatePath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');
const seed = fs.readFileSync(seedPath, 'utf8');
const core = fs.readFileSync(corePath, 'utf8');
const views = fs.readFileSync(viewsPath, 'utf8');
const grades = fs.readFileSync(gradesPath, 'utf8');
const events = fs.readFileSync(eventsPath, 'utf8');

const combinedJs = [
  '// === DATA AWAL (SEED) ===',
  seed,
  '// === MODUL STATE & UTILITAS ===',
  core,
  '// === MODUL TAMPILAN VIEW ===',
  views,
  '// === MODUL NILAI, SEMESTER & PROFIL ===',
  grades,
  '// === MODUL EVENT & INTERAKSI ===',
  events
].join('\n\n');

// PWA Offline Service Worker & Instructions in Comments
const pwaComment = `
<!--
=============================================================================
PANDUAN LENGKAP PENGGUNAAN & HOSTING PROGRESSIVE WEB APP (PWA)
=============================================================================
File ini adalah 'Single-File Web Application' yang dapat langsung dibuka secara offline di browser (Chrome, Edge, Safari, Firefox).

Untuk mengaktifkan fitur PWA penuh (Install to Home Screen di Android & Desktop):
1. Anda dapat mengunggah file ini ke GitHub Pages, Vercel, Netlify, atau web hosting HTTPS Anda.
2. Jika ingin menyediakan Service Worker terpisah ('sw.js'):
   - Buat file 'sw.js' di direktori yang sama dengan konten:
     self.addEventListener('install', e => self.skipWaiting());
     self.addEventListener('activate', e => clients.claim());
     self.addEventListener('fetch', e => e.respondWith(fetch(e.request).catch(() => caches.match(e.request))));
3. Jika menggunakan iOS Safari:
   - Tekan tombol "Bagikan" (Share Icon kotak dengan panah atas) di browser Safari iPhone.
   - Gulir ke bawah dan pilih "Tambahkan ke Layar Utama" (Add to Home Screen).
=============================================================================
-->
`;

let finalHtml = template.replace('/* CSS_PLACEHOLDER */', css);
finalHtml = finalHtml.replace('// JS_PLACEHOLDER', combinedJs);
finalHtml = finalHtml.replace('<!DOCTYPE html>', '<!DOCTYPE html>' + pwaComment);

// Write to root: jadwal-kuliah-aks1.upnvj.html
const destRoot = path.join(root, 'jadwal-kuliah-aks1.upnvj.html');
fs.writeFileSync(destRoot, finalHtml, 'utf8');
console.log('Successfully generated:', destRoot, `(${fs.statSync(destRoot).size} bytes)`);

// Write to public for static dev serving: public/jadwal-kuliah-aks1.upnvj.html
const publicDir = path.join(root, 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
const destPublic = path.join(publicDir, 'jadwal-kuliah-aks1.upnvj.html');
fs.writeFileSync(destPublic, finalHtml, 'utf8');
console.log('Successfully generated:', destPublic, `(${fs.statSync(destPublic).size} bytes)`);
