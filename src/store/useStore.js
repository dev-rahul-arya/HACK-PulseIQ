import { create } from 'zustand';

export const TABS = ['today', 'timeline', 'insights', 'profile'];

export const useStore = create((set) => ({
  isAuthenticated: localStorage.getItem('pulseiq_auth') === 'true',
  setIsAuthenticated: (val) => {
    if (val) localStorage.setItem('pulseiq_auth', 'true');
    else localStorage.removeItem('pulseiq_auth');
    set({ isAuthenticated: val });
  },

  hasCompletedOnboarding: null,
  setHasCompletedOnboarding: (val) => set({ hasCompletedOnboarding: val }),

  activeTab: 'today',
  setActiveTab: (tab) => set({ activeTab: tab }),

  selectedDate: new Date().toISOString().slice(0, 10),
  setSelectedDate: (date) => set({ selectedDate: date }),

  addModalOpen: false,
  openAddModal: () => set({ addModalOpen: true }),
  closeAddModal: () => set({ addModalOpen: false }),

  hasSyncedSampleData: false,
  setHasSyncedSampleData: (v) => set({ hasSyncedSampleData: v }),
}));
