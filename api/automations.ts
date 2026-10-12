import type { VercelRequest, VercelResponse } from '@vercel/node';

export interface AutomationExecutionRequest {
  automationId: string;
  triggerDeviceId: string;
  conditionType: 'temperature_above' | 'temperature_below' | 'occupancy_true' | 'occupancy_false' | 'power_above';
  conditionValue: number;
  currentValue: number;
  intervalMinutes: number;
  lastTriggeredAt?: string;
  actionDeviceId?: string;
  actionType: 'set_temperature' | 'toggle_power' | 'send_alert';
  actionPayload: Record<string, any>;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const payload = req.body as AutomationExecutionRequest;
    const now = new Date();

    // Check interval cooldown
    if (payload.lastTriggeredAt) {
      const lastTrigger = new Date(payload.lastTriggeredAt);
      const minutesSinceLast = (now.getTime() - lastTrigger.getTime()) / (1000 * 60);
      if (minutesSinceLast < (payload.intervalMinutes || 15)) {
        return res.status(200).json({
          status: 'skipped_cooldown',
          message: `Execution suppressed by ${payload.intervalMinutes}m cooldown interval (${Math.round(payload.intervalMinutes - minutesSinceLast)}m remaining).`,
          cooldownRemainingMinutes: Math.round(payload.intervalMinutes - minutesSinceLast),
        });
      }
    }

    // Evaluate Condition
    let conditionMet = false;
    switch (payload.conditionType) {
      case 'temperature_above':
        conditionMet = payload.currentValue > payload.conditionValue;
        break;
      case 'temperature_below':
        conditionMet = payload.currentValue < payload.conditionValue;
        break;
      case 'occupancy_true':
        conditionMet = Boolean(payload.currentValue);
        break;
      case 'occupancy_false':
        conditionMet = !Boolean(payload.currentValue);
        break;
      case 'power_above':
        conditionMet = payload.currentValue > payload.conditionValue;
        break;
      default:
        conditionMet = false;
    }

    if (!conditionMet) {
      return res.status(200).json({
        status: 'condition_not_met',
        message: `Condition ${payload.conditionType} (${payload.conditionValue}) was not met by current value (${payload.currentValue}).`,
      });
    }

    // Execute Action Dispatch
    const actionResult = {
      status: 'success',
      automationId: payload.automationId,
      executedAt: now.toISOString(),
      actionType: payload.actionType,
      targetDevice: payload.actionDeviceId || 'global-alert-bus',
      payload: payload.actionPayload,
      message: `Automation triggered successfully! Action ${payload.actionType} dispatched to ${payload.actionDeviceId || 'alerts'}.`,
    };

    return res.status(200).json(actionResult);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
