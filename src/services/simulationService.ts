import { dataStore } from './supabase';
import { Device, SimulationScenario, Alert, EventLog } from '../types/iot';

export const simulationService = {
  /**
   * Advances the world state by one discrete simulation tick.
   * Updates telemetry, ambient physics, automations, and shadow state reconciliation.
   */
  async advanceTick(): Promise<{
    scenario: string;
    devicesUpdated: number;
    automationsTriggered: number;
    alertsCreated: number;
  }> {
    const devices = await dataStore.getDevices();
    let updatedCount = 0;
    let automationsFired = 0;
    let alertsCount = 0;

    for (const device of devices) {
      if (device.status === 'offline') continue;

      let changed = false;
      const reported = { ...device.reportedState };
      const desired = { ...device.desiredState };

      // 1. Device Type Specific Physics & Logic
      if (device.type === 'thermostat') {
        const target = desired.target_temperature ?? 22.0;
        const current = reported.current_temperature ?? 22.0;
        // Step current temp closer to target by 0.2 deg
        const diff = target - current;
        if (Math.abs(diff) > 0.05) {
          reported.current_temperature = +(current + Math.sign(diff) * 0.2).toFixed(1);
          changed = true;
        }
        reported.target_temperature = target;
        reported.mode = desired.mode ?? reported.mode ?? 'cool';
      } else if (device.type === 'smart_plug') {
        // Reconcile power desired vs reported
        if (desired.power !== undefined && desired.power !== reported.power) {
          reported.power = desired.power;
          reported.current_watts = desired.power ? +(200 + Math.random() * 80).toFixed(1) : 0.0;
          changed = true;
        } else if (reported.power) {
          // Normal fluctuation
          const jitter = (Math.random() - 0.5) * 10;
          reported.current_watts = Math.max(10, +((reported.current_watts || 200) + jitter).toFixed(1));
          changed = true;
        }
      } else if (device.type === 'temperature_sensor') {
        const jitter = (Math.random() - 0.5) * 0.3;
        const current = reported.temperature ?? 22.0;
        reported.temperature = +(current + jitter).toFixed(1);
        changed = true;
      } else if (device.type === 'humidity_sensor') {
        const jitter = (Math.random() - 0.5) * 0.8;
        const current = reported.humidity ?? 45.0;
        reported.humidity = Math.min(95, Math.max(15, +(current + jitter).toFixed(1)));
        changed = true;
      } else if (device.type === 'occupancy_sensor') {
        // 10% chance to toggle motion state during normal day
        if (Math.random() < 0.1) {
          reported.occupied = !reported.occupied;
          if (reported.occupied) {
            reported.motion_count_today = (reported.motion_count_today || 0) + 1;
            reported.last_motion_at = new Date().toISOString();
          }
          changed = true;
        }
      }

      // 2. Battery slight consumption for battery powered devices
      let newBattery = device.batteryLevel;
      if (newBattery !== null && Math.random() < 0.05) {
        newBattery = Math.max(1, newBattery - 1);
        changed = true;
      }

      if (changed) {
        await dataStore.updateDevice(device.id, {
          reportedState: reported,
          batteryLevel: newBattery,
          lastSeenAt: new Date().toISOString(),
        });
        updatedCount++;
      }
    }

    // 3. Evaluate Automations
    const automations = await dataStore.getAutomations();
    const freshDevices = await dataStore.getDevices();

    for (const auto of automations) {
      if (!auto.isActive) continue;

      const triggerDev = freshDevices.find((d) => d.id === auto.triggerDeviceId);
      if (!triggerDev) continue;

      // Extract trigger value
      let triggerValue: number | null = null;
      if (auto.conditionType === 'temperature_above' || auto.conditionType === 'temperature_below') {
        triggerValue =
          triggerDev.reportedState.temperature ??
          triggerDev.reportedState.current_temperature ??
          null;
      } else if (auto.conditionType === 'occupancy_true' || auto.conditionType === 'occupancy_false') {
        triggerValue = triggerDev.reportedState.occupied ? 1 : 0;
      } else if (auto.conditionType === 'power_above') {
        triggerValue = triggerDev.reportedState.current_watts ?? 0;
      }

      if (triggerValue === null) continue;

      let conditionMet = false;
      if (auto.conditionType === 'temperature_above') conditionMet = triggerValue > auto.conditionValue;
      if (auto.conditionType === 'temperature_below') conditionMet = triggerValue < auto.conditionValue;
      if (auto.conditionType === 'occupancy_true') conditionMet = triggerValue === 1;
      if (auto.conditionType === 'occupancy_false') conditionMet = triggerValue === 0;
      if (auto.conditionType === 'power_above') conditionMet = triggerValue > auto.conditionValue;

      if (conditionMet) {
        // Cooldown check
        const now = Date.now();
        const lastTriggerTime = auto.lastTriggeredAt ? new Date(auto.lastTriggeredAt).getTime() : 0;
        const cooldownMs = (auto.intervalMinutes || 15) * 60 * 1000;

        if (now - lastTriggerTime >= cooldownMs) {
          automationsFired++;
          auto.lastTriggeredAt = new Date().toISOString();
          await dataStore.saveAutomation(auto);

          // Execute Action
          if (auto.actionType === 'set_temperature' && auto.actionDeviceId) {
            const targetDev = freshDevices.find((d) => d.id === auto.actionDeviceId);
            if (targetDev) {
              const newDesired = {
                ...targetDev.desiredState,
                target_temperature: auto.actionPayload.target_temperature,
                mode: auto.actionPayload.mode || 'cool',
              };
              await dataStore.updateDevice(targetDev.id, { desiredState: newDesired });
            }
          } else if (auto.actionType === 'toggle_power' && auto.actionDeviceId) {
            const targetDev = freshDevices.find((d) => d.id === auto.actionDeviceId);
            if (targetDev) {
              const newDesired = {
                ...targetDev.desiredState,
                power: auto.actionPayload.power,
              };
              await dataStore.updateDevice(targetDev.id, { desiredState: newDesired });
            }
          } else if (auto.actionType === 'send_alert') {
            await dataStore.addAlert({
              id: `alt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              organizationId: auto.organizationId,
              deviceId: auto.triggerDeviceId,
              severity: auto.actionPayload.severity || 'warning',
              title: auto.actionPayload.title || `Automation Alert: ${auto.name}`,
              message: auto.actionPayload.message || `Triggered by rule ${auto.name}`,
              status: 'active',
              createdAt: new Date().toISOString(),
            });
            alertsCount++;
          }

          await dataStore.addEvent({
            id: `ev-auto-${Date.now()}`,
            organizationId: auto.organizationId,
            deviceId: auto.triggerDeviceId,
            category: 'control',
            message: `Automation executed: "${auto.name}" (${auto.actionType})`,
            payload: { triggerValue, action: auto.actionType },
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    return {
      scenario: 'normal_jitter',
      devicesUpdated: updatedCount,
      automationsTriggered: automationsFired,
      alertsCreated: alertsCount,
    };
  },

  /**
   * Applies predetermined test scenarios for demonstration and verification.
   */
  async applyScenario(scenario: SimulationScenario): Promise<{ message: string; affectedCount: number }> {
    const devices = await dataStore.getDevices();

    switch (scenario) {
      case 'overheat_spike': {
        // Raise temps in Boardroom and Atrium to 27°C
        let count = 0;
        for (const dev of devices) {
          if (dev.type === 'temperature_sensor' || dev.type === 'thermostat') {
            const rep = { ...dev.reportedState };
            if (rep.temperature !== undefined) rep.temperature = 27.8;
            if (rep.current_temperature !== undefined) rep.current_temperature = 26.9;
            await dataStore.updateDevice(dev.id, {
              reportedState: rep,
              status: 'warning',
            });
            count++;
          }
        }

        await dataStore.addAlert({
          id: `alt-overheat-${Date.now()}`,
          organizationId: devices[0]?.organizationId || '11111111-1111-1111-1111-111111111111',
          deviceId: devices[0]?.id,
          severity: 'critical',
          title: 'High Thermal Load Warning',
          message: 'Zone temperatures escalated past 26.5°C across Innovation Center.',
          status: 'active',
          createdAt: new Date().toISOString(),
        });

        await dataStore.addEvent({
          id: `ev-scenario-${Date.now()}`,
          organizationId: devices[0]?.organizationId || '11111111-1111-1111-1111-111111111111',
          category: 'alert',
          message: 'Scenario Applied: Overheat Thermal Spike',
          createdAt: new Date().toISOString(),
        });

        return { message: 'Overheat scenario triggered! Temperature sensors raised to ~27°C.', affectedCount: count };
      }

      case 'offline_wave': {
        // Mark 3 devices offline
        const targets = devices.slice(2, 5);
        for (const t of targets) {
          await dataStore.updateDevice(t.id, {
            status: 'offline',
            signalStrength: -99,
          });
          await dataStore.addAlert({
            id: `alt-off-${t.id}-${Date.now()}`,
            organizationId: t.organizationId,
            deviceId: t.id,
            severity: 'critical',
            title: `Device Disconnected: ${t.name}`,
            message: `Heartbeat missed for 5+ cycles. Cellular / Zigbee connection lost.`,
            status: 'active',
            createdAt: new Date().toISOString(),
          });
        }

        await dataStore.addEvent({
          id: `ev-scenario-${Date.now()}`,
          organizationId: targets[0]?.organizationId || '11111111-1111-1111-1111-111111111111',
          category: 'alert',
          message: `Scenario Applied: Gateway Packet Loss / Offline Wave (3 devices offline)`,
          createdAt: new Date().toISOString(),
        });

        return { message: 'Offline wave triggered: 3 devices marked offline with critical alerts.', affectedCount: targets.length };
      }

      case 'battery_drain': {
        // Drop batteries on all battery-powered devices
        let count = 0;
        for (const dev of devices) {
          if (dev.batteryLevel !== null) {
            const lowBat = Math.max(8, dev.batteryLevel - 35);
            await dataStore.updateDevice(dev.id, {
              batteryLevel: lowBat,
              status: lowBat < 20 ? 'warning' : dev.status,
            });
            count++;

            if (lowBat < 20) {
              await dataStore.addAlert({
                id: `alt-bat-${dev.id}-${Date.now()}`,
                organizationId: dev.organizationId,
                deviceId: dev.id,
                severity: 'warning',
                title: `Low Battery: ${dev.name}`,
                message: `Battery level critically low (${lowBat}%). Replace AA cells soon.`,
                status: 'active',
                createdAt: new Date().toISOString(),
              });
            }
          }
        }

        await dataStore.addEvent({
          id: `ev-scenario-${Date.now()}`,
          organizationId: devices[0]?.organizationId || '11111111-1111-1111-1111-111111111111',
          category: 'alert',
          message: 'Scenario Applied: Battery Drain Wave on Wireless Sensors',
          createdAt: new Date().toISOString(),
        });

        return { message: `Battery levels drained across ${count} battery sensors.`, affectedCount: count };
      }

      case 'firmware_tick': {
        // Advance firmware progress by 25% on updating devices
        let count = 0;
        for (const dev of devices) {
          if (dev.firmwareStatus === 'installing' || dev.firmwareStatus === 'update_pending') {
            const nextProgress = Math.min(100, dev.firmwareProgress + 25);
            const isDone = nextProgress >= 100;
            await dataStore.updateDevice(dev.id, {
              firmwareStatus: isDone ? 'up_to_date' : 'installing',
              firmwareProgress: isDone ? 0 : nextProgress,
              firmwareVersion: isDone ? (dev.targetFirmwareVersion || 'v2.4.1') : dev.firmwareVersion,
              targetFirmwareVersion: isDone ? null : dev.targetFirmwareVersion,
              status: isDone ? 'online' : 'updating',
            });
            count++;

            await dataStore.addEvent({
              id: `ev-fw-${Date.now()}-${dev.id}`,
              organizationId: dev.organizationId,
              deviceId: dev.id,
              category: 'firmware',
              message: isDone
                ? `Firmware installation complete on ${dev.name}. Running version ${dev.targetFirmwareVersion || 'v2.4.1'}.`
                : `Firmware flashing progress: ${nextProgress}% on ${dev.name}`,
              createdAt: new Date().toISOString(),
            });
          }
        }

        return {
          message: count > 0 ? `Advanced OTA firmware progress on ${count} devices.` : 'No devices currently in updating status. Initiate an update first.',
          affectedCount: count,
        };
      }

      case 'reconnect_all': {
        // Reconnect all offline and warning devices
        let count = 0;
        for (const dev of devices) {
          if (dev.status === 'offline' || dev.status === 'warning') {
            await dataStore.updateDevice(dev.id, {
              status: 'online',
              signalStrength: -55,
              isReconnecting: false,
              batteryLevel: dev.batteryLevel !== null ? Math.max(dev.batteryLevel, 85) : null,
            });
            count++;
          }
        }

        // Auto resolve active disconnect alerts
        const alerts = await dataStore.getAlerts();
        for (const alt of alerts) {
          if (alt.status === 'active' && (alt.title.includes('Disconnected') || alt.title.includes('Heartbeat'))) {
            await dataStore.updateAlert(alt.id, {
              status: 'resolved',
              resolvedAt: new Date().toISOString(),
            });
          }
        }

        await dataStore.addEvent({
          id: `ev-scenario-${Date.now()}`,
          organizationId: devices[0]?.organizationId || '11111111-1111-1111-1111-111111111111',
          category: 'system',
          message: 'All offline gateways and sensors reconnected to ACME IoT cloud.',
          createdAt: new Date().toISOString(),
        });

        return { message: `Reconnected ${count} devices successfully.`, affectedCount: count };
      }

      case 'reset': {
        await dataStore.resetData();
        return { message: 'Demo environment reset to baseline 20 devices & 2 organizations.', affectedCount: 20 };
      }

      case 'normal_jitter':
      default: {
        const res = await this.advanceTick();
        return { message: `Normal ambient tick completed (${res.devicesUpdated} telemetry updates).`, affectedCount: res.devicesUpdated };
      }
    }
  },

  /**
   * Starts an OTA firmware update deployment on a device.
   */
  async startFirmwareUpdate(deviceId: string, targetVersion: string): Promise<boolean> {
    const dev = await dataStore.getDeviceById(deviceId);
    if (!dev) return false;

    await dataStore.updateDevice(deviceId, {
      targetFirmwareVersion: targetVersion,
      firmwareStatus: 'installing',
      firmwareProgress: 15,
      status: 'updating',
    });

    await dataStore.addEvent({
      id: `ev-fw-start-${Date.now()}`,
      organizationId: dev.organizationId,
      deviceId: dev.id,
      category: 'firmware',
      message: `OTA firmware update initiated for ${dev.name} to ${targetVersion}`,
      createdAt: new Date().toISOString(),
    });

    return true;
  },

  /**
   * Rolls back a firmware version to the previous stable build.
   */
  async rollbackFirmware(deviceId: string): Promise<boolean> {
    const dev = await dataStore.getDeviceById(deviceId);
    if (!dev) return false;

    const rollbackVersion = 'v2.3.8';
    await dataStore.updateDevice(deviceId, {
      firmwareVersion: rollbackVersion,
      targetFirmwareVersion: null,
      firmwareStatus: 'rolled_back',
      firmwareProgress: 0,
      status: 'online',
    });

    await dataStore.addEvent({
      id: `ev-fw-rb-${Date.now()}`,
      organizationId: dev.organizationId,
      deviceId: dev.id,
      category: 'firmware',
      message: `Rollback applied to ${dev.name}: reverted to ${rollbackVersion}`,
      createdAt: new Date().toISOString(),
    });

    return true;
  },

  /**
   * Pings / forces immediate reconnection of a device.
   */
  async reconnectDevice(deviceId: string): Promise<boolean> {
    const dev = await dataStore.getDeviceById(deviceId);
    if (!dev) return false;

    await dataStore.updateDevice(deviceId, {
      isReconnecting: true,
    });

    // Simulate short network delay then restore
    await new Promise((r) => setTimeout(r, 600));

    await dataStore.updateDevice(deviceId, {
      status: 'online',
      isReconnecting: false,
      signalStrength: -58,
      lastSeenAt: new Date().toISOString(),
    });

    await dataStore.addEvent({
      id: `ev-rec-${Date.now()}`,
      organizationId: dev.organizationId,
      deviceId: dev.id,
      category: 'system',
      message: `Device ${dev.name} manually reconnected via HTTP heartbeat handshake.`,
      createdAt: new Date().toISOString(),
    });

    return true;
  },
};
