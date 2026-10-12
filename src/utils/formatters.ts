export const formatTemp = (val?: number | null, unit = '°C') => {
  if (val === undefined || val === null) return '--';
  return `${val.toFixed(1)}${unit}`;
};

export const formatHumidity = (val?: number | null) => {
  if (val === undefined || val === null) return '--';
  return `${Math.round(val)}%`;
};

export const formatWatts = (val?: number | null) => {
  if (val === undefined || val === null) return '0 W';
  return val >= 1000 ? `${(val / 1000).toFixed(2)} kW` : `${Math.round(val)} W`;
};

export const formatSignal = (dbm?: number | null) => {
  if (dbm === undefined || dbm === null) return '-- dBm';
  return `${dbm} dBm`;
};

export const formatTimeAgo = (isoString?: string | null) => {
  if (!isoString) return 'never';
  const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
};

export const formatDeviceTypeLabel = (type: string) => {
  switch (type) {
    case 'thermostat':
      return 'Thermostat';
    case 'smart_plug':
      return 'Smart Plug';
    case 'temperature_sensor':
      return 'Temperature Sensor';
    case 'humidity_sensor':
      return 'Humidity Sensor';
    case 'occupancy_sensor':
      return 'Occupancy Sensor';
    default:
      return type;
  }
};
