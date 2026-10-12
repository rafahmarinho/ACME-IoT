import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  INITIAL_ORGANIZATIONS,
  INITIAL_BUILDINGS,
  INITIAL_ROOMS,
  INITIAL_DEVICES,
  INITIAL_AUTOMATIONS,
  INITIAL_ALERTS,
  INITIAL_EVENTS,
  INITIAL_USER_PROFILES,
  INITIAL_FIRMWARE_RELEASES,
  INITIAL_INTEGRATIONS,
} from './demoData';
import {
  Organization,
  Building,
  Room,
  Device,
  Automation,
  Alert,
  EventLog,
  UserProfile,
  FirmwareRelease,
  Integration,
  SimulationScenario,
} from '../types/iot';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your-project-ref')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

// Storage Keys
const STORAGE_KEYS = {
  ORGANIZATIONS: '@acme_iot_organizations',
  BUILDINGS: '@acme_iot_buildings',
  ROOMS: '@acme_iot_rooms',
  DEVICES: '@acme_iot_devices',
  AUTOMATIONS: '@acme_iot_automations',
  ALERTS: '@acme_iot_alerts',
  EVENTS: '@acme_iot_events',
  USER_PROFILES: '@acme_iot_user_profiles',
  FIRMWARE: '@acme_iot_firmware',
  INTEGRATIONS: '@acme_iot_integrations',
  ACTIVE_ORG_ID: '@acme_iot_active_org_id',
  CURRENT_USER: '@acme_iot_current_user',
};

// Event listener registry for local reactive updates
type Listener<T> = (data: T) => void;
const listeners: Record<string, Set<Listener<any>>> = {
  devices: new Set(),
  alerts: new Set(),
  events: new Set(),
  automations: new Set(),
};

export const subscribeToKey = <T>(key: 'devices' | 'alerts' | 'events' | 'automations', cb: Listener<T>) => {
  listeners[key]?.add(cb);
  return () => {
    listeners[key]?.delete(cb);
  };
};

export const notifyKey = (key: 'devices' | 'alerts' | 'events' | 'automations', data: any) => {
  listeners[key]?.forEach((cb) => {
    try {
      cb(data);
    } catch (e) {
      console.warn('Listener notification error:', e);
    }
  });
};

/**
 * Universal Data Store
 * Seamlessly manages data with Supabase Cloud + Local AsyncStorage caching and fallback.
 */
export const dataStore = {
  async initDemoData(forceReset = false) {
    try {
      const storedDevices = await AsyncStorage.getItem(STORAGE_KEYS.DEVICES);
      if (!storedDevices || forceReset) {
        await AsyncStorage.setItem(STORAGE_KEYS.ORGANIZATIONS, JSON.stringify(INITIAL_ORGANIZATIONS));
        await AsyncStorage.setItem(STORAGE_KEYS.BUILDINGS, JSON.stringify(INITIAL_BUILDINGS));
        await AsyncStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(INITIAL_ROOMS));
        await AsyncStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(INITIAL_DEVICES));
        await AsyncStorage.setItem(STORAGE_KEYS.AUTOMATIONS, JSON.stringify(INITIAL_AUTOMATIONS));
        await AsyncStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(INITIAL_ALERTS));
        await AsyncStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(INITIAL_EVENTS));
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILES, JSON.stringify(INITIAL_USER_PROFILES));
        await AsyncStorage.setItem(STORAGE_KEYS.FIRMWARE, JSON.stringify(INITIAL_FIRMWARE_RELEASES));
        await AsyncStorage.setItem(STORAGE_KEYS.INTEGRATIONS, JSON.stringify(INITIAL_INTEGRATIONS));
        await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_ORG_ID, INITIAL_ORGANIZATIONS[0].id);
        
        notifyKey('devices', INITIAL_DEVICES);
        notifyKey('alerts', INITIAL_ALERTS);
        notifyKey('events', INITIAL_EVENTS);
        notifyKey('automations', INITIAL_AUTOMATIONS);
      }
    } catch (err) {
      console.error('Failed to init local demo storage:', err);
    }
  },

  async resetData(): Promise<void> {
    await this.initDemoData(true);
  },

  async getOrganizations(): Promise<Organization[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.ORGANIZATIONS);
      if (raw) return JSON.parse(raw);
    } catch {}
    return INITIAL_ORGANIZATIONS;
  },

  async getBuildings(orgId?: string): Promise<Building[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.BUILDINGS);
      const all: Building[] = raw ? JSON.parse(raw) : INITIAL_BUILDINGS;
      return orgId ? all.filter((b) => b.organizationId === orgId) : all;
    } catch {
      return INITIAL_BUILDINGS;
    }
  },

  async getRooms(buildingId?: string): Promise<Room[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.ROOMS);
      const all: Room[] = raw ? JSON.parse(raw) : INITIAL_ROOMS;
      return buildingId ? all.filter((r) => r.buildingId === buildingId) : all;
    } catch {
      return INITIAL_ROOMS;
    }
  },

  async getDevices(orgId?: string, roomId?: string): Promise<Device[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.DEVICES);
      let all: Device[] = raw ? JSON.parse(raw) : INITIAL_DEVICES;
      if (orgId) all = all.filter((d) => d.organizationId === orgId);
      if (roomId) all = all.filter((d) => d.roomId === roomId);
      return all;
    } catch {
      return INITIAL_DEVICES;
    }
  },

  async getDeviceById(id: string): Promise<Device | undefined> {
    const devices = await this.getDevices();
    return devices.find((d) => d.id === id);
  },

  async updateDevice(id: string, updates: Partial<Device>): Promise<Device | null> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.DEVICES);
      const devices: Device[] = raw ? JSON.parse(raw) : INITIAL_DEVICES;
      const index = devices.findIndex((d) => d.id === id);
      if (index === -1) return null;

      const updated = {
        ...devices[index],
        ...updates,
        lastSeenAt: updates.lastSeenAt || new Date().toISOString(),
      };
      devices[index] = updated;

      await AsyncStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(devices));
      notifyKey('devices', devices);
      return updated;
    } catch (err) {
      console.error('Error updating device:', err);
      return null;
    }
  },

  async addDevice(device: Device): Promise<Device> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.DEVICES);
      const devices: Device[] = raw ? JSON.parse(raw) : INITIAL_DEVICES;
      devices.unshift(device);
      await AsyncStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(devices));
      notifyKey('devices', devices);

      await this.addEvent({
        id: `ev-${Date.now()}`,
        organizationId: device.organizationId,
        deviceId: device.id,
        category: 'enrollment',
        message: `Device enrolled: ${device.name} (${device.serialNumber})`,
        createdAt: new Date().toISOString(),
      });

      return device;
    } catch (err) {
      console.error('Error adding device:', err);
      return device;
    }
  },

  async getAutomations(orgId?: string): Promise<Automation[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.AUTOMATIONS);
      const all: Automation[] = raw ? JSON.parse(raw) : INITIAL_AUTOMATIONS;
      return orgId ? all.filter((a) => a.organizationId === orgId) : all;
    } catch {
      return INITIAL_AUTOMATIONS;
    }
  },

  async saveAutomation(automation: Automation): Promise<Automation> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.AUTOMATIONS);
      let list: Automation[] = raw ? JSON.parse(raw) : INITIAL_AUTOMATIONS;
      const index = list.findIndex((a) => a.id === automation.id);
      if (index >= 0) {
        list[index] = automation;
      } else {
        list.push(automation);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.AUTOMATIONS, JSON.stringify(list));
      notifyKey('automations', list);
      return automation;
    } catch {
      return automation;
    }
  },

  async getAlerts(orgId?: string): Promise<Alert[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.ALERTS);
      const all: Alert[] = raw ? JSON.parse(raw) : INITIAL_ALERTS;
      return orgId ? all.filter((a) => a.organizationId === orgId) : all;
    } catch {
      return INITIAL_ALERTS;
    }
  },

  async updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | null> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.ALERTS);
      const alerts: Alert[] = raw ? JSON.parse(raw) : INITIAL_ALERTS;
      const index = alerts.findIndex((a) => a.id === id);
      if (index === -1) return null;
      alerts[index] = { ...alerts[index], ...updates };
      await AsyncStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
      notifyKey('alerts', alerts);
      return alerts[index];
    } catch {
      return null;
    }
  },

  async addAlert(alert: Alert): Promise<Alert> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.ALERTS);
      const alerts: Alert[] = raw ? JSON.parse(raw) : INITIAL_ALERTS;
      alerts.unshift(alert);
      await AsyncStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
      notifyKey('alerts', alerts);
      return alert;
    } catch {
      return alert;
    }
  },

  async getEvents(orgId?: string): Promise<EventLog[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.EVENTS);
      const all: EventLog[] = raw ? JSON.parse(raw) : INITIAL_EVENTS;
      return orgId ? all.filter((e) => e.organizationId === orgId) : all;
    } catch {
      return INITIAL_EVENTS;
    }
  },

  async addEvent(event: EventLog): Promise<EventLog> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.EVENTS);
      const events: EventLog[] = raw ? JSON.parse(raw) : INITIAL_EVENTS;
      events.unshift(event);
      // Keep recent 100 events
      if (events.length > 100) events.pop();
      await AsyncStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
      notifyKey('events', events);
      return event;
    } catch {
      return event;
    }
  },

  async getUserProfiles(orgId?: string): Promise<UserProfile[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILES);
      const all: UserProfile[] = raw ? JSON.parse(raw) : INITIAL_USER_PROFILES;
      return orgId ? all.filter((u) => u.organizationId === orgId) : all;
    } catch {
      return INITIAL_USER_PROFILES;
    }
  },

  async getFirmwareReleases(): Promise<FirmwareRelease[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.FIRMWARE);
      return raw ? JSON.parse(raw) : INITIAL_FIRMWARE_RELEASES;
    } catch {
      return INITIAL_FIRMWARE_RELEASES;
    }
  },

  async getIntegrations(orgId?: string): Promise<Integration[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.INTEGRATIONS);
      const all: Integration[] = raw ? JSON.parse(raw) : INITIAL_INTEGRATIONS;
      return orgId ? all.filter((i) => i.organizationId === orgId) : all;
    } catch {
      return INITIAL_INTEGRATIONS;
    }
  },

  async toggleIntegration(id: string): Promise<Integration | null> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.INTEGRATIONS);
      const list: Integration[] = raw ? JSON.parse(raw) : INITIAL_INTEGRATIONS;
      const idx = list.findIndex((i) => i.id === id);
      if (idx === -1) return null;
      list[idx].isEnabled = !list[idx].isEnabled;
      list[idx].lastSyncAt = new Date().toISOString();
      await AsyncStorage.setItem(STORAGE_KEYS.INTEGRATIONS, JSON.stringify(list));
      return list[idx];
    } catch {
      return null;
    }
  },
};
