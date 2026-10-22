import React from 'react';
import { ShieldCheck, Circle, Layers, Hash, MessageSquare, ExternalLink, LogOut, Bot } from 'lucide-react';

export default function Header({ botStatus, currentTabTitle, activeServer, onLogout }) {
  const serverName = activeServer?.name || 'ADAM CORPORATION';
  const cats = activeServer?.categoriesCount ?? 6;
  const textChans = activeServer?.textChannelsCount ?? 28;
  const totalChans = activeServer?.channelsCount ?? 39;
  const botInviteUrl = 'https://discord.com/oauth2/authorize?client_id=1553095078460002454&permissions=8&scope=bot%20applications.commands';

  return (
    <header className="h-14 border-b border-zinc-800/80 bg-[#121215]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Breadcrumbs & Active Server Info */}
      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 font-semibold">{serverName}</span>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-400">Home</span>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-100 font-bold">{currentTabTitle}</span>
        </div>

        {/* Server Quick Metric Pill */}
        <div className="hidden lg:flex items-center gap-2 bg-zinc-900/90 border border-zinc-800/90 px-2.5 py-1 rounded-lg text-[11px] text-zinc-300">
          {activeServer?.iconUrl ? (
            <img src={activeServer.iconUrl} alt="Server" className="w-4 h-4 rounded-full object-cover" />
          ) : (
            <div className="w-4 h-4 rounded-full bg-zinc-700 flex items-center justify-center text-[9px] font-bold">A</div>
          )}
          <span className="font-semibold text-zinc-200">{serverName}</span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400 flex items-center gap-1 font-medium">
            <Layers className="w-3 h-3 text-indigo-400" />
            <strong className="text-zinc-200">{cats}</strong> Cats
          </span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-400 flex items-center gap-1 font-medium">
            <MessageSquare className="w-3 h-3 text-emerald-400" />
            <strong className="text-zinc-200">{textChans}</strong> Text
          </span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-400 flex items-center gap-1 font-medium">
            <Hash className="w-3 h-3 text-sky-400" />
            <strong className="text-zinc-200">{totalChans}</strong> Total
          </span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Invite Bot to Server Button */}
        <a
          href={botInviteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 bg-[#5865F2] hover:bg-[#4752C4] text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-[#5865F2]/20 cursor-pointer"
          title="Invite ADAM CORPORATION Bot to your Discord server"
        >
          <Bot className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Invite to Server</span>
          <ExternalLink className="w-3 h-3 opacity-80" />
        </a>

        {/* System Status */}
        <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 px-3 py-1.5 rounded-full text-xs">
          <Circle className={`w-2 h-2 fill-current ${botStatus?.online ? 'text-emerald-500 animate-pulse' : 'text-amber-500'}`} />
          <span className="text-zinc-300 font-medium text-[11px]">
            {botStatus?.online ? `Bot Online (${botStatus?.username})` : 'All Systems Operational'}
          </span>
        </div>

        {/* Admin profile & Logout */}
        <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800/80 pl-1.5 pr-2.5 py-1 rounded-full">
          <div className="w-6 h-6 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 flex items-center justify-center font-black text-[11px]">
            A
          </div>
          <span className="text-xs font-bold text-zinc-200">adamadmin</span>
          {onLogout && (
            <button
              onClick={onLogout}
              className="ml-1 text-zinc-400 hover:text-red-400 transition-colors p-1 rounded-full hover:bg-zinc-800 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
