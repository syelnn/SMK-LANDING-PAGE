import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../css/viewer/industrypartners.css';

export default function IndustryPartnersViewer() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = 'http://localhost:5002/api';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_URL}/industry-partners`);

        const activePartners = (res.data.data || []).filter(
          (p) => (p.isActive ?? p.is_active) === true || (p.isActive ?? p.is_active) === undefined
        );

        setPartners(activePartners);
        setLoading(false);
      } catch (error) {
        console.error('Gagal memuat data mitra industri:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Tidak ada mitra aktif -> section disembunyikan total
  if (loading || partners.length === 0) return null;

  return (
    <section id="section-mitra-industri" className="ipv-wrapper" aria-label="Mitra Industri">
      <div className="ipv-container">
        <h2 className="ipv-title">BEKERJA SAMA DENGAN INDUSTRI TERKEMUKA</h2>

        <div className="ipv-logo-grid">
          {partners.map((item) => {
            const logoUrl = item.logoUrl ?? item.logo_url;
            return (
              <div className="ipv-logo-item" key={item.id} title={item.name}>
                <img src={logoUrl} alt={item.name} loading="lazy" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}