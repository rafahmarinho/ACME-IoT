export type UserRole = 'owner' | 'admin' | 'operator' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  organizationId: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'Starter' | 'Professional' | 'Enterprise';
  address?: string;
  createdAt: string;
}

export interface Building {
  id: string;
  organizationId: string;
  name: string;
  address: string;
  floorsCount: number;
  totalAreaSqm: number;
  status: 'operational' | 'maintenance' | 'warning';
  createdAt: string;
}

export interface RoomDimensions {
  width: number;
  length: number;
  height: number;
}

export interface Room {
  id: string;
  buildingId: string;
  name: string;
  floor: number;
  roomType: 'office' | 'conference' | 'server_room' | 'breakroom' | 'lab';
  targetTemp: number;
  targetHumidity: number;
  dimensions: RoomDimensions;
  createdAt: string;
}

export type DeviceType =
  | 'thermostat'
  | 'smart_plug'
  | 'temperature_sensor'
  | 'humidity_sensor'
  | 'occupancy_sensor';

export type DeviceStatus = 'online' | 'offline' | 'warning' | 'updating';

export type FirmwareStatus =
  | 'up_to_date'
  | 'update_pending'
  | 'installing'
  | 'rollback_ready'
  | 'rolled_back';

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface ThermostatState {
  target_temperature?: number;
  current_temperature?: number;
  mode?: 'heat' | 'cool' | 'eco' | 'off';
  fan?: 'auto' | 'low' | 'high';
  humidity?: number;
}

export interface SmartPlugState {
  power?: boolean;
  voltage?: number;
  current_watts?: number;
  energy_kwh?: number;
}

export interface TempSensorState {
  temperature?: number;
  min_24h?: number;
  max_24h?: number;
  sample_rate_sec?: number;
}

export interface HumiditySensorState {
  humidity?: number;
  dew_point?: number;
  sample_rate_sec?: number;
}

export interface OccupancySensorState {
  occupied?: boolean;
  sensitivity?: 'low' | 'medium' | 'high' | 'ultra';
  motion_count_today?: number;
  last_motion_at?: string;
}

export type DesiredState = Record<string, any>;
export type ReportedState = Record<string, any>;

export interface Device {
  id: string;
  organizationId: string;
  roomId: string;
  name: string;
  serialNumber: string;
  enrollmentCode: string;
  type: DeviceType;
  status: DeviceStatus;
  batteryLevel: number | null; // null for line-powered (thermostats, smart plugs)
  signalStrength: number; // dBm e.g. -55
  firmwareVersion: string;
  targetFirmwareVersion?: string | null;
  firmwareStatus: FirmwareStatus;
  firmwareProgress: number; // 0-100
  desiredState: DesiredState;
  reportedState: ReportedState;
  isReconnecting: boolean;
  position3D: Position3D;
  lastSeenAt: string;
  createdAt: string;
}

export interface TelemetryPoint {
  id: string;
  deviceId: string;
  metric: string;
  value: number;
  unit: string;
  recordedAt: string;
}

export type ConditionType =
  | 'temperature_above'
  | 'temperature_below'
  | 'occupancy_true'
  | 'occupancy_false'
  | 'power_above';

export type ActionType = 'set_temperature' | 'toggle_power' | 'send_alert';

export interface Automation {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  isActive: boolean;
  triggerDeviceId: string;
  conditionType: ConditionType;
  conditionValue: number;
  actionDeviceId?: string;
  actionType: ActionType;
  actionPayload: Record<string, any>;
  intervalMinutes: number;
  lastTriggeredAt?: string | null;
  createdAt: string;
}

export interface AutomationLog {
  id: string;
  automationId: string;
  triggerValue: number;
  actionTaken: string;
  status: 'success' | 'failed' | 'skipped_cooldown';
  executedAt: string;
}

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface Alert {
  id: string;
  organizationId: string;
  deviceId?: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  status: AlertStatus;
  acknowledgedBy?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}

export type EventCategory =
  | 'telemetry'
  | 'control'
  | 'alert'
  | 'firmware'
  | 'enrollment'
  | 'system';

export interface EventLog {
  id: string;
  organizationId: string;
  deviceId?: string;
  category: EventCategory;
  message: string;
  payload?: Record<string, any>;
  createdAt: string;
}

export interface FirmwareRelease {
  id: string;
  version: string;
  deviceType: DeviceType;
  releaseNotes: string;
  downloadUrl: string;
  isStable: boolean;
  createdAt: string;
}

export type IntegrationType = 'webhook' | 'slack' | 'bacnet' | 'aws_iot';

export interface Integration {
  id: string;
  organizationId: string;
  type: IntegrationType;
  name: string;
  config: Record<string, any>;
  isEnabled: boolean;
  lastSyncAt?: string | null;
  status: 'healthy' | 'warning' | 'error';
  createdAt: string;
}

export type SimulationScenario =
  | 'normal_jitter'
  | 'overheat_spike'
  | 'offline_wave'
  | 'battery_drain'
  | 'firmware_tick'
  | 'reconnect_all'
  | 'reset';
