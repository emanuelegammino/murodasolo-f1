// Chiave pubblica per iscriversi alle notifiche (nessun dato riservato).
import { json, pushConfigured } from '../lib/push-common.mjs';
export default async () => json({ enabled: pushConfigured(), publicKey: process.env.VAPID_PUBLIC_KEY || '' });
export const config = { path: '/api/push-key' };
