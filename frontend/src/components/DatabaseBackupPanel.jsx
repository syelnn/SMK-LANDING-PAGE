// src/components/DatabaseBackupPanel.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Database, Download, ShieldAlert, X, Loader2, CheckCircle2,
  XCircle, Table2, HardDrive, Rows3, RefreshCw,
} from 'lucide-react';
import { API_URL } from '../theme/themeEngine';
import '../css/databasebackup.css';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const formatBytes = (bytes) => {
  if (!bytes || bytes <= 0) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

const formatNumber = (n) => new Intl.NumberFormat('id-ID').format(n || 0);

export default function DatabaseBackupPanel() {
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const fetchSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await axios.get(`${API_URL}/api/database/summary`, { headers: authHeaders() });
      setSummary(res.data?.data || null);
    } catch (error) {
      setSummary(null);
      showToast(error.response?.data?.message || 'Gagal memuat ringkasan database.', 'error');
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => { fetchSummary(); }, []);

  const handleDownload = async () => {
    setShowConfirm(false);
    setDownloading(true);
    try {
      const res = await axios.get(`${API_URL}/api/database/export`, {
        headers: authHeaders(),
        responseType: 'blob',
      });

      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup-database-${stamp}.sql`;
      const blob = new Blob([res.data], { type: 'application/sql' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showToast('Database berhasil diunduh sebagai file .sql', 'success');
    } catch (error) {
      let msg = 'Gagal mengunduh database.';
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          msg = JSON.parse(text)?.message || msg;
        } catch { /* biarkan pesan default */ }
      } else {
        msg = error.response?.data?.message || error.message || msg;
      }
      showToast(msg, 'error');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="dbk-wrapper">
      {/* HEADER */}
      <div className="dbk-header">
        <div className="dbk-header-icon"><Database size={22} /></div>
        <div>
          <h3>Backup &amp; Ekspor Database</h3>
          <p>Unduh seluruh isi database sebagai satu file <code>.sql</code> yang bisa langsung ditempel ke Supabase SQL Editor.</p>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="dbk-stats-grid">
        <div className="dbk-stat-card">
          <div className="dbk-stat-icon blue"><Table2 size={18} /></div>
          <div>
            <span className="dbk-stat-value">{loadingSummary ? '—' : formatNumber(summary?.totalTables)}</span>
            <span className="dbk-stat-label">Total Tabel</span>
          </div>
        </div>
        <div className="dbk-stat-card">
          <div className="dbk-stat-icon green"><Rows3 size={18} /></div>
          <div>
            <span className="dbk-stat-value">{loadingSummary ? '—' : `≈ ${formatNumber(summary?.totalRows)}`}</span>
            <span className="dbk-stat-label">Total Baris Data</span>
          </div>
        </div>
        <div className="dbk-stat-card">
          <div className="dbk-stat-icon amber"><HardDrive size={18} /></div>
          <div>
            <span className="dbk-stat-value">{loadingSummary ? '—' : formatBytes(summary?.totalSizeBytes)}</span>
            <span className="dbk-stat-label">Perkiraan Ukuran</span>
          </div>
        </div>
      </div>

      <button type="button" className="dbk-refresh-btn" onClick={fetchSummary} disabled={loadingSummary}>
        <RefreshCw size={14} className={loadingSummary ? 'animate-spin' : ''} /> Segarkan ringkasan
      </button>

      {/* WARNING */}
      <div className="dbk-warning-card">
        <ShieldAlert size={20} />
        <div>
          <strong>Perhatikan sebelum mengunduh</strong>
          <p>File ini berisi seluruh data mentah, termasuk akun pengguna. Simpan di tempat aman dan jangan dibagikan sembarangan.</p>
        </div>
      </div>

      {/* ACTION */}
      <button type="button" className="dbk-download-btn" onClick={() => setShowConfirm(true)} disabled={downloading}>
        {downloading ? (<><Loader2 size={18} className="animate-spin" /> Menyiapkan file...</>) : (<><Download size={18} /> Download Database (.sql)</>)}
      </button>

      {/* DAFTAR TABEL */}
      {!!summary?.tables?.length && (
        <div className="dbk-table-list">
          <div className="dbk-table-list-header">
            <span>Nama Tabel</span>
            <span>≈ Baris</span>
          </div>
          <div className="dbk-table-list-body">
            {summary.tables.map((t) => (
              <div className="dbk-table-list-row" key={t.name}>
                <span>{t.name}</span>
                <span>{formatNumber(t.estimatedRows)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI */}
      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modern-modal dbk-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-modern">
              <h3>Konfirmasi Download</h3>
              <button type="button" className="btn-close-modal" onClick={() => setShowConfirm(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="dbk-confirm-body">
              <div className="dbk-confirm-icon"><ShieldAlert size={28} /></div>
              <h4>Yakin ingin download database?</h4>
              <p>Seluruh data dari <strong>{summary?.totalTables ?? 'semua'} tabel</strong> akan diekspor menjadi satu file SQL. Proses ini tidak mengubah data apa pun di server.</p>
              <div className="dbk-confirm-actions">
                <button type="button" className="ms-ghost-btn" onClick={() => setShowConfirm(false)}>Batal</button>
                <button type="button" className="dbk-confirm-btn" onClick={handleDownload}>
                  <Download size={16} /> Ya, Download Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className={`modern-toast-card ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={22} color="#16a34a" /> : <XCircle size={22} color="#dc2626" />}
          <div className="modern-toast-content">
            <h4>{toast.type === 'success' ? 'Berhasil!' : 'Gagal!'}</h4>
            <p>{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
