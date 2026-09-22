// src/components/ThemePreview.jsx
// Preview langsung: memakai warna & font dari form (bukan tema global), jadi selalu akurat
// walau perubahan belum disimpan.
import React, { useState } from 'react';
import { resolvePalette, getFontStack } from '../theme/themeEngine';

export default function ThemePreview({ data }) {
  const [view, setView] = useState('site');
  const p = resolvePalette(data);
  const name = data.school_name || 'SMKN Compreng';

  const style = {
    '--pv-bg': p.bg, '--pv-surface': p.surface, '--pv-soft': p.surfaceSoft, '--pv-border': p.border,
    '--pv-text': p.text, '--pv-muted': p.muted,
    '--pv-accent': p.accent, '--pv-accent-hover': p.accentHover, '--pv-accent-text': p.accentText,
    '--pv-nav-bg': p.navBg, '--pv-nav-text': p.navText, '--pv-nav-muted': p.navMuted,
    '--pv-nav-accent': p.navAccent, '--pv-nav-border': p.navBorder,
    '--pv-foot-bg': p.footerBg, '--pv-foot-text': p.footerText, '--pv-foot-muted': p.footerMuted,
    '--pv-badge-bg': p.badgeBg, '--pv-badge-text': p.badgeText, '--pv-badge-border': p.badgeBorder,
    fontFamily: getFontStack(data.font_family),
  };

  return (
    <div className="ms-live-frame">
      <div className="ms-live-bar">
        <strong className="ms-live-title">Preview langsung</strong>
        <div className="ms-live-tabs">
          <button type="button" className={`ms-tab-pill ${view === 'site' ? 'on' : ''}`} onClick={() => setView('site')}>Website</button>
          <button type="button" className={`ms-tab-pill ${view === 'admin' ? 'on' : ''}`} onClick={() => setView('admin')}>Dashboard</button>
        </div>
      </div>

      <div className="pv-root" style={style}>
        {view === 'site' ? (
          <>
            <div className="pv-nav">
              <div className="pv-brand"><div className="pv-mark" /><strong>{name}</strong></div>
              <div className="pv-menu">
                <div className="pv-link on">Beranda<div className="pv-dot" /></div>
                <div className="pv-link">Profil</div>
                <div className="pv-link">Berita</div>
              </div>
              <div className="pv-cta">Login →</div>
            </div>

            <div className="pv-hero">
              <div className="pv-pill inv">{data.school_accreditation || 'Terakreditasi A'}</div>
              <div className="pv-h1">{name}</div>
              <div className="pv-sub">{data.hero_description || 'Membangun Generasi Cerdas, Berkarakter, dan Berprestasi.'}</div>
              <div className="pv-row">
                <div className="pv-btn-main">Jelajahi Sekolah</div>
                <div className="pv-btn-ghost">Hubungi Kami</div>
              </div>
            </div>

            <div className="pv-body">
              <div className="pv-h2">Berita Terbaru</div>
              <div className="pv-p">Teks deskripsi memakai warna teks redup.</div>
              <div className="pv-grid">
                {['Prestasi', 'Kegiatan'].map((t) => (
                  <div className="pv-tile" key={t}>
                    <div className="pv-pill">{t}</div>
                    <div className="pv-h3">Judul berita sekolah</div>
                    <div className="pv-p">Ringkasan singkat isi berita untuk pengunjung.</div>
                    <div className="pv-more">Baca selengkapnya →</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pv-foot">
              <strong>{name}</strong>
              <div className="pv-foot-muted">Jl. Compreng · info@sekolah.sch.id</div>
            </div>
          </>
        ) : (
          <div className="pv-admin">
            <div className="pv-side">
              <div className="pv-brand"><div className="pv-mark" /><strong>{name}</strong></div>
              <div className="pv-link">Dashboard</div>
              <div className="pv-link on">Berita &amp; Artikel<div className="pv-dot" /></div>
              <div className="pv-link">Galeri</div>
              <div className="pv-link">Pengaturan</div>
            </div>
            <div className="pv-main">
              <div className="pv-top">
                <div className="pv-find">Pencarian Cepat…</div>
                <div className="pv-me">N</div>
              </div>
              <div className="pv-h2">Dashboard Overview</div>
              <div className="pv-grid three">
                {[['Pengguna', '12'], ['Berita', '48'], ['Galeri', '230']].map(([k, v]) => (
                  <div className="pv-tile" key={k}>
                    <div className="pv-p">{k}</div>
                    <div className="pv-h2">{v}</div>
                  </div>
                ))}
              </div>
              <div className="pv-tile pv-rows">
                <div className="pv-rowline"><div>Judul berita pertama</div><div className="pv-pill">Publik</div></div>
                <div className="pv-rowline"><div>Judul berita kedua</div><div className="pv-pill">Draft</div></div>
              </div>
              <div className="pv-row">
                <div className="pv-btn-main">Tambah Berita</div>
                <div className="pv-btn-alt">Batal</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}