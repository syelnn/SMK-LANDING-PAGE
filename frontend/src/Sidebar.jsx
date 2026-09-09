import React, { useState, useEffect, useContext } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { SettingsContext } from './context/SettingsContext';
import { 
  Users, School, Newspaper, BookOpen, Activity, 
  GraduationCap, Trophy, MessageSquare, HelpCircle, 
  Image as ImageIcon, MapPin, LogOut, LayoutDashboard, Settings,
  X, ChevronDown, Download, ChevronsUpDown
} from 'lucide-react';

import logoSekolah from './assets/logo1.png';

const ICON_MAP = {
  dashboard: <LayoutDashboard size={18} />,
  users: <Users size={18} />,
  school: <School size={18} />,
  building: <School size={18} />,
  settings: <Settings size={18} />,
  news: <Newspaper size={18} />,
  newspaper: <Newspaper size={18} />,
  jurusan: <BookOpen size={18} />,
  'book-open': <BookOpen size={18} />,
  ekskul: <Activity size={18} />,
  activity: <Activity size={18} />,
  pengajar: <GraduationCap size={18} />,
  prestasi: <Trophy size={18} />,
  award: <Trophy size={18} />,
  testimoni: <MessageSquare size={18} />,
  'message-square': <MessageSquare size={18} />,
  faq: <HelpCircle size={18} />,
  'help-circle': <HelpCircle size={18} />,
  galeri: <ImageIcon size={18} />,
  image: <ImageIcon size={18} />,
  kontak: <MapPin size={18} />,
  'map-pin': <MapPin size={18} />,
  download: <Download size={18} />
};

const findTargetElement = (targetStr, urlStr) => {
  if (!targetStr && !urlStr) return null;
  const clean = (str) => {
    if (!str) return '';
    return str.replace(/.*#/, '').replace(/^section-/, '').trim();
  };

  const cTarget = clean(targetStr);
  const cUrl = clean(urlStr);

  const aliases = {
    'beranda': 'section-hero', 
    'hero': 'section-hero',
    'program': 'section-jurusan',
    'jurusan': 'section-jurusan',
    'ekstrakurikuler': 'section-ekskul',
    'ekskul': 'section-ekskul',
    'profil': 'section-profil',
    'profile': 'section-profil',
    'profil-sekolah': 'section-profil',
    'profil_sekolah': 'section-profil',
  };

  return (
    document.getElementById(`section-${cTarget}`) ||
    document.getElementById(cTarget) ||
    document.getElementById(aliases[cTarget]) ||
    document.getElementById(`section-${cUrl}`) ||
    document.getElementById(cUrl) ||
    document.getElementById(aliases[cUrl])
  );
};

export default function Sidebar({ 
  isMobileMenuOpen, 
  setIsMobileMenuOpen, 
  isSidebarVisible, 
  setIsSidebarVisible, 
  userData, 
  handleLogout 
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useContext(SettingsContext);

  const [activeSection, setActiveSection] = useState('section-hero');
  const [openDropdowns, setOpenDropdowns] = useState({ settings: true });
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarVisible(!isSidebarVisible);
  const toggleDropdown = (key) => setOpenDropdowns(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);

  const handleMenuClick = (menu) => {
    setIsMobileMenuOpen(false);

    if (menu.type === 'link' || (menu.url && menu.url.startsWith('/') && !menu.url.includes('#'))) {
      navigate(menu.url);
      return;
    }

    if (window.location.pathname !== '/admin') {
      const cleanSection = menu.target ? menu.target.replace(/^section-/, '') : '';
      navigate(`/admin#${cleanSection}`);
      return;
    }

    const targetEl = findTargetElement(menu.target, menu.url);
    const contentElement = document.querySelector('.dashboard-content');

    if (targetEl && contentElement) {
      contentElement.scrollTo({ top: targetEl.offsetTop - 70, behavior: 'smooth' });
      const cleanId = targetEl.id.replace(/^section-/, '');
      window.history.pushState(null, '', `/admin#${cleanId}`);
      setActiveSection(targetEl.id);
    }
  };

  useEffect(() => {
    const contentElement = document.querySelector('.dashboard-content');
    if (!contentElement) return;

    const sectionIds = [
      'section-hero', 'section-profil', 'section-berita', 
      'section-jurusan', 'section-ekskul', 'section-pengajar', 
      'section-prestasi', 'section-testimoni', 'section-galeri', 
      'section-faq', 'section-kontak'
    ];

    const handleScroll = () => {
      if (window.location.pathname !== '/admin' && window.location.pathname !== '/admin/') return;

      const isAtBottom = contentElement.scrollTop + contentElement.clientHeight >= contentElement.scrollHeight - 50;
      if (isAtBottom) {
        setActiveSection('section-kontak');
        return;
      }

      const scrollPosition = contentElement.scrollTop + 120; 
      for (const id of sectionIds) {
        const element = document.getElementById(id);
        if (element) {
          const top = element.offsetTop;
          const height = element.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    contentElement.addEventListener('scroll', handleScroll);
    handleScroll(); 
    return () => contentElement.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  const defaultMenuItems = [
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

          const filteredData = resData.data.filter(item => {
            const titleLower = item.title.toLowerCase();
            const isBeranda = titleLower === 'beranda' || titleLower === 'dashboard';
            const isKontak = titleLower === 'kontak & alamat' || titleLower === 'kontak' || titleLower === 'alamat';
            const isProfil = titleLower === 'profil sekolah' || titleLower === 'profil' || titleLower === 'profile';

            if (userData.role === 'ADMIN' && (isBeranda || isKontak || isProfil)) {
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
              type: 'link', 
              url: formattedUrl,
              roles: ['ADMIN', 'EDITOR', 'VIEWER'], 
              group: groupName
            };
          });

          setDynamicNavs(mapped);
        }
      })
      .catch(() => setDynamicNavs([]));
  }, [userData.role]);

  const activeMenuList = dynamicNavs.length > 0 ? dynamicNavs : defaultMenuItems;
  const allowedMenus = activeMenuList.filter(item => item.roles ? item.roles.map(r => r.toUpperCase()).includes(userData.role) : true);

  return (
    <div className={`dashboard-sidebar ${isMobileMenuOpen ? 'open' : ''} ${!isSidebarVisible ? 'collapsed' : ''}`}>
      <div className="sidebar-header" style={{ padding: '24px 20px', borderBottom: '1px solid var(--compreng-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={settings.school_logo || logoSekolah} alt="Logo" style={{ width: '30px', height: '30px', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
            <h2 style={{ fontSize: '15px', margin: 0, fontWeight: '800', color: 'var(--compreng-text)' }}>
              {settings.school_name || 'SMKN COMPRENG'}
            </h2>
          </div>
          <button className="sidebar-toggle-btn" onClick={toggleSidebar} title="Tutup Sidebar" style={{ color: 'var(--compreng-text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="sidebar-menu" style={{ background: 'var(--compreng-surface)', flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
        {['General', 'Pages', 'Other'].map(group => {
          const groupItems = allowedMenus.filter(m => (m.group || 'General') === group);
          if (groupItems.length === 0) return null;
          return (
            <div key={group} style={{ marginBottom: '16px' }}>
              <div style={{ padding: '0 15px', marginBottom: '8px', fontSize: '11px', fontWeight: '700', color: 'var(--compreng-text-muted)', textTransform: 'capitalize' }}>
                {group}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {groupItems.map((menu, index) => {
                  const hasSubItems = menu.type === 'dropdown' && menu.subItems && menu.subItems.length > 0;
                  const isDropdownOpen = openDropdowns[menu.iconKey];
                  const isPageLink = menu.type === 'link' || menu.type === 'dropdown' || (menu.url && menu.url.startsWith('/') && !menu.url.includes('#'));
                  const isActive = isPageLink ? location.pathname.startsWith(menu.url) : (location.pathname === '/admin' && activeSection === menu.target);

                  return (
                    <li key={index} style={{ display: 'flex', flexDirection: 'column', marginBottom: '2px' }}>
                      <button 
                        onClick={() => hasSubItems ? toggleDropdown(menu.iconKey) : handleMenuClick(menu)}
                        className={`sidebar-link ${isActive && !hasSubItems ? 'active' : ''}`}
                        style={{ 
                          border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 15px', borderRadius: '8px', transition: 'all 0.2s',
                          background: isActive && !hasSubItems ? 'var(--compreng-green-light)' : 'transparent',
                          color: isActive && !hasSubItems ? 'var(--compreng-green)' : 'var(--compreng-text-secondary)',
                          fontWeight: isActive ? '600' : '500'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: isActive && !hasSubItems ? 'var(--compreng-green)' : 'var(--compreng-text-secondary)' }}>
                            {ICON_MAP[menu.iconKey] || <LayoutDashboard size={18} />}
                          </span>
                          <span style={{ fontSize: '13px' }}>{menu.title}</span>
                        </div>
                        {hasSubItems && <ChevronDown size={14} style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', color: 'var(--compreng-text-muted)' }} />}
                      </button>

                      {hasSubItems && isDropdownOpen && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px', marginLeft: '32px', borderLeft: '1px solid var(--compreng-border)', paddingLeft: '12px' }}>
                          {menu.subItems.map((sub, sIdx) => {
                            const isSubActive = location.pathname === sub.url || location.pathname.startsWith(sub.url);
                            return (
                              <NavLink
                                key={sIdx}
                                to={sub.url}
                                style={{
                                  padding: '8px 12px', fontSize: '12px', borderRadius: '6px', textDecoration: 'none', display: 'block', transition: 'all 0.2s',
                                  color: isSubActive ? 'var(--compreng-text)' : 'var(--compreng-text-secondary)',
                                  background: isSubActive ? 'var(--compreng-surface-soft)' : 'transparent',
                                  fontWeight: isSubActive ? '600' : '500'
                                }}>
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

      <div className="sidebar-footer" style={{ background: 'var(--compreng-surface)', borderTop: '1px solid var(--compreng-border)', padding: '12px', position: 'relative' }}>
        {isUserMenuOpen && (
          <div style={{ position: 'absolute', bottom: '12px', left: 'calc(100% + 10px)', width: '220px', background: 'var(--compreng-surface)', border: '1px solid var(--compreng-border)', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', overflow: 'hidden', zIndex: 100 }}>
            <div style={{ padding: '12px', borderBottom: '1px solid var(--compreng-border)' }}>
               <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--compreng-text)' }}>{userData.name}</div>
               <div style={{ fontSize: '11px', color: 'var(--compreng-text-muted)' }}>{userData.email}</div>
            </div>
            <div style={{ padding: '4px' }}>
              <button onClick={() => { setIsUserMenuOpen(false); navigate('/admin/users'); }} style={{ width: '100%', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'transparent', color: 'var(--compreng-text-secondary)', fontSize: '13px', cursor: 'pointer', borderRadius: '4px' }}>
                 <Users size={14} /> Kelola Pengguna
              </button>
            </div>
            <div style={{ padding: '4px', borderTop: '1px solid var(--compreng-border)' }}>
              <button onClick={handleLogout} style={{ width: '100%', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'transparent', color: '#dc2626', fontSize: '13px', cursor: 'pointer', borderRadius: '4px', fontWeight: '600' }}>
                 <LogOut size={14} /> Sign out
              </button>
            </div>
          </div>
        )}

        <button 
          onClick={toggleUserMenu}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px', border: 'none', background: isUserMenuOpen ? 'var(--compreng-surface-soft)' : 'transparent', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s', textAlign: 'left' }}>
        
          <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'var(--compreng-green)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800', flexShrink: 0 }}>
            {userData.initial}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--compreng-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {userData.name}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--compreng-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {userData.email}
            </div>
          </div>
          <div style={{ color: 'var(--compreng-text-muted)' }}>
             <ChevronsUpDown size={14} style={{ color: 'var(--compreng-text-muted)' }} />
          </div>
        </button>
      </div>
    </div>
  );
}