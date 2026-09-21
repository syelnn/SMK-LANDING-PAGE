import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Compass, 
  Users, 
  Music, 
  Swords, 
  Activity, 
  Palette, 
  Cpu 
} from 'lucide-react';
import '../../css/viewer/ekstrakurikulerViewer.css';

const renderIcon = (iconValue) => {
  const props = { className: "ekskul-icon" };

  if (iconValue && (iconValue.startsWith('data:image') || iconValue.startsWith('http') || iconValue.startsWith('/uploads'))) {
    return (
      <img 
        src={iconValue} 
        alt="Logo Ekskul" 
        className="ekskul-logo-img"
      />
    );
  }

  switch (iconValue) {
    case 'Shield': return <Shield {...props} className="ekskul-icon text-blue" />;
    case 'Compass': return <Compass {...props} className="ekskul-icon text-green" />;
    case 'Users': return <Users {...props} className="ekskul-icon text-yellow" />;
    case 'Music': return <Music {...props} className="ekskul-icon text-orange" />;
    case 'Swords': return <Swords {...props} className="ekskul-icon text-red" />;
    case 'Activity': return <Activity {...props} className="ekskul-icon text-emerald" />;
    case 'Palette': return <Palette {...props} className="ekskul-icon text-pink" />;
    case 'Cpu': return <Cpu {...props} className="ekskul-icon text-purple" />;
    default: return <Shield {...props} className="ekskul-icon text-blue" />;
  }
};

export default function EkstrakurikulerViewer() {
  const [listEkskul, setListEkskul] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEkskul = async () => {
      try {
        const response = await fetch('http://localhost:5002/api/extracurriculars');
        const result = await response.json();
        if (result.success) {
          const visibleData = result.data.filter(item => item.show === 1 || item.show === true || item.show === undefined);
          setListEkskul(visibleData);
        }
        setLoading(false);
      } catch (error) {
        console.error('Gagal memuat data ekstrakurikuler:', error);
        setLoading(false);
      }
    };

    fetchEkskul();
  }, []);

  if (loading) {
    return <div className="text-center py-5" style={{ color: 'var(--compreng-text-secondary, #475569)' }}>Memuat data ekstrakurikuler...</div>;
  }

  return (
    <div className="ekskul-section-wrapper">
      <div className="ekskul-container">
        <div style={{ maxWidth: '1100px', margin: '0 auto 36px auto', padding: '0 15px' }}>
          <div style={{ textAlign: 'center' }}>
            <span className="ekskul-badge">Ekstrakurikuler</span>
            <h2 className="ekskul-title" style={{ marginTop: '12px' }}>
              Ekstrakurikuler <span>SMK Negeri Compreng</span>
            </h2>
            <p className="ekskul-desc" style={{ margin: '12px auto 0 auto' }}>
              Wadah pengembangan minat, bakat, dan potensi siswa di luar kelas.
            </p>
          </div>
        </div>

        <div className="ekskul-grid">
          {listEkskul.map((item) => (
            <div key={item.id} className="ekskul-card">
              <div className="ekskul-icon-box">
                {renderIcon(item.icon)}
              </div>
              <h3 className="ekskul-card-title">{item.title}</h3>
              <p className="ekskul-card-text">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}