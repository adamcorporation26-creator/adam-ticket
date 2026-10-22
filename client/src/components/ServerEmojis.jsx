import React, { useState } from 'react';
import { 
  Smile, 
  Search, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  Flame, 
  Film, 
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';

export default function ServerEmojis({ emojis = [], serverInfo = {} }) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'animated', 'static'
  const [copiedId, setCopiedId] = useState(null);
  const [copiedFormat, setCopiedFormat] = useState(null);

  const handleCopy = (text, type, id) => {
    navigator.clipboard.writeText(text);
    if (type === 'format') {
      setCopiedFormat(id);
      setTimeout(() => setCopiedFormat(null), 2000);
    } else {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const filteredEmojis = emojis.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase());
    if (filterType === 'animated') return matchesSearch && e.animated;
    if (filterType === 'static') return matchesSearch && !e.animated;
    return matchesSearch;
  });

  const animatedCount = emojis.filter(e => e.animated).length;
  const staticCount = emojis.filter(e => !e.animated).length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
        <span>{serverInfo?.guildName || 'ADAM CORPORATION'}</span>
        <span>/</span>
        <span>Home</span>
        <span>/</span>
        <span className="text-zinc-300 font-bold">Server Emojis</span>
      </div>

      {/* Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-black text-zinc-100 tracking-tight">Server Emojis</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-extrabold text-xs flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>{emojis.length} Total</span>
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-medium">
            All custom animated and static emojis available from your connected Discord server.
          </p>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center gap-2.5 text-xs">
          <div className="px-3 py-1.5 bg-[#18181c] border border-zinc-800 rounded-xl flex items-center gap-2 text-zinc-300">
            <Film className="w-3.5 h-3.5 text-purple-400" />
            <span>Animated:</span>
            <span className="font-bold text-white">{animatedCount}</span>
          </div>
          <div className="px-3 py-1.5 bg-[#18181c] border border-zinc-800 rounded-xl flex items-center gap-2 text-zinc-300">
            <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>Static:</span>
            <span className="font-bold text-white">{staticCount}</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-zinc-500" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emojis by name..."
            className="w-full bg-[#151518] border border-zinc-800 focus:border-yellow-500 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none transition-all font-medium"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-[#151518] p-1 rounded-xl border border-zinc-800 text-xs font-semibold self-stretch sm:self-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-zinc-800 text-yellow-400 font-bold shadow-sm border border-zinc-700/80'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All ({emojis.length})
          </button>
          <button
            onClick={() => setFilterType('animated')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterType === 'animated'
                ? 'bg-zinc-800 text-purple-400 font-bold shadow-sm border border-zinc-700/80'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Animated ({animatedCount})
          </button>
          <button
            onClick={() => setFilterType('static')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterType === 'static'
                ? 'bg-zinc-800 text-emerald-400 font-bold shadow-sm border border-zinc-700/80'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Static ({staticCount})
          </button>
        </div>
      </div>

      {/* Emojis Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3.5">
        {filteredEmojis.map((emoji) => (
          <div
            key={emoji.id}
            className="group bg-[#151518] hover:bg-[#1a1a20] border border-zinc-800/80 hover:border-yellow-500/50 rounded-2xl p-3.5 flex flex-col items-center justify-between gap-3 transition-all shadow-md hover:shadow-xl relative"
          >
            {/* Animated / Static Badge */}
            <div className="w-full flex items-center justify-between text-[10px]">
              <span className={`px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                emoji.animated 
                  ? 'bg-purple-950/80 text-purple-300 border border-purple-800/60' 
                  : 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/60'
              }`}>
                {emoji.animated ? 'GIF' : 'PNG'}
              </span>

              <a 
                href={emoji.url} 
                target="_blank" 
                rel="noreferrer" 
                className="text-zinc-500 hover:text-zinc-300 transition-all"
                title="Open image in new tab"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Emoji Preview Graphic */}
            <div className="w-16 h-16 rounded-xl bg-[#1e1f24] border border-zinc-800 flex items-center justify-center p-2 group-hover:scale-110 transition-transform shadow-inner">
              <img
                src={emoji.url}
                alt={emoji.name}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Emoji Name & Info */}
            <div className="text-center w-full space-y-0.5">
              <div className="font-extrabold text-xs text-zinc-100 truncate w-full" title={emoji.name}>
                :{emoji.name}:
              </div>
              <div className="text-[10px] text-zinc-500 font-mono truncate w-full">
                {emoji.id}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full space-y-1.5 pt-1 border-t border-zinc-800/60">
              <button
                type="button"
                onClick={() => handleCopy(emoji.format, 'format', emoji.id)}
                className={`w-full py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  copiedFormat === emoji.id
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                    : 'bg-[#1c1c20] hover:bg-zinc-800 text-yellow-400 hover:text-yellow-300 border border-zinc-700/70'
                }`}
                title="Copy Discord Tag for Embeds and Buttons"
              >
                {copiedFormat === emoji.id ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Tag</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleCopy(emoji.name, 'name', emoji.id)}
                className="w-full py-1 px-2 bg-transparent hover:bg-zinc-800 text-[10px] text-zinc-400 hover:text-zinc-200 rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                {copiedId === emoji.id ? 'Copied Name!' : 'Copy Name'}
              </button>
            </div>
          </div>
        ))}

        {filteredEmojis.length === 0 && (
          <div className="col-span-full py-12 text-center text-zinc-500 space-y-2">
            <Smile className="w-8 h-8 mx-auto text-zinc-600" />
            <p className="text-xs">No emojis match your search query.</p>
          </div>
        )}
      </div>

      {/* Guide Card */}
      <div className="bg-[#151518] border border-yellow-500/20 rounded-2xl p-5 space-y-3 shadow-lg">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          <h3 className="text-xs font-bold text-zinc-200">How to use server emojis in your panels</h3>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          • In the **Panel Designer**, you can use the smiley button (<span className="text-yellow-400">😊</span>) to directly insert any server emoji into your embed descriptions.<br />
          • Click **Copy Tag** on any emoji above to get its Discord tag (e.g. <code className="bg-[#1c1c20] px-1 py-0.5 rounded text-yellow-400">&lt;:ClientsEmoji:1559562155324350604&gt;</code>) and paste it into descriptions or button emojis.<br />
          • Animated emojis (<span className="text-purple-400 font-bold">GIF</span>) and static emojis (<span className="text-emerald-400 font-bold">PNG</span>) render live both in the web preview and inside Discord!
        </p>
      </div>
    </div>
  );
}
