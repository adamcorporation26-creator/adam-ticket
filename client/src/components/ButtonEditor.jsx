import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Settings, 
  MessageSquare, 
  Sliders, 
  RotateCcw, 
  Trash2, 
  Smile, 
  X, 
  Plus, 
  HelpCircle,
  Check
} from 'lucide-react';

export default function ButtonEditor({ button, onUpdate, onDelete, onBack, emojis = [] }) {
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'messages' | 'advanced'
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiTab, setEmojiTab] = useState('server'); // 'server' | 'unicode'

  if (!button) {
    return (
      <div className="bg-[#151518] border border-zinc-800 rounded-xl p-6 text-center text-zinc-400 text-xs">
        No button selected for editing.
      </div>
    );
  }

  const updateField = (field, value) => {
    onUpdate({
      ...button,
      [field]: value
    });
  };

  const handleReset = () => {
    onUpdate({
      ...button,
      label: 'Buy',
      style: 'Primary',
      emoji: '🛒',
      customId: `ticket_create_${button.id || 'buy'}`
    });
  };

  // Button style color presets matching Discord UI
  const colorStyles = [
    { name: 'Primary (Blurple)', value: 'Primary', hex: '#5865F2', bg: 'bg-[#5865F2]' },
    { name: 'Secondary (Grey)', value: 'Secondary', hex: '#4E5058', bg: 'bg-[#4E5058]' },
    { name: 'Success (Green)', value: 'Success', hex: '#248046', bg: 'bg-[#248046]' },
    { name: 'Danger (Red)', value: 'Danger', hex: '#DA373C', bg: 'bg-[#DA373C]' },
  ];

  const currentColorObj = colorStyles.find(c => c.value === (button.style || 'Primary')) || colorStyles[0];

  // Questions management
  const questions = button.questions || [];

  const addQuestion = () => {
    const newQ = {
      id: Date.now().toString(),
      label: 'New Question',
      placeholder: 'User answer here...',
      required: true,
      style: 'short' // 'short' or 'paragraph'
    };
    updateField('questions', [...questions, newQ]);
  };

  const updateQuestion = (index, qField, qVal) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [qField]: qVal };
    updateField('questions', updated);
  };

  const removeQuestion = (index) => {
    const updated = questions.filter((_, i) => i !== index);
    updateField('questions', updated);
  };

  return (
    <div className="bg-[#151518] border border-zinc-800/80 rounded-xl p-5 space-y-5 shadow-2xl">
      {/* Header: Edit: {Button Label} + Back button */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div>
          <h2 className="text-base font-extrabold text-zinc-100 flex items-center gap-2">
            <span>Edit: {button.label || 'Button'}</span>
          </h2>
        </div>
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg bg-[#18181c] border border-zinc-700/80 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all cursor-pointer"
          title="Back to Embed Editor"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Sub-tabs: General | Messages | Advanced */}
      <div className="flex items-center gap-1 bg-[#18181c] p-1 rounded-xl border border-zinc-800/80 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'general'
              ? 'bg-zinc-800 text-zinc-100 font-bold border border-zinc-700/60 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Settings className="w-3.5 h-3.5" /> General
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'messages'
              ? 'bg-zinc-800 text-zinc-100 font-bold border border-zinc-700/60 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" /> Messages
        </button>
        <button
          onClick={() => setActiveTab('advanced')}
          className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'advanced'
              ? 'bg-zinc-800 text-zinc-100 font-bold border border-zinc-700/60 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" /> Advanced
        </button>
      </div>

      {/* GENERAL TAB */}
      {activeTab === 'general' && (
        <div className="space-y-5">
          {/* Color */}
          <div className="space-y-2">
            <div>
              <h3 className="text-xs font-bold text-zinc-200">Color</h3>
              <p className="text-[11px] text-zinc-400">The visual style of this button.</p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div 
                className={`w-7 h-7 rounded-full shadow-md ${currentColorObj.bg} border-2 border-zinc-600/50 flex items-center justify-center text-white text-xs font-bold`}
              >
                ✓
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowColorPicker(prev => !prev)}
                  className="px-3 py-1.5 rounded-lg bg-[#1c1c20] border border-zinc-700/80 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Settings className="w-3 h-3 text-zinc-400" />
                  <span>Change Color ({currentColorObj.name.split(' ')[0]})</span>
                </button>

                {showColorPicker && (
                  <div className="absolute left-0 top-9 z-30 w-56 bg-[#18181c] border border-zinc-700 rounded-xl shadow-2xl p-2 space-y-1">
                    <div className="text-[10px] font-bold text-zinc-400 px-2 py-1 uppercase tracking-wider">Select Style</div>
                    {colorStyles.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => {
                          updateField('style', c.value);
                          setShowColorPicker(false);
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs font-medium cursor-pointer transition-all ${
                          (button.style || 'Primary') === c.value
                            ? 'bg-zinc-800 text-white font-bold border border-zinc-700'
                            : 'text-zinc-300 hover:bg-zinc-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-3.5 h-3.5 rounded-full ${c.bg}`}></span>
                          <span>{c.name}</span>
                        </div>
                        {(button.style || 'Primary') === c.value && <Check className="w-3.5 h-3.5 text-yellow-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions: Reset & Delete */}
          <div className="space-y-2 pt-3 border-t border-zinc-800/80">
            <div>
              <h3 className="text-xs font-bold text-zinc-200">Actions</h3>
              <p className="text-[11px] text-zinc-400">Reset or delete this button.</p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 bg-[#1c1c20] hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
              <button
                type="button"
                onClick={() => onDelete(button.id)}
                className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-800/80 text-red-400 hover:text-red-300 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>

          {/* Button Emoji */}
          <div className="space-y-2 pt-3 border-t border-zinc-800/80 relative">
            <div>
              <h3 className="text-xs font-bold text-zinc-200">Button Emoji</h3>
              <p className="text-[11px] text-zinc-400">An optional emoji for this button.</p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="w-8 h-8 rounded-lg bg-[#1c1c20] border border-zinc-700 flex items-center justify-center text-base overflow-hidden">
                {(() => {
                  if (!button.emoji) return '🛒';
                  const match = button.emoji.match(/<(a)?:([^:]+):(\d+)>/);
                  if (match) {
                    const isAnim = Boolean(match[1]);
                    const name = match[2];
                    const id = match[3];
                    return (
                      <img 
                        src={`https://cdn.discordapp.com/emojis/${id}.${isAnim ? 'gif' : 'png'}`} 
                        alt={name} 
                        className="w-5 h-5 object-contain" 
                        referrerPolicy="no-referrer"
                      />
                    );
                  }
                  return button.emoji;
                })()}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(prev => !prev)}
                  className="px-3 py-1.5 bg-[#1c1c20] hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-200 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Smile className="w-3.5 h-3.5 text-zinc-400" /> Change Emoji
                </button>
                {button.emoji && (
                  <button
                    type="button"
                    onClick={() => updateField('emoji', '')}
                    className="text-xs text-red-400 hover:text-red-300 font-medium cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* Popover Emoji Picker */}
            {showEmojiPicker && (
              <div className="absolute left-0 top-16 z-30 w-72 bg-[#18181c] border border-zinc-700 rounded-xl shadow-2xl p-3 space-y-2">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <div className="flex items-center gap-1 text-[11px] font-bold">
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
                          onClick={() => {
                            updateField('emoji', emoji.format);
                            setShowEmojiPicker(false);
                          }}
                          title={`:${emoji.name}:`}
                          className="p-1.5 rounded-lg bg-[#222228] hover:bg-yellow-500/20 hover:border-yellow-500/40 border border-zinc-700/60 flex items-center justify-center transition-all cursor-pointer"
                        >
                          <img src={emoji.url} alt={emoji.name} className="w-5 h-5 object-contain" />
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
                        onClick={() => {
                          updateField('emoji', em);
                          setShowEmojiPicker(false);
                        }}
                        className="p-1 rounded-md hover:bg-zinc-700 flex items-center justify-center transition-all cursor-pointer"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Button Text */}
          <div className="space-y-2 pt-3 border-t border-zinc-800/80">
            <div>
              <h3 className="text-xs font-bold text-zinc-200">Button Text</h3>
              <p className="text-[11px] text-zinc-400">The clickable label on this button.</p>
            </div>

            <div className="space-y-1">
              <input
                type="text"
                maxLength={80}
                value={button.label || ''}
                onChange={(e) => updateField('label', e.target.value)}
                placeholder="Buy"
                className="w-full bg-[#1c1c20] border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500 font-medium"
              />
              <div className="flex justify-end text-[10px] text-zinc-500 font-mono">
                {(button.label || '').length}/80
              </div>
            </div>
          </div>

          {/* Ticket Questions */}
          <div className="space-y-3 pt-3 border-t border-zinc-800/80">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-zinc-200">Ticket Questions</h3>
                <p className="text-[11px] text-zinc-400">Configure questions that users must answer when creating a ticket.</p>
              </div>
              <button
                type="button"
                onClick={addQuestion}
                className="px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/20 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Add Question
              </button>
            </div>

            {questions.length > 0 ? (
              <div className="space-y-2.5">
                {questions.map((q, idx) => (
                  <div key={q.id || idx} className="bg-[#18181c] border border-zinc-800 rounded-lg p-3 space-y-2 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-zinc-300">Question #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeQuestion(idx)}
                        className="text-zinc-500 hover:text-red-400 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={q.label || ''}
                      onChange={(e) => updateQuestion(idx, 'label', e.target.value)}
                      placeholder="e.g. What product do you want to purchase?"
                      className="w-full bg-[#1c1c20] border border-zinc-700/80 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500"
                    />

                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <label className="flex items-center gap-1.5 text-zinc-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={q.required !== false}
                          onChange={(e) => updateQuestion(idx, 'required', e.target.checked)}
                          className="rounded border-zinc-700 text-yellow-500 focus:ring-0 bg-zinc-800"
                        />
                        <span>Required field</span>
                      </label>

                      <select
                        value={q.style || 'short'}
                        onChange={(e) => updateQuestion(idx, 'style', e.target.value)}
                        className="bg-[#1c1c20] border border-zinc-700/80 rounded px-2 py-0.5 text-[11px] text-zinc-300 focus:outline-none"
                      >
                        <option value="short">Short Input</option>
                        <option value="paragraph">Paragraph Text</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#18181c] border border-zinc-800/80 border-dashed rounded-lg p-4 text-center text-[11px] text-zinc-500">
                No custom questions configured. Users will open tickets directly.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MESSAGES TAB */}
      {activeTab === 'messages' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-bold text-zinc-200">Custom Ticket Welcome Message</h3>
            <p className="text-[11px] text-zinc-400">Override default welcome message specifically for tickets opened via this button.</p>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-zinc-400">Welcome Message Text</label>
            <textarea
              rows={4}
              value={button.welcomeMessage?.content || ''}
              onChange={(e) => updateField('welcomeMessage', { ...button.welcomeMessage, content: e.target.value })}
              placeholder="Leave blank to use default panel welcome message..."
              className="w-full bg-[#1c1c20] border border-zinc-700/80 rounded-lg p-3 text-xs text-zinc-200 font-mono leading-relaxed focus:outline-none focus:border-yellow-500"
            ></textarea>
          </div>
        </div>
      )}

      {/* ADVANCED TAB */}
      {activeTab === 'advanced' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-bold text-zinc-200">Button Identifier</h3>
            <p className="text-[11px] text-zinc-400">Unique Discord Custom ID for this button component.</p>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-400">Custom ID</label>
            <input
              type="text"
              value={button.customId || `ticket_create_${button.id}`}
              onChange={(e) => updateField('customId', e.target.value)}
              className="w-full bg-[#1c1c20] border border-zinc-700/80 rounded-lg px-3 py-1.5 text-xs text-yellow-400 font-mono focus:outline-none focus:border-yellow-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
