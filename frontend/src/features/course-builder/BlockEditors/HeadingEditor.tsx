'use client';

import type { HeadingBlock } from '../../../types/course';

interface Props {
  block: HeadingBlock;
  onChange: (updated: HeadingBlock) => void;
}

export function HeadingEditor({ block, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">רמת כותרת</label>
        <select
          value={block.level}
          onChange={(e) => onChange({ ...block, level: Number(e.target.value) as 1 | 2 | 3 })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value={1}>H1 — כותרת ראשית</option>
          <option value={2}>H2 — כותרת משנית</option>
          <option value={3}>H3 — כותרת שלישית</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">טקסט</label>
        <input
          type="text"
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
          placeholder="הכנס כותרת..."
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">יישור</label>
        <div className="flex gap-2">
          {(['right', 'center', 'left'] as const).map((align) => (
            <button
              key={align}
              onClick={() => onChange({ ...block, align })}
              className={`flex-1 py-1.5 rounded text-xs border transition-colors ${
                block.align === align ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {align === 'right' ? 'ימין' : align === 'center' ? 'מרכז' : 'שמאל'}
            </button>
          ))}
        </div>
      </div>
      <TimeGateField
        value={block.minTimeSeconds}
        onChange={(v) => onChange({ ...block, minTimeSeconds: v })}
      />
    </div>
  );
}

export function TimeGateField({
  value,
  onChange
}: {
  value?: number;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        זמן מינימלי לצפייה (שניות)
      </label>
      <input
        type="number"
        min={0}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        placeholder="ללא הגבלה"
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
      />
    </div>
  );
}
