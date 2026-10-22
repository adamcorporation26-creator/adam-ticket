import React from 'react';
import { ShoppingCart, Copy, Trash2, Plus, GripVertical, Link as LinkIcon } from 'lucide-react';

export default function DiscordEmbedPreview({ 
  embedData = {}, 
  buttons = [], 
  selectedButtonId = null, 
  onSelectButton, 
  onAddButton, 
  onDeleteButton,
  embedTitle = 'Embed 1'
}) {
  const {
    authorName = 'ADAM CORPORATION',
    authorUrl = '',
    authorIconUrl = '',
    title = '',
    description = 'Welcome to the **ADAM CORPORATION** Store.',
    color = '#e11d48',
    thumbnailUrl = '',
    imageUrl = '',
    footerText = '',
    footerIconUrl = ''
  } = embedData;

  // Simple Markdown Formatter for live preview
  const formatMarkdown = (text) => {
    if (!text) return '';
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let formatted = line;

      // Custom Animated Discord Emojis <a:name:id>
      formatted = formatted.replace(/&lt;a:([^:]+):(\d+)&gt;|<a:([^:]+):(\d+)>/g, (match, n1, id1, n2, id2) => {
        const id = id1 || id2;
        const name = n1 || n2;
        return `<img src="https://cdn.discordapp.com/emojis/${id}.gif" referrerPolicy="no-referrer" alt="${name}" title=":${name}:" class="w-4 h-4 inline-block align-middle mx-0.5" />`;
      });

      // Custom Static Discord Emojis <:name:id>
      formatted = formatted.replace(/&lt;:([^:]+):(\d+)&gt;|<:([^:]+):(\d+)>/g, (match, n1, id1, n2, id2) => {
        const id = id1 || id2;
        const name = n1 || n2;
        return `<img src="https://cdn.discordapp.com/emojis/${id}.png" referrerPolicy="no-referrer" alt="${name}" title=":${name}:" class="w-4 h-4 inline-block align-middle mx-0.5" />`;
      });

      // Bold **text**
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-white">$1</strong>');

      // Underline __text__
      formatted = formatted.replace(/__(.*?)__/g, '<u class="underline underline-offset-2 decoration-1 text-zinc-100">$1</u>');

      // Strikethrough ~~text~~
      formatted = formatted.replace(/~~(.*?)~~/g, '<del class="line-through text-zinc-400">$1</del>');

      // Italic *text* or _text_
      formatted = formatted.replace(/\*(.*?)\*/g, '<em class="italic text-zinc-200">$1</em>');
      formatted = formatted.replace(/_(.*?)_/g, '<em class="italic text-zinc-200">$1</em>');

      // Spoiler / Invisible ||text||
      formatted = formatted.replace(/\|\|(.*?)\|\|/g, '<span class="bg-[#1e1f22] text-[#1e1f22] hover:text-zinc-200 hover:bg-[#383a40] px-1.5 py-0.5 rounded transition-all cursor-pointer font-mono text-[11px]" title="Spoiler / Hidden Text (Hover/Click to reveal)">$1</span>');

      // Inline Code `text`
      formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-[#1e1f22] text-amber-300 px-1 py-0.5 rounded font-mono text-[11px] border border-zinc-700/60">$1</code>');

      // Discord Subtext -# text
      if (line.trim().startsWith('-#')) {
        return (
          <div key={idx} className="text-[10px] text-zinc-400 font-normal my-0.5">
            <span dangerouslySetInnerHTML={{ __html: formatted.replace('-#', '').trim() }} />
          </div>
        );
      }

      // Headers # Title, ## Subtitle, ### Heading
      if (line.trim().startsWith('# ')) {
        return (
          <div key={idx} className="text-base font-extrabold text-white my-1 border-b border-zinc-700/40 pb-0.5">
            <span dangerouslySetInnerHTML={{ __html: formatted.replace('# ', '').trim() }} />
          </div>
        );
      }
      if (line.trim().startsWith('## ')) {
        return (
          <div key={idx} className="text-sm font-bold text-white my-1">
            <span dangerouslySetInnerHTML={{ __html: formatted.replace('## ', '').trim() }} />
          </div>
        );
      }
      if (line.trim().startsWith('### ')) {
        return (
          <div key={idx} className="text-xs font-bold text-zinc-100 my-0.5">
            <span dangerouslySetInnerHTML={{ __html: formatted.replace('### ', '').trim() }} />
          </div>
        );
      }

      // Bullet points
      if (line.trim().startsWith('•')) {
        return (
          <div key={idx} className="flex items-start gap-1.5 my-0.5 text-zinc-300">
            <span className="text-red-500 font-bold">•</span>
            <span dangerouslySetInnerHTML={{ __html: formatted.replace('•', '').trim() }} />
          </div>
        );
      }
      return (
        <div key={idx} className="min-h-[1.2rem] my-0.5 text-zinc-300" dangerouslySetInnerHTML={{ __html: formatted }} />
      );
    });
  };

  const isValidUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    if (trimmed.startsWith('/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      if (trimmed.includes('example.com')) return false;
      return true;
    }
    return false;
  };

  return (
    <div className="bg-[#1e1f22] border border-zinc-800 rounded-xl p-4 shadow-2xl space-y-4 max-w-xl mx-auto">
      {/* Panel Embed Card Header */}
      <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-zinc-800 pb-2">
        <div className="flex items-center gap-2 font-bold text-zinc-200">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
          <span>{embedTitle}</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="hover:text-zinc-200 flex items-center gap-1 cursor-pointer">
            <Copy className="w-3 h-3" /> Duplicate embed
          </button>
          <button className="text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer">
            <Trash2 className="w-3 h-3" /> Delete
          </button>
        </div>
      </div>

      {/* Discord Embed Box */}
      <div 
        className="bg-[#2b2d31] rounded-lg p-4 flex gap-4 text-xs font-sans relative border-l-4 shadow-inner"
        style={{ borderLeftColor: color || '#e11d48' }}
      >
        <div className="flex-1 space-y-2">
          {/* Author */}
          {authorName && (
            <div className="flex items-center gap-2 font-bold text-zinc-200 text-[11px]">
              {isValidUrl(authorIconUrl) && (
                <img 
                  src={authorIconUrl.trim()} 
                  referrerPolicy="no-referrer"
                  alt="author" 
                  className="w-4 h-4 rounded-full object-cover" 
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
              <span>{authorName}</span>
            </div>
          )}

          {/* Title */}
          {title && (
            <div className="font-extrabold text-sm text-white uppercase tracking-tight">
              {title}
            </div>
          )}

          {/* Description Body */}
          <div className="text-[12px] leading-relaxed text-zinc-300 font-normal">
            {formatMarkdown(description)}
          </div>

          {/* Main Embed Banner Image */}
          {isValidUrl(imageUrl) && (
            <div className="mt-2.5 rounded-md overflow-hidden max-h-48 border border-zinc-700/50">
              <img 
                src={imageUrl.trim()} 
                referrerPolicy="no-referrer"
                alt="embed banner" 
                className="w-full h-full object-cover" 
                onError={(e) => { e.target.parentElement.style.display = 'none'; }}
              />
            </div>
          )}

          {/* Embed Footer (Only if non-empty) */}
          {footerText && footerText.trim() !== '' && (
            <div className="flex items-center gap-2 pt-2 text-[10px] font-bold text-zinc-400 tracking-wide uppercase">
              {isValidUrl(footerIconUrl) && (
                <img 
                  src={footerIconUrl.trim()} 
                  referrerPolicy="no-referrer"
                  alt="footer icon" 
                  className="w-4 h-4 rounded-full object-cover shrink-0" 
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
              <span>{footerText}</span>
            </div>
          )}
        </div>

        {/* Thumbnail Preview Image */}
        <div className="w-20 h-20 bg-[#1e1f22] border border-zinc-700/60 rounded-md overflow-hidden shrink-0 flex items-center justify-center p-0.5 shadow-md">
          <img 
            src={isValidUrl(thumbnailUrl) ? thumbnailUrl.trim() : '/adam_corp_logo.jpg'} 
            referrerPolicy="no-referrer"
            alt="thumbnail" 
            className="w-full h-full object-cover rounded" 
          />
        </div>
      </div>

      {/* Interaction Area (Buttons Row) */}
      <div className="space-y-3 pt-3 border-t border-zinc-800">
        <div className="flex items-center justify-between text-[11px] text-zinc-400">
          <span className="font-bold text-zinc-200">Interaction Area</span>
          <span className="text-[10px] text-zinc-500">Rows available [1/5]</span>
        </div>

        <div className="bg-[#151518] border border-zinc-800 rounded-xl p-3 space-y-3 shadow-lg">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-zinc-300">
              <GripVertical className="w-3.5 h-3.5 text-zinc-600 cursor-grab" />
              <span>Button Row</span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <button type="button" className="hover:text-zinc-200 cursor-pointer">Duplicate button row</button>
              <button type="button" className="text-red-400 hover:text-red-300 font-semibold cursor-pointer">Delete</button>
            </div>
          </div>

          {/* Render Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {buttons.map((btn, idx) => {
              const isSelected = selectedButtonId === btn.id;
              
              // Helper to render custom or unicode emoji
              const renderBtnEmoji = (emojiStr) => {
                if (!emojiStr) return '🛒';
                const match = emojiStr.match(/<(a)?:([^:]+):(\d+)>/);
                if (match) {
                  const isAnim = Boolean(match[1]);
                  const name = match[2];
                  const id = match[3];
                  return (
                    <img 
                      src={`https://cdn.discordapp.com/emojis/${id}.${isAnim ? 'gif' : 'png'}`} 
                      alt={name} 
                      className="w-4 h-4 inline-block object-contain" 
                      referrerPolicy="no-referrer"
                    />
                  );
                }
                return emojiStr;
              };

              return (
                <div
                  key={btn.id || idx}
                  onClick={() => onSelectButton && onSelectButton(btn.id)}
                  className={`group relative px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#1e1f24] text-white border-2 border-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.25)]'
                      : 'bg-[#1c1c20] text-zinc-300 border border-zinc-700 hover:border-zinc-500 hover:text-white'
                  }`}
                >
                  <GripVertical className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400" />
                  <span className="flex items-center">{renderBtnEmoji(btn.emoji)}</span>
                  <span>{btn.label || 'Buy'}</span>
                </div>
              );
            })}

            <button
              type="button"
              onClick={onAddButton}
              className="bg-[#1c1c20] hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-700/80 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-zinc-400" /> Add Button
            </button>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={onAddButton}
              className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 cursor-pointer font-medium"
            >
              <LinkIcon className="w-3 h-3 text-zinc-500" /> Add Link Button
            </button>
          </div>
        </div>

        {/* Global Row Actions */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onAddButton}
            className="flex-1 bg-[#151518] hover:bg-zinc-800/80 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-yellow-400" /> Add Button Row
          </button>
          <button
            type="button"
            className="flex-1 bg-[#151518] hover:bg-zinc-800/80 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-yellow-400" /> Add Dropdown Menu
          </button>
        </div>
      </div>
    </div>
  );
}
