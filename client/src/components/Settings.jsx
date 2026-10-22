import React, { useState } from 'react';
import { Bot, Key, Shield, Hash, Save, Check, Lock, UserCheck, ShieldAlert } from 'lucide-react';

export default function Settings({ settings = {}, onSaveSettings }) {
  const [token, setToken] = useState(process.env.DISCORD_TOKEN || '');
  const [clientId, setClientId] = useState(process.env.CLIENT_ID || '1553095078460002454');
  const [ownerId, setOwnerId] = useState(settings.ownerId || '842417480521089054');
  const [logChannel, setLogChannel] = useState(settings.logChannel || '#ticket-logs');
  const [ownerOnly, setOwnerOnly] = useState(settings.ownerOnly !== false);
  const [privateBot, setPrivateBot] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await onSaveSettings({
      ...settings,
      ownerId,
      ownerOnly,
      privateBot,
      logChannel,
      guildName: settings.guildName || 'ADAM CORPORATION'
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto font-sans">
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-zinc-100 tracking-tight">Bot & Guild Settings</h1>
        <p className="text-xs text-zinc-400 font-medium">Configure bot credentials, owner access restrictions, and private bot controls.</p>
      </div>

      {/* Bot Ownership & Security Controls */}
      <div className="bg-[#151518] border border-yellow-500/30 rounded-2xl p-6 space-y-5 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>Bot Owner Access Control & Security</span>
                <span className="text-[10px] bg-yellow-500/20 text-yellow-400 font-bold px-2 py-0.5 rounded border border-yellow-500/40">
                  Strict Owner Lock
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">Ensure this bot can only be managed, deployed, and controlled by your account.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-yellow-400" />
              Bot Owner Discord User ID (OWNER_ID)
            </label>
            <input
              type="text"
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              placeholder="e.g. 842417480521089054"
              className="w-full bg-[#1c1c20] border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-yellow-400 font-mono font-bold focus:outline-none focus:border-yellow-500 shadow-inner"
            />
            <p className="text-[10px] text-zinc-400 font-medium">Only the Discord account matching this ID will have full management control over slash commands and panel deployments.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Private Bot Lock Option */}
            <div className="bg-[#18181c] border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-xs font-extrabold text-zinc-200">Private Bot Mode</div>
                <p className="text-[10px] text-zinc-400 font-medium">Disable Public Bot in Developer Portal so others cannot invite it.</p>
              </div>
              <input
                type="checkbox"
                checked={privateBot}
                onChange={(e) => setPrivateBot(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 text-yellow-500 focus:ring-0 bg-zinc-800 cursor-pointer"
              />
            </div>

            {/* Owner Only Restriction */}
            <div className="bg-[#18181c] border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-xs font-extrabold text-zinc-200">Lock Command Control</div>
                <p className="text-[10px] text-zinc-400 font-medium">Restricts bot slash commands strictly to the Bot Owner.</p>
              </div>
              <input
                type="checkbox"
                checked={ownerOnly}
                onChange={(e) => setOwnerOnly(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 text-yellow-500 focus:ring-0 bg-zinc-800 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#151518] border border-zinc-800/80 rounded-2xl p-6 space-y-6 shadow-xl">
        <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
          <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-zinc-100">Discord Bot Credentials</h2>
            <p className="text-[11px] text-zinc-400">These credentials link your localhost web dashboard to your Discord bot.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-zinc-400" />
              Bot Token (DISCORD_TOKEN)
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste your Discord Bot Token here..."
              className="w-full bg-[#1c1c20] border border-zinc-700/80 rounded-xl px-3.5 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-yellow-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Client Application ID</label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="1553095078460002454"
                className="w-full bg-[#1c1c20] border border-zinc-700/80 rounded-xl px-3.5 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-yellow-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Global Log Channel</label>
              <input
                type="text"
                value={logChannel}
                onChange={(e) => setLogChannel(e.target.value)}
                placeholder="#ticket-logs"
                className="w-full bg-[#1c1c20] border border-zinc-700/80 rounded-xl px-3.5 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-yellow-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
        >
          {saved ? <Check className="w-4 h-4 stroke-[3]" /> : <Save className="w-4 h-4" />}
          <span>{saved ? 'Saved & Locked Successfully!' : 'Save Owner Settings'}</span>
        </button>
      </div>
    </div>
  );
}
