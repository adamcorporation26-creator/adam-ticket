import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    })
  : null;

export function isSupabaseConfigured() {
  return Boolean(supabase && supabaseUrl && supabaseKey);
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
    console.error('[Supabase] Error fetching panels:', err.message);
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
    console.error(`[Supabase] Error saving panel ${id}:`, err.message);
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
    console.error('[Supabase] Error fetching tickets:', err.message);
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
    console.error(`[Supabase] Error saving ticket ${ticket.id}:`, err.message);
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
    console.error('[Supabase] Error saving all tickets:', err.message);
  }
}

export async function deleteTicketFromSupabase(ticketId) {
  if (!supabase || !ticketId) return;
  try {
    const { error } = await supabase.from('tickets').delete().eq('id', ticketId);
    if (error) throw error;
  } catch (err) {
    console.error(`[Supabase] Error deleting ticket ${ticketId}:`, err.message);
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
    console.error('[Supabase] Error fetching settings:', err.message);
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
    console.error(`[Supabase] Error saving setting ${key}:`, err.message);
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
    console.error('[Supabase] Error fetching audit logs:', err.message);
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
    console.error('[Supabase] Error saving audit log:', err.message);
  }
}
