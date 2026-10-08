import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Search, Users, MapPin, Pencil, ChevronLeft, ChevronRight, AlertCircle, ClipboardList,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import FooterViewer from './FooterViewer';
import { getSession, isStaff } from '../../utils/auth';
import '../../css/viewer/tracerStudy.css';

const API = 'https://smkn-compreng-api-pi.vercel.app';
const PAGE_SIZE = 10;

const TracerStudy = () => {
  const navigate = useNavigate();
  const session = useMemo(() => getSession(), []);
  const staff = !!session && isStaff(session.role);

  const [data, setData] = useState(null); // { currentAngkatan, recentRange, stats, items }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mine, setMine] = useState(null); // data milik user login (kalau sudah pernah isi)

  const [angkatan, setAngkatan] = useState('all'); // 'all' | number
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
  const stats = data?.stats || { total: 0, cities: 0, byAngkatan: [] };

  // Chip filter: Semua + angkatan terbaru dan 2 tahun ke belakang (mis. 8, 9, 10)
  const chips = useMemo(() => {
    const list = [];
    for (let a = Math.max(1, current - range); a <= current; a++) list.push(a);
    return list;
  }, [current, range]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((r) => {
      if (angkatan !== 'all' && r.angkatan !== angkatan) return false;
      if (!q) return true;
      return (
        r.fullName.toLowerCase().includes(q) ||
        r.domicile.toLowerCase().includes(q) ||
        `angkatan ${r.angkatan}`.includes(q)
      );
    });
  }, [items, angkatan, query]);

  useEffect(() => { setPage(1); }, [angkatan, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const maxCount = Math.max(1, ...stats.byAngkatan.map((b) => b.count));

  const onCta = () => {
    if (!session) {
      // Wajib punya akun: login (atau daftar dari halaman login), lalu langsung ke formulir
      return navigate('/login', { state: { from: '/tracer-study/isi', reason: 'tracer' } });
    }
    if (staff) return navigate('/admin/tracer-study');
    return navigate('/tracer-study/isi');
  };
  const ctaLabel = staff ? 'Kelola Data' : mine ? 'Status Data Saya' : 'Isi Data Mandiri';

  const labelOf = (a) => (a === current ? `Angkatan ${a} (tahun ini)` : `Angkatan ${a}`);

  return (
    <div className="ts-page">
      <Navbar />

      <main className="ts-main">
        <div className="ts-wrap">
          <header className="ts-head">
            <div className="ts-kicker"><ClipboardList size={14} aria-hidden="true" /> Tracer Study</div>
            <h1 className="ts-h1">Jejak Alumni SMKN Compreng</h1>
            <div className="ts-lead">
              Data alumni yang sudah terverifikasi sekolah. Alumni bisa ikut mendata diri secara mandiri.
            </div>
          </header>

          {/* ===== STATISTIK ===== */}
          <section className="ts-figs" aria-label="Ringkasan data">
            <div className="ts-fig">
              <div className="ts-fig-top"><div className="ts-fig-lbl">Total alumni terdata</div><Users size={18} aria-hidden="true" /></div>
              <div className="ts-fig-val">{loading ? '…' : stats.total}</div>
              <div className="ts-fig-note">Sudah diverifikasi admin</div>
            </div>
            <div className="ts-fig">
              <div className="ts-fig-top"><div className="ts-fig-lbl">Sebaran domisili</div><MapPin size={18} aria-hidden="true" /></div>
              <div className="ts-fig-val">{loading ? '…' : stats.cities}</div>
              <div className="ts-fig-note">Domisili berbeda</div>
            </div>
            <div className="ts-fig ts-fig-wide">
              <div className="ts-fig-top"><div className="ts-fig-lbl">Alumni per angkatan</div></div>
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
                      <div className="ts-meter-fill" style={{ width: `${(b.count / maxCount) * 100}%` }} />
                    </div>
                    <div className="ts-meter-num">{b.count}</div>
                  </button>
                ))}
                {!loading && stats.byAngkatan.length === 0 && <div className="ts-fig-note">Belum ada data.</div>}
              </div>
            </div>
          </section>

          {/* ===== FILTER + PENCARIAN + CTA ===== */}
          <section className="ts-controls">
            <div className="ts-controls-left">
              <div className="ts-chips" role="group" aria-label="Filter angkatan">
                <button
                  type="button"
                  className={`ts-chip ${angkatan === 'all' ? 'is-on' : ''}`}
                  onClick={() => setAngkatan('all')}
                >
                  Semua
                </button>
                {chips.map((a) => (
                  <button
                    type="button"
                    key={a}
                    className={`ts-chip ${angkatan === a ? 'is-on' : ''}`}
                    onClick={() => setAngkatan(a)}
                  >
                    {labelOf(a)}
                  </button>
                ))}
              </div>

              <div className="ts-find">
                <Search size={16} className="ts-find-ico" aria-hidden="true" />
                <input
                  type="text"
                  className="ts-find-input"
                  placeholder="Cari nama atau domisili…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Cari alumni"
                />
              </div>
            </div>

            <button type="button" className="ts-cta" onClick={onCta}>
              <Pencil size={16} aria-hidden="true" /> {ctaLabel}
            </button>
          </section>

          {/* ===== TABEL ===== */}
          {error && (
            <div className="ts-alert" role="alert"><AlertCircle size={20} aria-hidden="true" /> {error}</div>
          )}

          {!error && (
            <section className="ts-sheet">
              <div className="ts-scroll">
                <table className="ts-grid">
                  <thead>
                    <tr>
                      <th className="ts-col-no">No</th>
                      <th>Nama Lengkap</th>
                      <th>Angkatan</th>
                      <th>Domisili</th>
                      <th>NISN</th>
                      <th>No. HP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="6" className="ts-empty">Memuat data alumni…</td></tr>
                    ) : rows.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="ts-empty">
                          {items.length === 0
                            ? 'Belum ada data alumni yang terverifikasi.'
                            : 'Tidak ada data yang cocok dengan filter atau pencarian.'}
                        </td>
                      </tr>
                    ) : (
                      rows.map((r, i) => (
                        <tr key={r.id}>
                          <td className="ts-col-no">{(safePage - 1) * PAGE_SIZE + i + 1}</td>
                          <td><div className="ts-person">{r.fullName}</div></td>
                          <td><div className="ts-gen">Angkatan {r.angkatan}</div></td>
                          <td>{r.domicile}</td>
                          <td><div className="ts-mono">{r.nisn}</div></td>
                          <td><div className="ts-mono">{r.phone}</div></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
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
            NISN dan nomor HP disamarkan demi privasi. NIK dan tanggal lahir hanya bisa dilihat admin sekolah.
          </div>
        </div>
      </main>

      <FooterViewer />
    </div>
  );
};

export default TracerStudy;
