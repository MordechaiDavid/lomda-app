'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ContentBlock, HeadingBlock, TextBlock, ImageBlock, VideoBlock, QuizBlock } from '../../types/course';

interface CanvasProps {
  blocks: ContentBlock[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function CourseCanvas({ blocks, selectedId, onSelect, onDelete }: CanvasProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas' });

  return (
    <main
      ref={setNodeRef}
      className={`flex-1 overflow-y-auto p-6 bg-gray-100 min-h-full transition-colors ${isOver ? 'bg-blue-50' : ''}`}
    >
      {blocks.length === 0 && (
        <div className="h-64 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400">
          <p className="text-lg">גרור רכיבים לכאן</p>
          <p className="text-sm mt-1">או בחר רכיב מהרשימה משמאל</p>
        </div>
      )}
      <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 max-w-2xl mx-auto">
          {blocks.map((block) => (
            <SortableBlock
              key={block.id}
              block={block}
              isSelected={block.id === selectedId}
              onSelect={() => onSelect(block.id)}
              onDelete={() => onDelete(block.id)}
            />
          ))}
        </div>
      </SortableContext>
    </main>
  );
}

function SortableBlock({
  block,
  isSelected,
  onSelect,
  onDelete
}: {
  block: ContentBlock;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group relative bg-white rounded-xl border-2 transition-colors cursor-pointer ${
        isSelected ? 'border-blue-500 shadow-md' : 'border-transparent hover:border-gray-300'
      }`}
    >
      {/* Drag handle */}
      <div
        {...listeners}
        {...attributes}
        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 cursor-grab p-1 text-gray-400 hover:text-gray-600 rounded z-10"
        onClick={(e) => e.stopPropagation()}
      >
        ⠿
      </div>

      {/* Delete */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute left-2 top-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xs px-1 z-10"
      >
        ✕
      </button>

      <div className="p-4">
        <BlockPreview block={block} />
      </div>

      {block.minTimeSeconds && (
        <div className="px-4 pb-2">
          <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
            ⏱ {block.minTimeSeconds} שניות מינימום
          </span>
        </div>
      )}
    </div>
  );
}

function BlockPreview({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'heading': {
      const b = block as HeadingBlock;
      const Tag = `h${b.level}` as 'h1' | 'h2' | 'h3';
      const sizes = { 1: 'text-2xl', 2: 'text-xl', 3: 'text-lg' };
      return (
        <Tag className={`font-bold text-gray-800 ${sizes[b.level]}`} style={{ textAlign: b.align ?? 'right' }}>
          {b.text || <span className="text-gray-300 italic">כותרת ריקה</span>}
        </Tag>
      );
    }
    case 'text': {
      const b = block as TextBlock;
      return (
        <div className="text-sm text-gray-700 leading-relaxed">
          {b.html
            ? <div dangerouslySetInnerHTML={{ __html: b.html }} />
            : <span className="text-gray-300 italic">בלוק טקסט ריק</span>
          }
        </div>
      );
    }
    case 'image': {
      const b = block as ImageBlock;
      return b.url
        ? <img src={b.url} alt={b.alt ?? ''} className="w-full max-h-48 object-cover rounded" />
        : <div className="h-24 bg-gray-100 rounded flex items-center justify-center text-gray-400">🖼 תמונה</div>;
    }
    case 'video': {
      const b = block as VideoBlock;
      return (
        <div className="bg-gray-900 rounded-lg p-4 flex items-center gap-3 text-white">
          <span className="text-2xl">▶</span>
          <div>
            <p className="text-sm font-medium">וידאו ({b.provider})</p>
            {b.url && <p className="text-xs text-gray-400 truncate">{b.url}</p>}
          </div>
        </div>
      );
    }
    case 'quiz': {
      const b = block as QuizBlock;
      return (
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-sm font-medium text-blue-800">שאלון — {b.questions.length} שאלות</p>
          {b.passingScore && <p className="text-xs text-blue-600">ציון עובר: {b.passingScore}%</p>}
        </div>
      );
    }
    case 'divider':
      return <hr className="border-gray-300" />;
    default:
      return null;
  }
}
