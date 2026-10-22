import React from 'react';
import { ShieldCheck, Circle, Layers, Hash, MessageSquare } from 'lucide-react';

export default function Header({ botStatus, currentTabTitle, activeServer }) {
  const serverName = activeServer?.name || 'ADAM CORPORATION';
  const cats = activeServer?.categoriesCount ?? 6;
  const textChans = activeServer?.textChannelsCount ?? 28;
  const totalChans = activeServer?.channelsCount ?? 39;

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
        {/* System Status */}
        <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 px-3 py-1.5 rounded-full text-xs">
          <Circle className={`w-2 h-2 fill-current ${botStatus?.online ? 'text-emerald-500 animate-pulse' : 'text-amber-500'}`} />
          <span className="text-zinc-300 font-medium text-[11px]">
            {botStatus?.online ? `Bot Online (${botStatus?.username})` : 'All Systems Operational (Local)'}
          </span>
        </div>

        {/* User profile */}
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center font-bold text-xs text-yellow-400">
            S
          </div>
          <span className="text-xs font-semibold text-zinc-300">SUSIL</span>
        </div>
      </div>
    </header>
  );
}
