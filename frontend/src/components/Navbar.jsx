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

  // State khusus mengontrol garis aktif navigasi secara real-time
  const [activePath, setActivePath] = useState(location.pathname);

  // Sync activePath jika URL React Router berubah
  useEffect(() => {
    setActivePath(location.pathname);
  }, [location.pathname]);

  // 1. Fetching Menu (DILENGKAPI CACHING AGAR LEBIH CEPTA & TIDAK LOADING LAMA)
  useEffect(() => {
    let isMounted = true;
    
    // Cek dulu dari cache sessionStorage
    const cachedMenu = sessionStorage.getItem('app_menu_items');
    if (cachedMenu) {
      try {
        setMenuItems(JSON.parse(cachedMenu));
      } catch (e) {
        console.error("Failed to parse cached menu", e);
      }
    }

    const fetchMenus = async () => {
      try {
        const response = await fetch('http://localhost:5002/api/menu-items');
        const result = await response.json();
        
        if (!isMounted) return;
        const rawList = Array.isArray(result) ? result : (result.data || []);
        
        const publicMenus = rawList.filter(item => {
          const isPublic = item.isPublic ?? item.is_public ?? true;
          const isActive = item.status === 1 || item.status === 'ACTIVE' || item.status === true || item.status === undefined;
          return isPublic && isActive;
        });

        // Simpan ke Cache
        sessionStorage.setItem('app_menu_items', JSON.stringify(publicMenus));
        setMenuItems(publicMenus);
      } catch (error) {
        console.error('Gagal mengambil data menu:', error);
      }
    };

    fetchMenus();
    return () => { isMounted = false; };
  }, []);

  // 2. Optimized Scroll Event
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

  // 3. Helper Sanitasi URL
  const getCleanUrl = useCallback((item) => {
    let rawUrl = (item.url || item.href || '/').trim();
    if (rawUrl === '/dashboard') return '/';
    return rawUrl;
  }, []);

  // 4. Memoized Data Menu
  const mainMenus = useMemo(() => {
    return menuItems.filter(item => !item.parentId && !item.parent_id);
  }, [menuItems]);

  const getSubMenus = useCallback((parentId) => {
    return menuItems.filter(item => item.parentId === parentId || item.parent_id === parentId);
  }, [menuItems]);

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
    const sectionKey = item.sectionKey || item.section_key;

    if (sectionKey) {
      const element = document.getElementById(sectionKey);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        window.history.pushState(null, '', targetUrl);
        setActivePath(targetUrl);
      } else {
        navigate(targetUrl);
      }
    } else if (targetUrl) {
      navigate(targetUrl);
    }
  };

  const handleDropdownToggle = (menuId, e) => {
    e.stopPropagation();
    setDropdownOpen(prev => (prev === menuId ? null : menuId));
  };

  // 7. Logika Check Active Menu
  const checkIsActive = (menu) => {
    const currentPath = activePath;
    const menuTitle = menu.title ? menu.title.toLowerCase().trim() : '';
    const menuUrl = getCleanUrl(menu);

    if (menuTitle.includes('beranda') || menuTitle.includes('home') || menuUrl === '/') {
      return currentPath === '/';
    }

    if (menuUrl && menuUrl !== '/') {
      return currentPath === menuUrl;
    }

    return false;
  };

  return (
    <nav className={`viewer-navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Logo Sekolah */}
        <Link to="/" className="navbar-logo">
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
        </Link>

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
                <li 
                  key={menu.id} 
                  ref={dropdownRef}
                  className="nav-item dropdown"
                >
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