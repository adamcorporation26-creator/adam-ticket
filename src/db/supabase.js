import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import WebSocket from 'ws';

if (!globalThis.WebSocket) {
  globalThis.WebSocket = WebSocket;
}

dotenv.config();

function formatSupabaseUrl(url) {
  if (!url) return null;
  let cleaned = url.trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '');
  if (!cleaned || cleaned.includes('your-project') || cleaned.includes('<')) return null;
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `https://${cleaned}`;
  }
  return cleaned;
}

function cleanKey(key) {
  if (!key) return null;
  const cleaned = key.trim().replace(/^["']|["']$/g, '');
  if (!cleaned || cleaned.includes('your_') || cleaned.includes('<')) return null;
  return cleaned;
}

const supabaseUrl = formatSupabaseUrl(process.env.SUPABASE_URL);
const supabaseKey = cleanKey(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY);

if (process.env.SUPABASE_URL && !supabaseUrl) {
  console.warn('[Supabase] ⚠️ SUPABASE_URL appears to be invalid or placeholder:', process.env.SUPABASE_URL);
}

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      realtime: {
        websocket: WebSocket
      }
    })
  : null;

export function isSupabaseConfigured() {
  return Boolean(supabase && supabaseUrl && supabaseKey);
}

function logSupabaseError(action, err) {
  const cause = err?.cause ? (err.cause.message || err.cause.code || JSON.stringify(err.cause)) : '';
  console.error(`[Supabase] ${action}:`, err.message, cause ? `(Cause: ${cause})` : '');
}

// ============================================================================
// PANELS
// ============================================================================
export async function fetchPanelsFromSupabase() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('panels').select('*');
    if (error) throw error;
    const result = {};
    for (const row of data || []) {
      result[row.id] = row.data || {};
    }
    return result;
  } catch (err) {
    logSupabaseError('Error fetching panels', err);
    return null;
  }
}

export async function upsertPanelToSupabase(id, panelData) {
  if (!supabase) return;
  try {
    const payload = {
      id,
      name: panelData.name || id,
      data: panelData,
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from('panels').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  } catch (err) {
    logSupabaseError(`Error saving panel ${id}`, err);
  }
}

// ============================================================================
// TICKETS
// ============================================================================
export async function fetchTicketsFromSupabase() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('tickets').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(row => ({
      ...(row.data || {}),
      id: row.id,
      ticketNumber: row.data?.ticketNumber || row.ticket_number,
      ticketName: row.data?.ticketName || row.ticket_name,
      status: row.status || row.data?.status || 'open',
      channelId: row.channel_id || row.data?.channelId,
      guildId: row.guild_id || row.data?.guildId,
      authorId: row.author_id || row.data?.authorId
    }));
  } catch (err) {
    logSupabaseError('Error fetching tickets', err);
    return null;
  }
}

export async function upsertTicketToSupabase(ticket) {
  if (!supabase || !ticket || !ticket.id) return;
  try {
    const payload = {
      id: ticket.id,
      ticket_number: ticket.ticketNumber || null,
      ticket_name: ticket.ticketName || '',
      topic: ticket.topic || '',
      status: ticket.status || 'open',
      channel_id: ticket.channelId || null,
      guild_id: ticket.guildId || null,
      author_id: ticket.authorId || null,
      data: ticket,
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from('tickets').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  } catch (err) {
    logSupabaseError(`Error saving ticket ${ticket.id}`, err);
  }
}

export async function upsertAllTicketsToSupabase(ticketsList) {
  if (!supabase || !Array.isArray(ticketsList)) return;
  try {
    const uniqueMap = new Map();
    for (const ticket of ticketsList) {
      if (ticket && ticket.id) {
        uniqueMap.set(ticket.id, ticket);
      }
    }
    const payloads = Array.from(uniqueMap.values()).map(ticket => ({
      id: ticket.id,
      ticket_number: ticket.ticketNumber || null,
      ticket_name: ticket.ticketName || '',
      topic: ticket.topic || '',
      status: ticket.status || 'open',
      channel_id: ticket.channelId || null,
      guild_id: ticket.guildId || null,
      author_id: ticket.authorId || null,
      data: ticket,
      updated_at: new Date().toISOString()
    }));
    const { error } = await supabase.from('tickets').upsert(payloads, { onConflict: 'id' });
    if (error) throw error;
  } catch (err) {
    logSupabaseError('Error saving all tickets', err);
  }
}

export async function deleteTicketFromSupabase(ticketId) {
  if (!supabase || !ticketId) return;
  try {
    const { error } = await supabase.from('tickets').delete().eq('id', ticketId);
    if (error) throw error;
  } catch (err) {
    logSupabaseError(`Error deleting ticket ${ticketId}`, err);
  }
}

// ============================================================================
// SETTINGS
// ============================================================================
export async function fetchSettingsFromSupabase() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('settings').select('*');
    if (error) throw error;
    const result = {};
    for (const row of data || []) {
      result[row.key] = row.value;
    }
    return result;
  } catch (err) {
    logSupabaseError('Error fetching settings', err);
    return null;
  }
}

export async function upsertSettingToSupabase(key, value) {
  if (!supabase) return;
  try {
    const payload = {
      key,
      value,
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from('settings').upsert(payload, { onConflict: 'key' });
    if (error) throw error;
  } catch (err) {
    logSupabaseError(`Error saving setting ${key}`, err);
  }
}

// ============================================================================
// AUDIT LOGS
// ============================================================================
export async function fetchAuditLogsFromSupabase() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    return (data || []).map(row => row.data || {
      id: row.id,
      action: row.action,
      details: row.details,
      user: row.user_name,
      timestamp: row.created_at
    });
  } catch (err) {
    logSupabaseError('Error fetching audit logs', err);
    return null;
  }
}

export async function upsertAuditLogToSupabase(log) {
  if (!supabase || !log) return;
  try {
    const payload = {
      id: log.id || Date.now(),
      action: log.action || 'ACTION',
      details: log.details || '',
      user_name: log.user || 'System',
      data: log,
      created_at: log.timestamp || new Date().toISOString()
    };
    const { error } = await supabase.from('audit_logs').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  } catch (err) {
    logSupabaseError('Error saving audit log', err);
  }
}
