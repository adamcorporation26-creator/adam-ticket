import React, { useState } from 'react';
import { 
  X, 
  Settings as SettingsIcon, 
  MessageSquare, 
  Hash, 
  Check, 
  ChevronDown, 
  Sparkles, 
  Lock, 
  Plus, 
  HelpCircle,
  Save
} from 'lucide-react';

export default function PanelSettingsModal({ 
  panel, 
  onSave, 
  onClose, 
  channels = [], 
  roles = [],
  categories = []
}) {
  const [ticketStyle, setTicketStyle] = useState(panel.channelType || 'text'); // 'text' | 'thread'
  const [selectionMode, setSelectionMode] = useState(panel.selectionMode || 'buttons'); // 'buttons' | 'dropdown' | 'both'
  const [enableIntakeModal, setEnableIntakeModal] = useState(panel.disableIntakeModal !== true);
  const [selectPlaceholder, setSelectPlaceholder] = useState(panel.selectPlaceholder || '📂 Select a category to open a ticket...');
  const [category, setCategory] = useState(panel.category || 'Purchase');
  const [openLogChannel, setOpenLogChannel] = useState(panel.openLogChannel || '#ticket-logs');
  const [closeLogChannel, setCloseLogChannel] = useState(panel.closeLogChannel || '#ticket-logs');
  
  // Support roles (Server roles)
  const [supportRoles, setSupportRoles] = useState(panel.supportRoles || ['Founder', 'Staff', 'Manager']);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  // Custom ticket name & welcome message
  const [customTicketName, setCustomTicketName] = useState(panel.customTicketName || 'buy-{USER_NAME}');
  const [welcomeContent, setWelcomeContent] = useState(
    panel.welcomeMessage?.content || 
    'Welcome {USER} .You can continue your purchase in 🛒 {GUILD_NAME} } here.\n\nWait for a moment our Staffs will help you!'
  );
  const [extraMessageContent, setExtraMessageContent] = useState(panel.extraMessageContent || '');

  // Ticket Opener Permissions Toggles
  const [permissions, setPermissions] = useState(panel.permissions || {
    addReactions: true,
    attachFiles: true,
    embedLinks: false,
    sendVoiceMessages: true,
    useExternalEmojis: true,
    useExternalStickers: true,
    useAppCommands: false
  });

  const togglePermission = (key) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const addRole = (roleName) => {
    if (!supportRoles.includes(roleName)) {
      setSupportRoles([...supportRoles, roleName]);
    }
    setShowRoleDropdown(false);
  };

  const removeRole = (roleName) => {
    setSupportRoles(supportRoles.filter(r => r !== roleName));
  };

  const insertVariable = (varText) => {
    setCustomTicketName(prev => prev + varText);
  };

  const handleSave = () => {
    const updatedPanel = {
      ...panel,
      channelType: ticketStyle,
      selectionMode,
      disableIntakeModal: !enableIntakeModal,
      selectPlaceholder,
      category,
      openLogChannel,
      closeLogChannel,
      supportRoles,
      customTicketName,
      welcomeMessage: {
        ...(panel.welcomeMessage || {}),
        content: welcomeContent
      },
      extraMessageContent,
      permissions
    };
    onSave(updatedPanel);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-[#121215] border border-zinc-800/90 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans my-auto">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 flex items-center justify-between bg-[#151518]">
          <div className="flex items-center gap-2.5">
            <SettingsIcon className="w-5 h-5 text-yellow-400" />
            <h2 className="text-base font-extrabold text-white tracking-tight">Panel Settings</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg bg-[#1c1c20] hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer border border-zinc-700/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Content (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-7 flex-1 text-xs text-zinc-300">
          
          {/* 1. Ticket Style */}
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-extrabold text-white">Ticket Style</h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                The style used by buttons and options that don't override their own ticket style. Options that explicitly set their own style are not affected.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Option A: Text Channel */}
              <div 
                onClick={() => setTicketStyle('text')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between relative space-y-3 ${
                  ticketStyle === 'text'
                    ? 'bg-yellow-500/5 border-yellow-500 shadow-lg'
                    : 'bg-[#151518] border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {ticketStyle === 'text' && (
                  <>
                    <span className="absolute -top-3 left-4 bg-yellow-400 text-black font-extrabold text-[10px] px-2.5 py-0.5 rounded-full shadow">
                      Recommended • Selected
                    </span>
                    <div className="absolute top-3 right-3 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-black">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  </>
                )}

                <div className="flex flex-col items-center text-center space-y-2 pt-2">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-yellow-400">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <span className="font-extrabold text-sm text-white">Text Channel</span>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Create a new text channel in your server for each ticket.
                  </p>
                </div>
              </div>

              {/* Option B: Thread */}
              <div 
                onClick={() => setTicketStyle('thread')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between relative space-y-3 ${
                  ticketStyle === 'thread'
                    ? 'bg-yellow-500/5 border-yellow-500 shadow-lg'
                    : 'bg-[#151518] border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {ticketStyle === 'thread' && (
                  <div className="absolute top-3 right-3 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-black">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}

                <div className="flex flex-col items-center text-center space-y-2 pt-2">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-yellow-400">
                    <Hash className="w-5 h-5" />
                  </div>
                  <span className="font-extrabold text-sm text-white">Thread</span>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Create a new thread for each ticket within a designated channel.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Modal Questionnaire Toggle */}
          <div className="bg-[#151518] border border-zinc-800/90 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                  📝 Interactive Modal Questionnaire (Intake Form)
                </h4>
                <p className="text-[11px] text-zinc-400">
                  Prompt users with pop-up questions (Product, Payment Method, Issue Details) before opening their ticket.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEnableIntakeModal(!enableIntakeModal)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  enableIntakeModal ? 'bg-yellow-500' : 'bg-zinc-800'
                }`}
              >
                <div
                  className={`bg-black w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    enableIntakeModal ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Component Selection Mode (Buttons vs Select Menu Dropdown) */}
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-extrabold text-white">Panel Component Style</h4>
              <p className="text-[11px] text-zinc-400">
                Choose how categories and options appear on your Discord embed panel.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'buttons', label: 'Buttons', desc: 'Standard action buttons' },
                { id: 'dropdown', label: 'Dropdown Menu', desc: 'Discord select dropdown' },
                { id: 'both', label: 'Both', desc: 'Dropdown + Quick buttons' }
              ].map(opt => (
                <div
                  key={opt.id}
                  onClick={() => setSelectionMode(opt.id)}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all text-center space-y-1 ${
                    selectionMode === opt.id
                      ? 'bg-yellow-500/10 border-yellow-500 text-yellow-400'
                      : 'bg-[#151518] border-zinc-800 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <div className="font-bold text-xs">{opt.label}</div>
                  <div className="text-[10px] text-zinc-400">{opt.desc}</div>
                </div>
              ))}
            </div>

            {(selectionMode === 'dropdown' || selectionMode === 'both') && (
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-semibold text-zinc-300">Dropdown Placeholder Text</label>
                <input
                  type="text"
                  value={selectPlaceholder}
                  onChange={(e) => setSelectPlaceholder(e.target.value)}
                  placeholder="📂 Select a category to open a ticket..."
                  className="w-full bg-[#151518] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-yellow-500"
                />
              </div>
            )}
          </div>

          <div className="border-t border-zinc-800/80 pt-4">
            <h3 className="text-sm font-extrabold text-white">Panel Defaults</h3>
            <p className="text-[11px] text-zinc-400 font-medium">Configure values that individual options on this panel can inherit. Any option on this panel that inherits a field will pick up the value you set here.</p>
          </div>

          {/* 2. Default Categories */}
          <div className="space-y-2">
            <div>
              <h4 className="text-xs font-extrabold text-zinc-200">Default Categories</h4>
              <p className="text-[11px] text-zinc-400">Categories used by options that inherit this field. Choose a category from your connected server.</p>
            </div>

            <div className="flex items-center gap-2 pb-1">
              <span className="text-[11px] text-zinc-400 font-medium">Mode:</span>
              <select className="bg-[#18181c] border border-zinc-700/80 rounded-lg px-2.5 py-1 text-[11px] text-zinc-200 focus:outline-none">
                <option value="custom">Custom</option>
                <option value="default">Inherit Server Default</option>
              </select>
            </div>

            <div className="bg-[#151518] border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-transparent border-none text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                <option value={category}>📁 {category}</option>
                {(categories.length > 0 ? categories : [{ id: '1', name: 'Purchase' }, { id: '2', name: 'Tickets' }, { id: '3', name: 'Support' }]).map((cat) => (
                  <option key={cat.id || cat.name} value={cat.name}>
                    📁 {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Default Ticket Open Log Channel */}
          <div className="space-y-2 pt-2 border-t border-zinc-800/60">
            <div>
              <h4 className="text-xs font-extrabold text-zinc-200">Default Ticket Open Log Channel</h4>
              <p className="text-[11px] text-zinc-400">Channel where the open-ticket log embed is sent for tickets opened from this panel.</p>
            </div>

            <div className="flex items-center gap-2 pb-1">
              <span className="text-[11px] text-zinc-400 font-medium">Mode:</span>
              <select className="bg-[#18181c] border border-zinc-700/80 rounded-lg px-2.5 py-1 text-[11px] text-zinc-200 focus:outline-none">
                <option value="custom">Custom</option>
              </select>
            </div>

            <div className="bg-[#151518] border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
              <select
                value={openLogChannel}
                onChange={(e) => setOpenLogChannel(e.target.value)}
                className="w-full bg-transparent border-none text-xs font-mono text-white font-bold focus:outline-none"
              >
                <option value="#ticket-logs">#Ticket-logs</option>
                {channels.map((c) => (
                  <option key={c.id} value={`#${c.name}`}>#{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Default Ticket Close Log Channel */}
          <div className="space-y-2 pt-2 border-t border-zinc-800/60">
            <div>
              <h4 className="text-xs font-extrabold text-zinc-200">Default Ticket Close Log Channel</h4>
              <p className="text-[11px] text-zinc-400">Channel where the close-ticket log embed (with transcript link) is sent for tickets opened from this panel.</p>
            </div>

            <div className="flex items-center gap-2 pb-1">
              <span className="text-[11px] text-zinc-400 font-medium">Mode:</span>
              <select className="bg-[#18181c] border border-zinc-700/80 rounded-lg px-2.5 py-1 text-[11px] text-zinc-200 focus:outline-none">
                <option value="custom">Custom</option>
              </select>
            </div>

            <div className="bg-[#151518] border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
              <select
                value={closeLogChannel}
                onChange={(e) => setCloseLogChannel(e.target.value)}
                className="w-full bg-transparent border-none text-xs font-mono text-white font-bold focus:outline-none"
              >
                <option value="#ticket-logs">#Ticket-logs</option>
                {channels.map((c) => (
                  <option key={c.id} value={`#${c.name}`}>#{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 5. Default Support Roles (Matching Image media_1790422191111.png) */}
          <div className="space-y-2 pt-2 border-t border-zinc-800/60 relative">
            <div>
              <h4 className="text-xs font-extrabold text-zinc-200">Default Support Roles</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Roles that can view and manage tickets opened from this panel. Server-wide support roles from your settings page always apply too — those roles can manage every ticket.
              </p>
            </div>

            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-400 font-medium">Mode:</span>
                <select className="bg-[#18181c] border border-zinc-700/80 rounded-lg px-2.5 py-1 text-[11px] text-zinc-200 focus:outline-none">
                  <option value="custom">Custom</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setShowRoleDropdown(prev => !prev)}
                className="text-xs text-yellow-400 hover:text-yellow-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Server Role
              </button>
            </div>

            {/* Support Roles Tag Input */}
            <div className="bg-[#151518] border border-zinc-800 rounded-xl p-3 flex flex-wrap items-center gap-2 justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {supportRoles.map((roleName, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-lg bg-[#1c1c20] border border-zinc-700 text-xs font-bold text-zinc-200 flex items-center gap-1.5 shadow-sm">
                    <span>{roleName}</span>
                    <button type="button" onClick={() => removeRole(roleName)} className="text-zinc-500 hover:text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <ChevronDown 
                className="w-4 h-4 text-zinc-500 cursor-pointer" 
                onClick={() => setShowRoleDropdown(prev => !prev)} 
              />
            </div>

            {/* Server Role Selection Popover */}
            {showRoleDropdown && (
              <div className="absolute right-0 top-24 z-30 w-64 bg-[#18181c] border border-zinc-700 rounded-xl shadow-2xl p-2 space-y-1">
                <div className="text-[10px] font-bold text-zinc-400 px-2 py-1 uppercase tracking-wider">Select Discord Server Role</div>
                {(roles.length > 0 ? roles : [{ id: '1', name: 'Founder' }, { id: '2', name: 'Staff' }, { id: '3', name: 'Manager' }, { id: '4', name: 'Support' }]).map((r) => (
                  <button
                    key={r.id || r.name}
                    type="button"
                    onClick={() => addRole(r.name)}
                    className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs text-zinc-200 hover:bg-zinc-800 cursor-pointer"
                  >
                    <span>{r.name}</span>
                    {supportRoles.includes(r.name) && <Check className="w-3.5 h-3.5 text-yellow-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 6. Default Custom Ticket Name */}
          <div className="space-y-2 pt-2 border-t border-zinc-800/60">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-extrabold text-zinc-200">Default Custom Ticket Name</h4>
                <p className="text-[11px] text-zinc-400">Custom ticket name used by inheriting options. Leave empty to use the built-in name.</p>
              </div>

              <div className="relative">
                <select
                  onChange={(e) => {
                    if (e.target.value) insertVariable(e.target.value);
                  }}
                  className="bg-[#18181c] border border-zinc-700/80 rounded-lg px-2.5 py-1 text-[11px] text-yellow-400 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="">Add Variable v</option>
                  <option value="{USER_NAME}">{`{USER_NAME}`}</option>
                  <option value="{USER_ID}">{`{USER_ID}`}</option>
                  <option value="{TICKET_NUM}">{`{TICKET_NUM}`}</option>
                </select>
              </div>
            </div>

            <div className="bg-[#151518] border border-zinc-800 rounded-xl p-3 flex items-center gap-2">
              <span className="text-amber-400 text-xs">🎟️</span>
              <input
                type="text"
                value={customTicketName}
                onChange={(e) => setCustomTicketName(e.target.value)}
                className="w-full bg-transparent border-none text-xs font-mono text-yellow-400 font-bold focus:outline-none"
              />
            </div>
          </div>

          {/* 7. Default Ticket Embed Message */}
          <div className="space-y-2 pt-2 border-t border-zinc-800/60">
            <div>
              <h4 className="text-xs font-extrabold text-zinc-200">Default Ticket Embed Message</h4>
              <p className="text-[11px] text-zinc-400">The message shown inside the ticket's opening embed. Leave empty to use the built-in greeting.</p>
            </div>

            <div className="space-y-1">
              <textarea
                rows={4}
                value={welcomeContent}
                onChange={(e) => setWelcomeContent(e.target.value)}
                className="w-full bg-[#151518] border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 font-mono leading-relaxed focus:outline-none focus:border-yellow-500"
              ></textarea>
              <div className="flex justify-end text-[10px] text-zinc-500 font-mono">
                {welcomeContent.length}/2048
              </div>
            </div>
          </div>

          {/* 8. Default Ticket Message Content */}
          <div className="space-y-2 pt-2 border-t border-zinc-800/60">
            <div>
              <h4 className="text-xs font-extrabold text-zinc-200">Default Ticket Message Content</h4>
              <p className="text-[11px] text-zinc-400">Additional message sent alongside the ticket's opening embed. Leave empty to skip this extra message.</p>
            </div>

            <input
              type="text"
              value={extraMessageContent}
              onChange={(e) => setExtraMessageContent(e.target.value)}
              placeholder="Additional content sent above the embed..."
              className="w-full bg-[#151518] border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500"
            />
          </div>

          {/* 9. Default Ticket Opener Permissions (Matching Image media_1790422198802.png) */}
          <div className="space-y-4 pt-3 border-t border-zinc-800/60">
            <div>
              <h4 className="text-xs font-extrabold text-zinc-200">Default Ticket Opener Permissions</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                What the person who opens a ticket can do inside their ticket channel. Turn a permission off to block it for the ticket opener — for example, disable Attach Files and Embed Links to stop users from sending images or file uploads to your staff. Only the opener is restricted; staff and everyone else in the ticket keep their normal permissions.
              </p>
            </div>

            {/* Mandatory Required Lock Box */}
            <div className="bg-[#18181c] border border-zinc-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-medium border-b border-zinc-800 pb-2">
                <Lock className="w-3.5 h-3.5 text-zinc-500" />
                <span>These permissions are required for tickets to work and are always granted to the ticket opener.</span>
              </div>

              {[
                { name: 'View Channel', active: true },
                { name: 'Read Message History', active: true },
                { name: 'Send Messages', active: true },
              ].map((perm, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs font-semibold text-zinc-300 opacity-80">
                  <span>{perm.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-emerald-400 font-bold">ACTIVE</span>
                    <div className="w-8 h-4 bg-emerald-600/80 rounded-full flex items-center justify-end px-0.5 opacity-60">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Configurable Toggles */}
            <div className="space-y-3 pt-1">
              {[
                { key: 'addReactions', name: 'Add Reactions' },
                { key: 'attachFiles', name: 'Attach Files & Upload Images' },
                { key: 'embedLinks', name: 'Embed Links' },
                { key: 'sendVoiceMessages', name: 'Send Voice Messages' },
                { key: 'useExternalEmojis', name: 'Use External Emojis' },
                { key: 'useExternalStickers', name: 'Use External Stickers' },
                { key: 'useAppCommands', name: 'Use Application Commands' },
              ].map((perm) => {
                const isActive = permissions[perm.key];
                return (
                  <div key={perm.key} className="flex items-center justify-between text-xs font-bold text-zinc-200">
                    <span>{perm.name}</span>
                    <div 
                      onClick={() => togglePermission(perm.key)}
                      className="flex items-center gap-2.5 cursor-pointer"
                    >
                      <span className={`text-[10px] font-bold ${isActive ? 'text-emerald-400' : 'text-orange-500'}`}>
                        {isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                      <div className={`w-9 h-5 rounded-full p-0.5 transition-all flex items-center ${
                        isActive ? 'bg-emerald-600 justify-end' : 'bg-orange-600/80 justify-start'
                      }`}>
                        <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[10px] text-zinc-500 leading-normal italic pt-1">
              These apply only to the person who opened the ticket — not to staff or anyone else in the channel. Permissions left on aren't changed (the opener keeps their normal server permissions); permissions turned off are blocked for the opener inside the ticket. Only applies to tickets created as text channels — thread tickets follow the server's thread permissions. Note that turning off Embed Links removes link previews, but users can still post URLs as plain text.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800/80 bg-[#151518] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Panel Settings</span>
          </button>
        </div>

      </div>
    </div>
  );
}
