// src/context/SettingsContext.jsx
import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import '../css/appearance.css';
import {
  API_URL, applyThemeToDOM, readThemeCache, writeThemeCache,
} from '../theme/themeEngine';

export const SettingsContext = createContext();

// Terapkan tema terakhir yang tersimpan SEBELUM React render -> tidak ada kedipan tema lama
applyThemeToDOM(readThemeCache());

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => readThemeCache());
  const [isLoading, setIsLoading] = useState(true);
  const [isMaintenance] = useState(false);

  const settingsRef = useRef(settings); // selalu berisi data TERSIMPAN terbaru (anti closure basi)
  const previewActiveRef = useRef(false);

  // Satu pintu untuk memperbarui data tersimpan + menerapkannya ke layar
  const commit = useCallback((next) => {
    settingsRef.current = next;
    setSettings(next);
    writeThemeCache(next);
    if (!previewActiveRef.current) applyThemeToDOM(next);
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/settings`);
      if (res.data && Array.isArray(res.data.data)) {
        const obj = {};
        res.data.data.forEach((item) => { obj[item.key] = item.value ?? ''; });
        commit(obj);
      }
    } catch (error) {
      console.warn('Gagal memuat setting dari server, memakai cache lokal/default', error);
    } finally {
      setIsLoading(false);
    }
  }, [commit]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  // Simpan ke server. Kalau sukses: tema/kontak LANGSUNG berlaku di seluruh website.
  const saveSettings = useCallback(async (data) => {
    const res = await fetch(`${API_URL}/api/settings/bulk-update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      let msg = '';
      try { msg = (await res.json()).message; } catch { /* body bukan JSON */ }
      throw new Error(msg || `Server menolak permintaan (HTTP ${res.status})`);
    }
    const strData = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v ?? '')]));
    previewActiveRef.current = false;
    commit({ ...settingsRef.current, ...strData });
  }, [commit]);

  // Preview: tampil di layar saja, belum disimpan
  const applyPreview = useCallback((previewData) => {
    previewActiveRef.current = true;
    applyThemeToDOM(previewData);
  }, []);

  // Batalkan preview -> kembali ke tema yang tersimpan
  const clearPreview = useCallback(() => {
    previewActiveRef.current = false;
    applyThemeToDOM(settingsRef.current);
  }, []);

  return (
    <SettingsContext.Provider
      value={{ settings, fetchSettings, saveSettings, isMaintenance, isLoading, applyPreview, clearPreview }}
    >
      {children}
    </SettingsContext.Provider>
  );
};