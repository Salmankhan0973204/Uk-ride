import type { RequestHandler } from 'express';
import { sendSuccess } from '../../shared/response.js';
import type { SettingsInput } from './settings.schemas.js';
import { getSettings, publicConfig, setSettings } from './settings.service.js';

/** Public: the rules the customer site shows and checks before it asks for a quote. */
export const config: RequestHandler = async (_req, res) => {
  // A minute is short enough that a change by an admin reaches customers quickly.
  res.set('Cache-Control', 'public, max-age=60');
  sendSuccess(res, { message: 'Configuration', data: await publicConfig() });
};

/** Admin: every setting. */
export const read: RequestHandler = async (_req, res) => {
  res.set('Cache-Control', 'no-store');
  sendSuccess(res, { message: 'Settings', data: { settings: await getSettings() } });
};

/** Admin: replaces every setting. */
export const replace: RequestHandler = async (req, res) => {
  const settings = await setSettings(req.body as SettingsInput);
  sendSuccess(res, { message: 'Settings saved', data: { settings } });
};
