import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, 
  Layers, 
  FileText, 
  History, 
  Inbox, 
  Settings, 
  ShieldCheck, 
  ScrollText, 
  Bot, 
  Crown, 
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Search,
  Check,
  Plus,
  Smile,
  ExternalLink
} from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab, serverInfo, selectedGuildId: propGuildId, onSelectGuild }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [guilds, setGuilds] = useState([
    { id: '1', name: 'ADAM CORPORATION', memberCount: 579, iconUrl: '/adam_corp_logo.jpg' },
    { id: '2', name: "ADAM's Area", memberCount: 142, iconUrl: '/adam_corp_logo.jpg' }
  ]);
  const [localGuildId, setLocalGuildId] = useState('1');
  const selectedGuildId = propGuildId || localGuildId;
  const [botInviteUrl, setBotInviteUrl] = useState('https://discord.com/oauth2/authorize');

  const dropdownRef = useRef(null);

  useEffect(() => {
    fetch('/api/discord/guilds')
      .then(r => r.json())
      .then(data => {
        if (data.guilds) setGuilds(data.guilds);
        if (data.botInviteUrl) setBotInviteUrl(data.botInviteUrl);
      })
      .catch(err => console.error('Error fetching guilds:', err));
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedGuild = guilds.find(g => g.id === selectedGuildId) || guilds[0] || {
    name: serverInfo?.guildName || 'ADAM CORPORATION',
    memberCount: serverInfo?.memberCount || 579,
    iconUrl: serverInfo?.iconUrl || '/adam_corp_logo.jpg'
  };

  const filteredGuilds = guilds.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const mainNav = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'panels', label: 'Panels', icon: Layers, active: true },
    { id: 'emojis', label: 'Server Emojis', icon: Smile },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'history', label: 'Ticket History', icon: History },
    { id: 'applications', label: 'Applications', icon: Inbox },
    { id: 'settings', label: 'Settings', icon: Settings, pro: true },
    { id: 'permissions', label: 'Permissions', icon: ShieldCheck },
    { id: 'audit_logs', label: 'Audit Logs', icon: ScrollText },
    { id: 'personalizer', label: 'Bot Personalizer', icon: Bot, pro: true },
  ];

  return (
    <aside className="w-64 bg-[#121215] border-r border-zinc-800/80 flex flex-col justify-between h-screen sticky top-0 select-none">
      {/* Brand & Server Header */}
      <div>
        <div className="p-4 flex items-center justify-between border-b border-zinc-800/60">
          <div className="flex items-center gap-2.5">
            <img src="/adam_corp_logo.jpg" alt="ADAM CORP" className="w-8 h-8 rounded-lg object-cover border border-red-800/60 shadow-md shrink-0" />
            <span className="font-extrabold tracking-wider text-xs text-zinc-100 uppercase">ADAM CORPORATION</span>
          </div>
        </div>

        {/* Server Selector Dropdown (Matching Reference Screenshot) */}
        <div className="p-3 relative" ref={dropdownRef}>
          {/* Header Card button */}
          <div 
            onClick={() => setIsOpen(prev => !prev)}
            className="bg-[#18181c] border border-zinc-800 hover:border-zinc-700 rounded-xl p-2.5 flex items-center justify-between cursor-pointer transition-all shadow-md"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img 
                src={selectedGuild?.iconUrl || '/adam_corp_logo.jpg'} 
                alt="Server Icon" 
                className="w-8 h-8 rounded-lg object-cover border border-red-800/60 shrink-0 shadow-md" 
                onError={(e) => { e.target.src = '/adam_corp_logo.jpg'; }}
              />
              <div className="truncate">
                <div className="font-extrabold text-xs text-zinc-100 truncate">
                  {selectedGuild?.name || 'ADAM CORPORATION'}
                </div>
                <div className="text-[10px] text-zinc-400 font-medium">
                  {selectedGuild?.memberCount || 579} members
                </div>
              </div>
            </div>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-yellow-400 shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
            )}
          </div>

          {/* Open Dropdown Container (Exact match to Reference Screenshot) */}
          {isOpen && (
            <div className="absolute left-3 right-3 top-16 z-50 bg-[#18181c] border border-zinc-800 rounded-xl shadow-2xl p-2.5 space-y-2.5">
              {/* Search input with yellow border outline */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <Search className="w-3.5 h-3.5 text-zinc-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Find a server..."
                  className="w-full bg-[#121215] border border-zinc-700/80 focus:border-yellow-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none transition-all font-medium"
                />
              </div>

              {/* List of servers */}
              <div className="max-h-44 overflow-y-auto space-y-1 pr-0.5">
                {filteredGuilds.length > 0 ? (
                  filteredGuilds.map((g) => {
                    const isSelected = g.id === selectedGuildId;
                    return (
                      <div
                        key={g.id}
                        onClick={() => {
                          setLocalGuildId(g.id);
                          if (onSelectGuild) onSelectGuild(g.id);
                          setIsOpen(false);
                        }}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-[#222228] text-white font-bold border border-zinc-700/60' 
                            : 'hover:bg-zinc-800/60 text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <img 
                            src={g.iconUrl || '/adam_corp_logo.jpg'} 
                            alt={g.name} 
                            className="w-7 h-7 rounded-lg object-cover border border-red-900/50 shrink-0"
                            onError={(e) => { e.target.src = '/adam_corp_logo.jpg'; }}
                          />
                          <span className="text-xs font-bold text-zinc-100 truncate">{g.name}</span>
                        </div>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="py-3 text-center text-xs text-zinc-500">
                    No servers found.
                  </div>
                )}
              </div>

              {/* Add Ticket King to a server button */}
              <button
                onClick={() => {
                  window.open(botInviteUrl, '_blank');
                  setIsOpen(false);
                }}
                className="w-full py-2 px-3 bg-[#222228] hover:bg-zinc-800 border border-zinc-700/60 rounded-lg font-bold text-xs text-yellow-400 hover:text-yellow-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 text-yellow-400 stroke-[3]" />
                <span>Add Ticket King to a server</span>
              </button>
            </div>
          )}
        </div>

        {/* Menu Navigation */}
        <nav className="px-2 py-2 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Main Menu</div>
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-yellow-500/10 text-yellow-400 font-semibold border-l-2 border-yellow-500 pl-2.5'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-yellow-400' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.pro && (
                  <Crown className="w-3 h-3 text-yellow-500/70" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-zinc-800/60 space-y-2">
        <a 
          href={botInviteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-white bg-[#5865F2] hover:bg-[#4752C4] rounded-xl shadow-md shadow-[#5865F2]/20 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            <span>Invite Bot to Server</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 opacity-80" />
        </a>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-500 fill-yellow-500/30" />
            <span className="text-xs font-bold text-yellow-400">ADAM CORPORATION</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">v2.0</span>
        </div>
      </div>
    </aside>
  );
}
