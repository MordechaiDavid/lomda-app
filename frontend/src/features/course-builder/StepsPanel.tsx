'use client';

import type { CourseStep, BlockType } from '../../types/course';

interface Props {
  steps: CourseStep[];
  activeStepIndex: number;
  onSelectStep: (index: number) => void;
  onAddStep: () => void;
  onDeleteStep: (index: number) => void;
  onRenameStep: (index: number, title: string) => void;
  onMoveStep: (index: number, direction: 'up' | 'down') => void;
  onAddBlock: (type: BlockType) => void;
}

const BLOCK_TYPES: { type: BlockType; label: string; icon: string }[] = [
  { type: 'heading', label: 'כותרת',  icon: 'H' },
  { type: 'text',    label: 'טקסט',   icon: '¶' },
  { type: 'image',   label: 'תמונה',  icon: '🖼' },
  { type: 'video',   label: 'וידאו',  icon: '▶' },
  { type: 'quiz',    label: 'שאלון',  icon: '?' },
  { type: 'divider', label: 'מפריד',  icon: '—' },
];

export function StepsPanel({
  steps,
  activeStepIndex,
  onSelectStep,
  onAddStep,
  onDeleteStep,
  onRenameStep,
  onMoveStep,
  onAddBlock
}: Props) {
  return (
    <aside className="w-56 flex-shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden">

      {/* Block palette — TOP, prominent */}
      <div className="px-3 pt-3 pb-2 border-b border-gray-200 bg-white flex-shrink-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">הוסף רכיב לשלב</p>
        <div className="grid grid-cols-3 gap-1.5">
          {BLOCK_TYPES.map((b) => (
            <button
              key={b.type}
              onClick={() => onAddBlock(b.type)}
              className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl bg-gray-50 hover:bg-blue-50 hover:text-blue-700 text-gray-600 transition-colors border border-gray-200 hover:border-blue-300"
            >
              <span className="text-xl leading-none">{b.icon}</span>
              <span className="text-xs leading-tight font-medium">{b.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Steps list */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 pt-3 pb-1 flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">שלבים</p>
          <button
            onClick={onAddStep}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 rounded-lg hover:bg-blue-50"
          >
            + הוסף שלב
          </button>
        </div>
        <div className="px-2 pb-3 space-y-1">
          {steps.map((step, idx) => (
            <StepRow
              key={step.id}
              step={step}
              index={idx}
              isActive={idx === activeStepIndex}
              isFirst={idx === 0}
              isLast={idx === steps.length - 1}
              canDelete={steps.length > 1}
              onSelect={() => onSelectStep(idx)}
              onDelete={() => onDeleteStep(idx)}
              onRename={(t) => onRenameStep(idx, t)}
              onMove={(d) => onMoveStep(idx, d)}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}

function StepRow({
  step, index, isActive, isFirst, isLast, canDelete,
  onSelect, onDelete, onRename, onMove
}: {
  step: CourseStep;
  index: number;
  isActive: boolean;
  isFirst: boolean;
  isLast: boolean;
  canDelete: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (t: string) => void;
  onMove: (d: 'up' | 'down') => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`group relative rounded-xl px-2.5 py-2 cursor-pointer transition-colors ${
        isActive
          ? 'bg-blue-600 text-white shadow-sm'
          : 'hover:bg-white text-gray-700 hover:shadow-sm'
      }`}
    >
      {/* Step number badge */}
      <div className="flex items-start gap-2">
        <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
          isActive ? 'bg-white text-blue-600' : 'bg-gray-200 text-gray-600'
        }`}>
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={step.title}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onRename(e.target.value)}
            className={`w-full text-xs font-medium bg-transparent outline-none truncate ${
              isActive ? 'text-white placeholder-blue-200' : 'text-gray-700'
            }`}
          />
          <p className={`text-xs mt-0.5 ${isActive ? 'text-blue-200' : 'text-gray-400'}`}>
            {step.blocks.length} רכיבים
          </p>
        </div>
      </div>

      {/* Action buttons (visible on hover/active) */}
      <div className={`absolute left-1 top-1 flex flex-col gap-0.5 ${
        isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      } transition-opacity`}>
        {!isFirst && (
          <button
            onClick={(e) => { e.stopPropagation(); onMove('up'); }}
            className="w-4 h-4 flex items-center justify-center rounded text-xs hover:bg-black/10"
            title="העלה שלב"
          >↑</button>
        )}
        {!isLast && (
          <button
            onClick={(e) => { e.stopPropagation(); onMove('down'); }}
            className="w-4 h-4 flex items-center justify-center rounded text-xs hover:bg-black/10"
            title="הורד שלב"
          >↓</button>
        )}
        {canDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); if (confirm('למחוק שלב זה?')) onDelete(); }}
            className="w-4 h-4 flex items-center justify-center rounded text-xs hover:bg-red-500/20 text-red-400"
            title="מחק שלב"
          >✕</button>
        )}
      </div>
    </div>
  );
}
