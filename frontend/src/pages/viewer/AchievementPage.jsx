import React, { useEffect } from 'react';
import Navbar from '../../components/Navbar';
import FooterViewer from './FooterViewer';
import AchievementViewer from './AchievementViewer';
import '../../css/viewer/AchievementViewer.css';

// Halaman /prestasi: menampilkan SEMUA karya & prestasi.
const AchievementPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="kp-page">
      <Navbar />
      <AchievementViewer variant="page" />
      <FooterViewer />
    </div>
  );
};

export default AchievementPage;