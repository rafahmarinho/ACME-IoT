import type { VercelRequest, VercelResponse } from '@vercel/node';

export interface TelemetryPayload {
  deviceId: string;
  metric: string;
  value: number;
  unit: string;
  reportedState?: Record<string, any>;
  batteryLevel?: number;
  signalStrength?: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS for web client
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
    const { deviceId, metric, value, unit, reportedState, batteryLevel, signalStrength } = req.body as TelemetryPayload;

    if (!deviceId || metric === undefined || value === undefined) {
      return res.status(400).json({ error: 'Missing required fields: deviceId, metric, value' });
    }

    const timestamp = new Date().toISOString();

    // Process ingestion response (compatible with Supabase or standalone edge)
    const ingestionResult = {
      status: 'acknowledged',
      deviceId,
      recordedAt: timestamp,
      metric,
      value,
      unit: unit || '',
      reportedState: reportedState || {},
      batteryLevel: batteryLevel ?? null,
      signalStrength: signalStrength ?? -55,
      processedBy: 'ACME IoT Ingestion Gateway (Vercel Serverless)',
    };

    return res.status(200).json(ingestionResult);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
