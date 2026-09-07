import React, { createContext, useState, useEffect } from 'react';
import { getPaletteByMode } from '../theme/themePalettes';

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

  // Menyuntik warna LANGSUNG ke variabel --compreng-* yang sudah dipakai
  // di ratusan class pada App.css. Tidak perlu ganti nama class apa pun.
  const applyGlobalStyles = (data) => {
    const root = document.documentElement;
    const mode = data.theme_mode || 'compreng_default';
    const p = getPaletteByMode(mode, data);

    root.setAttribute('data-theme', mode);

    // --- Variabel utama yang dipakai di seluruh App.css ---
    root.style.setProperty('--compreng-green', p.primary);
    root.style.setProperty('--compreng-green-dark', p.primaryDark);
    root.style.setProperty('--compreng-yellow', p.accent);
    root.style.setProperty('--compreng-navy', p.navBg);
    root.style.setProperty('--compreng-bg', p.bg);
    root.style.setProperty('--compreng-surface', p.surface);
    root.style.setProperty('--compreng-surface-soft', p.surfaceSoft);
    root.style.setProperty('--compreng-text', p.textMain);
    root.style.setProperty('--compreng-text-secondary', p.textMuted);
    root.style.setProperty('--compreng-text-muted', p.textMuted);
    root.style.setProperty('--compreng-border', p.border);

    // --- Alias --theme-* untuk beberapa inline style di App.jsx & ManageSettings.jsx ---
    root.style.setProperty('--theme-bg', p.bg);
    root.style.setProperty('--theme-card', p.surface);
    root.style.setProperty('--theme-text-main', p.textMain);
    root.style.setProperty('--theme-text-muted', p.textMuted);
    root.style.setProperty('--theme-accent', p.accent);
    root.style.setProperty('--theme-accent-text', mode === 'dark_olive' ? p.textMain : '#FFFFFF');
    root.style.setProperty('--theme-border', p.border);

    if (data.font_family) root.style.setProperty('--main-font', data.font_family);
  };

  const applyPreview = (formData) => applyGlobalStyles(formData);
  const cancelPreview = () => applyGlobalStyles(settings);

  useEffect(() => { fetchSettings(); }, []);

  return (
    <SettingsContext.Provider
      value={{ settings, fetchSettings, isMaintenance, setIsMaintenance, isLoading, applyPreview, cancelPreview }}
    >
      {children}
    </SettingsContext.Provider>
  );
};