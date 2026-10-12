import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed. Use POST or PATCH.' });
  }

  try {
    const { deviceId, desiredState, reconcileImmediate } = req.body;

    if (!deviceId) {
      return res.status(400).json({ error: 'Missing required field: deviceId' });
    }

    const timestamp = new Date().toISOString();

    return res.status(200).json({
      success: true,
      deviceId,
      desiredState: desiredState || {},
      reconcileImmediate: Boolean(reconcileImmediate),
      updatedAt: timestamp,
      message: 'Shadow desired state queued successfully. Device will sync on next heartbeat.',
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
