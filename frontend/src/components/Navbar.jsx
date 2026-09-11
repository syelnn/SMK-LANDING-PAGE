import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import logoSekolah from '../assets/logo1.png'; 
import '../css/viewer/navbar.css'; 

const Navbar = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const response = await fetch('http://localhost:5002/api/menu-items');
        const result = await response.json();
        
        const rawList = Array.isArray(result) ? result : (result.data || []);
        
        const publicMenus = rawList.filter(item => {
          const isPublic = item.isPublic ?? item.is_public ?? true;
          const isActive = item.status === 1 || item.status === 'ACTIVE' || item.status === true || item.status === undefined;
          return isPublic && isActive;
        });

        setMenuItems(publicMenus);
      } catch (error) {
        console.error('Gagal mengambil data menu:', error);
      }
    };

    fetchMenus();

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };

    // Menutup dropdown ketika pengguna mengklik di luar area dropdown
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(null);
      }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const mainMenus = menuItems.filter(item => !item.parentId && !item.parent_id);
  const getSubMenus = (parentId) => {
    return menuItems.filter(item => item.parentId === parentId || item.parent_id === parentId);
  };

  const handleNavClick = (item) => {
    setMobileMenuOpen(false);
    setDropdownOpen(null);

    const targetUrl = item.url || item.href || '/';

    if ((item.type === 'section' || item.sectionKey) && item.sectionKey) {
      const element = document.getElementById(item.sectionKey);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        window.history.pushState(null, '', targetUrl);
      } else {
        navigate(`/#${item.sectionKey}`);
      }
    } else if (targetUrl) {
      navigate(targetUrl);
    }
  };

  // Toggle dropdown saat diklik
  const handleDropdownToggle = (menuId, e) => {
    e.stopPropagation();
    setDropdownOpen(prev => (prev === menuId ? null : menuId));
  };

  // ==========================================
  // PERBAIKAN LOGIKA PENGECEKAN AKTIF
  // ==========================================
  const checkIsActive = (menu) => {
    const currentPath = location.pathname;
    const currentHash = location.hash;
    const menuTitle = menu.title ? menu.title.toLowerCase().trim() : '';
    const menuUrl = (menu.url || menu.href || '').trim();

    // 1. Cek jika URL memiliki Hash (#sectionKey)
    if (menu.sectionKey && currentHash === `#${menu.sectionKey}`) {
      return true;
    }

    // 2. Jika di Halaman Beranda / Dashboard
    const isDashboardOrHome = currentPath === '/' || currentPath === '/dashboard';
    
    if (isDashboardOrHome) {
      // Jika URL memiliki Hash lain (misal #kontak), Beranda jangan aktif
      if (currentHash && currentHash !== '#') {
        return false;
      }

      // Validasi Khusus Beranda: hanya aktif jika namanya mengandung 'beranda'/'home' 
      // ATAU URL-nya '/' / '/dashboard' DAN judulnya BUKAN Kontak/Lainnya
      const isHomeTitle = menuTitle.includes('beranda') || menuTitle.includes('home');
      const isHomeUrl = (menuUrl === '/' || menuUrl === '/dashboard') && !menuTitle.includes('kontak');

      return isHomeTitle || isHomeUrl;
    }

    // 3. Untuk Halaman Lain (misal /profil-sekolah, /berita)
    if (menuUrl && menuUrl !== '/' && menuUrl !== '/dashboard') {
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