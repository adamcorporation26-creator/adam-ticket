import React, { useState } from 'react';
import { Search, Filter, MessageSquare, CheckCircle, Clock, Trash2, X } from 'lucide-react';

export default function TicketHistory({ tickets = [], onCloseTicket }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.ticketName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.authorTag?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-zinc-100 tracking-tight">Ticket History</h1>
        <p className="text-xs text-zinc-400 mt-0.5">View and manage active and closed ticket transcripts across your Discord server.</p>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ticket name or author..."
            className="w-full bg-[#151518] border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {['all', 'open', 'in_progress', 'resolved'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                filterStatus === status
                  ? 'bg-yellow-500 text-black shadow-md'
                  : 'bg-[#151518] border border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Ticket Grid / Table */}
      <div className="bg-[#151518] border border-zinc-800/80 rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-800/80 text-zinc-400 bg-[#18181c]/60">
              <th className="py-3.5 px-4 font-semibold">Ticket ID</th>
              <th className="py-3.5 px-4 font-semibold">Ticket Name</th>
              <th className="py-3.5 px-4 font-semibold">Author</th>
              <th className="py-3.5 px-4 font-semibold">Status</th>
              <th className="py-3.5 px-4 font-semibold">Rating & Review</th>
              <th className="py-3.5 px-4 font-semibold">Open Time</th>
              <th className="py-3.5 px-4 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
            {filteredTickets.length > 0 ? (
              filteredTickets.map(t => (
                <tr key={t.id} className="hover:bg-zinc-800/30 transition-all">
                  <td className="py-3.5 px-4 font-mono text-zinc-400 text-[11px]">{t.id}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-zinc-100">{t.ticketName}</div>
                    {t.intakeData && (
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        {t.intakeData.product && (
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-medium">
                            🛍️ {t.intakeData.product}
                          </span>
                        )}
                        {t.intakeData.issueSubject && (
                          <span className="px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[10px] font-medium">
                            📌 {t.intakeData.issueSubject}
                          </span>
                        )}
                        {t.intakeData.paymentMethod && (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-medium">
                            💳 {t.intakeData.paymentMethod}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">{t.authorTag || 'User'}</td>
                  <td className="py-3.5 px-4">
                    {t.status === 'resolved' || t.status === 'closed' ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 text-[11px] font-semibold">
                        Resolved
                      </span>
                    ) : t.status === 'in_progress' ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-950/60 border border-amber-800/50 text-amber-400 text-[11px] font-semibold">
                        In Progress
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-950/60 border border-purple-800/50 text-purple-400 text-[11px] font-semibold">
                        Open
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {t.rating ? (
                      <div className="space-y-0.5">
                        <div className="text-yellow-400 font-bold text-xs">
                          {'⭐'.repeat(t.rating)} <span className="text-zinc-400 font-normal">({t.rating}/5)</span>
                        </div>
                        {t.feedback && (
                          <div className="text-[11px] text-zinc-300 italic truncate max-w-[200px]">
                            "{t.feedback}"
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-500 text-[11px]">No rating yet</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-zinc-400 text-[11px]">
                    {new Date(t.openTime).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedTicket(t)}
                        className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-yellow-400 rounded-md text-[11px] font-bold border border-zinc-700 transition-all"
                      >
                        Quick View
                      </button>
                      <a
                        href={`/transcripts/${t.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 rounded-md text-[11px] font-bold border border-indigo-700/50 transition-all inline-flex items-center gap-1"
                      >
                        🌐 HTML
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="py-8 text-center text-zinc-500">
                  No tickets found matching your query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Transcript Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181c] border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-zinc-100 text-sm">Transcript: {selectedTicket.ticketName}</h3>
                <p className="text-[11px] text-zinc-400">Created by {selectedTicket.authorTag} • Status: {selectedTicket.status}</p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-zinc-500 hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Intake details box inside modal */}
            {selectedTicket.intakeData && (
              <div className="bg-amber-500/10 border-b border-amber-500/20 p-3.5 text-xs text-zinc-200 space-y-1">
                <div className="font-bold text-amber-400 text-[11px] uppercase tracking-wider flex items-center gap-1">
                  📋 Customer Intake Responses
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  {selectedTicket.intakeData.product && (
                    <div><span className="text-zinc-400 font-medium">Product:</span> <span className="font-semibold text-zinc-100">{selectedTicket.intakeData.product}</span></div>
                  )}
                  {selectedTicket.intakeData.paymentMethod && (
                    <div><span className="text-zinc-400 font-medium">Payment:</span> <span className="font-semibold text-zinc-100">{selectedTicket.intakeData.paymentMethod}</span></div>
                  )}
                  {selectedTicket.intakeData.issueSubject && (
                    <div><span className="text-zinc-400 font-medium">Subject:</span> <span className="font-semibold text-zinc-100">{selectedTicket.intakeData.issueSubject}</span></div>
                  )}
                  {selectedTicket.intakeData.reference && (
                    <div><span className="text-zinc-400 font-medium">Reference:</span> <span className="font-semibold text-zinc-100">{selectedTicket.intakeData.reference}</span></div>
                  )}
                </div>
                {selectedTicket.intakeData.issueDetails && (
                  <div className="text-[11px] pt-1 text-zinc-300">
                    <span className="text-zinc-400 font-medium">Details:</span> {selectedTicket.intakeData.issueDetails}
                  </div>
                )}
                {selectedTicket.intakeData.notes && (
                  <div className="text-[11px] pt-0.5 text-zinc-300">
                    <span className="text-zinc-400 font-medium">Notes:</span> {selectedTicket.intakeData.notes}
                  </div>
                )}
              </div>
            )}

            <div className="p-4 flex-1 overflow-y-auto space-y-3 font-mono text-xs bg-[#121215]">
              {(selectedTicket.messages || []).map((msg, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-[#1a1a1e] border border-zinc-800/60 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 font-sans">
                    <span className="font-bold text-yellow-400">{msg.author}</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-zinc-200 text-xs font-sans">{msg.content}</div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-zinc-800 flex items-center justify-between bg-[#18181c]">
              <a
                href={`/transcripts/${selectedTicket.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md"
              >
                🌐 Open Interactive HTML Transcript
              </a>
              <div className="flex items-center gap-2">
                {selectedTicket.status !== 'resolved' && (
                  <button
                    onClick={() => {
                      onCloseTicket(selectedTicket.id);
                      setSelectedTicket(null);
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all"
                  >
                    Close Ticket
                  </button>
                )}
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl transition-all"
                >
                  Close View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
