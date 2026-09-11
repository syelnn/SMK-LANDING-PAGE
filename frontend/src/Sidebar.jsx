import React, { useState, useEffect, useContext } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { SettingsContext } from './context/SettingsContext';
import { 
  Users, School, Newspaper, BookOpen, Activity, 
  GraduationCap, Trophy, MessageSquare, HelpCircle, 
  Image as ImageIcon, MapPin, LayoutDashboard, Settings,
  X, ChevronDown, ChevronRight, Download, LogOut, ChevronsUpDown 
} from 'lucide-react';
import logoSekolah from './assets/logo1.png';
import './css/sidebar.css'; // MENGIMPOR CSS SIDEBAR BARU

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

// Pengaturan hak akses per nama menu
const MENU_ROLES = {
  'Beranda': ['ADMIN', 'EDITOR', 'VIEWER'],
  'Dashboard': ['ADMIN', 'EDITOR', 'VIEWER'],
  'Kelola Pengguna': ['ADMIN'],
  'Berita & Artikel': ['ADMIN', 'EDITOR'],
  'Jurusan & Program': ['ADMIN', 'EDITOR'],
  'Ekstrakurikuler': ['ADMIN', 'EDITOR'],
  'Tenaga Pengajar': ['ADMIN'],
  'Karya & Prestasi': ['ADMIN', 'EDITOR'],
  'Testimoni': ['ADMIN', 'EDITOR'],
  'Galeri': ['ADMIN', 'EDITOR'],
  'FAQ': ['ADMIN'],
  'Download': ['ADMIN', 'EDITOR'],
  'Pengaturan Website': ['ADMIN']
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
    { title: 'Beranda', iconKey: 'dashboard', type: 'link', url: '/admin/dashboard', roles: ['ADMIN', 'EDITOR', 'VIEWER'], group: 'General' },
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

            // Menentukan hak akses secara dinamis berdasarkan objek MENU_ROLES atau m.roles dari backend
            const itemRoles = m.roles || MENU_ROLES[m.title] || ['ADMIN'];

            return {
              title: m.title, 
              iconKey: m.icon || 'dashboard', 
              type: m.title === 'Pengaturan Website' ? 'dropdown' : 'link', 
              url: formattedUrl,
              roles: itemRoles, 
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
            mapped.unshift({ title: 'Beranda', iconKey: 'dashboard', type: 'link', url: '/admin/dashboard', roles: ['ADMIN', 'EDITOR', 'VIEWER'], group: 'General' });
          }

          setDynamicNavs(mapped);
        }
      })
      .catch(() => setDynamicNavs([]));
  }, [userData?.role]);

  const activeMenuList = dynamicNavs.length > 0 ? dynamicNavs : defaultMenuItems;
  const userRole = (userData?.role || 'VIEWER').toUpperCase();
  const allowedMenus = activeMenuList.filter(item => item.roles ? item.roles.map(r => r.toUpperCase()).includes(userRole) : true);

  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const rawName = userData?.name || savedUser?.name || savedUser?.username || 'user';
  const cleanedName = rawName.toLowerCase().replace(/\s+/g, '');

  const userEmail = (userData?.email && userData.email !== '-' && userData.email !== '')
    ? userData.email
    : (savedUser?.email || localStorage.getItem('email') || `${cleanedName}@gmail.com`);
    
  return (
    <div className={`dashboard-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''} ${!isSidebarVisible ? 'sidebar-mini' : ''}`}>
      
      {/* HEADER SIDEBAR */}
      <div className="sidebar-header">
        <div className="sidebar-brand-wrapper">
          <img 
            src={settings.school_logo || logoSekolah} 
            alt="Logo" 
            className="sidebar-logo-img"
            onError={(e) => { e.target.style.display = 'none'; }} 
          />
          <div className="sidebar-brand-text">
            <h2 className="sidebar-brand-title">SMKN COMPRENG</h2>
            <span className="sidebar-brand-subtitle">The High School</span>
          </div>
        </div>

        {/* Hanya tampil jika versi Mobile */}
        <button onClick={() => setIsMobileMenuOpen(false)} title="Tutup Sidebar" className="sidebar-mobile-close">
          <X size={16} />
        </button>
      </div>

      {/* MENU SIDEBAR */}
      <div className="sidebar-menu">
        {['General', 'Pages', 'Other'].map(group => {
          const groupItems = allowedMenus.filter(m => (m.group || 'General') === group);
          if (groupItems.length === 0) return null;
          return (
            <div key={group} style={{ marginBottom: '24px' }}>
              <div className="sidebar-group-label">{group}</div>
              <ul className="sidebar-nav-list">
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
                      >
                        <div className="sidebar-link-inner">
                          <span className="sidebar-link-icon">{ICON_MAP[menu.iconKey] || <LayoutDashboard size={16} />}</span>
                          <span className="sidebar-link-text">{menu.title}</span>
                        </div>
                        {hasSubItems && (
                          isDropdownOpen 
                            ? <ChevronDown size={16} className="sidebar-dropdown-icon" /> 
                            : <ChevronRight size={16} className="sidebar-dropdown-icon" />
                        )}
                      </button>

                      {hasSubItems && isDropdownOpen && (
                        <div className="sidebar-sub-menu">
                          {menu.subItems.map((sub, sIdx) => {
                            const isSubActive = location.pathname === sub.url || location.pathname.startsWith(sub.url);
                            return (
                              <NavLink key={sIdx} to={sub.url} className={`sidebar-sub-link ${isSubActive ? 'active' : ''}`}>
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

      {/* FOOTER SIDEBAR (PROFIL USER) */}
      <div className="sidebar-footer">
        
        {/* POPUP LOGOUT */}
        {isUserMenuOpen && (
          <>
            <div onClick={() => setIsUserMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }}></div>
            <div className="sidebar-user-popup">
              <div className="sidebar-user-popup-header">
                 <div className="sidebar-user-name">{userData?.name}</div>
                 <div className="sidebar-user-email">{userEmail}</div>
              </div>
              {userRole === 'ADMIN' && (
                <div style={{ padding: '4px' }}>
                  <button onClick={() => { setIsUserMenuOpen(false); navigate('/admin/users'); }} className="sidebar-popup-action">
                     <Users size={14} /> Kelola Pengguna
                  </button>
                </div>
              )}
              <div style={{ padding: '4px', borderTop: '1px solid var(--compreng-border)' }}>
                <button onClick={handleLogout} className="sidebar-popup-action danger">
                   <LogOut size={14} /> Log out
                </button>
              </div>
            </div>
          </>
        )}

        {/* TOMBOL USER DI BAWAH SIDEBAR */}
        <button 
          onClick={toggleUserMenu}
          className={`sidebar-user-btn ${isUserMenuOpen ? 'active' : ''}`}
        >
          <div className="sidebar-user-avatar">
            {userData?.initial}
          </div>
          <div className="sidebar-user-text">
            <div className="sidebar-user-name">{userData?.name}</div>
            <div className="sidebar-user-email">{userEmail}</div>
          </div>
          <ChevronsUpDown size={16} className="sidebar-user-chevron" />
        </button>
      </div>

    </div>
  );
}