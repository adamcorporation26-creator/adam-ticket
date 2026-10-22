import React, { useState, useEffect } from 'react';
import { ScrollText, Search, Shield, RefreshCw, Clock, CheckCircle2, User, Activity } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit-logs');
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.action?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    return matchesSearch && matchesAction;
  });

  const getBadgeStyle = (action) => {
    switch (action) {
      case 'TICKET_CREATE':
        return 'bg-purple-950/70 text-purple-400 border-purple-800/50';
      case 'TICKET_CLOSE':
        return 'bg-red-950/70 text-red-400 border-red-800/50';
      case 'PANEL_SAVED':
      case 'PANEL_UPDATE':
        return 'bg-yellow-950/70 text-yellow-400 border-yellow-800/50';
      case 'PANEL_DEPLOY':
        return 'bg-emerald-950/70 text-emerald-400 border-emerald-800/50';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-100 tracking-tight flex items-center gap-2.5">
            <ScrollText className="w-6 h-6 text-yellow-400" />
            <span>Audit Logs</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">Real-time audit log history for panel edits, bot events, and ticket activity.</p>
        </div>

        <button
          onClick={fetchLogs}
          className="px-3.5 py-1.5 bg-[#151518] hover:bg-zinc-800 border border-zinc-700/80 rounded-xl text-xs font-semibold text-zinc-300 flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-yellow-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by user, action, or details..."
            className="w-full bg-[#151518] border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {[
            { id: 'all', label: 'All Events' },
            { id: 'PANEL_SAVED', label: 'Panel Saved' },
            { id: 'PANEL_DEPLOY', label: 'Deployed' },
            { id: 'TICKET_CREATE', label: 'Ticket Created' },
            { id: 'TICKET_CLOSE', label: 'Ticket Closed' }
          ].map(action => (
            <button
              key={action.id}
              onClick={() => setFilterAction(action.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterAction === action.id
                  ? 'bg-yellow-500 text-black shadow-md'
                  : 'bg-[#151518] border border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-[#151518] border border-zinc-800/80 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-800/80 text-zinc-400 bg-[#18181c]/60">
              <th className="py-3.5 px-4 font-semibold">Timestamp</th>
              <th className="py-3.5 px-4 font-semibold">Action</th>
              <th className="py-3.5 px-4 font-semibold">User / Trigger</th>
              <th className="py-3.5 px-4 font-semibold">Event Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50 text-zinc-300 font-sans">
            {filteredLogs.length > 0 ? (
              filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-zinc-800/30 transition-all">
                  <td className="py-3.5 px-4 text-zinc-400 text-[11px] font-mono whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-md border text-[10px] font-extrabold uppercase font-mono tracking-wider ${getBadgeStyle(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-yellow-400">
                        {log.user?.[0] || 'A'}
                      </div>
                      <span className="font-semibold text-zinc-200 text-xs">{log.user || 'System'}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-200 leading-relaxed font-medium">
                    {log.details}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="py-10 text-center text-zinc-500">
                  {loading ? 'Loading audit logs...' : 'No audit log records found matching your filter.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
