// src/components/ImageEditorModal.jsx
// Editor foto ala aplikasi foto di HP:
//  - Frame crop di atas gambar, sudut (dan sisi, saat mode Free) bisa ditarik manual; isi frame bisa digeser
//  - Preset rasio sekali klik: Free, 1:1, 4:3, 16:9, Full (klik lagi 4:3 / 16:9 untuk balik landscape <-> portrait)
//  - Tombol rotasi 90° (tanpa slider), Reset, Batal, Gunakan Hasil Edit
// Tanpa library eksternal (canvas + pointer events). Biasanya dipakai lewat <ImageUploader />.

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, RotateCw, Undo2, Check, Loader2 } from 'lucide-react';
import '../css/imageuploader.css';

const MIN_PX = 36; // ukuran minimum frame crop di layar
const PRESET_LABEL = { free: 'Free', '1:1': '1:1', '4:3': '4:3', '16:9': '16:9', full: 'Full' };
const PRESET_RATIO = { '1:1': 1, '4:3': 4 / 3, '16:9': 16 / 9 };
const ALL_PRESETS = ['free', '1:1', '4:3', '16:9', 'full'];

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const toRad = (d) => (d * Math.PI) / 180;
const isLocalUrl = (v) => /^(blob:|data:)/i.test(v || '');
const canvasToBlob = (canvas, type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality));

/** Rasio terkunci (lebar/tinggi) untuk sebuah preset; null = bebas. */
function ratioOf(preset, flip, rw, rh) {
  if (preset === 'free') return null;
  if (preset === 'full') return rw / rh;
  const base = PRESET_RATIO[preset];
  return flip ? 1 / base : base;
}

/** Persegi terbesar dengan rasio tertentu yang muat di dalam gambar (di tengah). Hasil dalam pecahan 0..1. */
function defaultRect(preset, flip, rw, rh) {
  const r = ratioOf(preset, flip, rw, rh);
  if (!r) return { x: 0, y: 0, w: 1, h: 1 };
  let w = rw;
  let h = w / r;
  if (h > rh) { h = rh; w = h * r; }
  return { x: (rw - w) / 2 / rw, y: (rh - h) / 2 / rh, w: w / rw, h: h / rh };
}

/** Cocokkan prop `aspect` ke preset awal. */
function initialPresetFor(aspect, shape) {
  if (shape === 'round') return { preset: '1:1', flip: false, custom: null };
  if (aspect === 'auto') return { preset: 'full', flip: false, custom: null };
  const a = Number(aspect);
  if (!(a > 0)) return { preset: 'free', flip: false, custom: null };
  const near = (x, y) => Math.abs(x - y) < 0.01;
  if (near(a, 1)) return { preset: '1:1', flip: false, custom: null };
  if (near(a, 4 / 3)) return { preset: '4:3', flip: false, custom: null };
  if (near(a, 3 / 4)) return { preset: '4:3', flip: true, custom: null };
  if (near(a, 16 / 9)) return { preset: '16:9', flip: false, custom: null };
  if (near(a, 9 / 16)) return { preset: '16:9', flip: true, custom: null };
  return { preset: 'free', flip: false, custom: a }; // rasio khusus (mis. 3:2): mulai dengan frame itu, tetap bebas ditarik
}

/** Frame di tengah dengan rasio khusus (pecahan). */
function customRect(a, rw, rh) {
  let w = rw;
  let h = w / a;
  if (h > rh) { h = rh; w = h * a; }
  return { x: (rw - w) / 2 / rw, y: (rh - h) / 2 / rh, w: w / rw, h: h / rh };
}

export default function ImageEditorModal({
  src,
  aspect = 1,
  shape = 'rect',
  title = 'Edit Foto',
  outputType = 'image/jpeg',
  outputName = 'foto',
  maxWidth = 1200,
  maxSizeMB = null,
  aspectOptions = null,   // mis. ['free', '1:1'] untuk membatasi pilihan rasio
  initialView = null,     // keadaan terakhir yang disimpan (edit bisa dilanjutkan)
  onApply,
  onClose,
}) {
  const stageRef = useRef(null);
  const boxRef = useRef(null);
  const drag = useRef(null);

  const init = initialPresetFor(aspect, shape);
  const options = shape === 'round'
    ? ['1:1']
    : (aspectOptions && aspectOptions.length ? aspectOptions : ALL_PRESETS);

  const [img, setImg] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const [rot, setRot] = useState(initialView ? initialView.rot : 0);
  const [preset, setPreset] = useState(initialView ? initialView.preset : init.preset);
  const [flip, setFlip] = useState(initialView ? initialView.flip : init.flip);
  const [rect, setRect] = useState(initialView ? initialView.rect : null); // pecahan 0..1 pada gambar yang sudah diputar
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // ---------- Muat gambar ----------
  useEffect(() => {
    let cancelled = false;
    setImg(null);
    setLoadError('');
    const im = new Image();
    if (!isLocalUrl(src)) im.crossOrigin = 'anonymous'; // wajib agar canvas tidak "tainted"
    im.onload = () => { if (!cancelled) setImg({ el: im, nw: im.naturalWidth, nh: im.naturalHeight }); };
    im.onerror = () => {
      if (!cancelled) {
        setLoadError(
          'Gambar dari link ini tidak bisa dibuka di editor (kemungkinan dibatasi CORS oleh server asalnya). ' +
          'Unduh gambarnya lalu upload ulang untuk mengeditnya.'
        );
      }
    };
    im.src = src;
    return () => { cancelled = true; };
  }, [src]);

  // ---------- Ukur area editor ----------
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    const measure = () => setStage({ w: el.clientWidth, h: el.clientHeight });
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ---------- Geometri ----------
  const swap = Math.abs(rot % 180) === 90;
  const rw = img ? (swap ? img.nh : img.nw) : 1; // dimensi gambar setelah diputar (px asli)
  const rh = img ? (swap ? img.nw : img.nh) : 1;
  const pad = 18;
  const ready = !!img && stage.w > 0 && stage.h > 0;
  const fit = ready ? Math.min((stage.w - pad * 2) / rw, (stage.h - pad * 2) / rh) : 1;
  const dw = rw * fit;
  const dh = rh * fit;
  const ratio = ratioOf(preset, flip, rw, rh);

  // Frame awal setelah gambar termuat
  useEffect(() => {
    if (!img || rect) return;
    const r = init.custom ? customRect(init.custom, rw, rh) : defaultRect(preset, flip, rw, rh);
    setRect(r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img]);

  const cur = rect || { x: 0, y: 0, w: 1, h: 1 };
  const px = { x: cur.x * dw, y: cur.y * dh, w: cur.w * dw, h: cur.h * dh };

  // ---------- Tutup dengan Esc ----------
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onClose && onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  // ---------- Aksi ----------
  const choosePreset = (p) => {
    if (!ready) return;
    let nextFlip = false;
    if (p === preset && (p === '4:3' || p === '16:9')) nextFlip = !flip; // klik lagi = portrait/landscape
    setPreset(p);
    setFlip(nextFlip);
    setRect(defaultRect(p, nextFlip, rw, rh));
  };

  const rotate90 = () => {
    if (!ready) return;
    const nr = (rot + 90) % 360;
    const nSwap = Math.abs(nr % 180) === 90;
    const nrw = nSwap ? img.nh : img.nw;
    const nrh = nSwap ? img.nw : img.nh;
    setRot(nr);
    setRect(defaultRect(preset, flip, nrw, nrh));
  };

  const resetAll = () => {
    if (!ready) return;
    setError('');
    setRot(0);
    setPreset(init.preset);
    setFlip(init.flip);
    setRect(init.custom ? customRect(init.custom, img.nw, img.nh) : defaultRect(init.preset, init.flip, img.nw, img.nh));
  };

  // ---------- Tarik / geser frame crop ----------
  const onPointerDown = (e) => {
    const handle = e.target && e.target.dataset ? e.target.dataset.h : null;
    if (!handle || !ready) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const b = boxRef.current.getBoundingClientRect();
    drag.current = {
      id: e.pointerId, handle, left: b.left, top: b.top,
      sx: e.clientX, sy: e.clientY,
      start: { ...px },
    };
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const s = d.start;
    let n = { ...s };

    if (d.handle === 'move') {
      n.x = clamp(s.x + (e.clientX - d.sx), 0, dw - s.w);
      n.y = clamp(s.y + (e.clientY - d.sy), 0, dh - s.h);
    } else if (d.handle.length === 2) {
      // sudut: jangkar = sudut yang berseberangan
      const east = d.handle.includes('e');
      const south = d.handle.includes('s');
      const ax = east ? s.x : s.x + s.w;
      const ay = south ? s.y : s.y + s.h;
      const dirX = east ? 1 : -1;
      const dirY = south ? 1 : -1;
      const pxp = clamp(e.clientX - d.left, 0, dw);
      const pyp = clamp(e.clientY - d.top, 0, dh);
      const rawW = Math.max(0, (pxp - ax) * dirX);
      const rawH = Math.max(0, (pyp - ay) * dirY);
      const maxW = dirX > 0 ? dw - ax : ax;
      const maxH = dirY > 0 ? dh - ay : ay;
      let w;
      let h;
      if (ratio) {
        w = Math.max(rawW, rawH * ratio);
        w = Math.max(w, Math.max(MIN_PX, MIN_PX * ratio));
        w = Math.min(w, maxW, maxH * ratio);
        h = w / ratio;
      } else {
        w = clamp(rawW, Math.min(MIN_PX, maxW), maxW);
        h = clamp(rawH, Math.min(MIN_PX, maxH), maxH);
      }
      n = { x: dirX > 0 ? ax : ax - w, y: dirY > 0 ? ay : ay - h, w, h };
    } else {
      // sisi (hanya mode Free)
      const pxp = clamp(e.clientX - d.left, 0, dw);
      const pyp = clamp(e.clientY - d.top, 0, dh);
      if (d.handle === 'e') n.w = clamp(pxp - s.x, MIN_PX, dw - s.x);
      if (d.handle === 'w') { const x1 = clamp(pxp, 0, s.x + s.w - MIN_PX); n.x = x1; n.w = s.x + s.w - x1; }
      if (d.handle === 's') n.h = clamp(pyp - s.y, MIN_PX, dh - s.y);
      if (d.handle === 'n') { const y1 = clamp(pyp, 0, s.y + s.h - MIN_PX); n.y = y1; n.h = s.y + s.h - y1; }
    }
    setRect({ x: n.x / dw, y: n.y / dh, w: n.w / dw, h: n.h / dh });
  };

  const endDrag = (e) => {
    if (drag.current && drag.current.id === e.pointerId) drag.current = null;
  };

  // ---------- Simpan hasil ----------
  const handleApply = async () => {
    if (!ready || busy || !rect) return;
    setBusy(true);
    setError('');
    try {
      const cw = rect.w * rw; // ukuran area crop dalam piksel gambar asli
      const ch = rect.h * rh;
      const k = Math.min(1, maxWidth / cw);
      const outW = Math.max(16, Math.round(cw * k));
      const outH = Math.max(16, Math.round(ch * k));

      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');
      if (outputType === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, outW, outH);
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.translate(-rect.x * rw * k, -rect.y * rh * k); // geser ke area crop
      ctx.translate((rw * k) / 2, (rh * k) / 2);         // pusat gambar yang sudah diputar
      ctx.rotate(toRad(rot));
      ctx.scale(k, k);
      ctx.drawImage(img.el, -img.nw / 2, -img.nh / 2);

      let quality = 0.92;
      let blob = await canvasToBlob(canvas, outputType, quality);
      if (!blob) throw new Error('Gagal membuat gambar hasil edit.');

      if (maxSizeMB) {
        const maxBytes = maxSizeMB * 1024 * 1024;
        let work = canvas;
        let tries = 0;
        while (blob.size > maxBytes && tries < 10) {
          tries += 1;
          if (outputType !== 'image/png' && quality > 0.55) {
            quality -= 0.1;
          } else {
            const smaller = document.createElement('canvas');
            smaller.width = Math.max(16, Math.round(work.width * 0.85));
            smaller.height = Math.max(16, Math.round(work.height * 0.85));
            smaller.getContext('2d').drawImage(work, 0, 0, smaller.width, smaller.height);
            work = smaller;
          }
          blob = await canvasToBlob(work, outputType, quality);
          if (!blob) throw new Error('Gagal mengompres gambar hasil edit.');
        }
        if (blob.size > maxBytes) {
          throw new Error(`Hasil edit masih lebih dari ${maxSizeMB}MB. Coba pilih area yang lebih kecil.`);
        }
      }

      const ext = outputType === 'image/png' ? 'png' : outputType === 'image/webp' ? 'webp' : 'jpg';
      const base = (outputName || 'foto').replace(/\.[^.]+$/, '').replace(/-edit$/, '') || 'foto';
      const file = new File([blob], `${base}-edit.${ext}`, { type: outputType });
      const url = URL.createObjectURL(file);

      onApply && onApply({ file, url, view: { rot, preset, flip, rect } });
    } catch (err) {
      const tainted = err && (err.name === 'SecurityError' || /tainted/i.test(err.message || ''));
      setError(
        tainted
          ? 'Gambar dari link ini tidak bisa diproses (dibatasi CORS). Unduh gambarnya lalu upload ulang.'
          : (err.message || 'Gagal memproses gambar.')
      );
      setBusy(false);
    }
  };

  // ---------- Render ----------
  const stop = (e) => e.stopPropagation();
  const showEdges = !ratio; // sisi hanya bisa ditarik saat rasio bebas

  return createPortal(
    <div
      className="iu-editor-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={stop}
      onMouseDown={stop}
      onKeyDown={stop}
    >
      <div className="iu-editor">
        <div className="iu-editor-header">
          <h3>{title}</h3>
          <button type="button" className="iu-icon-btn" onClick={onClose} disabled={busy} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        <div className="iu-stage" ref={stageRef}>
          {!loadError && !ready && (
            <div className="iu-stage-msg"><Loader2 size={22} className="iu-spin" /> Memuat gambar...</div>
          )}
          {loadError && <div className="iu-stage-msg iu-stage-error">{loadError}</div>}

          {ready && (
            <div
              className="iu-imgbox"
              ref={boxRef}
              style={{ width: dw, height: dh, left: (stage.w - dw) / 2, top: (stage.h - dh) / 2 }}
            >
              <img
                className="iu-stage-img"
                src={src}
                alt=""
                draggable={false}
                crossOrigin={isLocalUrl(src) ? undefined : 'anonymous'}
                style={{
                  width: img.nw * fit,
                  height: img.nh * fit,
                  transform: `translate(-50%, -50%) rotate(${rot}deg)`,
                }}
              />

              <div
                className={`iu-crop ${shape === 'round' ? 'round' : ''}`}
                style={{ left: px.x, top: px.y, width: px.w, height: px.h }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
              >
                <div className="iu-crop-move" data-h="move" />
                <span className="iu-grid iu-grid-v1" />
                <span className="iu-grid iu-grid-v2" />
                <span className="iu-grid iu-grid-h1" />
                <span className="iu-grid iu-grid-h2" />

                {['nw', 'ne', 'sw', 'se'].map((h) => (
                  <span key={h} className={`iu-handle iu-corner iu-${h}`} data-h={h} />
                ))}
                {showEdges && ['n', 's', 'e', 'w'].map((h) => (
                  <span key={h} className={`iu-handle iu-edge iu-${h}`} data-h={h} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="iu-controls">
          <div className="iu-toolbar">
            {options.length > 1 && (
              <div className="iu-chips" role="group" aria-label="Rasio crop">
                {options.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`iu-chip ${preset === p ? 'active' : ''}`}
                    onClick={() => choosePreset(p)}
                    disabled={!ready || busy}
                  >
                    {PRESET_LABEL[p]}
                  </button>
                ))}
              </div>
            )}
            <div className="iu-tools">
              <button type="button" className="iu-btn iu-btn-secondary" onClick={rotate90} disabled={!ready || busy}>
                <RotateCw size={16} /> Putar 90°
              </button>
              <button type="button" className="iu-btn iu-btn-secondary" onClick={resetAll} disabled={!ready || busy}>
                <Undo2 size={16} /> Reset
              </button>
            </div>
          </div>
          <p className="iu-tip">
            Tarik sudut frame untuk memotong, geser isi frame untuk memindahkan.
            {options.length > 1 ? ' Klik 4:3 / 16:9 lagi untuk portrait.' : ''}
          </p>
          {error && <p className="iu-error" role="alert">{error}</p>}
        </div>

        <div className="iu-editor-footer">
          <button type="button" className="iu-btn iu-btn-ghost" onClick={onClose} disabled={busy}>Batal</button>
          <button type="button" className="iu-btn iu-btn-primary" onClick={handleApply} disabled={!ready || busy}>
            {busy ? <Loader2 size={16} className="iu-spin" /> : <Check size={16} />} Gunakan Hasil Edit
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
