'use client';

import type { VideoBlock } from '../../../types/course';
import { TimeGateField } from './HeadingEditor';

interface Props {
  block: VideoBlock;
  onChange: (updated: VideoBlock) => void;
}

export function VideoEditor({ block, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">ספק</label>
        <select
          value={block.provider}
          onChange={(e) => onChange({ ...block, provider: e.target.value as VideoBlock['provider'] })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="youtube">YouTube</option>
          <option value="vimeo">Vimeo</option>
          <option value="upload">קובץ מועלה</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          {block.provider === 'upload' ? 'URL קובץ' : 'קישור וידאו'}
        </label>
        <input
          type="url"
          value={block.url}
          onChange={(e) => onChange({ ...block, url: e.target.value })}
          placeholder={block.provider === 'youtube' ? 'https://youtube.com/watch?v=...' : 'https://...'}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">כיתוב (אופציונלי)</label>
        <input
          type="text"
          value={block.caption ?? ''}
          onChange={(e) => onChange({ ...block, caption: e.target.value || undefined })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          צפייה נדרשת (% מהסרטון)
        </label>
        <input
          type="number"
          min={0}
          max={100}
          value={block.requiredWatchPercent ?? 90}
          onChange={(e) => onChange({ ...block, requiredWatchPercent: Number(e.target.value) })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
        <p className="text-xs text-gray-400 mt-1">הלומד חייב לצפות ב-X% לפני שיוכל להמשיך</p>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input
          type="checkbox"
          checked={block.autoplay ?? false}
          onChange={(e) => onChange({ ...block, autoplay: e.target.checked })}
          className="rounded"
        />
        הפעל אוטומטית
      </label>
      <TimeGateField
        value={block.minTimeSeconds}
        onChange={(v) => onChange({ ...block, minTimeSeconds: v })}
      />
    </div>
  );
}
