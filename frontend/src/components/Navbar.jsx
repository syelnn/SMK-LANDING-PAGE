import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import logoSekolah from '../assets/logo1.png'; 
import '../css/viewer/navbar.css'; 

const Navbar = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const dropdownRef = useRef(null);
  const isScrolledRef = useRef(false);
  const isManualScrolling = useRef(false);

  // Inisialisasi hook router
  const navigate = useNavigate();
  const location = useLocation();

  // Inisialisasi state & ref
  const activePathRef = useRef(location.pathname);
  const [activePath, setActivePath] = useState(location.pathname);

  useEffect(() => {
    setActivePath(location.pathname);
    activePathRef.current = location.pathname;
  }, [location.pathname]);

  const getCleanUrl = useCallback((item) => {
    let rawUrl = (item.url || item.href || '/').trim();
    if (rawUrl === '/dashboard') return '/';
    return rawUrl;
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

  // 2. Listener Background Navbar (Scroll & Click Outside)
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
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter Menu Utama & Submenu
  const mainMenus = useMemo(() => {
    return menuItems.filter(item => !item.parentId && !item.parent_id);
  }, [menuItems]);

  const getSubMenus = useCallback((parentId) => {
    return menuItems.filter(item => item.parentId === parentId || item.parent_id === parentId);
  }, [menuItems]);

  // 3. SCROLL SPY PERBAIKAN URL AKURAT
  useEffect(() => {
    const validLandingPaths = ['/', '/profil', '/berita', '/program', '/jurusan', '/ekstrakurikuler', '/ekskul', '/kontak'];
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
          const kontakEl = document.getElementById('section-kontak');

          let activeKey = 'section-hero';

          if (heroEl && scrollPos >= heroEl.offsetTop) activeKey = 'section-hero';
          if (profilEl && scrollPos >= profilEl.offsetTop) activeKey = 'section-profil';
          if (beritaEl && scrollPos >= beritaEl.offsetTop) activeKey = 'section-berita';
          if (programEl && scrollPos >= programEl.offsetTop) activeKey = 'section-program';
          if (ekskulEl && scrollPos >= ekskulEl.offsetTop) activeKey = 'section-ekskul';
          if (kontakEl && scrollPos >= kontakEl.offsetTop) activeKey = 'section-kontak';

          // Jika posisi scroll mendekati bagian paling bawah
          const isBottom = Math.ceil(window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 150;
          if (isBottom) {
            if (kontakEl) activeKey = 'section-kontak';
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
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScrollSpy, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScrollSpy);
    };
  }, [menuItems, getCleanUrl, location.pathname]);

  // 4. Handle Nav Klik (Smooth Scroll)
  const handleNavClick = (item) => {
    setMobileMenuOpen(false);
    setDropdownOpen(null);

    const targetUrl = getCleanUrl(item);

    const sectionMap = {
      '/profil': 'section-profil',
      '/berita': 'section-berita',
      '/program': 'section-program',
      '/jurusan': 'section-program',
      '/ekstrakurikuler': 'section-ekskul',
      '/ekskul': 'section-ekskul',
      '/kontak': 'section-kontak',
      '/': 'section-hero'
    };

    const sectionKey = sectionMap[targetUrl];

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

  // 5. PENGECEKAN MENU AKTIF (Garis Biru)
  const checkIsActive = (menu) => {
    const menuTitle = menu.title ? menu.title.toLowerCase().trim() : '';
    const menuUrl = getCleanUrl(menu);

    // Mencegah garis biru pada "Jurusan & Program" saat berada di area ekstrakurikuler
    if (activePath === '/ekstrakurikuler' || activePath === '/ekskul') {
      if (menuTitle.includes('jurusan') || menuTitle.includes('program')) {
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
            src={logoSekolah} 
            alt="Logo Sekolah" 
            className="logo-img" 
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div className="brand-text">
            <span className="brand-title">SMKN COMPRENG</span>
            <span className="brand-subtitle">The School of SESCO Model</span>
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

              // Menu dropdown ("Lainnya") dibuat selalu false agar tidak muncul garis biru/aktif
              const isAnyChildActive = false;

              return (
                <li key={menu.id} ref={dropdownRef} className="nav-item dropdown">
                  <button 
                    className={`dropdown-btn ${isAnyChildActive ? 'active' : ''} ${isDropdownOpenState ? 'active-pill' : ''}`}
                    onClick={(e) => handleDropdownToggle(menu.id, e)}
                  >
                    {menu.title}
                    <span className="arrow">{isDropdownOpenState ? '▲' : '▾'}</span>
                  </button>
                  <ul className={`dropdown-menu ${isDropdownOpenState ? 'show' : ''}`}>
                    {subMenus.map((sub) => {
                      // Submenu di dalam dropdown "Lainnya" juga tidak ditandai active
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
                <span className={`nav-link ${isActive ? 'active' : ''}`}>
                  {menu.title}
                </span>
              </li>
            );
          })}

          {/* Tombol CMS Login */}
          <li className="nav-item btn-login-wrapper">
            <Link to="/login" className="btn-cms-login">
              Login
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;