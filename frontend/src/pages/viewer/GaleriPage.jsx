import React, { useEffect } from 'react';
import Navbar from '../../components/Navbar';
import FooterViewer from './FooterViewer';
import TampilanGalery from './TampilanGalery';

// Halaman /galeri: menampilkan SEMUA album galeri.
export default function GaleriPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="gav-page-wrapper">
      <Navbar />
      <TampilanGalery variant="page" />
      <FooterViewer />
    </div>
  );
}