// src/components/AvatarPicker.jsx
// Pemilih foto profil dengan 2 sumber (sama seperti di Kelola Pengguna):
//   - "Upload Foto"  : file dari perangkat
//   - "Link URL"     : tempel link gambar (backend yang mengunduh lalu menyimpannya ke Cloudinary)
// Komponen ini hanya mengelola pilihan. Pengunggahan ke Cloudinary dilakukan backend.
//
// value    : { mode: 'upload' | 'link', file: File|null, url: string }
// onChange : (nextValue) => void
import { useEffect, useRef, useState } from 'react';
import { Camera, Link2, Upload } from 'lucide-react';

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // sama dengan batas di backend (2MB)
const ALLOWED_TYPES = /^image\/(jpeg|png|webp|gif)$/;

export const EMPTY_AVATAR = { mode: 'upload', file: null, url: '' };
export const isValidImageUrl = (v) => /^https?:\/\/[^\s]+$/i.test(String(v || '').trim());

export default function AvatarPicker({ value = EMPTY_AVATAR, onChange, name = '', disabled = false }) {
  const { mode, file, url } = value;
  const inputRef = useRef(null);
  const [filePreview, setFilePreview] = useState('');
  const [error, setError] = useState('');
  const [brokenUrl, setBrokenUrl] = useState('');

  // Pratinjau file lokal (dibersihkan otomatis supaya tidak bocor memori)
  useEffect(() => {
    if (!file) { setFilePreview(''); return undefined; }
    const objectUrl = URL.createObjectURL(file);
    setFilePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const cleanUrl = url.trim();
  const linkOk = isValidImageUrl(cleanUrl) && brokenUrl !== cleanUrl;
  const src = mode === 'link' ? (linkOk ? cleanUrl : '') : filePreview;
  const initial = name.trim().charAt(0).toUpperCase();
  const hasAny = !!file || !!cleanUrl;

  const openPicker = () => {
    if (disabled) return;
    onChange({ ...value, mode: 'upload' });
    inputRef.current?.click();
  };

  const handlePick = (e) => {
    const picked = e.target.files?.[0];
    e.target.value = '';
    if (!picked) return;
    if (!ALLOWED_TYPES.test(picked.type)) return setError('File harus berupa gambar JPG, PNG, WEBP, atau GIF.');
    if (picked.size > AVATAR_MAX_BYTES) return setError('Ukuran foto maksimal 2 MB.');
    setError('');
    onChange({ ...value, mode: 'upload', file: picked });
  };

  const setMode = (next) => { setError(''); onChange({ ...value, mode: next }); };

  return (
    <div>
      <div className="ap">
        <button type="button" className="ap-pic" onClick={openPicker} disabled={disabled} aria-label="Pilih foto profil">
          {src ? (
            <img
              key={src}
              src={src}
              alt="Pratinjau foto profil"
              referrerPolicy="no-referrer"
              onError={() => { if (mode === 'link') setBrokenUrl(cleanUrl); }}
            />
          ) : initial ? (
            <span className="ap-initial">{initial}</span>
          ) : (
            <Camera size={26} />
          )}
          <span className="ap-cam"><Camera size={12} /></span>
        </button>

        <div className="ap-body">
          <div className="ap-tabs" role="group" aria-label="Sumber foto">
            <button type="button" className={`ap-tab ${mode === 'upload' ? 'is-on' : ''}`} onClick={() => setMode('upload')} disabled={disabled}>
              <Upload size={13} /> Upload
            </button>
            <button type="button" className={`ap-tab ${mode === 'link' ? 'is-on' : ''}`} onClick={() => setMode('link')} disabled={disabled}>
              <Link2 size={13} /> Link URL
            </button>
          </div>

          {mode === 'upload' ? (
            <button type="button" className="ap-drop" onClick={openPicker} disabled={disabled}>
              <span>{file ? file.name : 'Pilih foto dari perangkat'}</span>
              <small>JPG / PNG / WEBP, maks 2 MB</small>
            </button>
          ) : (
            <input
              type="text"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              className="form-input ap-url"
              placeholder="https://contoh.com/foto.jpg"
              value={url}
              disabled={disabled}
              onChange={(e) => onChange({ ...value, mode: 'link', url: e.target.value })}
              aria-label="Link foto profil"
            />
          )}

          {hasAny && (
            <button type="button" className="ap-clear" onClick={() => { setError(''); setBrokenUrl(''); onChange({ mode, file: null, url: '' }); }}>
              Hapus pilihan foto
            </button>
          )}
        </div>

        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="ap-file" onChange={handlePick} tabIndex={-1} aria-hidden="true" />
      </div>

      {error && <div className="au-msg is-bad" role="alert">{error}</div>}
      {!error && mode === 'link' && cleanUrl && !isValidImageUrl(cleanUrl) && (
        <div className="au-msg is-bad">Link harus diawali http:// atau https://</div>
      )}
    </div>
  );
}
