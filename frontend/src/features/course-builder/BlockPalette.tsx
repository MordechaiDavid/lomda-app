'use client';

import { useDraggable } from '@dnd-kit/core';
import type { BlockType } from '../../types/course';

const BLOCK_TYPES: { type: BlockType; label: string; icon: string; description: string }[] = [
  { type: 'heading',  label: 'כותרת',        icon: 'H',  description: 'כותרת ראשית או משנית' },
  { type: 'text',     label: 'טקסט',          icon: '¶',  description: 'פסקת טקסט עשיר' },
  { type: 'image',    label: 'תמונה',         icon: '🖼',  description: 'תמונה עם כיתוב' },
  { type: 'video',    label: 'וידאו',         icon: '▶',  description: 'וידאו מועלה או YouTube' },
  { type: 'quiz',     label: 'שאלון',         icon: '?',  description: 'שאלות רב-ברירה' },
  { type: 'divider',  label: 'מפריד',         icon: '—',  description: 'קו הפרדה' },
];

function DraggableBlock({ type, label, icon, description }: (typeof BLOCK_TYPES)[0]) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { isPalette: true, blockType: type }
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white cursor-grab select-none hover:border-blue-400 hover:bg-blue-50 transition-colors ${isDragging ? 'opacity-50' : ''}`}
    >
      <span className="w-8 h-8 flex items-center justify-center rounded bg-gray-100 text-gray-600 font-bold text-sm flex-shrink-0">
        {icon}
      </span>
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );
}

export function BlockPalette() {
  return (
    <aside className="w-56 flex-shrink-0 bg-gray-50 border-r border-gray-200 p-4 flex flex-col gap-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">רכיבים</p>
      {BLOCK_TYPES.map((b) => (
        <DraggableBlock key={b.type} {...b} />
      ))}
    </aside>
  );
}
