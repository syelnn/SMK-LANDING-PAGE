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
  const navigate = useNavigate();
  const location = useLocation();

  const [activePath, setActivePath] = useState(location.pathname);

  useEffect(() => {
    setActivePath(location.pathname);
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

  // 2. Scroll Navbar Background Shadow Listener
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 20;
      if (scrolled !== isScrolledRef.current) {
        isScrolledRef.current = scrolled;
        setIsScrolled(scrolled);
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

  const mainMenus = useMemo(() => {
    return menuItems.filter(item => !item.parentId && !item.parent_id);
  }, [menuItems]);

  const getSubMenus = useCallback((parentId) => {
    return menuItems.filter(item => item.parentId === parentId || item.parent_id === parentId);
  }, [menuItems]);

  // ==========================================
  // 3. SCROLL SPY KHUSUS LANDING PAGE
  // ==========================================
  useEffect(() => {
    // --- UBAH BARIS INI (Tambahkan: || location.pathname.startsWith('/berita/')) ---
    if (location.pathname.includes('/detail-kurikulum') || location.pathname.startsWith('/berita/')) return;
    if (menuItems.length === 0) return;

    const handleScrollSpy = () => {
      const scrollPos = window.scrollY + 250;

      const heroEl = document.getElementById('section-hero');
      const profilEl = document.getElementById('section-profil');
      const beritaEl = document.getElementById('section-berita');
      const programEl = document.getElementById('section-program');

      let activeKey = 'section-hero';

      if (heroEl && scrollPos >= heroEl.offsetTop) activeKey = 'section-hero';
      if (profilEl && scrollPos >= profilEl.offsetTop) activeKey = 'section-profil';
      if (beritaEl && scrollPos >= beritaEl.offsetTop) activeKey = 'section-berita';
      if (programEl && scrollPos >= programEl.offsetTop) activeKey = 'section-program';

      const matchedMenu = menuItems.find(item => {
        const key = item.sectionKey || item.section_key;
        return key === activeKey;
      });

      if (matchedMenu) {
        setActivePath(getCleanUrl(matchedMenu));
      }
    };

    window.addEventListener('scroll', handleScrollSpy, { passive: true });
    const initialSpy = setTimeout(handleScrollSpy, 500);

    return () => {
      window.removeEventListener('scroll', handleScrollSpy);
      clearTimeout(initialSpy);
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
      '/kontak': 'section-kontak',
      '/': 'section-hero'
    };

    const sectionKey = sectionMap[targetUrl];

    if (sectionKey && location.pathname === '/') {
      const element = document.getElementById(sectionKey);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        setActivePath(targetUrl);
      }
    } else {
      navigate(targetUrl);
    }
  };

  const handleDropdownToggle = (menuId, e) => {
    e.stopPropagation();
    setDropdownOpen(prev => (prev === menuId ? null : menuId));
  };

  // 5. PENGECEKAN MENU AKTIF YANG CERDAS
  const checkIsActive = (menu) => {
    const menuTitle = menu.title ? menu.title.toLowerCase().trim() : '';
    const menuUrl = getCleanUrl(menu);

    // 1) Jika berada di Halaman Detail Kurikulum
    if (location.pathname.includes('/detail-kurikulum')) {
      return menuTitle.includes('jurusan') || menuTitle.includes('program') || menuUrl.includes('jurusan');
    }

    // --- TAMBAHKAN BLOK KODE INI ---
    if (location.pathname.startsWith('/berita')) {
      return menuTitle.includes('berita') || menuUrl.includes('berita');
    }
    // --------------------------------

    // 3) Default (Landing Page scroll spy & exact match)
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
              const isDropdownActive = dropdownOpen === menu.id;
              return (
                <li key={menu.id} ref={dropdownRef} className="nav-item dropdown">
                  <button 
                    className={`dropdown-btn ${isDropdownActive ? 'active-pill' : ''}`}
                    onClick={(e) => handleDropdownToggle(menu.id, e)}
                  >
                    {menu.title}
                    <span className="arrow">{isDropdownActive ? '▲' : '▾'}</span>
                  </button>
                  <ul className={`dropdown-menu ${isDropdownActive ? 'show' : ''}`}>
                    {subMenus.map((sub) => (
                      <li key={sub.id} onClick={() => handleNavClick(sub)}>
                        <span className="dropdown-link">{sub.title}</span>
                      </li>
                    ))}
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