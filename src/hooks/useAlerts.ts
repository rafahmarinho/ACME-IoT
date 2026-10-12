import { useState, useEffect, useCallback } from 'react';
import { Alert } from '../types/iot';
import { dataStore, subscribeToKey } from '../services/supabase';
import { useOrg } from '../context/OrgContext';

export const useAlerts = () => {
  const { activeOrg } = useOrg();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    const data = await dataStore.getAlerts(activeOrg.id);
    setAlerts(data);
    setLoading(false);
  }, [activeOrg.id]);

  useEffect(() => {
    fetchAlerts();

    const unsubscribe = subscribeToKey<Alert[]>('alerts', (all) => {
      setAlerts(all.filter((a) => a.organizationId === activeOrg.id));
    });

    return () => {
      unsubscribe();
    };
  }, [fetchAlerts, activeOrg.id]);

  const acknowledgeAlert = async (id: string, userName: string) => {
    await dataStore.updateAlert(id, {
      status: 'acknowledged',
      acknowledgedBy: userName,
    });
  };

  const resolveAlert = async (id: string) => {
    await dataStore.updateAlert(id, {
      status: 'resolved',
      resolvedAt: new Date().toISOString(),
    });
  };

  const activeAlerts = alerts.filter((a) => a.status === 'active');
  const criticalCount = activeAlerts.filter((a) => a.severity === 'critical').length;
  const warningCount = activeAlerts.filter((a) => a.severity === 'warning').length;

  return {
    alerts,
    activeAlerts,
    criticalCount,
    warningCount,
    loading,
    refreshAlerts: fetchAlerts,
    acknowledgeAlert,
    resolveAlert,
  };
};
