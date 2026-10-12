import type { VercelRequest, VercelResponse } from '@vercel/node';

export interface ScenarioRequest {
  scenario: 'normal_jitter' | 'overheat_spike' | 'offline_wave' | 'battery_drain' | 'firmware_tick' | 'reconnect_all' | 'reset';
  targetOrgId?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use POST or GET.' });
  }

  try {
    const scenario = (req.body?.scenario || req.query.scenario || 'normal_jitter') as string;
    const timestamp = new Date().toISOString();

    const responses: Record<string, any> = {
      normal_jitter: {
        scenario: 'normal_jitter',
        summary: 'Simulated ambient drift applied to 20 devices (temp ±0.2°C, power ±15W).',
        eventsGenerated: 4,
      },
      overheat_spike: {
        scenario: 'overheat_spike',
        summary: 'HVAC thermal load spike generated. Boardroom temp raised to 25.8°C; Overheat cooling automation engaged.',
        eventsGenerated: 2,
        alertsCreated: ['High Temperature Warning: Boardroom'],
      },
      offline_wave: {
        scenario: 'offline_wave',
        summary: 'Simulated gateway packet loss. 3 fringe devices marked offline.',
        eventsGenerated: 3,
        alertsCreated: ['Device Heartbeat Timeout: Loading Dock Staging'],
      },
      battery_drain: {
        scenario: 'battery_drain',
        summary: 'Battery levels stepped down across wireless sensors. Low battery alert triggered.',
        eventsGenerated: 2,
        alertsCreated: ['Low Battery Warning: Dock Gate Occupancy Radar'],
      },
      firmware_tick: {
        scenario: 'firmware_tick',
        summary: 'OTA firmware distribution advanced +25% across pending devices.',
        eventsGenerated: 1,
      },
      reconnect_all: {
        scenario: 'reconnect_all',
        summary: 'Cellular and Wi-Fi gateways restored. All 20 devices reconnected and reporting online.',
        eventsGenerated: 5,
        alertsResolved: 2,
      },
      reset: {
        scenario: 'reset',
        summary: 'Simulation environment restored to baseline golden demo state.',
        eventsGenerated: 1,
      },
    };

    const result = responses[scenario] || responses.normal_jitter;

    return res.status(200).json({
      success: true,
      timestamp,
      ...result,
      engine: 'ACME IoT Simulation Engine v1.0',
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
