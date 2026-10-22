import React, { useState, useEffect, useRef } from 'react';
import DiscordEmbedPreview from './DiscordEmbedPreview.jsx';
import ButtonEditor from './ButtonEditor.jsx';
import PanelSettingsModal from './PanelSettingsModal.jsx';
import { 
  Eye, 
  Edit3, 
  Send, 
  Plus, 
  X, 
  HelpCircle, 
  MessageSquare, 
  Hash, 
  Sparkles,
  Check,
  Smile,
  ArrowLeft,
  BookOpen,
  Settings,
  Layers,
  LayoutGrid
} from 'lucide-react';

const defaultSupportPanel = {
  id: 'default-support-panel',
  name: 'Support Ticket Panel',
  channelType: 'text',
  category: '🎟️ • 𝐓𝐢𝐜𝐤𝐞𝐭𝐬',
  supportRoles: ['𝐒𝐭𝐚𝐟𝐟', '𝐌𝐚𝐧𝐚𝐠𝐞𝐫', '𝐅𝐨𝐮𝐧𝐝𝐞𝐫'],
  blockedRoles: [],
  customTicketName: 'support-{USER_NAME}',
  openLogChannel: '#ticket-logs',
  closeLogChannel: '#ticket-logs',
  embed: {
    authorName: '𝐀𝐃𝐀𝐌 𝐂𝐎𝐑𝐏𝐎𝐑𝐀𝐓𝐈𝐎𝐍 𝐓𝐢𝐜𝐤𝐞𝐭𝐬',
    authorUrl: '',
    authorIconUrl: '',
    title: '',
    titleUrl: '',
    description: 'Rules\n• Tickets Are For **Support** Only.\n• Any Other Requests = **Instant Ban**.\n• Stay **Respectful** Or Risk **Removal**.\n',
    color: '#ff0037',
    thumbnailUrl: '',
    imageUrl: 'https://cdn.discordapp.com/attachments/1469382427985186829/1559558254089207901/Adam_corp_Ticket_Pic.jpg?ex=6acf834e&is=6ace31ce&hm=2c623d0447aa607d10db1bc75b96bfed4e6100b78fb33bc08a40140ee8ea729c&',
    footerIconUrl: '',
    footerText: ''
  },
  welcomeMessage: {
    content: 'Welcome {USER}. Our support team will assist you in {GUILD_NAME}.\n\nWait for a moment our Staffs will help you!',
    embedTitle: 'Support Ticket Created!',
    embedDescription: 'Please describe your issue in detail. Staff will respond shortly.',
    color: '#e11d48'
  },
  buttons: [
    {
      id: 'support_btn',
      label: 'Support',
      style: 'Primary',
      emoji: '🎫',
      customId: 'ticket_create_support'
    }
  ],
  deployedMessageId: '',
  deployedChannelId: '',
  extraMessageContent: '',
  permissions: {
    addReactions: true,
    attachFiles: true,
    embedLinks: false,
    sendVoiceMessages: true,
    useExternalEmojis: true,
    useExternalStickers: true,
    useAppCommands: false
  }
};

export default function PanelEditor({ 
  panelData, 
  panels = {}, 
  onSave, 
  onDeploy, 
  channels = [], 
  roles = [], 
  emojis = [], 
  categories = [] 
}) {
  // Two panels: Panel 1 (Purchase) and Panel 2 (Support)
  const [panel1, setPanel1] = useState(panels['default-purchase-panel'] || panelData || {});
  const [panel2, setPanel2] = useState(panels['default-support-panel'] || defaultSupportPanel);

  // Active view: 'panel1' (Embed 1), 'panel2' (Embed 2), or 'dual' (Side-by-side preview)
  const [activeTab, setActiveTab] = useState('panel1');
  const activePanel = activeTab === 'panel2' ? panel2 : panel1;
  const setActivePanelState = activeTab === 'panel2' ? setPanel2 : setPanel1;

  const [selectedButtonId, setSelectedButtonId] = useState('buy_btn');
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Deployment states for Embed 1
  const [targetChannelId1, setTargetChannelId1] = useState(panel1.deployedChannelId || '');
  const [deploying1, setDeploying1] = useState(false);
  const [deployMsg1, setDeployMsg1] = useState(null);

  // Deployment states for Embed 2
  const [targetChannelId2, setTargetChannelId2] = useState(panel2.deployedChannelId || '');
  const [deploying2, setDeploying2] = useState(false);
  const [deployMsg2, setDeployMsg2] = useState(null);

  const [saving, setSaving] = useState(false);
  const [newRoleInput, setNewRoleInput] = useState('');

  const textareaRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiTab, setEmojiTab] = useState('server'); // 'server' or 'unicode'

  useEffect(() => {
    if (panels['default-purchase-panel']) {
      setPanel1(panels['default-purchase-panel']);
      if (panels['default-purchase-panel'].deployedChannelId) {
        setTargetChannelId1(panels['default-purchase-panel'].deployedChannelId);
      }
    } else if (panelData) {
      setPanel1(panelData);
    }

    if (panels['default-support-panel']) {
      setPanel2(panels['default-support-panel']);
      if (panels['default-support-panel'].deployedChannelId) {
        setTargetChannelId2(panels['default-support-panel'].deployedChannelId);
      }
    }
  }, [panels, panelData]);

  const handleUpdateCurrentButton = (updatedBtn) => {
    setActivePanelState(prev => {
      const currentButtons = prev.buttons || [];
      const updatedButtons = currentButtons.map(b => b.id === updatedBtn.id ? updatedBtn : b);
      return { ...prev, buttons: updatedButtons };
    });
  };

  const handleAddButton = () => {
    const newId = `btn_${Date.now()}`;
    const newBtn = {
      id: newId,
      label: 'New Button',
      style: 'Secondary',
      emoji: '🎟️',
      customId: `ticket_create_${newId}`
    };
    setActivePanelState(prev => ({
      ...prev,
      buttons: [...(prev.buttons || []), newBtn]
    }));
    setSelectedButtonId(newId);
  };

  const handleDeleteButton = (btnId) => {
    setActivePanelState(prev => ({
      ...prev,
      buttons: (prev.buttons || []).filter(b => b.id !== btnId)
    }));
    setSelectedButtonId(null);
  };

  const insertEmojiAtCursor = (emojiText) => {
    const textarea = textareaRef.current;
    const currentVal = activePanel.embed?.description || '';
    if (!textarea) {
      updateEmbedField('description', currentVal + emojiText);
      return;
    }

    const start = textarea.selectionStart ?? currentVal.length;
    const end = textarea.selectionEnd ?? currentVal.length;

    const newVal = currentVal.substring(0, start) + emojiText + currentVal.substring(end);
    updateEmbedField('description', newVal);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emojiText.length, start + emojiText.length);
    }, 0);
  };

  const applyFormatting = (prefix, suffix = prefix) => {
    const textarea = textareaRef.current;
    const currentVal = activePanel.embed?.description || '';
    if (!textarea) {
      updateEmbedField('description', currentVal + prefix + 'text' + suffix);
      return;
    }

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const selectedText = currentVal.substring(start, end) || 'text';

    const newVal = currentVal.substring(0, start) + prefix + selectedText + suffix + currentVal.substring(end);
    updateEmbedField('description', newVal);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const updateEmbedField = (field, value) => {
    setActivePanelState(prev => ({
      ...prev,
      embed: {
        ...prev.embed,
        [field]: value
      }
    }));
  };

  const updatePanelField = (field, value) => {
    setActivePanelState(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateWelcomeField = (field, value) => {
    setActivePanelState(prev => ({
      ...prev,
      welcomeMessage: {
        ...prev.welcomeMessage,
        [field]: value
      }
    }));
  };

  const addSupportRole = (roleName) => {
    if (!roleName) return;
    const current = activePanel.supportRoles || [];
    if (!current.includes(roleName)) {
      setActivePanelState(prev => ({ ...prev, supportRoles: [...current, roleName] }));
    }
    setNewRoleInput('');
  };

  const removeSupportRole = (roleName) => {
    setActivePanelState(prev => ({
      ...prev,
      supportRoles: (prev.supportRoles || []).filter(r => r !== roleName)
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(panel1);
    if (panel2) await onSave(panel2);
    setSaving(false);
  };

  const handleDeploy1 = async () => {
    if (!targetChannelId1) {
      setDeployMsg1({ error: true, text: 'Please select a Discord channel for Embed 1.' });
      return;
    }
    setDeploying1(true);
    setDeployMsg1(null);
    try {
      const res = await onDeploy(panel1.id, targetChannelId1);
      const isEdit = res?.result?.isEdit;
      const targetChan = channels.find(c => c.id === targetChannelId1)?.name || targetChannelId1;
      setDeployMsg1({ 
        error: false, 
        text: isEdit 
          ? `✅ Successfully updated Embed 1 in #${targetChan}!` 
          : `✅ Created Embed 1 message in #${targetChan}!` 
      });
    } catch (err) {
      setDeployMsg1({ error: true, text: err.message || 'Deployment of Embed 1 failed.' });
    } finally {
      setDeploying1(false);
    }
  };

  const handleDeploy2 = async () => {
    if (!targetChannelId2) {
      setDeployMsg2({ error: true, text: 'Please select a Discord channel for Embed 2.' });
      return;
    }
    setDeploying2(true);
    setDeployMsg2(null);
    try {
      const res = await onDeploy(panel2.id, targetChannelId2);
      const isEdit = res?.result?.isEdit;
      const targetChan = channels.find(c => c.id === targetChannelId2)?.name || targetChannelId2;
      setDeployMsg2({ 
        error: false, 
        text: isEdit 
          ? `✅ Successfully updated Embed 2 in #${targetChan}!` 
          : `✅ Created Embed 2 message in #${targetChan}!` 
      });
    } catch (err) {
      setDeployMsg2({ error: true, text: err.message || 'Deployment of Embed 2 failed.' });
    } finally {
      setDeploying2(false);
    }
  };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto font-sans">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
        <span>Adam Data Station</span>
        <span>/</span>
        <span>Home</span>
        <span>/</span>
        <span className="text-zinc-300 font-bold">Panels</span>
      </div>

      {/* Main Page Title */}
      <div className="space-y-0.5">
        <h1 className="text-3xl font-black text-zinc-100 tracking-tight">Panel Designer</h1>
        <p className="text-xs text-zinc-400 font-medium">Edit and customize your ticket panels with multiple embeds and categories.</p>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Embed Option Switchers */}
          <button 
            onClick={() => setActiveTab('panel1')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
              activeTab === 'panel1' 
                ? 'bg-yellow-500 text-black border border-yellow-400' 
                : 'bg-[#18181c] hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-600"></span>
            <span>Embed 1 • Purchase</span>
          </button>

          <button 
            onClick={() => setActiveTab('panel2')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
              activeTab === 'panel2' 
                ? 'bg-yellow-500 text-black border border-yellow-400' 
                : 'bg-[#18181c] hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Embed 2 • Support</span>
          </button>

          <button 
            onClick={() => setActiveTab('dual')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
              activeTab === 'dual' 
                ? 'bg-indigo-600 text-white border border-indigo-400' 
                : 'bg-[#18181c] hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-indigo-300" />
            <span>Dual Preview (Embed 1 & 2)</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            onClick={() => setShowSettingsModal(true)}
            className="px-3.5 py-1.5 bg-[#18181c] hover:bg-zinc-800 border border-zinc-700/80 rounded-xl text-xs font-bold text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-zinc-400" /> Panel Settings ({activeTab === 'panel2' ? 'Embed 2' : 'Embed 1'})
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save All Panel Changes'}
          </button>
        </div>
      </div>

      {/* Sub-Header: Active Mode Notification */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-sm font-extrabold text-zinc-100 tracking-tight flex items-center gap-2">
            <span>Panel Preview</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
              {activeTab === 'panel2' ? 'Editing: Embed 2 (Support)' : activeTab === 'dual' ? 'Dual Preview (Embed 1 + Embed 2)' : 'Editing: Embed 1 (Purchase)'}
            </span>
          </h2>
          <p className="text-[11px] text-zinc-400">Preview live Discord layout and deploy independently to different channels</p>
        </div>

        <div className="bg-[#18181c] border border-zinc-800 p-1 rounded-xl flex items-center gap-1 text-xs">
          <button 
            onClick={() => setActiveTab('panel1')}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${activeTab === 'panel1' ? 'bg-zinc-800 text-zinc-100 border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Embed 1
          </button>
          <button 
            onClick={() => setActiveTab('panel2')}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${activeTab === 'panel2' ? 'bg-zinc-800 text-zinc-100 border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Embed 2
          </button>
          <button 
            onClick={() => setActiveTab('dual')}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${activeTab === 'dual' ? 'bg-zinc-800 text-zinc-100 border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Both Embeds
          </button>
        </div>
      </div>

      {/* DUAL PREVIEW MODE */}
      {activeTab === 'dual' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Embed 1 Preview & Deploy Box */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">Embed 1 Preview (Purchase)</span>
                <button 
                  onClick={() => setActiveTab('panel1')}
                  className="text-[11px] bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 font-bold px-2 py-0.5 rounded border border-yellow-500/30 cursor-pointer"
                >
                  Edit Form 1
                </button>
              </div>

              <DiscordEmbedPreview 
                embedTitle="Embed 1 • Purchase"
                embedData={panel1.embed || {}} 
                buttons={panel1.buttons || []} 
                selectedButtonId={selectedButtonId}
                onSelectButton={(id) => { setSelectedButtonId(id); setActiveTab('panel1'); }}
                onAddButton={handleAddButton}
                onDeleteButton={handleDeleteButton}
              />

              {/* Deploy Box for Embed 1 */}
              <div className="bg-[#151518] border border-yellow-500/30 rounded-xl p-4 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs font-bold text-zinc-200">Deploy Embed 1 (Purchase) in Discord</span>
                  </div>
                  {panel1.deployedMessageId && (
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                      ● Deployed
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <select
                    value={targetChannelId1}
                    onChange={(e) => setTargetChannelId1(e.target.value)}
                    className="flex-1 bg-[#1c1c20] border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500"
                  >
                    <option value="">-- Select Target Channel for Embed 1 --</option>
                    {channels.map((c) => (
                      <option key={c.id} value={c.id}>#{c.name}</option>
                    ))}
                  </select>

                  <button
                    onClick={handleDeploy1}
                    disabled={deploying1}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    {deploying1 ? 'Updating...' : (panel1.deployedMessageId ? 'Update Embed 1' : 'Deploy Embed 1')}
                  </button>
                </div>

                {deployMsg1 && (
                  <div className={`p-2.5 rounded-lg text-xs font-medium ${deployMsg1.error ? 'bg-red-950/60 border border-red-800 text-red-300' : 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'}`}>
                    {deployMsg1.text}
                  </div>
                )}
              </div>
            </div>

            {/* Embed 2 Preview & Deploy Box */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Embed 2 Preview (Support)</span>
                <button 
                  onClick={() => setActiveTab('panel2')}
                  className="text-[11px] bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-bold px-2 py-0.5 rounded border border-blue-500/30 cursor-pointer"
                >
                  Edit Form 2
                </button>
              </div>

              <DiscordEmbedPreview 
                embedTitle="Embed 2 • Support"
                embedData={panel2.embed || {}} 
                buttons={panel2.buttons || []} 
                selectedButtonId={selectedButtonId}
                onSelectButton={(id) => { setSelectedButtonId(id); setActiveTab('panel2'); }}
                onAddButton={handleAddButton}
                onDeleteButton={handleDeleteButton}
              />

              {/* Deploy Box for Embed 2 */}
              <div className="bg-[#151518] border border-blue-500/30 rounded-xl p-4 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-zinc-200">Deploy Embed 2 (Support) in Discord</span>
                  </div>
                  {panel2.deployedMessageId && (
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                      ● Deployed
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <select
                    value={targetChannelId2}
                    onChange={(e) => setTargetChannelId2(e.target.value)}
                    className="flex-1 bg-[#1c1c20] border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Select Target Channel for Embed 2 --</option>
                    {channels.map((c) => (
                      <option key={c.id} value={c.id}>#{c.name}</option>
                    ))}
                  </select>

                  <button
                    onClick={handleDeploy2}
                    disabled={deploying2}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    {deploying2 ? 'Updating...' : (panel2.deployedMessageId ? 'Update Embed 2' : 'Deploy Embed 2')}
                  </button>
                </div>

                {deployMsg2 && (
                  <div className={`p-2.5 rounded-lg text-xs font-medium ${deployMsg2.error ? 'bg-red-950/60 border border-red-800 text-red-300' : 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'}`}>
                    {deployMsg2.text}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE EMBED MODE (Embed 1 or Embed 2) */}
      {activeTab !== 'dual' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Col: Visual Discord Embed Preview */}
          <div className="lg:col-span-6 space-y-4">
            <DiscordEmbedPreview 
              embedTitle={activeTab === 'panel2' ? 'Embed 2 • Support' : 'Embed 1 • Purchase'}
              embedData={activePanel.embed || {}} 
              buttons={activePanel.buttons || []} 
              selectedButtonId={selectedButtonId}
              onSelectButton={(id) => setSelectedButtonId(id)}
              onAddButton={handleAddButton}
              onDeleteButton={handleDeleteButton}
            />

            {/* Deploy Box */}
            <div className={`bg-[#151518] rounded-xl p-4 space-y-3 shadow-lg border ${activeTab === 'panel2' ? 'border-blue-500/30' : 'border-yellow-500/30'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Send className={`w-4 h-4 ${activeTab === 'panel2' ? 'text-blue-400' : 'text-yellow-400'}`} />
                  <span className="text-xs font-bold text-zinc-200">
                    Update / Deploy {activeTab === 'panel2' ? 'Embed 2 (Support)' : 'Embed 1 (Purchase)'} in Discord Guild
                  </span>
                </div>
                {activePanel.deployedMessageId && (
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                    ● Deployed (Edits In-Place)
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <select
                  value={activeTab === 'panel2' ? targetChannelId2 : targetChannelId1}
                  onChange={(e) => {
                    if (activeTab === 'panel2') setTargetChannelId2(e.target.value);
                    else setTargetChannelId1(e.target.value);
                  }}
                  className="flex-1 bg-[#1c1c20] border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500"
                >
                  <option value="">-- Select Target Channel --</option>
                  {channels.map((c) => (
                    <option key={c.id} value={c.id}>#{c.name}</option>
                  ))}
                </select>

                <button
                  onClick={activeTab === 'panel2' ? handleDeploy2 : handleDeploy1}
                  disabled={activeTab === 'panel2' ? deploying2 : deploying1}
                  className={`px-4 py-2 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer text-white ${
                    activeTab === 'panel2' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-red-600 hover:bg-red-500'
                  }`}
                >
                  {activeTab === 'panel2' 
                    ? (deploying2 ? 'Updating...' : (activePanel.deployedMessageId ? 'Update Embed 2' : 'Deploy Embed 2'))
                    : (deploying1 ? 'Updating...' : (activePanel.deployedMessageId ? 'Update Embed 1' : 'Deploy Embed 1'))
                  }
                </button>
              </div>

              {(activeTab === 'panel2' ? deployMsg2 : deployMsg1) && (
                <div className={`p-2.5 rounded-lg text-xs font-medium ${(activeTab === 'panel2' ? deployMsg2 : deployMsg1).error ? 'bg-red-950/60 border border-red-800 text-red-300' : 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'}`}>
                  {(activeTab === 'panel2' ? deployMsg2 : deployMsg1).text}
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Embed Form Editors or Button Editor */}
          <div className="lg:col-span-6 space-y-4">
            {/* Editor Header Toggle Bar */}
            <div className="bg-[#151518] border border-zinc-800 rounded-xl p-2 flex items-center gap-2 text-xs">
              <button
                onClick={() => setSelectedButtonId(null)}
                className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  !selectedButtonId
                    ? 'bg-zinc-800 text-yellow-400 border border-zinc-700 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit {activeTab === 'panel2' ? 'Embed 2' : 'Embed 1'} Form
              </button>
              
              {(activePanel.buttons || []).length > 0 && (
                <select
                  value={selectedButtonId || ''}
                  onChange={(e) => setSelectedButtonId(e.target.value || null)}
                  className="flex-1 bg-[#1c1c20] border border-zinc-700/80 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500 font-medium"
                >
                  <option value="">-- Edit Embed Form --</option>
                  {(activePanel.buttons || []).map(b => (
                    <option key={b.id} value={b.id}>
                      Edit Button: {b.emoji ? `${b.emoji} ` : ''}{b.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedButtonId && (activePanel.buttons || []).find(b => b.id === selectedButtonId) ? (
              <ButtonEditor
                button={(activePanel.buttons || []).find(b => b.id === selectedButtonId)}
                onUpdate={handleUpdateCurrentButton}
                onDelete={handleDeleteButton}
                onBack={() => setSelectedButtonId(null)}
                emojis={emojis}
              />
            ) : (
              <div className="bg-[#151518] border border-zinc-800/80 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <span className="text-xs font-bold text-zinc-200">Embed Color & Styling ({activeTab === 'panel2' ? 'Embed 2' : 'Embed 1'})</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={activePanel.embed?.color || '#e11d48'}
                    onChange={(e) => updateEmbedField('color', e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                  />
                  <span className="text-xs text-zinc-400 font-mono">{activePanel.embed?.color || '#e11d48'}</span>
                </div>
              </div>

              {/* Author Information */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-xs font-bold text-zinc-200">Author Information</h3>
                  <p className="text-[11px] text-zinc-400">Information displayed at the top of the embed.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-400">Author Name</label>
                    <input
                      type="text"
                      value={activePanel.embed?.authorName || ''}
                      onChange={(e) => updateEmbedField('authorName', e.target.value)}
                      placeholder="ADAM CORPORATION"
                      className="w-full bg-[#1c1c20] border border-zinc-700/80 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-400">Author URL</label>
                    <input
                      type="text"
                      value={activePanel.embed?.authorUrl || ''}
                      onChange={(e) => updateEmbedField('authorUrl', e.target.value)}
                      placeholder="https://example.com"
                      className="w-full bg-[#1c1c20] border border-zinc-700/80 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400">Author Icon URL</label>
                  <input
                    type="text"
                    value={activePanel.embed?.authorIconUrl || ''}
                    onChange={(e) => updateEmbedField('authorIconUrl', e.target.value)}
                    placeholder="https://example.com/image.png"
                    className="w-full bg-[#1c1c20] border border-zinc-700/80 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500"
                  />
                </div>
              </div>

              {/* Embed Content */}
              <div className="space-y-3 pt-3 border-t border-zinc-800">
                <div>
                  <h3 className="text-xs font-bold text-zinc-200">Embed Content</h3>
                  <p className="text-[11px] text-zinc-400">Edit the main content of the embed. You can use Markdown and Discord emojis.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-400">Title</label>
                    <input
                      type="text"
                      value={activePanel.embed?.title || ''}
                      onChange={(e) => updateEmbedField('title', e.target.value)}
                      placeholder="Enter title..."
                      className="w-full bg-[#1c1c20] border border-zinc-700/80 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-400">Title URL</label>
                    <input
                      type="text"
                      value={activePanel.embed?.titleUrl || ''}
                      onChange={(e) => updateEmbedField('titleUrl', e.target.value)}
                      placeholder="https://example.com"
                      className="w-full bg-[#1c1c20] border border-zinc-700/80 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 relative">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-[11px] font-semibold text-zinc-400">Description</label>
                    <div className="flex items-center gap-2">
                      {/* Discord Text Formatting Toolbar */}
                      <div className="flex items-center gap-0.5 bg-[#18181c] border border-zinc-700/80 p-0.5 rounded-lg text-xs font-mono">
                        <button
                          type="button"
                          onClick={() => applyFormatting('**')}
                          className="px-2 py-0.5 rounded font-extrabold hover:bg-zinc-700 text-zinc-200 transition-all cursor-pointer"
                          title="Bold (**text**)"
                        >
                          B
                        </button>
                        <button
                          type="button"
                          onClick={() => applyFormatting('*')}
                          className="px-2 py-0.5 rounded italic hover:bg-zinc-700 text-zinc-200 transition-all cursor-pointer"
                          title="Italic (*text*)"
                        >
                          I
                        </button>
                        <button
                          type="button"
                          onClick={() => applyFormatting('__')}
                          className="px-2 py-0.5 rounded underline hover:bg-zinc-700 text-zinc-200 transition-all cursor-pointer"
                          title="Underline (__text__)"
                        >
                          U
                        </button>
                        <button
                          type="button"
                          onClick={() => applyFormatting('~~')}
                          className="px-2 py-0.5 rounded line-through hover:bg-zinc-700 text-zinc-200 transition-all cursor-pointer"
                          title="Strikethrough (~~text~~)"
                        >
                          S
                        </button>
                        <button
                          type="button"
                          onClick={() => applyFormatting('||')}
                          className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-amber-500/20 text-amber-400 font-semibold text-[10px] transition-all cursor-pointer border border-amber-500/30"
                          title="Spoiler / Invisible (||text||)"
                        >
                          ||
                        </button>
                        <button
                          type="button"
                          onClick={() => applyFormatting('`')}
                          className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-[10px] transition-all cursor-pointer border border-zinc-700/50"
                          title="Inline Code (`text`)"
                        >
                          `
                        </button>
                        <button
                          type="button"
                          onClick={() => applyFormatting('# ')}
                          className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-yellow-500/20 text-yellow-400 font-bold text-[10px] transition-all cursor-pointer border border-yellow-500/30"
                          title="Header (# Title)"
                        >
                          #
                        </button>
                      </div>

                      <span className="text-[10px] text-zinc-500 font-mono">{activePanel.embed?.description?.length || 0}/4096</span>

                      {/* Emoji Trigger Button */}
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(prev => !prev)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          showEmojiPicker 
                            ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' 
                            : 'bg-[#1c1c20] text-zinc-400 hover:text-zinc-200 border-zinc-700/80 hover:border-zinc-600'
                        }`}
                        title="Insert Emoji at cursor position"
                      >
                        <Smile className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Emoji Popover Picker Menu */}
                  {showEmojiPicker && (
                    <div className="absolute right-0 top-7 z-30 w-72 bg-[#18181c] border border-zinc-700 rounded-xl shadow-2xl p-3 space-y-2">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold">
                          <button
                            type="button"
                            onClick={() => setEmojiTab('server')}
                            className={`px-2 py-1 rounded-md transition-all cursor-pointer ${emojiTab === 'server' ? 'bg-yellow-500/20 text-yellow-400' : 'text-zinc-400 hover:text-zinc-200'}`}
                          >
                            Server ({emojis.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setEmojiTab('unicode')}
                            className={`px-2 py-1 rounded-md transition-all cursor-pointer ${emojiTab === 'unicode' ? 'bg-yellow-500/20 text-yellow-400' : 'text-zinc-400 hover:text-zinc-200'}`}
                          >
                            Emojis
                          </button>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setShowEmojiPicker(false)} 
                          className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {emojiTab === 'server' && (
                        <div className="max-h-48 overflow-y-auto grid grid-cols-6 gap-1.5 pt-1">
                          {emojis.length > 0 ? (
                            emojis.map((emoji) => (
                              <button
                                key={emoji.id}
                                type="button"
                                onClick={() => insertEmojiAtCursor(emoji.format)}
                                title={`:${emoji.name}: (${emoji.animated ? 'GIF' : 'PNG'})`}
                                className="p-1.5 rounded-lg bg-[#222228] hover:bg-yellow-500/20 hover:border-yellow-500/40 border border-zinc-700/60 flex items-center justify-center transition-all cursor-pointer group"
                              >
                                <img src={emoji.url} alt={emoji.name} className="w-5 h-5 object-contain group-hover:scale-125 transition-transform" referrerPolicy="no-referrer" />
                              </button>
                            ))
                          ) : (
                            <div className="col-span-6 py-4 text-center text-[11px] text-zinc-500">
                              No custom server emojis found.
                            </div>
                          )}
                        </div>
                      )}

                      {emojiTab === 'unicode' && (
                        <div className="max-h-48 overflow-y-auto grid grid-cols-7 gap-1 pt-1 text-base">
                          {[
                            '🛒', '👑', '🔥', '⚡', '🎟️', '🔒', '📦', 
                            '💬', '🚀', '💰', '📌', '✅', '❌', '⭐', 
                            '💎', '🎯', '📣', '🔔', '🎉', '🎁', '🏆', 
                            '💼', '🛡️', '⚙️', '🌐', '📊', '🙋‍♂️', '🤝'
                          ].map((em, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => insertEmojiAtCursor(em)}
                              className="p-1 rounded-md hover:bg-zinc-700 flex items-center justify-center transition-all cursor-pointer"
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <textarea
                    ref={textareaRef}
                    rows={7}
                    value={activePanel.embed?.description || ''}
                    onChange={(e) => updateEmbedField('description', e.target.value)}
                    className="w-full bg-[#1c1c20] border border-zinc-700/80 rounded-lg p-3 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500 font-mono leading-relaxed"
                  ></textarea>

                  {/* Visual Emoji & Formatting Render View */}
                  {activePanel.embed?.description && (
                    <div className="bg-[#18181c] border border-zinc-700/80 rounded-lg p-3 space-y-1 text-xs mt-2">
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold uppercase tracking-wider pb-1.5 border-b border-zinc-800/80">
                        <span>👁️ Description Visual Emoji Render</span>
                        <span className="text-yellow-400 font-semibold text-[9px] bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/30">Live Custom Emojis</span>
                      </div>
                      <div className="pt-2 font-sans leading-relaxed text-zinc-200">
                        {(() => {
                          const lines = (activePanel.embed?.description || '').split('\n');
                          return lines.map((line, idx) => {
                            let formatted = line;
                            formatted = formatted.replace(new RegExp('<a:([^:]+):(\\d+)>', 'g'), (match, name, id) => {
                              return `<img src="https://cdn.discordapp.com/emojis/${id}.gif" alt="${name}" title=":${name}:" class="w-4 h-4 inline-block align-middle mx-0.5" />`;
                            });
                            formatted = formatted.replace(new RegExp('<:([^:]+):(\\d+)>', 'g'), (match, name, id) => {
                              return `<img src="https://cdn.discordapp.com/emojis/${id}.png" alt="${name}" title=":${name}:" class="w-4 h-4 inline-block align-middle mx-0.5" />`;
                            });
                            formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-white">$1</strong>');
                            return (
                              <div key={idx} className="min-h-[1.2rem] my-0.5 text-zinc-300" dangerouslySetInnerHTML={{ __html: formatted }} />
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Media Content */}
              <div className="space-y-3 pt-3 border-t border-zinc-800">
                <div>
                  <h3 className="text-xs font-bold text-zinc-200">Media Content</h3>
                  <p className="text-[11px] text-zinc-400">Set up the embed's thumbnail and main image.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400">Image URL</label>
                  <input
                    type="text"
                    value={activePanel.embed?.imageUrl || ''}
                    onChange={(e) => updateEmbedField('imageUrl', e.target.value)}
                    placeholder="https://example.com/image.png"
                    className="w-full bg-[#1c1c20] border border-zinc-700/80 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400">Thumbnail URL</label>
                  <input
                    type="text"
                    value={activePanel.embed?.thumbnailUrl || ''}
                    onChange={(e) => updateEmbedField('thumbnailUrl', e.target.value)}
                    placeholder="https://cdn.discordapp.com/attachments/..."
                    className="w-full bg-[#1c1c20] border border-zinc-700/80 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500"
                  />
                </div>
              </div>

              {/* Footer Content */}
              <div className="space-y-3 pt-3 border-t border-zinc-800">
                <div>
                  <h3 className="text-xs font-bold text-zinc-200">Footer Content</h3>
                  <p className="text-[11px] text-zinc-400">Leave empty to omit footer text entirely.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400">Footer Text</label>
                  <input
                    type="text"
                    value={activePanel.embed?.footerText || ''}
                    onChange={(e) => updateEmbedField('footerText', e.target.value)}
                    placeholder="Leave empty for no footer"
                    className="w-full bg-[#1c1c20] border border-zinc-700/80 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400">Footer Icon URL</label>
                  <input
                    type="text"
                    value={activePanel.embed?.footerIconUrl || ''}
                    onChange={(e) => updateEmbedField('footerIconUrl', e.target.value)}
                    placeholder="https://example.com/icon.png"
                    className="w-full bg-[#1c1c20] border border-zinc-700/80 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500 font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Section 2: Two Panel Defaults & Categories */}
      <div className="bg-[#151518] border border-zinc-800/80 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-zinc-100">Default Categories for Both Ticket Options</h2>
            <p className="text-xs text-zinc-400">Configure separate server categories for Embed 1 (Purchase) and Embed 2 (Support).</p>
          </div>
          <span className="text-[10px] bg-yellow-500/10 text-yellow-400 font-bold px-2.5 py-1 rounded-lg border border-yellow-500/30">
            2 Categories Enabled
          </span>
        </div>

        {/* Categories Grid for Both Embed 1 and Embed 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Embed 1 Category Card */}
          <div className="bg-[#18181c] border border-yellow-500/30 rounded-xl p-4 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                <span className="text-xs font-bold text-zinc-200">Embed 1 Default Category (Purchase)</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-[11px] font-bold text-yellow-400">
                📁 {panel1.category || 'Purchase'}
              </span>
            </div>

            <select
              value={panel1.category || 'Purchase'}
              onChange={(e) => {
                const val = e.target.value;
                setPanel1(prev => ({ ...prev, category: val }));
              }}
              className="w-full bg-[#1c1c20] border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500 font-medium cursor-pointer"
            >
              <option value={panel1.category || 'Purchase'}>-- Select Category for Embed 1 --</option>
              {(categories.length > 0 ? categories : [{ id: '1', name: 'Purchase' }, { id: '2', name: 'Tickets' }, { id: '3', name: 'Support' }]).map((cat) => (
                <option key={cat.id || cat.name} value={cat.name}>
                  📁 {cat.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-zinc-400">Tickets opened via Embed 1 will appear in this category.</p>
          </div>

          {/* Embed 2 Category Card */}
          <div className="bg-[#18181c] border border-blue-500/30 rounded-xl p-4 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                <span className="text-xs font-bold text-zinc-200">Embed 2 Default Category (Support)</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-[11px] font-bold text-blue-400">
                📁 {panel2.category || 'Tickets'}
              </span>
            </div>

            <select
              value={panel2.category || 'Tickets'}
              onChange={(e) => {
                const val = e.target.value;
                setPanel2(prev => ({ ...prev, category: val }));
              }}
              className="w-full bg-[#1c1c20] border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
            >
              <option value={panel2.category || 'Tickets'}>-- Select Category for Embed 2 --</option>
              {(categories.length > 0 ? categories : [{ id: '1', name: 'Purchase' }, { id: '2', name: 'Tickets' }, { id: '3', name: 'Support' }]).map((cat) => (
                <option key={cat.id || cat.name} value={cat.name}>
                  📁 {cat.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-zinc-400">Tickets opened via Embed 2 will appear in this category.</p>
          </div>
        </div>

        {/* Ticket Channel Type Options for currently active panel */}
        <div className="space-y-2 pt-2 border-t border-zinc-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-300">
              Ticket Creation Type for {activeTab === 'panel2' ? 'Embed 2 (Support)' : 'Embed 1 (Purchase)'}
            </label>
            <span className="text-[11px] text-zinc-500 font-mono">
              Panel ID: {activePanel.id}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Text Channel Option */}
            <div 
              onClick={() => updatePanelField('channelType', 'text')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center space-y-2 relative ${
                activePanel.channelType !== 'thread'
                  ? 'bg-yellow-500/5 border-yellow-500'
                  : 'bg-[#18181c] border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {activePanel.channelType !== 'thread' && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center text-black">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
              <MessageSquare className="w-6 h-6 text-yellow-400" />
              <div className="font-extrabold text-sm text-zinc-100">Text Channel</div>
              <p className="text-[11px] text-zinc-400">Create a new text channel in your server for each ticket.</p>
            </div>

            {/* Thread Option */}
            <div 
              onClick={() => updatePanelField('channelType', 'thread')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center space-y-2 relative ${
                activePanel.channelType === 'thread'
                  ? 'bg-yellow-500/5 border-yellow-500'
                  : 'bg-[#18181c] border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {activePanel.channelType === 'thread' && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center text-black">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
              <Hash className="w-6 h-6 text-yellow-400" />
              <div className="font-extrabold text-sm text-zinc-100">Thread</div>
              <p className="text-[11px] text-zinc-400">Create a new thread for each ticket within a designated channel.</p>
            </div>
          </div>
        </div>

        {/* Default Support Roles Tag Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-300">
            Default Support Roles ({activeTab === 'panel2' ? 'Embed 2' : 'Embed 1'})
          </label>
          <p className="text-[11px] text-zinc-400">Roles that can view and manage tickets opened from this panel.</p>
          <div className="bg-[#18181c] border border-zinc-800 rounded-lg p-2.5 flex flex-wrap items-center gap-2">
            {(activePanel.supportRoles || ['Founder', 'Staff', 'Manager']).map((role, idx) => (
              <span key={idx} className="px-2.5 py-1 rounded-lg bg-zinc-800/90 border border-zinc-700 text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <span>{role}</span>
                <button onClick={() => removeSupportRole(role)} className="text-zinc-500 hover:text-red-400">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={newRoleInput}
              onChange={(e) => setNewRoleInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSupportRole(newRoleInput)}
              placeholder="Add role name..."
              className="bg-transparent border-none text-xs text-zinc-300 focus:outline-none min-w-[120px]"
            />
          </div>
        </div>

        {/* Default Custom Ticket Name */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-300">
              Default Custom Ticket Name ({activeTab === 'panel2' ? 'Embed 2' : 'Embed 1'})
            </label>
            <button 
              onClick={() => updatePanelField('customTicketName', activePanel.customTicketName + '-{USER_NAME}')}
              className="text-[11px] bg-[#18181c] border border-zinc-800 px-2 py-1 rounded-lg text-zinc-300 hover:text-yellow-400 font-medium flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-yellow-400" /> Add Variable
            </button>
          </div>
          <div className="bg-[#1c1c20] border border-zinc-700/80 rounded-lg p-2.5 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <input
              type="text"
              value={activePanel.customTicketName || (activeTab === 'panel2' ? 'support-{USER_NAME}' : 'buy-{USER_NAME}')}
              onChange={(e) => updatePanelField('customTicketName', e.target.value)}
              className="flex-1 bg-transparent border-none font-mono text-xs text-yellow-400 font-bold focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Open & Close Log Settings for Both Embeds */}
      <div className="bg-[#151518] border border-zinc-800/80 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-zinc-100">Open & Close Log Channels (Both Embed Options)</h2>
            <p className="text-xs text-zinc-400">Configure dedicated Discord log channels for ticket creation and ticket closures with transcripts.</p>
          </div>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2.5 py-1 rounded-lg border border-emerald-500/30">
            Open & Close Logs Active
          </span>
        </div>

        {/* Two Columns: Embed 1 Logs & Embed 2 Logs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Embed 1 Logs Box */}
          <div className="bg-[#18181c] border border-yellow-500/30 rounded-xl p-4 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                <span className="text-xs font-bold text-zinc-200">Embed 1 Logs (Purchase)</span>
              </div>
              <span className="text-[10px] text-yellow-400 font-bold bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/30">
                Embed 1
              </span>
            </div>

            {/* Embed 1 Open Log */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-300">Embed 1 Open Log Channel</label>
              <select
                value={panel1.openLogChannel || '#ticket-logs'}
                onChange={(e) => {
                  const val = e.target.value;
                  setPanel1(prev => ({ ...prev, openLogChannel: val }));
                }}
                className="w-full bg-[#1c1c20] border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500 font-mono cursor-pointer"
              >
                <option value="#ticket-logs">#ticket-logs (Default)</option>
                {channels.map((c) => (
                  <option key={c.id} value={`#${c.name}`}>#{c.name}</option>
                ))}
              </select>
            </div>

            {/* Embed 1 Close Log */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-300">Embed 1 Close Log Channel (Transcript)</label>
              <select
                value={panel1.closeLogChannel || '#ticket-logs'}
                onChange={(e) => {
                  const val = e.target.value;
                  setPanel1(prev => ({ ...prev, closeLogChannel: val }));
                }}
                className="w-full bg-[#1c1c20] border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500 font-mono cursor-pointer"
              >
                <option value="#ticket-logs">#ticket-logs (Default)</option>
                {channels.map((c) => (
                  <option key={c.id} value={`#${c.name}`}>#{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Embed 2 Logs Box */}
          <div className="bg-[#18181c] border border-blue-500/30 rounded-xl p-4 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                <span className="text-xs font-bold text-zinc-200">Embed 2 Logs (Support)</span>
              </div>
              <span className="text-[10px] text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/30">
                Embed 2
              </span>
            </div>

            {/* Embed 2 Open Log */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-300">Embed 2 Open Log Channel</label>
              <select
                value={panel2.openLogChannel || '#ticket-logs'}
                onChange={(e) => {
                  const val = e.target.value;
                  setPanel2(prev => ({ ...prev, openLogChannel: val }));
                }}
                className="w-full bg-[#1c1c20] border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono cursor-pointer"
              >
                <option value="#ticket-logs">#ticket-logs (Default)</option>
                {channels.map((c) => (
                  <option key={c.id} value={`#${c.name}`}>#{c.name}</option>
                ))}
              </select>
            </div>

            {/* Embed 2 Close Log */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-300">Embed 2 Close Log Channel (Transcript)</label>
              <select
                value={panel2.closeLogChannel || '#ticket-logs'}
                onChange={(e) => {
                  const val = e.target.value;
                  setPanel2(prev => ({ ...prev, closeLogChannel: val }));
                }}
                className="w-full bg-[#1c1c20] border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono cursor-pointer"
              >
                <option value="#ticket-logs">#ticket-logs (Default)</option>
                {channels.map((c) => (
                  <option key={c.id} value={`#${c.name}`}>#{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="space-y-2 pt-3 border-t border-zinc-800">
          <label className="text-xs font-bold text-zinc-300">
            Default Ticket Welcome Message ({activeTab === 'panel2' ? 'Embed 2' : 'Embed 1'})
          </label>
          <textarea
            rows={3}
            value={activePanel.welcomeMessage?.content || ''}
            onChange={(e) => updateWelcomeField('content', e.target.value)}
            className="w-full bg-[#1c1c20] border border-zinc-700/80 rounded-lg p-3 text-xs text-zinc-200 font-mono leading-relaxed focus:outline-none focus:border-yellow-500"
          ></textarea>
        </div>
      </div>

      {/* Render Panel Settings Modal */}
      {showSettingsModal && (
        <PanelSettingsModal
          panel={activePanel}
          channels={channels}
          roles={roles}
          categories={categories}
          onClose={() => setShowSettingsModal(false)}
          onSave={(updatedPanel) => {
            setActivePanelState(updatedPanel);
            onSave(updatedPanel);
          }}
        />
      )}
    </div>
  );
}
