import { useState, useEffect, useCallback } from 'react';
import { Device } from '../types/iot';
import { dataStore, subscribeToKey } from '../services/supabase';
import { useOrg } from '../context/OrgContext';

export const useDevices = (roomId?: string) => {
  const { activeOrg } = useOrg();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    const data = await dataStore.getDevices(activeOrg.id, roomId);
    setDevices(data);
    setLoading(false);
  }, [activeOrg.id, roomId]);

  useEffect(() => {
    fetchDevices();

    // Subscribe to local and realtime updates
    const unsubscribe = subscribeToKey<Device[]>('devices', (all) => {
      let filtered = all.filter((d) => d.organizationId === activeOrg.id);
      if (roomId) filtered = filtered.filter((d) => d.roomId === roomId);
      setDevices(filtered);
    });

    return () => {
      unsubscribe();
    };
  }, [fetchDevices, activeOrg.id, roomId]);

  return {
    devices,
    loading,
    refreshDevices: fetchDevices,
  };
};
