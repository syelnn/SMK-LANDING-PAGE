// src/components/ImageUploader.jsx
//
// Komponen upload & edit foto yang bisa dipakai ulang di SEMUA form CRUD admin.
//
//   Alur: pilih file -> langsung tampil di pratinjau (tanpa modal) ->
//         tombol [Edit Foto] membuka editor ala HP (frame crop yang sudutnya bisa ditarik,
//         preset Free / 1:1 / 4:3 / 16:9 / Full, putar 90°, Reset) ->
//         [Gunakan Hasil Edit] memperbarui pratinjau. Tombol [Hapus] mengosongkan foto.
//
// Contoh pemakaian:
//
//   <ImageUploader
//     value={formData.logo_url}                 // URL lama (mode Edit) / URL pratinjau
//     onChange={({ file, url }) => {
//       setSelectedFile(file);                  // File yang dikirim ke backend (null jika bukan file)
//       setImageType(file ? 'file' : 'url');
//       setFormData((prev) => ({ ...prev, logo_url: url }));
//     }}
//     aspect={16 / 9}
//     previewLabel="PRATINJAU LOGO"
//     maxSizeMB={2}
//   />
//
// onChange dipanggil dengan { file, url, mode }:
//   - file : File | null  -> File asli / hasil edit (kirim ke backend via FormData)
//   - url  : string       -> URL untuk pratinjau (blob:) ATAU link yang diketik / URL lama
//   - mode : 'file' | 'url'
//   Saat foto dihapus: { file: null, url: '', mode: 'url' }.

import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, Link as LinkIcon, Upload, Pencil, Trash2, Undo2, RefreshCw } from 'lucide-react';
import ImageEditorModal from './ImageEditorModal';
import '../css/imageuploader.css';

const isLocalUrl = (v) => /^(blob:|data:)/i.test(v || '');
const isImageLike = (v) => /^(https?:|data:image|blob:|\/)/i.test(v || '');

const guessType = (src = '') => {
  const clean = src.split('?')[0].split('#')[0].toLowerCase();
  if (clean.endsWith('.png')) return 'image/png';
  if (clean.endsWith('.webp')) return 'image/webp';
  if (clean.startsWith('data:image/png')) return 'image/png';
  return 'image/jpeg';
};

const guessName = (src = '') => {
  if (isLocalUrl(src)) return 'foto';
  const last = src.split('?')[0].split('#')[0].split('/').pop();
  return last || 'foto';
};

const clampRatio = (r) => Math.min(2.4, Math.max(0.5, r));
const OUTPUT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ImageUploader({
  value = '',
  onChange,
  aspect = 1,                    // rasio AWAL frame crop: 1, 16 / 9, 4 / 3, 3 / 2, ... atau 'auto' (Full). Pengguna tetap bisa ganti preset.
  aspectOptions,                 // opsional: batasi preset, mis. ['free', '1:1', '16:9'] (default: free, 1:1, 4:3, 16:9, full)
  shape = 'rect',                // 'rect' | 'round' (frame lingkaran, otomatis 1:1, untuk foto profil)
  maxSizeMB = null,              // batas ukuran file (null = tanpa batas)
  allowUrl = true,               // tampilkan tab "Link URL"
  defaultMode = 'file',          // tab awal saat belum ada foto: 'file' | 'url'
  urlPlaceholder = 'https://contoh.com/gambar.jpg',
  previewLabel = 'PRATINJAU FOTO',
  fit,                           // 'cover' | 'contain' (default: contain, round = cover)
  outputMaxWidth = 1200,         // lebar maksimum hasil edit (px)
  previewMaxWidth = 340,         // lebar maksimum kotak pratinjau (px)
  editorTitle = 'Edit Foto',
  uploadText = 'Pilih atau tarik foto ke sini',
  renderTextPreview,             // opsional: render pratinjau untuk nilai non-gambar (mis. nama ikon)
  disabled = false,
}) {
  const [mode, setMode] = useState(() => {
    if (!allowUrl) return 'file';
    if (value) return isLocalUrl(value) ? 'file' : 'url';
    return defaultMode;
  });
  const [error, setError] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [edited, setEdited] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [broken, setBroken] = useState(false);
  const [imgRatio, setImgRatio] = useState(null); // rasio asli gambar yang sedang dipratinjau

  const fileInputRef = useRef(null);
  const source = useRef(null);        // gambar asli yang dipakai editor { src, name, type }
  const viewRef = useRef(null);       // posisi/zoom/rotasi terakhir (edit bisa dilanjutkan)
  const lastEmitted = useRef(undefined);
  const initialUrl = useRef('');      // URL lama dari database (mode Edit Data)
  const createdUrls = useRef(new Set());

  const displayFit = fit || (shape === 'round' ? 'cover' : 'contain');
  const fallbackRatio = aspect === 'auto' ? 4 / 3 : Number(aspect) > 0 ? Number(aspect) : 1;
  const ratio = shape === 'round' ? 1 : clampRatio(imgRatio || fallbackRatio);

  // ---------- Sinkronisasi bila `value` diubah dari luar (mis. buka form Edit / data selesai dimuat) ----------
  useEffect(() => {
    if (value === lastEmitted.current) return;
    lastEmitted.current = value;
    setBroken(false);
    setEdited(false);
    viewRef.current = null;
    if (value) {
      source.current = { src: value, name: guessName(value), type: guessType(value) };
      if (!isLocalUrl(value)) {
        initialUrl.current = value;
        if (allowUrl) setMode('url');
      } else if (allowUrl) {
        setMode('file');
      }
    } else {
      source.current = null;
    }
  }, [value, allowUrl]);

  // ---------- Helper ----------
  const emit = (file, url) => {
    lastEmitted.current = url;
    onChange && onChange({ file, url, mode: file ? 'file' : 'url' });
  };

  const trackUrl = (u) => { createdUrls.current.add(u); return u; };
  const revoke = (u) => {
    if (u && createdUrls.current.has(u)) {
      URL.revokeObjectURL(u);
      createdUrls.current.delete(u);
    }
  };
  const releaseCurrent = () => {
    revoke(value);
    revoke(source.current && source.current.src);
  };

  // ---------- Pilih file -> langsung jadi pratinjau ----------
  const acceptFile = (file) => {
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      setError('File harus berupa gambar (JPG, PNG, WebP, dll).');
      return;
    }
    if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
      setError(`Ukuran file terlalu besar! Maksimal ${maxSizeMB}MB.`);
      return;
    }
    setError('');
    setBroken(false);
    releaseCurrent();
    const url = trackUrl(URL.createObjectURL(file));
    source.current = { src: url, name: file.name, type: file.type };
    viewRef.current = null;
    setEdited(false);
    setMode('file');
    emit(file, url);
  };

  const handleInputChange = (e) => {
    const file = e.target.files && e.target.files[0];
    acceptFile(file);
    e.target.value = ''; // agar file yang sama bisa dipilih lagi
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    acceptFile(e.dataTransfer.files && e.dataTransfer.files[0]);
  };

  // ---------- Link URL ----------
  const handleUrlChange = (e) => {
    const v = e.target.value;
    setError('');
    setBroken(false);
    releaseCurrent();
    source.current = v ? { src: v, name: guessName(v), type: guessType(v) } : null;
    viewRef.current = null;
    setEdited(false);
    emit(null, v);
  };

  // ---------- Hapus / Kembalikan ----------
  const handleRemove = () => {
    setError('');
    setBroken(false);
    releaseCurrent();
    source.current = null;
    viewRef.current = null;
    setEdited(false);
    emit(null, '');
  };

  const handleRestore = () => {
    if (!initialUrl.current) return;
    setError('');
    setBroken(false);
    releaseCurrent();
    source.current = { src: initialUrl.current, name: guessName(initialUrl.current), type: guessType(initialUrl.current) };
    viewRef.current = null;
    setEdited(false);
    setMode(allowUrl ? 'url' : 'file');
    emit(null, initialUrl.current);
  };

  // ---------- Editor ----------
  const openEditor = () => {
    if (!source.current && value) {
      source.current = { src: value, name: guessName(value), type: guessType(value) };
    }
    if (source.current) setEditorOpen(true);
  };

  const handleApply = ({ file, url, view }) => {
    // buang hasil edit sebelumnya (jangan buang gambar asli yang masih dipakai editor)
    if (value && value !== (source.current && source.current.src)) revoke(value);
    trackUrl(url);
    viewRef.current = view;
    setEdited(true);
    setBroken(false);
    setError('');
    setEditorOpen(false);
    setMode('file');
    emit(file, url);
  };

  const outputType = OUTPUT_TYPES.includes(source.current && source.current.type)
    ? source.current.type
    : 'image/jpeg';

  // ---------- Render ----------
  const hasImage = !!value && isImageLike(value);
  const hasTextValue = !!value && !isImageLike(value) && !!renderTextPreview;
  const canRestore = !!initialUrl.current && value !== initialUrl.current;

  return (
    <div className={`iu-root ${disabled ? 'is-disabled' : ''}`}>
      {allowUrl && (
        <div className="iu-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'file'}
            className={`iu-tab ${mode === 'file' ? 'active' : ''}`}
            onClick={() => setMode('file')}
            disabled={disabled}
          >
            <ImageIcon size={15} /> Upload Foto
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'url'}
            className={`iu-tab ${mode === 'url' ? 'active' : ''}`}
            onClick={() => setMode('url')}
            disabled={disabled}
          >
            <LinkIcon size={15} /> Link URL
          </button>
        </div>
      )}

      {allowUrl && mode === 'url' && (
        <input
          type="text"
          className="iu-url-input"
          placeholder={urlPlaceholder}
          value={isLocalUrl(value) ? '' : value}
          onChange={handleUrlChange}
          disabled={disabled}
        />
      )}

      {/* Input file tersembunyi: dipakai dropzone & tombol "Ganti" */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="iu-file-hidden"
        onChange={handleInputChange}
        disabled={disabled}
        tabIndex={-1}
      />

      {mode === 'file' && !hasImage && (
        <div
          className={`iu-dropzone ${dragOver ? 'drag' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => !disabled && fileInputRef.current && fileInputRef.current.click()}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
              e.preventDefault();
              fileInputRef.current && fileInputRef.current.click();
            }
          }}
          onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <Upload size={22} />
          <strong>{uploadText}</strong>
          <span>
            JPG, PNG, atau WebP{maxSizeMB ? ` · maks. ${maxSizeMB}MB` : ''}
          </span>
        </div>
      )}

      {hasImage && (
        <div className="iu-preview">
          <span className="iu-preview-label">{previewLabel}</span>
          <div
            className={`iu-frame ${shape === 'round' ? 'round' : ''}`}
            style={shape === 'round'
              ? { aspectRatio: '1' }
              : { aspectRatio: String(ratio), width: `min(100%, ${Math.round(Math.min(previewMaxWidth, 240 * ratio))}px)` }}
          >
            {broken ? (
              <span className="iu-frame-msg">Gambar tidak dapat dimuat</span>
            ) : (
              <img
                src={value}
                alt="Pratinjau"
                style={{ objectFit: displayFit }}
                onError={() => setBroken(true)}
                onLoad={(e) => {
                  setBroken(false);
                  const { naturalWidth: w, naturalHeight: h } = e.target;
                  if (w && h) setImgRatio(w / h);
                }}
              />
            )}
          </div>

          <div className="iu-actions">
            <button type="button" className="iu-btn iu-btn-primary" onClick={openEditor} disabled={disabled || broken}>
              <Pencil size={15} /> Edit Foto
            </button>
            <button
              type="button"
              className="iu-btn iu-btn-secondary"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              disabled={disabled}
            >
              <RefreshCw size={15} /> Ganti
            </button>
            <button type="button" className="iu-btn iu-btn-danger" onClick={handleRemove} disabled={disabled}>
              <Trash2 size={15} /> Hapus
            </button>
            {canRestore && (
              <button type="button" className="iu-btn iu-btn-ghost" onClick={handleRestore} disabled={disabled}>
                <Undo2 size={15} /> Foto Lama
              </button>
            )}
          </div>

          {isLocalUrl(value) && !edited && (
            <small className="iu-hint">
              Klik “Edit Foto” untuk memotong atau memutar foto.
            </small>
          )}
        </div>
      )}

      {hasTextValue && (
        <div className="iu-preview">
          <span className="iu-preview-label">{previewLabel}</span>
          {renderTextPreview(value)}
          <div className="iu-actions">
            <button type="button" className="iu-btn iu-btn-danger" onClick={handleRemove} disabled={disabled}>
              <Trash2 size={15} /> Hapus
            </button>
            {canRestore && (
              <button type="button" className="iu-btn iu-btn-ghost" onClick={handleRestore} disabled={disabled}>
                <Undo2 size={15} /> Foto Lama
              </button>
            )}
          </div>
        </div>
      )}

      {error && <p className="iu-error" role="alert">{error}</p>}

      {editorOpen && source.current && (
        <ImageEditorModal
          src={source.current.src}
          aspect={aspect}
          shape={shape}
          title={editorTitle}
          outputType={outputType}
          outputName={source.current.name}
          maxWidth={outputMaxWidth}
          maxSizeMB={maxSizeMB}
          aspectOptions={aspectOptions}
          initialView={viewRef.current}
          onApply={handleApply}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </div>
  );
}