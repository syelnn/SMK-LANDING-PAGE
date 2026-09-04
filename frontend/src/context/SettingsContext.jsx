import React, { createContext, useState, useEffect } from 'react';

export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({});
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const response = await fetch('http://localhost:5002/api/settings');
      const result = await response.json();
      const settingsObj = {};
      if (result.success && result.data) {
        result.data.forEach(item => { settingsObj[item.key] = item.value; });
      }
      setSettings(settingsObj);
      applyGlobalStyles(settingsObj);
      setIsLoading(false);
    } catch (error) {
      console.error("Gagal memuat pengaturan:", error);
      setIsLoading(false);
    }
  };

  const applyGlobalStyles = (data) => {
    const root = document.documentElement;
    const mode = data.theme_mode || 'compreng_default';
    
    let p = {};

    // RUMUS PALET WARNA TEMA
    switch(mode) {
      case 'emerald_gold':
        p = { bg: '#f8fafc', card: '#ffffff', textMain: '#064e3b', textMuted: '#475569', accent: '#0A7E2E', accentText: '#ffffff', navBg: '#022c22', navText: '#ffffff', border: '#dcfce7' }; break;
      case 'golden_nature':
        p = { bg: '#fdfdfa', card: '#ffffff', textMain: '#0f172a', textMuted: '#64748b', accent: '#FFC107', accentText: '#0f172a', navBg: '#0A7E2E', navText: '#ffffff', border: '#fef08a' }; break;
      case 'fresh_compreng':
        p = { bg: '#f0fdf4', card: '#ffffff', textMain: '#1e293b', textMuted: '#475569', accent: '#15803d', accentText: '#ffffff', navBg: '#ffffff', navText: '#15803d', border: '#bbf7d0' }; break;
      
      // Tema Bawaan & Gelap
      case 'compreng_default':
        p = { bg: '#F8FAFC', card: '#FFFFFF', textMain: '#0F172A', textMuted: '#64748B', accent: '#0A7E2E', accentText: '#FFFFFF', navBg: '#0B132B', navText: '#FFFFFF', border: '#E2E8F0' }; break;
      case 'dark_olive': 
        p = { bg: '#101511', card: '#222922', textMain: '#FFFFFF', textMuted: '#A3AFA3', accent: '#717476', accentText: '#101511', navBg: '#101916', navText: '#FFFFFF', border: '#3D4633' }; break;
      
      case 'custom':
        p = {
          bg: data.custom_bg || '#F8FAFC',
          card: data.custom_card || '#FFFFFF',
          textMain: data.custom_text_main || '#0F172A',
          textMuted: data.custom_text_muted || '#64748B',
          accent: data.custom_accent || '#2563EB',
          accentText: data.custom_accent_text || '#FFFFFF',
          navBg: data.custom_nav_bg || '#0B132B',
          navText: data.custom_nav_text || '#FFFFFF',
          border: data.custom_border || '#E2E8F0'
        }; break;
      default:
        p = { bg: '#f8fafc', card: '#ffffff', textMain: '#064e3b', textMuted: '#475569', accent: '#0A7E2E', accentText: '#ffffff', navBg: '#022c22', navText: '#ffffff', border: '#dcfce7' };
    }

    // Suntikkan ke seluruh elemen website CSS
    root.style.setProperty('--theme-bg', p.bg);
    root.style.setProperty('--theme-card', p.card);
    root.style.setProperty('--theme-text-main', p.textMain);
    root.style.setProperty('--theme-text-muted', p.textMuted);
    root.style.setProperty('--theme-accent', p.accent);
    root.style.setProperty('--theme-accent-text', p.accentText);
    root.style.setProperty('--theme-nav-bg', p.navBg);
    root.style.setProperty('--theme-nav-text', p.navText);
    root.style.setProperty('--theme-border', p.border);

    if (data.font_family) root.style.setProperty('--main-font', data.font_family);
  };

  useEffect(() => { fetchSettings(); }, []);

  return (
    <SettingsContext.Provider value={{ settings, fetchSettings, isMaintenance, setIsMaintenance, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
};