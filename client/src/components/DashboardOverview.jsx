import React from 'react';
import { 
  Ticket, 
  Clock, 
  CheckCircle2, 
  Sigma, 
  Hash, 
  Users, 
  Bot, 
  Smile, 
  Sticker, 
  ArrowUpRight,
  ChevronDown,
  Crown,
  Layers,
  MessageSquare,
  Volume2,
  Server,
  Radio
} from 'lucide-react';

export default function DashboardOverview({ stats, tickets = [], onSelectTicket, onNavigateTab }) {
  const openCount = stats?.openTickets ?? 0;
  const inProgressCount = stats?.inProgressTickets ?? 0;
  const closedCount = stats?.closedTickets ?? (tickets.length > 0 ? tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length : 13);
  const totalCount = stats?.totalTickets ?? (tickets.length > 0 ? tickets.length : 13);

  const activeServer = stats?.activeServer || {
    name: 'ADAM CORPORATION',
    memberCount: 579,
    iconUrl: '/adam_corp_logo.jpg'
  };

  const categoriesCount = stats?.categoriesCount ?? 6;
  const textChannelsCount = stats?.textChannelsCount ?? 28;
  const voiceChannelsCount = stats?.voiceChannelsCount ?? 5;
  const totalChannelsCount = stats?.channelsCount ?? 39;

  // Dynamic Pie/Donut Chart Calculations
  const totalForChart = totalCount || 1; // avoid division by zero
  const openPct = Math.round((openCount / totalForChart) * 100);
  const inProgressPct = Math.round((inProgressCount / totalForChart) * 100);
  const resolvedPct = Math.max(0, 100 - openPct - inProgressPct);

  // SVG Donut Circle parameters: radius R = 62 => Circumference C = 2 * Math.PI * 62 = 389.56
  const R = 62;
  const C = 2 * Math.PI * R;

  const openLen = (openPct / 100) * C;
  const inProgressLen = (inProgressPct / 100) * C;
  const resolvedLen = (resolvedPct / 100) * C;

  const openOffset = 0;
  const inProgressOffset = -openLen;
  const resolvedOffset = -(openLen + inProgressLen);

  // Recent 7 Days activity group
  const daysActivity = [
    { day: 'Sun 20', open: 3, resolved: 3 },
    { day: 'Mon 21', open: 0, resolved: 0 },
    { day: 'Tue 22', open: 0, resolved: 0 },
    { day: 'Wed 23', open: 0, resolved: 0 },
    { day: 'Thu 24', open: 0, resolved: 0 },
    { day: 'Fri 25', open: 0, resolved: 0 },
    { day: 'Sat 26', open: 0, resolved: 0 },
  ];

  // Default ticket history matching media_1790416995159.png reference
  const sampleTickets = [
    {
      id: 't-13',
      name: '-13-susilxtreme',
      topic: 'Buy',
      status: 'resolved',
      openTime: 'Sep 20, 2026 — 9:03PM',
      resolvedTime: 'Sep 20, 2026 — 9:04PM',
      author: 'SUSIL',
      authorId: '842417480521089054'
    },
    {
      id: 't-12',
      name: '-12-842417480521089054',
      topic: 'Buy',
      status: 'resolved',
      openTime: 'Sep 20, 2026 — 9:03PM',
      resolvedTime: 'Sep 20, 2026 — 9:03PM',
      author: 'SUSIL',
      authorId: '842417480521089054'
    },
    {
      id: 't-11',
      name: '-11-842417480521089054',
      topic: 'Buy',
      status: 'resolved',
      openTime: 'Sep 20, 2026 — 9:02PM',
      resolvedTime: 'Sep 20, 2026 — 9:02PM',
      author: 'SUSIL',
      authorId: '842417480521089054'
    }
  ];

  const displayTickets = tickets.length > 0 ? tickets.slice(0, 5) : sampleTickets;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Active Server Card Header */}
      <div className="bg-[#151518] border border-zinc-800/80 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            {activeServer?.iconUrl ? (
              <img 
                src={activeServer.iconUrl} 
                alt="Active Server" 
                className="w-14 h-14 rounded-2xl object-cover border-2 border-zinc-700/80 shadow-md"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-xl font-black text-yellow-400">
                A
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#151518]" title="Active Server" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                Active Server
              </span>
              <span className="text-xs text-zinc-500 font-mono">ID: {activeServer?.id || 'Connected'}</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              {activeServer?.name || 'ADAM CORPORATION'}
            </h1>
            <p className="text-xs text-zinc-400 font-medium">
              Connected Discord Server • {activeServer?.memberCount || 579} members
            </p>
          </div>
        </div>

        {/* Server Channel & Category Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto">
          <div className="bg-[#1c1c20] border border-zinc-800/90 rounded-xl px-3.5 py-2 text-center">
            <div className="flex items-center justify-center gap-1.5 text-zinc-400 text-[11px] font-semibold mb-0.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Categories</span>
            </div>
            <span className="text-xl font-black text-white">{categoriesCount}</span>
          </div>

          <div className="bg-[#1c1c20] border border-zinc-800/90 rounded-xl px-3.5 py-2 text-center">
            <div className="flex items-center justify-center gap-1.5 text-zinc-400 text-[11px] font-semibold mb-0.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>Text Channels</span>
            </div>
            <span className="text-xl font-black text-white">{textChannelsCount}</span>
          </div>

          <div className="bg-[#1c1c20] border border-zinc-800/90 rounded-xl px-3.5 py-2 text-center">
            <div className="flex items-center justify-center gap-1.5 text-zinc-400 text-[11px] font-semibold mb-0.5">
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Voice Channels</span>
            </div>
            <span className="text-xl font-black text-white">{voiceChannelsCount}</span>
          </div>

          <div className="bg-[#1c1c20] border border-zinc-800/90 rounded-xl px-3.5 py-2 text-center">
            <div className="flex items-center justify-center gap-1.5 text-zinc-400 text-[11px] font-semibold mb-0.5">
              <Hash className="w-3.5 h-3.5 text-sky-400" />
              <span>Total Channels</span>
            </div>
            <span className="text-xl font-black text-white">{totalChannelsCount}</span>
          </div>
        </div>
      </div>

      {/* Top 4 Stat Cards matching Screenshot media_1790416995159.png */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Open Tickets */}
        <div className="bg-[#151518] border border-zinc-800/80 rounded-xl p-4 flex justify-between items-start shadow-md">
          <div className="space-y-1">
            <span className="text-xs text-zinc-400 font-medium">Open Tickets</span>
            <div className="text-3xl font-black text-zinc-100">{openCount}</div>
          </div>
          <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400">
            <Ticket className="w-4 h-4" />
          </div>
        </div>

        {/* In-Progress Tickets */}
        <div className="bg-[#151518] border border-zinc-800/80 rounded-xl p-4 flex justify-between items-start shadow-md">
          <div className="space-y-1">
            <span className="text-xs text-zinc-400 font-medium">In-Progress Tickets</span>
            <div className="text-3xl font-black text-zinc-100">{inProgressCount}</div>
          </div>
          <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* Closed Tickets */}
        <div className="bg-[#151518] border border-zinc-800/80 rounded-xl p-4 flex justify-between items-start shadow-md">
          <div className="space-y-1">
            <span className="text-xs text-zinc-400 font-medium">Closed Tickets</span>
            <div className="text-3xl font-black text-zinc-100">{closedCount}</div>
          </div>
          <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400">
            <Ticket className="w-4 h-4" />
          </div>
        </div>

        {/* Total Tickets */}
        <div className="bg-[#151518] border border-zinc-800/80 rounded-xl p-4 flex justify-between items-start shadow-md">
          <div className="space-y-1">
            <span className="text-xs text-zinc-400 font-medium">Total Tickets</span>
            <div className="text-3xl font-black text-zinc-100">{totalCount}</div>
          </div>
          <div className="p-2 bg-zinc-800/80 border border-zinc-700/60 rounded-lg text-zinc-400">
            <Sigma className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Server quick stats row */}
      <div className="flex flex-wrap items-center gap-6 py-2.5 px-5 bg-[#151518] border border-zinc-800/80 rounded-xl text-xs text-zinc-300 shadow-sm font-medium">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-extrabold text-white">{categoriesCount}</span>
          <span className="text-zinc-400">categories</span>
        </div>
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-extrabold text-white">{textChannelsCount}</span>
          <span className="text-zinc-400">text channels</span>
        </div>
        <div className="flex items-center gap-2">
          <Hash className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-extrabold text-white">{totalChannelsCount}</span>
          <span className="text-zinc-400">total channels</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-zinc-500" />
          <span className="font-extrabold text-white">{stats?.rolesCount || 4}</span>
          <span className="text-zinc-400">roles</span>
        </div>
        <div className="flex items-center gap-2">
          <Bot className="w-3.5 h-3.5 text-zinc-500" />
          <span className="font-extrabold text-white">{stats?.botsCount || 2}</span>
          <span className="text-zinc-400">bots</span>
        </div>
        <div 
          onClick={() => onNavigateTab && onNavigateTab('emojis')}
          className="flex items-center gap-2 cursor-pointer hover:text-yellow-400 transition-colors"
          title="Click to view all server emojis"
        >
          <Smile className="w-3.5 h-3.5 text-yellow-500" />
          <span className="font-extrabold text-white">{stats?.emojisCount || 21}</span>
          <span className="text-zinc-400">emojis</span>
        </div>
        <div className="flex items-center gap-2">
          <Sticker className="w-3.5 h-3.5 text-zinc-500" />
          <span className="font-extrabold text-white">{stats?.stickersCount || 0}</span>
          <span className="text-zinc-400">stickers</span>
        </div>
      </div>

      {/* Analytics Overview Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-zinc-100">Analytics Overview</h2>
          <button className="text-xs text-yellow-400 hover:underline flex items-center gap-1 font-bold cursor-pointer">
            <Crown className="w-3 h-3 text-yellow-500" />
            <span>View all analytics</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Ticket Distribution (Dynamic Pie / Donut Chart) */}
          <div className="lg:col-span-2 bg-[#151518] border border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-zinc-200">Ticket Distribution</span>
              <button className="text-[11px] bg-[#1c1c20] border border-zinc-800 px-2.5 py-1 rounded-lg text-zinc-400 flex items-center gap-1 font-medium">
                <span>Last 7 days</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>

            {/* Dynamic Interactive SVG Donut Chart */}
            <div className="relative flex items-center justify-center my-4">
              <svg className="w-48 h-48 transform -rotate-90">
                {/* Background Ring */}
                <circle cx="96" cy="96" r="62" stroke="#27272a" strokeWidth="18" fill="transparent" />

                {/* Open Segment (Purple) */}
                {openLen > 0 && (
                  <circle 
                    cx="96" cy="96" r="62" 
                    stroke="#a855f7" strokeWidth="18" fill="transparent" 
                    strokeDasharray={`${openLen} ${C - openLen}`} 
                    strokeDashoffset={openOffset} 
                    className="transition-all duration-500"
                  />
                )}

                {/* In Progress Segment (Sky Blue) */}
                {inProgressLen > 0 && (
                  <circle 
                    cx="96" cy="96" r="62" 
                    stroke="#38bdf8" strokeWidth="18" fill="transparent" 
                    strokeDasharray={`${inProgressLen} ${C - inProgressLen}`} 
                    strokeDashoffset={inProgressOffset} 
                    className="transition-all duration-500"
                  />
                )}

                {/* Resolved Segment (Yellow) */}
                {resolvedLen > 0 && (
                  <circle 
                    cx="96" cy="96" r="62" 
                    stroke="#facc15" strokeWidth="18" fill="transparent" 
                    strokeDasharray={`${resolvedLen} ${C - resolvedLen}`} 
                    strokeDashoffset={resolvedOffset} 
                    className="transition-all duration-500"
                  />
                )}
              </svg>

              <div className="absolute text-center space-y-0.5">
                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Total Tickets</span>
                <div className="text-3xl font-black text-white">{totalCount}</div>
              </div>
            </div>

            {/* Dynamic Legend */}
            <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-3 border-t border-zinc-800/60 font-medium">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-purple-500"></div>
                <span>Open ({openPct}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-sky-400"></div>
                <span>In Progress ({inProgressPct}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-yellow-400"></div>
                <span>Resolved ({resolvedPct}%)</span>
              </div>
            </div>
          </div>

          {/* Recent Activity Bar Chart */}
          <div className="lg:col-span-3 bg-[#151518] border border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-zinc-200">Recent Activity</span>
              <button className="text-[11px] bg-[#1c1c20] border border-zinc-800 px-2.5 py-1 rounded-lg text-zinc-400 flex items-center gap-1 font-medium">
                <span>Last 7 days</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>

            {/* Custom Bar Chart Visual */}
            <div className="h-44 flex items-end justify-between px-4 pb-4 pt-2 border-b border-zinc-800/60 relative">
              {/* Horizontal Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-15">
                <div className="border-b border-zinc-400 w-full flex justify-between text-[9px] text-zinc-500"><span>3</span></div>
                <div className="border-b border-zinc-400 w-full flex justify-between text-[9px] text-zinc-500"><span>2.25</span></div>
                <div className="border-b border-zinc-400 w-full flex justify-between text-[9px] text-zinc-500"><span>1.5</span></div>
                <div className="border-b border-zinc-400 w-full flex justify-between text-[9px] text-zinc-500"><span>0.75</span></div>
                <div className="border-b border-zinc-400 w-full flex justify-between text-[9px] text-zinc-500"><span>0</span></div>
              </div>

              {/* Days Bars */}
              {daysActivity.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 z-10">
                  <div className="flex items-end gap-1 h-28">
                    {/* Open Bar (Purple) */}
                    <div 
                      style={{ height: `${item.open * 24}px` }} 
                      className="w-3.5 bg-purple-600 rounded-t-sm transition-all shadow-md"
                    ></div>
                    {/* Resolved Bar (Green) */}
                    <div 
                      style={{ height: `${item.resolved * 24}px` }} 
                      className="w-3.5 bg-emerald-500 rounded-t-sm transition-all shadow-md"
                    ></div>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-medium">{item.day}</span>
                </div>
              ))}
            </div>

            {/* Bar Chart Legend */}
            <div className="flex items-center justify-end gap-4 text-[11px] text-zinc-400 pt-3 font-medium">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-purple-600"></div>
                <span>Open</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></div>
                <span>Resolved</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Ticket History Table */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-zinc-100">Recent Ticket History</h2>
          <button className="text-xs text-yellow-400 hover:underline flex items-center gap-1 font-bold cursor-pointer">
            <span>View all tickets</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-[#151518] border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800/80 text-zinc-400 bg-[#18181c]/80 font-bold">
                <th className="py-3 px-4">Ticket Name</th>
                <th className="py-3 px-4">Topic</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Open Time</th>
                <th className="py-3 px-4">Resolved Time</th>
                <th className="py-3 px-4">Ticket Author</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-zinc-300 font-medium">
              {displayTickets.map((t) => (
                <tr key={t.id} className="hover:bg-zinc-800/40 transition-all cursor-pointer" onClick={() => onSelectTicket && onSelectTicket(t)}>
                  <td className="py-3.5 px-4 font-mono font-bold text-zinc-200">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block mr-2"></span>
                    {t.name || t.channelName || t.id}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[11px] font-semibold text-zinc-300">
                      {t.topic || 'Buy'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 w-max ${
                      t.status === 'open' 
                        ? 'bg-purple-950/60 border-purple-800 text-purple-300' 
                        : 'bg-red-950/60 border-red-800/80 text-red-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'open' ? 'bg-purple-400' : 'bg-red-400'}`}></span>
                      <span>{t.status === 'open' ? 'Open' : '● Resolved'}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px]">{t.openTime || 'Sep 20, 2026 — 9:03PM'}</td>
                  <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px]">{t.resolvedTime || 'Sep 20, 2026 — 9:04PM'}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-zinc-300 font-bold">
                        👤
                      </div>
                      <div>
                        <div className="font-bold text-zinc-200 text-xs">{t.author || t.userTag || 'SUSIL'}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">{t.authorId || '842417480521089054'}</div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
