import React, { useState, useEffect, useContext } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { SettingsContext } from './context/SettingsContext';
import { 
  Users, School, Newspaper, BookOpen, Activity, 
  GraduationCap, Trophy, MessageSquare, HelpCircle, 
  Image as ImageIcon, MapPin, LayoutDashboard, Settings,
  X, ChevronDown, Download, LogOut, ChevronsUpDown
} from 'lucide-react';

import logoSekolah from './assets/logo1.png';

const ICON_MAP = {
  dashboard: <LayoutDashboard size={16} />,
  users: <Users size={16} />,
  school: <School size={16} />,
  building: <School size={16} />,
  settings: <Settings size={16} />,
  news: <Newspaper size={16} />,
  newspaper: <Newspaper size={16} />,
  jurusan: <BookOpen size={16} />,
  'book-open': <BookOpen size={16} />,
  ekskul: <Activity size={16} />,
  activity: <Activity size={16} />,
  pengajar: <GraduationCap size={16} />,
  prestasi: <Trophy size={16} />,
  award: <Trophy size={16} />,
  testimoni: <MessageSquare size={16} />,
  'message-square': <MessageSquare size={16} />,
  faq: <HelpCircle size={16} />,
  'help-circle': <HelpCircle size={16} />,
  galeri: <ImageIcon size={16} />,
  image: <ImageIcon size={16} />,
  kontak: <MapPin size={16} />,
  'map-pin': <MapPin size={16} />,
  download: <Download size={16} />
};

export default function Sidebar({ 
  isMobileMenuOpen, 
  setIsMobileMenuOpen, 
  isSidebarVisible, 
  setIsSidebarVisible, 
  userData 
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useContext(SettingsContext);

  const [openDropdowns, setOpenDropdowns] = useState({ settings: true });
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarVisible(!isSidebarVisible);
  const toggleDropdown = (key) => setOpenDropdowns(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleMenuClick = (menu) => {
    setIsMobileMenuOpen(false);
    if (menu.type === 'link' || (menu.url && menu.url.startsWith('/') && !menu.url.includes('#'))) {
      navigate(menu.url);
    }
  };

  const defaultMenuItems = [
    { title: 'Beranda', iconKey: 'dashboard', type: 'link', url: '/admin/dashboard', roles: ['ADMIN', 'EDITOR'], group: 'General' },
    { title: 'Kelola Pengguna', iconKey: 'users', type: 'link', url: '/admin/users', roles: ['ADMIN'], group: 'General' },
    { title: 'Berita & Artikel', iconKey: 'news', type: 'link', url: '/admin/berita', roles: ['ADMIN', 'EDITOR'], group: 'General' },
    { title: 'Jurusan & Program', iconKey: 'jurusan', type: 'link', url: '/admin/jurusan', roles: ['ADMIN', 'EDITOR'], group: 'Pages' },
    { title: 'Ekstrakurikuler', iconKey: 'ekskul', type: 'link', url: '/admin/ekstrakurikuler', roles: ['ADMIN', 'EDITOR'], group: 'Pages' },
    { title: 'Tenaga Pengajar', iconKey: 'pengajar', type: 'link', url: '/admin/pengajar', roles: ['ADMIN'], group: 'Pages' },
    { title: 'Karya & Prestasi', iconKey: 'prestasi', type: 'link', url: '/admin/prestasi', roles: ['ADMIN', 'EDITOR'], group: 'Pages' },
    { title: 'Testimoni', iconKey: 'testimoni', type: 'link', url: '/admin/testimoni', roles: ['ADMIN', 'EDITOR'], group: 'Pages' },
    { title: 'Galeri', iconKey: 'galeri', type: 'link', url: '/admin/galeri', roles: ['ADMIN', 'EDITOR'], group: 'Pages' },
    { title: 'FAQ', iconKey: 'faq', type: 'link', url: '/admin/faq', roles: ['ADMIN'], group: 'Other' },
    { title: 'Download', iconKey: 'download', type: 'link', url: '/admin/downloads', roles: ['ADMIN', 'EDITOR'], group: 'Other' },
    { 
      title: 'Pengaturan Website', 
      iconKey: 'settings', 
      type: 'dropdown', 
      url: '/admin/settings', 
      roles: ['ADMIN'],
      group: 'Other',
      subItems: [
        { title: 'Profile & Identitas', url: '/admin/settings/profile' },
        { title: 'Tema & Tampilan', url: '/admin/settings/appearance' },
        { title: 'Kontak & Maps', url: '/admin/settings/contact' }
      ]
    }
  ];

  const [dynamicNavs, setDynamicNavs] = useState([]);
  
  useEffect(() => {
    fetch('http://localhost:5002/api/menu-items')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.data && resData.data.length > 0) {
          const routeMap = {
            'Beranda': '/admin/dashboard',
            'Dashboard': '/admin/dashboard',
            'Berita & Artikel': '/admin/berita',
            'Jurusan & Program': '/admin/jurusan',
            'Ekstrakurikuler': '/admin/ekstrakurikuler',
            'Tenaga Pengajar': '/admin/pengajar',
            'Karya & Prestasi': '/admin/prestasi',
            'Testimoni': '/admin/testimoni',
            'Galeri': '/admin/galeri',
            'FAQ': '/admin/faq',
            'Kelola Pengguna': '/admin/users',
            'Download': '/admin/downloads'
          };


          const filteredData = resData.data.filter(m => {
            const titleLower = m.title.toLowerCase();
            if (titleLower.includes('profil') || titleLower.includes('kontak')) {
              return false;
            }
            return true;
          });

          const mapped = filteredData.map(m => {
            let formattedUrl = routeMap[m.title] || m.url || '';
            if (formattedUrl && !formattedUrl.startsWith('/admin') && !formattedUrl.startsWith('#')) {
              formattedUrl = `/admin${formattedUrl.startsWith('/') ? formattedUrl : '/' + formattedUrl}`;
            }

            let groupName = 'General';
            const pageMenus = ['Jurusan & Program', 'Ekstrakurikuler', 'Tenaga Pengajar', 'Karya & Prestasi', 'Testimoni', 'Galeri'];
            const otherMenus = ['Pengaturan Website', 'FAQ', 'Download'];
            
            if (pageMenus.includes(m.title)) groupName = 'Pages';
            else if (otherMenus.includes(m.title) || m.icon === 'settings') groupName = 'Other';

            return {
              title: m.title, 
              iconKey: m.icon || 'dashboard', 
              type: m.title === 'Pengaturan Website' ? 'dropdown' : 'link', 
              url: formattedUrl,
              roles: ['ADMIN', 'EDITOR', 'VIEWER'], 
              group: groupName,
              subItems: m.title === 'Pengaturan Website' ? [
                { title: 'Profile & Identitas', url: '/admin/settings/profile' },
                { title: 'Tema & Tampilan', url: '/admin/settings/appearance' },
                { title: 'Kontak & Maps', url: '/admin/settings/contact' }
              ] : []
            };
          });
          
          const hasBeranda = mapped.find(m => m.url === '/admin/dashboard');
          if (!hasBeranda) {
            mapped.unshift({ title: 'Beranda', iconKey: 'dashboard', type: 'link', url: '/admin/dashboard', roles: ['ADMIN', 'EDITOR'], group: 'General' });
          }

          setDynamicNavs(mapped);
        }
      })
      .catch(() => setDynamicNavs([]));
  }, [userData.role]);

  const activeMenuList = dynamicNavs.length > 0 ? dynamicNavs : defaultMenuItems;
  const allowedMenus = activeMenuList.filter(item => item.roles ? item.roles.map(r => r.toUpperCase()).includes(userData.role) : true);

  // Ambil email dari prop userData, atau fallback ke localStorage jika nilainya '-' atau kosong

const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
const rawName = userData?.name || savedUser?.name || savedUser?.username || 'user';
const cleanedName = rawName.toLowerCase().replace(/\s+/g, '');

const userEmail = (userData?.email && userData.email !== '-' && userData.email !== '')
  ? userData.email
  : (savedUser?.email || localStorage.getItem('email') || `${cleanedName}@gmail.com`);
  

return (
  <div 
    className={`dashboard-sidebar ${isMobileMenuOpen ? 'open' : ''} ${!isSidebarVisible ? 'collapsed' : ''}`}
    style={{ fontFamily: 'var(--theme-font, sans-serif)' }}
  >
      {/* HEADER SIDEBAR (STYLE SHADCN UI MODERN) */}
      <div className="sidebar-header">
        <div className="sidebar-brand-wrapper">
          <div className="sidebar-logo-box">
            <img 
              src={settings.school_logo || logoSekolah} 
              alt="Logo" 
              className="sidebar-logo-img"
              onError={(e) => { e.target.style.display = 'none'; }} 
            />
          </div>
          <div className="sidebar-brand-text">
            <h2 className="sidebar-brand-title">
              SMKN COMPRENG
            </h2>
            <span className="sidebar-brand-subtitle">
              The High School
            </span>
          </div>
        </div>


        <button 
          onClick={toggleSidebar} 
          title="Tutup Sidebar" 
          className="sidebar-close-btn"
        >
          <X size={16} />
        </button>
      </div>

      {/* MENU SIDEBAR */}
      <div className="sidebar-menu" style={{ flex: 1, overflowY: 'auto', padding: '16px 12px', scrollbarWidth: 'none' }}>
        {['General', 'Pages', 'Other'].map(group => {
          const groupItems = allowedMenus.filter(m => (m.group || 'General') === group);
          if (groupItems.length === 0) return null;
          return (
            <div key={group} style={{ marginBottom: '24px' }}>
              <div style={{ padding: '0 12px', marginBottom: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--compreng-text-muted)', textTransform: 'capitalize' }}>
                {group}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {groupItems.map((menu, index) => {
                  const hasSubItems = menu.type === 'dropdown' && menu.subItems && menu.subItems.length > 0;
                  const isDropdownOpen = openDropdowns[menu.iconKey];
                  
                  let isActive = false;
                  if (menu.url === '/admin/dashboard' && (location.pathname === '/admin/dashboard' || location.pathname === '/admin' || location.pathname === '/admin/')) {
                    isActive = true;
                  } else if (menu.url !== '/admin/dashboard' && location.pathname.startsWith(menu.url)) {
                    isActive = true;
                  }

                  return (
                    <li key={index} style={{ display: 'flex', flexDirection: 'column', marginBottom: '4px' }}>
                      <button 
                        onClick={() => hasSubItems ? toggleDropdown(menu.iconKey) : handleMenuClick(menu)}
                        className={`sidebar-link ${isActive && !hasSubItems ? 'active' : ''}`}
                        style={{ 
                          border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 12px', borderRadius: '6px', transition: 'all 0.2s',
                          background: isActive && !hasSubItems ? 'var(--compreng-surface-soft)' : 'transparent',
                          color: isActive && !hasSubItems ? 'var(--compreng-text)' : 'var(--compreng-text-secondary)',
                          fontWeight: isActive ? '600' : '500'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ color: isActive && !hasSubItems ? 'var(--compreng-text)' : 'var(--compreng-text-secondary)' }}>
                            {ICON_MAP[menu.iconKey] || <LayoutDashboard size={16} />}
                          </span>
                          <span style={{ fontSize: '13.5px' }}>{menu.title}</span>
                        </div>
                        {hasSubItems && <ChevronDown size={14} style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', color: 'var(--compreng-text-muted)' }} />}
                      </button>

                      {hasSubItems && isDropdownOpen && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px', marginLeft: '26px', borderLeft: '1px solid var(--compreng-border)', paddingLeft: '12px' }}>
                          {menu.subItems.map((sub, sIdx) => {
                            const isSubActive = location.pathname === sub.url || location.pathname.startsWith(sub.url);
                            return (
                              <NavLink
                                key={sIdx}
                                to={sub.url}
                                style={{
                                  padding: '8px 12px', fontSize: '13px', borderRadius: '6px', textDecoration: 'none', display: 'block', transition: 'all 0.2s',
                                  color: isSubActive ? 'var(--compreng-text)' : 'var(--compreng-text-muted)',
                                  background: isSubActive ? 'var(--compreng-surface-soft)' : 'transparent',
                                  fontWeight: isSubActive ? '600' : '500'
                                }}
                              >
                                {sub.title}
                              </NavLink>
                            );
                          })}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {/* FOOTER SIDEBAR */}
      <div className="sidebar-footer" style={{ borderTop: '1px solid var(--compreng-border)', padding: '16px', position: 'relative' }}>
        {isUserMenuOpen && (
          <>
            <div onClick={() => setIsUserMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }}></div>
            <div style={{ position: 'absolute', bottom: 'calc(100% + 10px)', left: '16px', right: '16px', background: 'var(--compreng-surface)', border: '1px solid var(--compreng-border)', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden', zIndex: 50 }}>
              <div style={{ padding: '12px', borderBottom: '1px solid var(--compreng-border)' }}>
                 <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--compreng-text)' }}>{userData?.name}</div>
                 <div style={{ fontSize: '12px', color: 'var(--compreng-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</div>
              </div>
              <div style={{ padding: '4px' }}>
                <button onClick={() => { setIsUserMenuOpen(false); navigate('/admin/users'); }} style={{ width: '100%', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'transparent', color: 'var(--compreng-text-secondary)', fontSize: '13px', cursor: 'pointer', borderRadius: '4px', transition: 'background 0.2s' }} onMouseOver={(e)=>e.currentTarget.style.background='var(--compreng-surface-soft)'} onMouseOut={(e)=>e.currentTarget.style.background='transparent'}>
                   <Users size={14} /> Kelola Pengguna
                </button>
              </div>
              <div style={{ padding: '4px', borderTop: '1px solid var(--compreng-border)' }}>
                <button onClick={handleLogout} style={{ width: '100%', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'transparent', color: '#dc2626', fontSize: '13px', cursor: 'pointer', borderRadius: '4px', fontWeight: '500', transition: 'background 0.2s' }} onMouseOver={(e)=>e.currentTarget.style.background='#fef2f2'} onMouseOut={(e)=>e.currentTarget.style.background='transparent'}>
                   <LogOut size={14} /> Sign out
                </button>
              </div>
            </div>
          </>
        )}

        <button 
          onClick={toggleUserMenu}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '8px', border: 'none', background: isUserMenuOpen ? 'var(--compreng-surface-soft)' : 'transparent', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s', textAlign: 'left' }}
          onMouseOver={(e)=> { if(!isUserMenuOpen) e.currentTarget.style.background='var(--compreng-surface-soft)' }}
          onMouseOut={(e)=> { if(!isUserMenuOpen) e.currentTarget.style.background='transparent' }}
        >
          <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: 'var(--compreng-text)', color: 'var(--compreng-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', flexShrink: 0 }}>
            {userData?.initial}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--compreng-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {userData?.name}
            </div>
           <div style={{ fontSize: '11px', color: 'var(--compreng-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
  {userEmail}
</div>
          </div>
          <div style={{ color: 'var(--compreng-text-muted)' }}>
             <ChevronsUpDown size={16} />
          </div>
        </button>
      </div>

    </div>
  );
}