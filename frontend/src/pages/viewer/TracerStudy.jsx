import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Search, Users, MapPin, Pencil, ChevronLeft, ChevronRight, AlertCircle, ClipboardList,
  Briefcase, Store, GraduationCap, Laptop, TrendingUp, RotateCcw,
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
  const range = data?.recentRange ?? 2;
  const items = data?.items || [];
  const stats = data?.stats || {
    total: 0, areas: 0, absorbedRate: 0, answered: 0, byStatus: [], byJurusan: [], byAngkatan: [],
  };

  const chips = useMemo(() => {
    const list = [];
    for (let a = Math.max(1, current - range); a <= current; a++) list.push(a);
    return list;
  }, [current, range]);

  const parts = useMemo(
    () => KINDS.map((k) => ({
      ...k,
      count: stats.byStatus.find((s) => s.status === k.key)?.count || 0,
    })),
    [stats.byStatus]
  );
  const answeredTotal = parts.reduce((n, p) => n + p.count, 0);
  const jurusanList = stats.byJurusan.map((j) => j.jurusan);
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
                {chips.map((a) => (
                  <button type="button" key={a} className={`ts-chip ${angkatan === a ? 'is-on' : ''}`} onClick={() => setAngkatan(a)}>
                    {labelOf(a)}
                  </button>
                ))}
              </div>

              <div className="ts-row">
                <div className="ts-find">
                  <Search size={16} className="ts-find-ico" aria-hidden="true" />
                  <input
                    type="text" className="ts-find-input" placeholder="Cari nama, kecamatan, atau tempat…"
                    value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Cari alumni"
                  />
                </div>
                <select className="ts-pick" value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Filter status">
                  <option value="all">Semua status</option>
                  {KINDS.map((k) => <option key={k.key} value={k.key}>{k.key}</option>)}
                </select>
                <select className="ts-pick" value={jurusan} onChange={(e) => setJurusan(e.target.value)} aria-label="Filter jurusan">
                  <option value="all">Semua jurusan</option>
                  {jurusanList.map((j) => <option key={j} value={j}>{j}</option>)}
                </select>
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
                      <th>Status</th>
                      <th>Detail Tempat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="5" className="ts-empty">Memuat data alumni…</td></tr>
                    ) : rows.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="ts-empty">
                          {items.length === 0 ? 'Belum ada data alumni yang terverifikasi.' : 'Tidak ada data yang cocok dengan filter atau pencarian.'}
                        </td>
                      </tr>
                    ) : (
                      rows.map((r, i) => (
                        <tr key={r.id}>
                          <td className="ts-col-no">{(safePage - 1) * PAGE_SIZE + i + 1}</td>
                          <td>
                            <div className="ts-person">{r.fullName}</div>
                            <div className="ts-minor">Angkatan {r.angkatan} · {r.domicile}</div>
                          </td>
                          <td><div>{r.jurusan || <div className="ts-muted">Belum diisi</div>}</div></td>
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
                {rows.map((r) => (
                  <div key={r.id} className="ts-tile">
                    <div className="ts-tile-top">
                      <div>
                        <div className="ts-person">{r.fullName}</div>
                        <div className="ts-minor">Angkatan {r.angkatan} · {r.domicile}</div>
                      </div>
                      <KindPill value={r.workStatus} />
                    </div>
                    <div className="ts-kv"><div>Jurusan</div><div>{r.jurusan || '—'}</div></div>
                    {r.detailTempat && <div className="ts-kv"><div>Tempat</div><div>{r.detailTempat}</div></div>}
                  </div>
                ))}
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