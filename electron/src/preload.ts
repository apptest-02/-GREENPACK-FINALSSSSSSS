// Greenpack Pro — Electron Preload Script
// Exposes safe IPC APIs to the React renderer via contextBridge
// SECURITY: contextIsolation=true, nodeIntegration=false

import { contextBridge, ipcRenderer } from 'electron';

// Expose typed API to renderer process (window.electronAPI)
contextBridge.exposeInMainWorld('electronAPI', {
  // ── Window controls (custom title bar) ──────────────────────────────────────
  minimize:    () => ipcRenderer.invoke('window-minimize'),
  maximize:    () => ipcRenderer.invoke('window-maximize'),
  close:       () => ipcRenderer.invoke('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),

  // ── App configuration (electron-store) ─────────────────────────────────────
  getConfig: () => ipcRenderer.invoke('get-config'),
  setConfig: (config: Record<string, unknown>) => ipcRenderer.invoke('set-config', config),

  // ── Native file/folder pickers ──────────────────────────────────────────────
  openFile: (options?: any) => ipcRenderer.invoke('open-file-dialog', options),
  openFolder: () => ipcRenderer.invoke('open-folder-dialog'),

  // ── Windows toast notifications ─────────────────────────────────────────────
  showToast: (title: string, body: string, type?: 'info' | 'success' | 'error') =>
    ipcRenderer.invoke('show-toast', { title, body, type }),

  // ── Version & API ───────────────────────────────────────────────────────────
  getVersion: () => ipcRenderer.invoke('get-version'),
  getApiUrl:  () => ipcRenderer.invoke('get-api-url'),

  // ── Engine health ───────────────────────────────────────────────────────────
  checkEngineHealth: () => ipcRenderer.invoke('check-engine-health'),

  // ── Auto-update events ──────────────────────────────────────────────────────
  onUpdateAvailable: (callback: (info: any) => void) =>
    ipcRenderer.on('update-available', (_, info) => callback(info)),
  onUpdateDownloaded: (callback: () => void) =>
    ipcRenderer.on('update-downloaded', () => callback()),

  // ── Platform info ───────────────────────────────────────────────────────────
  platform: process.platform,
  isElectron: true,
});
