// src/components/CommandPalette.jsx
// Pencarian Cepat (Ctrl/⌘ + K): dikelompokkan, bisa dinavigasi keyboard, dengan highlight kata kunci.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, ArrowUp, ArrowDown, CornerDownLeft } from 'lucide-react';
import '../css/commandpalette.css';

const GROUPS = [
  { key: 'halaman', label: 'Halaman' },
  { key: 'pengaturan', label: 'Pengaturan' },
  { key: 'aksi', label: 'Aksi cepat' },
];

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Sorot kata kunci yang cocok di dalam judul
function Highlight({ text, tokens }) {
  if (!tokens.length) return text;
  const re = new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'ig');
  return text.split(re).map((part, i) =>
    i % 2 === 1 ? <mark key={i} className="qs-hit">{part}</mark> : part
  );
}

function PaletteInner({ items, onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listRef = useRef(null);

  const tokens = useMemo(() => query.trim().toLowerCase().split(/\s+/).filter(Boolean), [query]);

  // Hasil disaring lalu diurutkan per kelompok (Halaman → Pengaturan → Aksi cepat)
  const { sections, flat } = useMemo(() => {
    const matched = items.filter((it) => {
      const hay = `${it.title} ${it.type}`.toLowerCase();
      return tokens.every((t) => hay.includes(t));
    });
    const flatList = [];
    const secs = GROUPS.map((g) => {
      const rows = matched.filter((it) => it.type === g.key).map((it) => {
        const row = { ...it, index: flatList.length };
        flatList.push(row);
        return row;
      });
      return { ...g, rows };
    }).filter((g) => g.rows.length > 0);
    return { sections: secs, flat: flatList };
  }, [items, tokens]);

  useEffect(() => { setActive(0); }, [query]);

  // Jaga baris aktif selalu terlihat saat navigasi keyboard
  useEffect(() => {
    const el = listRef.current?.querySelector(`#qs-opt-${active}`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const handleKeyDown = (e) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (flat.length) setActive((a) => (a + 1) % flat.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (flat.length) setActive((a) => (a - 1 + flat.length) % flat.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flat[active]) onSelect(flat[active]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="qs-scrim" onMouseDown={onClose}>
      <div
        className="qs-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Pencarian cepat"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="qs-head">
          <Search size={18} className="qs-head-glyph" aria-hidden="true" />
          <input
            autoFocus
            type="text"
            className="qs-field"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Cari halaman, pengaturan, atau aksi…"
            autoComplete="off"
            spellCheck={false}
            role="combobox"
            aria-expanded="true"
            aria-controls="qs-listbox"
            aria-activedescendant={flat[active] ? `qs-opt-${active}` : undefined}
          />
          <button type="button" className="qs-esc" onClick={onClose} aria-label="Tutup pencarian">
            esc
          </button>
        </div>

        <div className="qs-scroll" id="qs-listbox" role="listbox" ref={listRef}>
          {flat.length === 0 ? (
            <div className="qs-none">
              <div className="qs-none-glyph"><Search size={20} aria-hidden="true" /></div>
              <p className="qs-none-title">Tidak ada hasil</p>
              <p className="qs-none-hint">
                Tidak ada halaman atau aksi yang cocok dengan “{query.trim()}”.
              </p>
            </div>
          ) : (
            sections.map((sec) => (
              <div key={sec.key} role="group" aria-label={sec.label}>
                <div className="qs-group-title">{sec.label}</div>
                {sec.rows.map((row) => (
                  <div
                    key={row.index}
                    id={`qs-opt-${row.index}`}
                    role="option"
                    aria-selected={row.index === active}
                    className={`qs-row ${row.index === active ? 'qs-row-on' : ''} ${row.type === 'aksi' ? 'qs-row-act' : ''}`}
                    onMouseMove={() => active !== row.index && setActive(row.index)}
                    onClick={() => onSelect(row)}
                  >
                    <span className="qs-row-glyph">{row.icon}</span>
                    <span className="qs-row-title"><Highlight text={row.title} tokens={tokens} /></span>
                    <span className="qs-row-go" aria-hidden="true">
                      Buka <CornerDownLeft size={13} />
                    </span>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        <div className="qs-foot">
          <div className="qs-hints">
            <span className="qs-hint"><kbd><ArrowUp size={12} /></kbd><kbd><ArrowDown size={12} /></kbd> Pilih</span>
            <span className="qs-hint"><kbd><CornerDownLeft size={12} /></kbd> Buka</span>
            <span className="qs-hint"><kbd>esc</kbd> Tutup</span>
          </div>
          <span className="qs-count">{flat.length} hasil</span>
        </div>
      </div>
    </div>
  );
}

export default function CommandPalette({ open, items, onSelect, onClose }) {
  // Dimuat hanya saat terbuka → kotak pencarian selalu mulai kosong
  if (!open) return null;
  return <PaletteInner items={items} onSelect={onSelect} onClose={onClose} />;
}