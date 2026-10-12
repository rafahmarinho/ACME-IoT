import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Organization, Building, Room } from '../types/iot';
import { dataStore } from '../services/supabase';
import { INITIAL_ORGANIZATIONS } from '../services/demoData';

interface OrgContextType {
  organizations: Organization[];
  activeOrg: Organization;
  setActiveOrgId: (id: string) => Promise<void>;
  buildings: Building[];
  rooms: Room[];
  refreshOrgData: () => Promise<void>;
  isLoading: boolean;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

const ACTIVE_ORG_KEY = '@acme_iot_active_org_id';

export const OrgProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [organizations, setOrganizations] = useState<Organization[]>(INITIAL_ORGANIZATIONS);
  const [activeOrgId, setActiveOrgIdState] = useState<string>(INITIAL_ORGANIZATIONS[0].id);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initData();
  }, []);

  const initData = async () => {
    setIsLoading(true);
    await dataStore.initDemoData();
    const orgs = await dataStore.getOrganizations();
    setOrganizations(orgs);

    const savedOrgId = await AsyncStorage.getItem(ACTIVE_ORG_KEY);
    const selected = orgs.find((o) => o.id === savedOrgId) || orgs[0];
    setActiveOrgIdState(selected.id);

    const blds = await dataStore.getBuildings(selected.id);
    setBuildings(blds);

    const rms = await dataStore.getRooms();
    setRooms(rms);

    setIsLoading(false);
  };

  const setActiveOrgId = async (id: string) => {
    setActiveOrgIdState(id);
    await AsyncStorage.setItem(ACTIVE_ORG_KEY, id);
    const blds = await dataStore.getBuildings(id);
    setBuildings(blds);
  };

  const refreshOrgData = async () => {
    const orgs = await dataStore.getOrganizations();
    setOrganizations(orgs);
    const blds = await dataStore.getBuildings(activeOrgId);
    setBuildings(blds);
    const rms = await dataStore.getRooms();
    setRooms(rms);
  };

  const activeOrg = organizations.find((o) => o.id === activeOrgId) || organizations[0];

  return (
    <OrgContext.Provider
      value={{
        organizations,
        activeOrg,
        setActiveOrgId,
        buildings,
        rooms,
        refreshOrgData,
        isLoading,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
};

export const useOrg = () => {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error('useOrg must be used within an OrgProvider');
  return ctx;
};
