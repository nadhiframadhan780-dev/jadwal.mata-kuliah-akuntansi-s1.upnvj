/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import {useEffect} from 'react';

const APP_URL = 'jadwal-kuliah-aks1.upnvj.html';

// Aplikasi berjalan langsung (bukan di dalam iframe) agar tampilan HP, safe-area,
// dan install PWA berfungsi normal.
export default function App() {
  useEffect(() => {
    window.location.replace(APP_URL);
  }, []);
  return (
    <div style={{display: 'grid', placeItems: 'center', height: '100dvh', fontFamily: 'system-ui, sans-serif', color: '#0F766E'}}>
      <a href={APP_URL}>Membuka Jadwal Kuliah…</a>
    </div>
  );
}
