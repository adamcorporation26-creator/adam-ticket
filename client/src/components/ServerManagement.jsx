import React, { useState } from 'react';
import { 
  Search, 
  Settings as SettingsIcon, 
  Plus, 
  Shield, 
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  User,
  Sparkles
} from 'lucide-react';

export default function ServerManagement({ 
  onSelectServer, 
  botInviteUrl = 'https://discord.com/oauth2/authorize',
  serverInfo
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // Sample managed servers list matching reference screenshot media_1790416395240.png
  const [managedServers, setManagedServers] = useState([
    {
      id: '1',
      name: 'ADAM CORPORATION',
      status: 'active', // 'active' | 'not_configured'
      statusLabel: 'Bot Active',
      iconUrl: '/adam_corp_logo.jpg'
    },
    {
      id: '2',
      name: "ADAM's Area",
      status: 'active',
      statusLabel: 'Bot Active',
      iconUrl: '/adam_corp_logo.jpg'
    },
    {
      id: '3',
      name: 'Club House 2.0',
      status: 'not_configured',
      statusLabel: 'Not Configured',
      iconUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: '4',
      name: 'SUSIL AWM',
      status: 'not_configured',
      statusLabel: 'Not Configured',
      iconUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=120&auto=format&fit=crop&q=80'
    }
  ]);

  // Sample role access servers list
  const roleAccessServers = [
    {
      id: 'r1',
      name: 'UnFair E-Sports',
      badge: 'Role Access',
      iconUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'r2',
      name: 'PORUL PANDI',
      badge: 'Role Access',
      iconUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'r3',
      name: 'FREESTYLE - EDITING CO...',
      badge: 'Role Access',
      iconUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=120&auto=format&fit=crop&q=80'
    }
  ];

  const filteredManaged = managedServers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = managedServers.filter(s => s.status === 'active').length;
  const missingCount = 0;
  const notConfiguredCount = managedServers.filter(s => s.status === 'not_configured').length;

  const handleInvite = () => {
    window.open(botInviteUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-zinc-100 font-sans p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Navbar Header matching Reference Screenshot */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <img src="/adam_corp_logo.jpg" alt="ADAM CORP" className="w-9 h-9 rounded-xl object-cover border border-red-800/80 shadow-lg" />
          <span className="font-extrabold text-base tracking-wider text-white uppercase font-sans">ADAM CORPORATION</span>
        </div>

        {/* Center Nav Links */}
        <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-zinc-400">
          <button onClick={handleInvite} className="hover:text-white transition-all cursor-pointer">Invite</button>
          <a href="#blog" className="hover:text-white transition-all">Blog</a>
          <a href="#docs" className="hover:text-white transition-all">Docs</a>
          <span className="text-white font-bold border-b-2 border-yellow-500 pb-0.5">Dashboard</span>
          <a href="#status" className="hover:text-white transition-all">Status</a>
        </div>

        {/* Right Status Badge & User */}
        <div className="flex items-center gap-3">
          <div className="bg-[#151518] border border-zinc-800 px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-zinc-300">All Systems Operational</span>
          </div>

          <div className="bg-[#18181c] border border-zinc-700/80 px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold text-zinc-200 shadow-md">
            <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-yellow-400 font-black text-[10px]">
              👤
            </div>
            <span>SUSIL</span>
          </div>
        </div>
      </div>

      {/* Main Section Header */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Server Management</h1>
            <p className="text-xs text-zinc-400 mt-1 font-medium">Manage your Discord servers with ADAM CORPORATION</p>
          </div>

          <button
            onClick={handleInvite}
            className="px-5 py-2.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <span>Invite ADAM CORPORATION</span>
          </button>
        </div>

        {/* Search & Stats Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-zinc-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a server..."
              className="w-full bg-[#151518] border border-zinc-800 focus:border-yellow-500 rounded-xl pl-9 pr-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="font-extrabold text-zinc-200 text-sm">{managedServers.length} Servers</span>
            <div className="flex items-center gap-3 text-[11px] font-semibold">
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {activeCount} Active
              </span>
              <span className="text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {missingCount} Missing
              </span>
              <span className="text-zinc-400 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" /> {notConfiguredCount} Not Configured
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Managed Servers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredManaged.map((server) => (
          <div 
            key={server.id}
            className="bg-[#151518] border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-4 space-y-4 shadow-xl transition-all flex flex-col justify-between"
          >
            <div className="flex items-center gap-3.5">
              <img 
                src={server.iconUrl} 
                alt={server.name} 
                className="w-12 h-12 rounded-xl object-cover border border-zinc-700/80 shrink-0 shadow-md"
                onError={(e) => { e.target.src = '/adam_corp_logo.jpg'; }}
              />
              <div className="overflow-hidden">
                <h3 className="font-extrabold text-sm text-white truncate">{server.name}</h3>
                <span className={`text-xs font-bold ${
                  server.status === 'active' ? 'text-emerald-400' : 'text-zinc-500'
                }`}>
                  {server.statusLabel}
                </span>
              </div>
            </div>

            {server.status === 'active' ? (
              <button
                onClick={() => onSelectServer && onSelectServer(server.id)}
                className="w-full py-2.5 bg-[#1c1c20] hover:bg-zinc-800 border border-zinc-700/70 rounded-xl font-bold text-xs text-zinc-200 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <SettingsIcon className="w-4 h-4 text-zinc-400" />
                <span>Manage Server</span>
              </button>
            ) : (
              <button
                onClick={handleInvite}
                className="w-full py-2.5 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/60 rounded-xl font-bold text-xs text-emerald-400 hover:text-emerald-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4 text-emerald-400 stroke-[3]" />
                <span>Add to Server</span>
              </button>
            )}
          </div>
        ))}

        {/* Add New Server Card (Dashed Card) */}
        <div 
          onClick={handleInvite}
          className="bg-[#121215] border-2 border-dashed border-zinc-800/80 hover:border-yellow-500/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-2 cursor-pointer transition-all hover:bg-yellow-500/5 group"
        >
          <div className="w-10 h-10 rounded-full bg-zinc-800/80 group-hover:bg-yellow-500/20 border border-zinc-700/80 group-hover:border-yellow-500/50 flex items-center justify-center text-zinc-400 group-hover:text-yellow-400 transition-all">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <h3 className="font-extrabold text-sm text-white group-hover:text-yellow-400 transition-all">Add New Server</h3>
          <p className="text-[11px] text-zinc-400 font-medium">Invite ADAM CORPORATION to another server</p>
        </div>
      </div>

      {/* Section 2: Servers You May Have Access To */}
      <div className="space-y-4 pt-6 border-t border-zinc-800/80">
        <div className="space-y-1">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            <span>Servers You May Have Access To</span>
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed font-medium">
            These servers have ADAM CORPORATION active and you're a member, but you don't have Administrator or Manage Server permissions. If you've been granted dashboard access through a role, you can access them below.
          </p>
        </div>

        {/* Role Access Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roleAccessServers.map((server) => (
            <div 
              key={server.id}
              onClick={() => onSelectServer && onSelectServer(server.id)}
              className="bg-[#151518] border border-zinc-800/80 hover:border-purple-500/40 rounded-2xl p-4 flex items-center gap-3.5 cursor-pointer transition-all hover:bg-[#1a1a1f] shadow-lg group"
            >
              <img 
                src={server.iconUrl} 
                alt={server.name} 
                className="w-11 h-11 rounded-xl object-cover border border-zinc-700/80 shrink-0 shadow-md"
                onError={(e) => { e.target.src = '/adam_corp_logo.jpg'; }}
              />
              <div className="overflow-hidden">
                <h3 className="font-extrabold text-xs text-white group-hover:text-purple-300 transition-all truncate">{server.name}</h3>
                <span className="text-[11px] font-bold text-purple-400">
                  {server.badge}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
