import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, FileText, Folder, HardDrive, AlertCircle } from 'lucide-react';
import Navbar from '../../components/Navbar';
import FooterViewer from './FooterViewer';
import '../../css/viewer/DownloadViewer.css';

const API_URL = 'http://localhost:5002';

const DownloadViewer = () => {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0); // selalu mulai dari atas saat pindah dari landing/footer
    fetchDownloads();
  }, []);

  const fetchDownloads = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/downloads`);
      if (response.data.success) {
        // Filter hanya data yang diset show (support angka 1 atau boolean true)
        const visibleDownloads = response.data.data.filter(
          item => item.show === 1 || item.show === true
        );
        setDownloads(visibleDownloads);
      }
    } catch (err) {
      console.error("Error fetching downloads:", err);
      setError("Gagal memuat data unduhan. Silakan coba lagi nanti.");
    } finally {
      setLoading(false);
    }
  };

  // Mengelompokkan data berdasarkan field 'category'
  const groupedDownloads = downloads.reduce((acc, item) => {
    const categoryName = item.category || 'Lainnya';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(item);
    return acc;
  }, {});

  return (
    <div className="download-page-wrapper">
      {/* Navbar Halaman (Diperbaiki: Menggunakan <Navbar /> sesuai import) */}
      <Navbar />

      {/* Main Content dengan Latar Putih */}
      <main className="download-content">
        <div className="download-container">
          
          {/* Header section (Tanpa Background Gambar) */}
          <div className="download-header-clean">
            <span className="badge-subtitle">Download</span>
            <h1>Pusat Unduhan Document & Berkas</h1>
            <p>Unduh berkas-berkas penting seputar akademik, kurikulum, dan administrasi sekolah.</p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="download-loading">
              <div className="spinner"></div>
              <p>Memuat berkas unduhan...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="download-error">
              <AlertCircle size={24} />
              <span>{error}</span>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && Object.keys(groupedDownloads).length === 0 && (
            <div className="download-empty">
              <p>Belum ada berkas yang tersedia untuk diunduh.</p>
            </div>
          )}

          {/* List Kategori dan Card File */}
          {!loading && !error && Object.keys(groupedDownloads).map((category) => (
            <div key={category} className="download-category-group">
              <div className="category-header">
                <div className="category-title">
                  <Folder className="category-icon" size={20} />
                  <h2>{category}</h2>
                </div>
                <span className="category-count">
                  {groupedDownloads[category].length} berkas
                </span>
              </div>

              <div className="download-cards-list">
                {groupedDownloads[category].map((item) => {
                  // Fallback agar kompatibel baik fileSize (Prisma) maupun file_size (Raw SQL)
                  const sizeText = item.fileSize || item.file_size;

                  return (
                    <div key={item.id} className="download-card">
                      <div className="card-left-info">
                        <div className="file-icon-box">
                          <FileText size={22} />
                        </div>
                        <div className="file-details">
                          <h3 className="file-title">{item.title}</h3>
                          <p className="file-description">{item.description}</p>
                        </div>
                      </div>

                      <div className="card-right-action">
                        {sizeText && (
                          <div className="file-size-tag">
                            <HardDrive size={14} />
                            <span>{sizeText}</span>
                          </div>
                        )}
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn-download-action"
                          title="Unduh Berkas"
                        >
                          <Download size={18} />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

        </div>
      </main>

      {/* Footer Halaman */}
      <FooterViewer />
    </div>
  );
};

export default DownloadViewer;