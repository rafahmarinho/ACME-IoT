import { useState, useEffect, useCallback } from 'react';
import { Automation } from '../types/iot';
import { dataStore, subscribeToKey } from '../services/supabase';
import { useOrg } from '../context/OrgContext';

export const useAutomations = () => {
  const { activeOrg } = useOrg();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAutomations = useCallback(async () => {
    setLoading(true);
    const data = await dataStore.getAutomations(activeOrg.id);
    setAutomations(data);
    setLoading(false);
  }, [activeOrg.id]);

  useEffect(() => {
    fetchAutomations();

    const unsubscribe = subscribeToKey<Automation[]>('automations', (all) => {
      setAutomations(all.filter((a) => a.organizationId === activeOrg.id));
    });

    return () => {
      unsubscribe();
    };
  }, [fetchAutomations, activeOrg.id]);

  const toggleAutomationActive = async (id: string) => {
    const target = automations.find((a) => a.id === id);
    if (!target) return;
    const updated = { ...target, isActive: !target.isActive };
    await dataStore.saveAutomation(updated);
  };

  return {
    automations,
    loading,
    refreshAutomations: fetchAutomations,
    toggleAutomationActive,
  };
};
