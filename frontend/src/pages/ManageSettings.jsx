import { useState } from 'react';
import { Settings, Save } from 'lucide-react';
import '../App.css';

export default function ManageSettings() {
  const [settings, setSettings] = useState({
    school_name: 'SMKN Compreng',
    school_accreditation: 'A',
    contact_phone: '08123456789',
    contact_email: 'info@smkncompreng.sch.id'
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSave = (e) => {
    e.preventDefault();
    setMessage('Pengaturan website berhasil diperbarui!');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="content-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px' }}>
        <Settings size={28} color="#d97706" />
        <div>
          <h2 style={{ margin: 0, color: '#111827', fontSize: '20px' }}>Pengaturan Website Sekolah</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>Kelola identitas, logo, dan informasi kontak utama (Khusus Admin).</p>
        </div>
      </div>

      {message && <div style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: 'bold', border: '1px solid #fde68a' }}>{message}</div>}

      <form onSubmit={handleSave}>
        <div className="form-grid">
          <div className="setting-group">
            <label>Nama Sekolah</label>
            <input type="text" name="school_name" value={settings.school_name} onChange={handleChange} className="setting-input" required />
          </div>

          <div className="setting-group">
            <label>Akreditasi Sekolah</label>
            <input type="text" name="school_accreditation" value={settings.school_accreditation} onChange={handleChange} className="setting-input" required />
          </div>

          <div className="setting-group">
            <label>Nomor Telepon</label>
            <input type="text" name="contact_phone" value={settings.contact_phone} onChange={handleChange} className="setting-input" />
          </div>

          <div className="setting-group">
            <label>Email Resmi</label>
            <input type="email" name="contact_email" value={settings.contact_email} onChange={handleChange} className="setting-input" />
          </div>
        </div>

        <button type="submit" className="gold-btn">
          <Save size={18} /> Simpan Perubahan Setting
        </button>
      </form>
    </div>
  );
}