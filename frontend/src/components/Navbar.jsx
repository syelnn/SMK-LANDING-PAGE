import React, { useState, useEffect, useRef, useMemo, useCallback, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import logoSekolah from '../assets/logo1.png'; 
import '../css/viewer/navbar.css'; 
import { getSession, clearSession, verifySession } from '../utils/auth';
import { SettingsContext } from '../context/SettingsContext';

const Navbar = () => {
  const { settings } = useContext(SettingsContext) || {};
  const [menuItems, setMenuItems] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // State untuk Data User (Viewer yang sedang login)
  const [user, setUser] = useState(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);
  const profileRef = useRef(null);
  const isScrolledRef = useRef(false);
  const isManualScrolling = useRef(false);

  // Inisialisasi hook router
  const navigate = useNavigate();
  const location = useLocation();

  // Inisialisasi state & ref path
  const activePathRef = useRef(location.pathname);
  const [activePath, setActivePath] = useState(location.pathname);

  
  const syncUserSession = useCallback(() => {
    const session = getSession();

    if (session) {
      setUser({
        username: session.username || session.name || 'Viewer',
        email: session.email || 'Email tidak tersedia',
        role: session.role || 'viewer',
        avatar: session.avatar || ''
      });
    } else {
      if (localStorage.getItem('token')) clearSession(); // token ada tapi rusak/kedaluwarsa -> bersihkan
      setUser(null);
    }
  }, []);

  useEffect(() => {
    syncUserSession();

    // Segarkan data profil (foto, nama) dari server supaya navbar tidak menampilkan data lama.
    // verifySession memperbarui localStorage & memicu event 'auth:profile-updated' bila ada perubahan.
    if (getSession()) {
      verifySession().then((r) => {
        if (r.ok) syncUserSession();
        else if (r.reason === 'INVALID') { clearSession(); syncUserSession(); }
      });
    }
  }, [location.pathname, syncUserSession]);

  // token invalid) supaya Navbar langsung update tanpa perlu pindah halaman/refresh dulu.
  useEffect(() => {
    window.addEventListener('auth:expired', syncUserSession);
    window.addEventListener('auth:profile-updated', syncUserSession);
    window.addEventListener('storage', syncUserSession); // sinkron antar-tab juga
    return () => {
      window.removeEventListener('auth:expired', syncUserSession);
      window.removeEventListener('auth:profile-updated', syncUserSession);
      window.removeEventListener('storage', syncUserSession);
    };
  }, [syncUserSession]);

  useEffect(() => {
    setActivePath(location.pathname);
    activePathRef.current = location.pathname;
  }, [location.pathname]);

  const getCleanUrl = useCallback((item) => {
    let rawUrl = (item.url || item.href || '/').trim();
    if (rawUrl === '/dashboard') return '/';
    if (!rawUrl.startsWith('/') && !rawUrl.startsWith('http') && !rawUrl.startsWith('#')) {
      rawUrl = '/' + rawUrl;
    }
    return rawUrl;
  }, []);

  useEffect(() => {
    if (!sessionStorage.getItem('scrollToSection')) return;
    isManualScrolling.current = true;
    setTimeout(() => {
      isManualScrolling.current = false;
      window.dispatchEvent(new Event('scroll'));
    }, 2200);
  }, []);

  // 1. Fetching Menu dari Database
  useEffect(() => {
    let isMounted = true;
    
    const cachedMenu = sessionStorage.getItem('app_menu_items');
    if (cachedMenu) {
      try { setMenuItems(JSON.parse(cachedMenu)); } catch (e) {}
    }

    const fetchMenus = async () => {
      try {
        const response = await fetch('http://localhost:5002/api/menu-items');
        const result = await response.json();
        
        if (!isMounted) return;
        const rawList = Array.isArray(result) ? result : (result.data || []);
        
        const publicMenus = rawList.filter(item => {
          const isPublic = item.isPublic ?? item.is_public ?? false;
          const isActive = item.status === 1 || item.status === 'ACTIVE' || item.status === true || item.status === undefined;
          return isPublic && isActive;
        });

        sessionStorage.setItem('app_menu_items', JSON.stringify(publicMenus));
        setMenuItems(publicMenus);
      } catch (error) {
        console.error('Gagal mengambil data menu:', error);
      }
    };

    fetchMenus();
    return () => { isMounted = false; };
  }, []);

  // 2. Optimized Scroll Event & Click Outside Listener
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrolled = window.scrollY > 20;
          if (scrolled !== isScrolledRef.current) {
            isScrolledRef.current = scrolled;
            setIsScrolled(scrolled);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(null);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 3. Filter Menu Utama & Submenu (Hanya dideklarasikan sekali di sini)
  const mainMenus = useMemo(() => {
    return menuItems.filter(item => !item.parentId && !item.parent_id);
  }, [menuItems]);

  const getSubMenus = useCallback((parentId) => {
    return menuItems.filter(item => item.parentId === parentId || item.parent_id === parentId);
  }, [menuItems]);

  // 4. SCROLL SPY PERBAIKAN URL AKURAT
  useEffect(() => {
    const validLandingPaths = [
      '', '/', '/profil', '/berita', '/program', '/jurusan', 
      '/ekstrakurikuler', '/ekskul', '/tenagapengajar', '/guru', 
      '/pengajar', '/karya', '/prestasi', '/achievement', '/galeri', '/testimoni', '/faq', '/mitra-industri', '/mitraindustri', '/kontak'
    ];
    if (!validLandingPaths.includes(location.pathname)) return;

    let ticking = false;

    const handleScrollSpy = () => {
      if (isManualScrolling.current) return;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollPos = window.scrollY + 250;

          const heroEl = document.getElementById('section-hero');
          const profilEl = document.getElementById('section-profil');
          const beritaEl = document.getElementById('section-berita');
          const programEl = document.getElementById('section-program');
          const ekskulEl = document.getElementById('section-ekskul');
          const pengajarEl = document.getElementById('section-pengajar');
          const prestasiEl = document.getElementById('section-prestasi'); 
          const galeriEl = document.getElementById('section-galeri');
          const testimoniEl = document.getElementById('section-testimoni');
          const faqEl = document.getElementById('section-faq');
          const mitraEl = document.getElementById('section-mitra-industri');
          const kontakEl = document.getElementById('section-kontak');

          let activeKey = 'section-hero';

          if (heroEl && scrollPos >= heroEl.offsetTop) activeKey = 'section-hero';
          if (profilEl && scrollPos >= profilEl.offsetTop) activeKey = 'section-profil';
          if (beritaEl && scrollPos >= beritaEl.offsetTop) activeKey = 'section-berita';
          if (programEl && scrollPos >= programEl.offsetTop) activeKey = 'section-program';
          if (ekskulEl && scrollPos >= ekskulEl.offsetTop) activeKey = 'section-ekskul';
          if (pengajarEl && scrollPos >= pengajarEl.offsetTop) activeKey = 'section-pengajar';
          if (prestasiEl && scrollPos >= prestasiEl.offsetTop) activeKey = 'section-prestasi'; 
          if (galeriEl && scrollPos >= galeriEl.offsetTop) activeKey = 'section-galeri';
          if (testimoniEl && scrollPos >= testimoniEl.offsetTop) activeKey = 'section-testimoni';
          if (faqEl && scrollPos >= faqEl.offsetTop) activeKey = 'section-faq';
          if (mitraEl && scrollPos >= mitraEl.offsetTop) activeKey = 'section-mitra-industri';
          if (kontakEl && scrollPos >= kontakEl.offsetTop) activeKey = 'section-kontak';

          const isBottom = Math.ceil(window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 150;
          if (isBottom) {
            if (kontakEl) activeKey = 'section-kontak';
            else if (faqEl) activeKey = 'section-faq'; 
            else if (testimoniEl) activeKey = 'section-testimoni';
            else if (galeriEl) activeKey = 'section-galeri';
            else if (prestasiEl) activeKey = 'section-prestasi'; 
            else if (pengajarEl) activeKey = 'section-pengajar';
            else if (ekskulEl) activeKey = 'section-ekskul';
          }

          const matchedMenu = menuItems.find(item => {
            const key = item.sectionKey || item.section_key;
            return key === activeKey;
          });

          if (matchedMenu) {
            const cleanUrl = getCleanUrl(matchedMenu);
            if (activePathRef.current !== cleanUrl) {
              activePathRef.current = cleanUrl;
              setActivePath(cleanUrl);
              window.history.replaceState(null, '', cleanUrl);
            }
          } else if (activeKey === 'section-ekskul') {
            const targetUrl = '/ekstrakurikuler';
            if (activePathRef.current !== targetUrl) {
              activePathRef.current = targetUrl;
              setActivePath(targetUrl);
              window.history.replaceState(null, '', targetUrl);
            }
          } else if (activeKey === 'section-pengajar') {
            const targetUrl = '/tenagapengajar';
            if (activePathRef.current !== targetUrl) {
              activePathRef.current = targetUrl;
              setActivePath(targetUrl);
              window.history.replaceState(null, '', targetUrl);
            }
          } else if (activeKey === 'section-prestasi') {
            const targetUrl = '/prestasi';
            if (activePathRef.current !== targetUrl) {
              activePathRef.current = targetUrl;
              setActivePath(targetUrl);
              window.history.replaceState(null, '', targetUrl);
            }
          } else if (activeKey === 'section-testimoni') {
            const targetUrl = '/testimoni';
            if (activePathRef.current !== targetUrl) {
              activePathRef.current = targetUrl;
              setActivePath(targetUrl);
              window.history.replaceState(null, '', targetUrl);
            }
          } else if (activeKey === 'section-faq') {
            const targetUrl = '/faq';
            if (activePathRef.current !== targetUrl) {
              activePathRef.current = targetUrl;
              setActivePath(targetUrl);
              window.history.replaceState(null, '', targetUrl);
            }
          }  else if (activeKey === 'section-mitra-industri') {
            const targetUrl = '/mitra-industri';
            if (activePathRef.current !== targetUrl) {
              activePathRef.current = targetUrl;
              setActivePath(targetUrl);
              window.history.replaceState(null, '', targetUrl);
            }
          }
        

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScrollSpy, { passive: true });
    return () => window.removeEventListener('scroll', handleScrollSpy);
  }, [menuItems, getCleanUrl, location.pathname]);

  // 5. Automatic IntersectionObserver
  useEffect(() => {
    if (menuItems.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -50% 0px',
      threshold: 0.1
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          const matchedMenu = menuItems.find(
            item => (item.sectionKey === sectionId || item.section_key === sectionId)
          );

          if (matchedMenu) {
            const targetUrl = getCleanUrl(matchedMenu);
            if (window.location.pathname !== targetUrl) {
              window.history.replaceState(null, '', targetUrl);
            }
            setActivePath(targetUrl);
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    menuItems.forEach((item) => {
      const key = item.sectionKey || item.section_key;
      if (key) {
        const el = document.getElementById(key);
        if (el) observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, [menuItems, getCleanUrl]);

  // 6. Handle Nav Klik
  const handleNavClick = (item) => {
    setMobileMenuOpen(false);
    setDropdownOpen(null);

    const targetUrl = getCleanUrl(item);
    const itemTitle = (item.title || '').toLowerCase().trim();

    if (targetUrl === '/download' || targetUrl.includes('download') || itemTitle.includes('download')) {
      navigate('/download');
      return;
    }
    
    const sectionMap = {
      '/profil': 'section-profil',
      '/berita': 'section-berita',
      '/program': 'section-program',
      '/jurusan': 'section-program',
      '/ekstrakurikuler': 'section-ekskul',
      '/ekskul': 'section-ekskul',
      '/tenagapengajar': 'section-pengajar',
      '/guru': 'section-pengajar', 
      '/pengajar': 'section-pengajar',
      '/karya': 'section-prestasi',      
      '/prestasi': 'section-prestasi',  
      '/achievement': 'section-prestasi',
      '/galeri': 'section-galeri',
      '/testimoni': 'section-testimoni',
      '/faq': 'section-faq',
   '/mitra-industri': 'section-mitra-industri',
      '/mitraindustri': 'section-mitra-industri',
      '/kontak': 'section-kontak',
      '/': 'section-hero'
    };

    const sectionKey = sectionMap[targetUrl];
    const onLanding = !!document.getElementById('section-hero');

    if (!onLanding) {
      if (sectionKey) {
        sessionStorage.setItem('scrollToSection', sectionKey);
        navigate('/');
      } else {
        navigate(targetUrl);
      }
      return;
    }

    if (sectionKey) {
      const element = document.getElementById(sectionKey);
      if (element) {
        isManualScrolling.current = true;
        activePathRef.current = targetUrl;
        setActivePath(targetUrl);
        window.history.replaceState(null, '', targetUrl);

        element.scrollIntoView({ behavior: 'smooth' });

        setTimeout(() => {
          isManualScrolling.current = false;
        }, 800);
      } else {
        navigate(targetUrl);
      }
    } else {
      navigate(targetUrl);
    }
  };

  const handleDropdownToggle = (menuId, e) => {
    e.stopPropagation();
    setDropdownOpen(prev => (prev === menuId ? null : menuId));
  };

  const checkIsActive = (menu) => {
    const menuTitle = menu.title ? menu.title.toLowerCase().trim() : '';
    const menuUrl = getCleanUrl(menu);

    if (location.pathname === '/download' && (menuUrl.includes('download') || menuTitle.includes('download'))) {
      return true;
    }
    
    const isDropdownArea = [
      '/ekstrakurikuler', '/ekskul', '/tenagapengajar', 
      '/guru', '/karya', '/prestasi', '/achievement', '/mitra-industri', '/mitraindustri'
    ].includes(activePath);
    
    if (isDropdownArea) {
      if (menuTitle.includes('jurusan') || menuTitle.includes('program') || menuTitle.includes('berita')) {
        return false;
      }
    }

    if (location.pathname.includes('/detail-kurikulum')) {
      return menuTitle.includes('jurusan') || menuTitle.includes('program') || menuUrl.includes('jurusan');
    }

    if (location.pathname.startsWith('/berita')) {
      return menuTitle.includes('berita') || menuUrl.includes('berita');
    }

    return activePath === menuUrl;
  };

  // Fungsi Logout khusus Viewer
  const handleLogout = () => {
    clearSession();
    setUser(null);
    setProfileDropdownOpen(false);
    navigate('/');
  };

  return (
    <nav className={`viewer-navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Logo Sekolah */}
        <div 
          className="navbar-logo" 
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}
        >
          <img 
            src={settings?.school_logo || logoSekolah} 
            alt="Logo Sekolah" 
            className="logo-img" 
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div className="brand-text">
            <span className="brand-title">{settings?.school_name || 'SMKN Compreng'}</span>
            <span className="brand-subtitle">{settings?.site_tagline || 'The School of SESCO Model'}</span>
          </div>
        </div>

        {/* Toggle Mobile */}
        <button 
          className="mobile-toggle" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          ☰
        </button>

        {/* List Navigasi */}
        <ul className={`navbar-menu ${mobileMenuOpen ? 'active' : ''}`}>
          {mainMenus.map((menu) => {
            const subMenus = getSubMenus(menu.id);
            const hasChildren = subMenus.length > 0 || menu.type === 'dropdown';
            if (hasChildren) {
              const isDropdownOpenState = dropdownOpen === menu.id;
              const isAnyChildActive = subMenus.some(sub => checkIsActive(sub));

              return (
                <li key={menu.id} ref={dropdownRef} className="nav-item dropdown">
                  <button 
                    className={`dropdown-btn ${isAnyChildActive ? 'active' : ''} ${isDropdownOpenState ? 'active-pill' : ''}`}
                    onClick={(e) => handleDropdownToggle(menu.id, e)}
                  >
                    {menu.title}
                    <span className="nav-dot" aria-hidden="true"></span>
                    <span className="arrow" aria-hidden="true">▾</span>
                  </button>
                  <ul className={`dropdown-menu ${isDropdownOpenState ? 'show' : ''}`}>
                    {subMenus.map((sub) => {
                      return (
                        <li key={sub.id} onClick={() => handleNavClick(sub)}>
                          <span className="dropdown-link">
                            {sub.title}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            }

            const isActive = checkIsActive(menu);

            return (
              <li key={menu.id} className="nav-item" onClick={() => handleNavClick(menu)}>
                <span
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {menu.title}
                  <span className="nav-dot" aria-hidden="true"></span>
                </span>
              </li>
            );
          })}

          {/* ===== Pengkondisian Tombol Login / Profil Viewer ===== */}
          <li className={user ? 'nv-user' : 'nav-item btn-login-wrapper'} ref={profileRef}>
            {user ? (
              <>
                <button
                  type="button"
                  className="nv-user__trigger"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  aria-haspopup="true"
                  aria-expanded={profileDropdownOpen}
                >
                  <span className="nv-user__text">
                    <span className="nv-user__name">{user.username || 'Viewer'}</span>
                    <span className="nv-user__email">{user.email}</span>
                  </span>
                  <span className="nv-user__avatar-wrap">
                    <span className="nv-user__avatar">
                      {(user.username || 'V').charAt(0).toUpperCase()}
                      {user.avatar && (
                        <img
                          src={user.avatar}
                          alt={user.username || 'Profil'}
                          className="nv-user__photo"
                          referrerPolicy="no-referrer"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      )}
                    </span>
                    <span className="nv-user__dot" aria-hidden="true"></span>
                  </span>
                </button>

                {profileDropdownOpen && (
                  <div className="nv-user__menu" role="menu">
                    <div className="nv-user__menu-head">
                      <span className="nv-user__menu-avatar">
                        {(user.username || 'V').charAt(0).toUpperCase()}
                        {user.avatar && (
                          <img
                            src={user.avatar}
                            alt={user.username || 'Profil'}
                            className="nv-user__photo"
                            referrerPolicy="no-referrer"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        )}
                      </span>
                      <span className="nv-user__menu-info">
                        <p className="nv-user__menu-name">{user.username || 'Viewer'}</p>
                        <p className="nv-user__menu-email">{user.email}</p>
                      </span>
                    </div>
                    <div className="nv-user__divider"></div>

                    {/* Menu khusus Admin & Editor -> dashboard admin */}
                    {(user.role === 'admin' || user.role === 'editor') && (
                      <button
                        type="button"
                        className="nv-user__admin-link"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          navigate('/admin/dashboard');
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="7" height="7"></rect>
                          <rect x="14" y="3" width="7" height="7"></rect>
                          <rect x="14" y="14" width="7" height="7"></rect>
                          <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                        {user.role === 'admin' ? 'Ke Halaman Admin' : 'Ke Halaman Editor'}
                      </button>
                    )}

                    <button type="button" className="nv-user__logout" onClick={handleLogout}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link to="/login" className="btn-cms-login">
                Login
              </Link>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;