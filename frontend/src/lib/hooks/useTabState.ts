/**
 * Custom hook for managing tab navigation state
 * Consolidates: activeTab, tabState per tab
 * Reduces ~3 useState calls into 1
 */

import { useState, useCallback } from 'react';

export interface TabState {
  activeTab: string;
  tabData: Record<string, any>;
}

export function useTabState(initialTab: string, initialData: Record<string, any> = {}) {
  const [state, setState] = useState<TabState>({
    activeTab: initialTab,
    tabData: initialData,
  });

  const setActiveTab = useCallback((tab: string) => {
    setState((prev) => ({ ...prev, activeTab: tab }));
  }, []);

  const setTabData = useCallback((tab: string, data: any) => {
    setState((prev) => ({
      ...prev,
      tabData: { ...prev.tabData, [tab]: data },
    }));
  }, []);

  const updateTabData = useCallback((tab: string, dataUpdate: Partial<any>) => {
    setState((prev) => ({
      ...prev,
      tabData: {
        ...prev.tabData,
        [tab]: { ...(prev.tabData[tab] || {}), ...dataUpdate },
      },
    }));
  }, []);

  return {
    state,
    setActiveTab,
    setTabData,
    updateTabData,
  };
}
