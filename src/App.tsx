/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';

export default function App() {
  const [viewportHeight, setViewportHeight] = useState<string>('100dvh');

  useEffect(() => {
    function updateHeight() {
      // Accurately capture visible Android viewport excluding system/browser bars
      if (window.visualViewport) {
        setViewportHeight(`${window.visualViewport.height}px`);
      } else {
        setViewportHeight(`${window.innerHeight}px`);
      }
    }

    updateHeight();
    window.addEventListener('resize', updateHeight);
    window.addEventListener('orientationchange', updateHeight);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateHeight);
    }

    return () => {
      window.removeEventListener('resize', updateHeight);
      window.removeEventListener('orientationchange', updateHeight);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateHeight);
      }
    };
  }, []);

  return (
    <div
      style={{
        height: viewportHeight,
        width: '100%',
        maxWidth: '100vw',
      }}
      className="fixed inset-0 overflow-hidden bg-slate-50 m-0 p-0"
    >
      <iframe
        src="/jadwal-kuliah-aks1.upnvj.html"
        title="Jadwal Kuliah S1 Akuntansi UPNVJ"
        className="w-full h-full border-0 block"
        allow="clipboard-read; clipboard-write; notifications"
      />
    </div>
  );
}


