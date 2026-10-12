import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Search, Users, MapPin, Pencil, ChevronLeft, ChevronRight, AlertCircle, ClipboardList,
  Briefcase, Store, GraduationCap, Laptop, TrendingUp, RotateCcw, ChevronDown, Check,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import FooterViewer from './FooterViewer';
import { getSession, isStaff } from '../../utils/auth';
import '../../css/viewer/tracerStudy.css';

const API = 'https://smkn-compreng-api-pi.vercel.app';
const PAGE_SIZE = 10;

// Status kegiatan alumni: urutan = urutan di diagram. Warna sengaja mid-tone supaya terbaca
// di 4 tema (light / dark / system / custom) tanpa override per tema.
const KINDS = [
  { key: 'Bekerja', color: '#3b82f6', Icon: Briefcase },
  { key: 'Wirausaha', color: '#f59e0b', Icon: Store },
  { key: 'Kuliah', color: '#8b5cf6', Icon: GraduationCap },
  { key: 'Freelance', color: '#14b8a6', Icon: Laptop },
  { key: 'Pencari Kerja Aktif', color: '#f43f5e', Icon: Search },
];
const KIND_MAP = Object.fromEntries(KINDS.map((k) => [k.key, k]));

// Jurusan yang selalu tampil di dropdown (walau belum ada alumni terdata). Data dari API
// dengan kode singkatan yang sama akan dipakai sebagai nilai filter-nya.
const JURUSAN_DEFAULT = [
  'Pengembangan Perangkat Lunak & Gim (PPLG/RPL)',
  'Agribisnis Tanaman Pangan dan Hortikultura (ATPH)',
  'Teknik dan Bisnis Sepeda Motor (TBSM)',
];
const codeOf = (name) => String(name || '').match(/\(([^)]+)\)\s*$/)?.[1] || '';
const nameOf = (name) => String(name || '').replace(/\s*\([^)]*\)\s*$/, '');

/* ---------- Diagram donat (SVG murni, tanpa library) ---------- */
const Donut = ({ parts, total, active, onPick }) => {
  const R = 46;
  const C = 2 * Math.PI * R;
  const live = parts.filter((p) => p.count > 0);
  const GAP = live.length > 1 ? 2.2 : 0;
  let acc = 0;

  return (
    <div className="ts-donut">
      <svg viewBox="0 0 120 120" role="img" aria-label={`Diagram status alumni, total ${total} alumni`}>
        <circle cx="60" cy="60" r={R} fill="none" strokeWidth="14" className="ts-donut-track" />
        <g transform="rotate(-90 60 60)">
          {total > 0 && live.map((p) => {
            const len = (p.count / total) * C;
            const dash = Math.max(0.5, len - GAP);
            const node = (
              <circle
                key={p.key}
                cx="60" cy="60" r={R} fill="none"
                stroke={p.color}
                strokeWidth={active === p.key ? 19 : 14}
                strokeDasharray={`${dash} ${C - dash}`}
                strokeDashoffset={-acc}
                className="ts-donut-seg"
                style={{ opacity: active !== 'all' && active !== p.key ? 0.3 : 1 }}
                onClick={() => onPick(p.key)}
              >
                <title>{`${p.key}: ${p.count} alumni`}</title>
              </circle>
            );
            acc += len;
            return node;
          })}
        </g>
      </svg>
      <div className="ts-donut-mid">
        <div className="ts-donut-num">{total}</div>
        <div className="ts-donut-lbl">alumni</div>
      </div>
    </div>
  );
};

/* ---------- Dropdown kustom (menggantikan <select> bawaan browser) ---------- */
const Dropdown = ({ value, options, onChange, placeholder, ariaLabel, pill = false }) => {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const selected = options.find((o) => o.value === value);
  const isOn = value !== 'all';

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = (v) => { onChange(v); setOpen(false); };

  // Navigasi keyboard: panah atas/bawah memindahkan fokus antar opsi
  const onMenuKey = (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const items = Array.from(boxRef.current.querySelectorAll('.ts-dd-item'));
    const i = items.indexOf(document.activeElement);
    const next = e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
    items[next]?.focus();
  };

  return (
    <div className={`ts-dd ${pill ? 'ts-dd-pill' : ''} ${open ? 'is-open' : ''} ${isOn ? 'is-set' : ''}`} ref={boxRef}>
      <button
        type="button"
        className="ts-dd-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        {isOn && selected?.dot && <div className="ts-dd-dot" style={{ '--k': selected.dot }} aria-hidden="true" />}
        <div className="ts-dd-value">{isOn && selected ? (selected.short || selected.label) : placeholder}</div>
        <ChevronDown size={16} className="ts-dd-caret" aria-hidden="true" />
      </button>

      {open && (
        <>
        <div className="ts-dd-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
        <ul className="ts-dd-menu" role="listbox" aria-label={ariaLabel} onKeyDown={onMenuKey}>
          <li role="presentation" className="ts-dd-sheet-title" aria-hidden="true">{ariaLabel}</li>
          {options.map((o) => {
            const on = o.value === value;
            return (
              <li key={String(o.value)} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={on}
                  className={`ts-dd-item ${on ? 'is-on' : ''}`}
                  onClick={() => pick(o.value)}
                >
                  {o.badge && <div className="ts-dd-badge" aria-hidden="true">{o.badge}</div>}
                  <div className="ts-dd-text">{o.label}</div>
                  {o.tag && <div className="ts-dd-tag">{o.tag}</div>}
                  <div className="ts-dd-check" aria-hidden="true">{on && <Check size={16} />}</div>
                </button>
              </li>
            );
          })}
        </ul>
        </>
      )}
    </div>
  );
};

const TracerStudy = () => {
  const navigate = useNavigate();
  const session = useMemo(() => getSession(), []);
  const staff = !!session && isStaff(session.role);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mine, setMine] = useState(null);

  const [angkatan, setAngkatan] = useState('all');
  const [kind, setKind] = useState('all');
  const [jurusan, setJurusan] = useState('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    window.scrollTo(0, 0);
    let alive = true;
    axios
      .get(`${API}/api/tracer-study/public`)
      .then((res) => alive && setData(res.data?.data || null))
      .catch(() => alive && setError('Gagal memuat data Tracer Study. Silakan coba lagi nanti.'))
      .finally(() => alive && setLoading(false));

    if (session && !staff) {
      axios
        .get(`${API}/api/tracer-study/mine`, { headers: { Authorization: `Bearer ${session.token}` } })
        .then((res) => alive && setMine(res.data?.data?.entry || null))
        .catch(() => {});
    }
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = data?.currentAngkatan || 10;
  const items = data?.items || [];
  const stats = data?.stats || {
    total: 0, areas: 0, absorbedRate: 0, answered: 0, byStatus: [], byJurusan: [], byAngkatan: [],
  };

  const parts = useMemo(
    () => KINDS.map((k) => ({
      ...k,
      count: stats.byStatus.find((s) => s.status === k.key)?.count || 0,
    })),
    [stats.byStatus]
  );
  const answeredTotal = parts.reduce((n, p) => n + p.count, 0);
  const maxJurusan = Math.max(1, ...stats.byJurusan.map((j) => j.total));
  const maxAngkatan = Math.max(1, ...stats.byAngkatan.map((b) => b.count));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((r) => {
      if (angkatan !== 'all' && r.angkatan !== angkatan) return false;
      if (kind !== 'all' && r.workStatus !== kind) return false;
      if (jurusan !== 'all' && r.jurusan !== jurusan) return false;
      if (!q) return true;
      return [r.fullName, r.domicile, r.jurusan, r.workStatus, r.detailTempat, `angkatan ${r.angkatan}`]
        .some((v) => String(v || '').toLowerCase().includes(q));
    });
  }, [items, angkatan, kind, jurusan, query]);

  useEffect(() => { setPage(1); }, [angkatan, kind, jurusan, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const hasFilter = angkatan !== 'all' || kind !== 'all' || jurusan !== 'all' || query.trim() !== '';

  const resetAll = () => { setAngkatan('all'); setKind('all'); setJurusan('all'); setQuery(''); };
  const toggleKind = (k) => setKind((prev) => (prev === k ? 'all' : k));
  const toggleJurusan = (j) => setJurusan((prev) => (prev === j ? 'all' : j));

  const onCta = () => {
    if (!session) return navigate('/login', { state: { from: '/tracer-study/isi', reason: 'tracer' } });
    if (staff) return navigate('/admin/tracer-study');
    return navigate('/tracer-study/isi');
  };
  const ctaLabel = staff
    ? 'Kelola Data'
    : mine?.approvalStatus === 'rejected' ? 'Perbaiki Data Saya'
    : mine ? 'Status Data Saya' : 'Isi Data Mandiri';

  const labelOf = (a) => (a === current ? `Angkatan ${a} (tahun ini)` : `Angkatan ${a}`);

  // Opsi dropdown: semua angkatan 1..current, status, dan jurusan (dengan jumlah alumni)
  const angkatanOptions = [
    ...Array.from({ length: current }, (_, i) => i + 1).map((a) => ({
      value: a,
      label: `Angkatan ${a}`,
      tag: a === current ? 'Tahun ini' : '',
      badge: String(a),
      code: String(a),
      meta: stats.byAngkatan.find((b) => b.angkatan === a)?.count || 0,
    })),
  ];
  const statusOptions = [
    { value: 'all', label: 'Semua status', Icon: Users },
    ...parts.map((p) => ({ value: p.key, label: p.key, dot: p.color, Icon: p.Icon, meta: p.count })),
  ];
  const jurusanMap = new Map(JURUSAN_DEFAULT.map((n) => [codeOf(n) || n, n]));
  stats.byJurusan.forEach((j) => jurusanMap.set(codeOf(j.jurusan) || j.jurusan, j.jurusan));
  const jurusanOptions = [
    { value: 'all', label: 'Semua jurusan', Icon: Users },
    ...Array.from(jurusanMap.values()).map((n) => ({
      value: n,
      label: n,
      text: nameOf(n),
      code: codeOf(n),
      short: codeOf(n) || n,
      meta: stats.byJurusan.find((j) => j.jurusan === n)?.total || 0,
    })),
  ];

  const KindPill = ({ value }) => {
    const k = KIND_MAP[value];
    if (!k) return <div className="ts-muted">Belum diisi</div>;
    return <div className="ts-kind" style={{ '--k': k.color }}>{k.key}</div>;
  };

  return (
    <div className="ts-page">
      <Navbar />

      <main className="ts-main">
        <div className="ts-wrap">
          <header className="ts-head">
            <div className="ts-kicker"><ClipboardList size={14} aria-hidden="true" /> Tracer Study</div>
            <h1 className="ts-h1">Jejak Alumni SMKN Compreng</h1>
            <div className="ts-lead">
              Ke mana lulusan kami melangkah: bekerja, kuliah, berwirausaha, atau freelance.
              Data sudah diverifikasi sekolah, dan alumni bisa ikut mendata diri secara mandiri.
            </div>
          </header>

          {/* ===== RINGKASAN ===== */}
          <section className="ts-kpis" aria-label="Ringkasan data">
            <div className="ts-kpi">
              <div className="ts-kpi-top"><div className="ts-kpi-lbl">Alumni terdata</div><Users size={18} aria-hidden="true" /></div>
              <div className="ts-kpi-val">{loading ? '…' : stats.total}</div>
              <div className="ts-kpi-note">Sudah diverifikasi admin</div>
            </div>
            <div className="ts-kpi">
              <div className="ts-kpi-top"><div className="ts-kpi-lbl">Tingkat keterserapan</div><TrendingUp size={18} aria-hidden="true" /></div>
              <div className="ts-kpi-val">{loading ? '…' : `${stats.absorbedRate}%`}</div>
              <div className="ts-ring-track" aria-hidden="true"><div className="ts-ring-fill" style={{ width: `${stats.absorbedRate}%` }} /></div>
              <div className="ts-kpi-note">Bekerja, kuliah, wirausaha, atau freelance</div>
            </div>
            <div className="ts-kpi">
              <div className="ts-kpi-top"><div className="ts-kpi-lbl">Sebaran kecamatan</div><MapPin size={18} aria-hidden="true" /></div>
              <div className="ts-kpi-val">{loading ? '…' : stats.areas}</div>
              <div className="ts-kpi-note">Domisili berbeda</div>
            </div>
          </section>

          {/* ===== GRAFIK: status + jurusan ===== */}
          <section className="ts-charts" aria-label="Statistik alumni">
            <div className="ts-panel">
              <div className="ts-panel-head">
                <h2 className="ts-panel-h">Status alumni saat ini</h2>
                <div className="ts-panel-sub">Klik bagian diagram untuk memfilter tabel.</div>
              </div>
              <div className="ts-donut-row">
                <Donut parts={parts} total={answeredTotal} active={kind} onPick={toggleKind} />
                <ul className="ts-legend">
                  {parts.map((p) => {
                    const pct = answeredTotal ? Math.round((p.count / answeredTotal) * 100) : 0;
                    return (
                      <li key={p.key}>
                        <button
                          type="button"
                          className={`ts-legend-row ${kind === p.key ? 'is-on' : ''}`}
                          style={{ '--k': p.color }}
                          onClick={() => toggleKind(p.key)}
                          aria-pressed={kind === p.key}
                        >
                          <div className="ts-dot" aria-hidden="true"><p.Icon size={14} /></div>
                          <div className="ts-legend-name">{p.key}</div>
                          <div className="ts-legend-val">{p.count}<div className="ts-legend-pct">{pct}%</div></div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
              {!loading && answeredTotal === 0 && (
                <div className="ts-panel-empty">Belum ada alumni yang mengisi status kegiatan.</div>
              )}
            </div>

            <div className="ts-panel">
              <div className="ts-panel-head">
                <h2 className="ts-panel-h">Status per jurusan</h2>
                <div className="ts-panel-sub">Warna sama dengan diagram di samping. Klik jurusan untuk memfilter.</div>
              </div>
              <div className="ts-majors">
                {stats.byJurusan.map((j) => (
                  <button
                    type="button"
                    key={j.jurusan}
                    className={`ts-major ${jurusan === j.jurusan ? 'is-on' : ''}`}
                    onClick={() => toggleJurusan(j.jurusan)}
                    aria-pressed={jurusan === j.jurusan}
                  >
                    <div className="ts-major-top">
                      <div className="ts-major-name">{j.jurusan}</div>
                      <div className="ts-major-num">{j.total}</div>
                    </div>
                    <div className="ts-stack-track" aria-hidden="true">
                      <div className="ts-stack" style={{ width: `${(j.total / maxJurusan) * 100}%` }}>
                        {KINDS.filter((k) => j.counts[k.key]).map((k) => (
                          <div
                            key={k.key}
                            className="ts-stack-seg"
                            style={{ flexGrow: j.counts[k.key], background: k.color }}
                            title={`${k.key}: ${j.counts[k.key]}`}
                          />
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
                {!loading && stats.byJurusan.length === 0 && (
                  <div className="ts-panel-empty">Belum ada data jurusan.</div>
                )}
              </div>
            </div>
          </section>

          {/* ===== PER ANGKATAN ===== */}
          <section className="ts-panel ts-panel-wide" aria-label="Alumni per angkatan">
            <div className="ts-panel-head">
              <h2 className="ts-panel-h">Alumni per angkatan</h2>
            </div>
            <div className="ts-meters">
              {stats.byAngkatan.map((b) => (
                <button
                  type="button"
                  key={b.angkatan}
                  className={`ts-meter-row ${angkatan === b.angkatan ? 'is-on' : ''}`}
                  onClick={() => setAngkatan((prev) => (prev === b.angkatan ? 'all' : b.angkatan))}
                  aria-pressed={angkatan === b.angkatan}
                >
                  <div className="ts-meter-name">{labelOf(b.angkatan)}</div>
                  <div className="ts-meter-track" aria-hidden="true">
                    <div className="ts-meter-fill" style={{ width: `${(b.count / maxAngkatan) * 100}%` }} />
                  </div>
                  <div className="ts-meter-num">{b.count}</div>
                </button>
              ))}
              {!loading && stats.byAngkatan.length === 0 && <div className="ts-kpi-note">Belum ada data.</div>}
            </div>
          </section>

          {/* ===== FILTER + PENCARIAN + CTA ===== */}
          <section className="ts-controls">
            <div className="ts-controls-left">
              <div className="ts-chips" role="group" aria-label="Filter angkatan">
                <button type="button" className={`ts-chip ${angkatan === 'all' ? 'is-on' : ''}`} onClick={() => setAngkatan('all')}>
                  Semua
                </button>
                <Dropdown pill value={angkatan} options={angkatanOptions} onChange={setAngkatan} placeholder="Berdasarkan angkatan" ariaLabel="Berdasarkan angkatan" />
              </div>

              <div className="ts-row">
                <div className="ts-find">
                  <Search size={16} className="ts-find-ico" aria-hidden="true" />
                  <input
                    type="text" className="ts-find-input" placeholder="Cari nama, kecamatan, atau tempat…"
                    value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Cari alumni"
                  />
                </div>
                <Dropdown value={kind} options={statusOptions} onChange={setKind} placeholder="Semua status" ariaLabel="Filter status" />
                <Dropdown value={jurusan} options={jurusanOptions} onChange={setJurusan} placeholder="Semua jurusan" ariaLabel="Filter jurusan" />
                {hasFilter && (
                  <button type="button" className="ts-reset" onClick={resetAll}>
                    <RotateCcw size={14} aria-hidden="true" /> Reset
                  </button>
                )}
              </div>
            </div>

            <button type="button" className="ts-cta" onClick={onCta}>
              <Pencil size={16} aria-hidden="true" /> {ctaLabel}
            </button>
          </section>

          {/* ===== TABEL ===== */}
          {error && <div className="ts-alert" role="alert"><AlertCircle size={20} aria-hidden="true" /> {error}</div>}

          {!error && (
            <section className="ts-sheet">
              {/* Desktop & tablet */}
              <div className="ts-scroll">
                <table className="ts-grid">
                  <thead>
                    <tr>
                      <th className="ts-col-no">No</th>
                      <th>Nama Lengkap</th>
                      <th>Jurusan</th>
                      <th className="ts-col-ang">Angkatan</th>
                      <th>Domisili</th>
                      <th>Status</th>
                      <th>Detail Tempat Kerja / Universitas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="7" className="ts-empty">Memuat data alumni…</td></tr>
                    ) : rows.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="ts-empty">
                          {items.length === 0 ? 'Belum ada data alumni yang terverifikasi.' : 'Tidak ada data yang cocok dengan filter atau pencarian.'}
                        </td>
                      </tr>
                    ) : (
                      rows.map((r, i) => (
                        <tr key={r.id}>
                          <td className="ts-col-no">{(safePage - 1) * PAGE_SIZE + i + 1}</td>
                          <td>
                            <div className="ts-person">{r.fullName}</div>
                          </td>
                          <td><div>{r.jurusan || <div className="ts-muted">Belum diisi</div>}</div></td>
                          <td className="ts-col-ang"><div>{r.angkatan}</div></td>
                          <td><div>{r.domicile || '—'}</div></td>
                          <td><KindPill value={r.workStatus} /></td>
                          <td>{r.detailTempat ? <div>{r.detailTempat}</div> : <div className="ts-muted">—</div>}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile: daftar kartu */}
              <div className="ts-mlist">
                {loading && <div className="ts-mempty">Memuat data alumni…</div>}
                {!loading && rows.length === 0 && (
                  <div className="ts-mempty">
                    {items.length === 0 ? 'Belum ada data alumni yang terverifikasi.' : 'Tidak ada data yang cocok dengan filter atau pencarian.'}
                  </div>
                )}
                {rows.map((r) => {
                  const k = KIND_MAP[r.workStatus];
                  const PlaceIcon = k?.Icon || Briefcase;
                  return (
                    <article key={r.id} className="ts-tile" style={k ? { '--k': k.color } : undefined}>
                      <div className="ts-tile-top">
                        <div className="ts-initial" aria-hidden="true">{String(r.fullName || '?').trim().charAt(0).toUpperCase()}</div>
                        <div className="ts-person">{r.fullName}</div>
                      </div>
                      <div className="ts-pills">
                        <KindPill value={r.workStatus} />
                        <div className="ts-gen-pill">Angkatan {r.angkatan}</div>
                      </div>
                      <div className="ts-facts">
                        <div className="ts-fact"><GraduationCap size={17} aria-hidden="true" /><div>{r.jurusan || 'Jurusan belum diisi'}</div></div>
                        <div className="ts-fact"><MapPin size={17} aria-hidden="true" /><div>{r.domicile || '—'}</div></div>
                        {r.detailTempat && <div className="ts-fact"><PlaceIcon size={17} aria-hidden="true" /><div>{r.detailTempat}</div></div>}
                      </div>
                    </article>
                  );
                })}
              </div>

              {!loading && filtered.length > 0 && (
                <div className="ts-pager">
                  <div className="ts-pager-info">
                    Menampilkan {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} dari {filtered.length} alumni
                  </div>
                  <div className="ts-pager-ctl">
                    <button type="button" className="ts-step" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} aria-label="Halaman sebelumnya">
                      <ChevronLeft size={16} />
                    </button>
                    <div className="ts-pager-num">{safePage} / {totalPages}</div>
                    <button type="button" className="ts-step" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} aria-label="Halaman berikutnya">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          <div className="ts-privacy">
            NISN, NIK, tanggal lahir, dan nomor HP tidak ditampilkan ke publik. Hanya admin sekolah yang dapat melihatnya.
          </div>
        </div>
      </main>

      <FooterViewer />
    </div>
  );
};

export default TracerStudy;