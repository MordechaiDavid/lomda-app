'use client';

import dynamic from 'next/dynamic';
import type { ContentBlock, HeadingBlock, TextBlock, ImageBlock, VideoBlock, QuizBlock, DividerBlock } from '../../types/course';
import { HeadingEditor, TimeGateField } from './BlockEditors/HeadingEditor';
import { VideoEditor } from './BlockEditors/VideoEditor';
import { QuizEditor } from './BlockEditors/QuizEditor';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false, loading: () => <div className="h-32 bg-gray-100 rounded animate-pulse" /> });

interface PanelProps {
  block: ContentBlock | null;
  onChange: (updated: ContentBlock) => void;
  courseSettings: {
    passing_score: number;
    background_music_url: string;
    estimated_minutes: string;
    thumbnail_url: string;
  };
  onCourseSettingsChange: (key: string, value: string | number) => void;
}

export function PropertiesPanel({ block, onChange, courseSettings, onCourseSettingsChange }: PanelProps) {
  return (
    <aside className="w-72 flex-shrink-0 bg-white border-l border-gray-200 overflow-y-auto">
      {block ? (
        <div className="p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            עריכת רכיב — {blockTypeLabel(block.type)}
          </p>
          <BlockEditor block={block} onChange={onChange} />
        </div>
      ) : (
        <div className="p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">הגדרות קורס</p>
          <CourseSettingsForm settings={courseSettings} onChange={onCourseSettingsChange} />
        </div>
      )}
    </aside>
  );
}

function blockTypeLabel(type: ContentBlock['type']) {
  const map: Record<string, string> = {
    heading: 'כותרת', text: 'טקסט', image: 'תמונה', video: 'וידאו', quiz: 'שאלון', divider: 'מפריד'
  };
  return map[type] ?? type;
}

function BlockEditor({ block, onChange }: { block: ContentBlock; onChange: (b: ContentBlock) => void }) {
  switch (block.type) {
    case 'heading':
      return <HeadingEditor block={block as HeadingBlock} onChange={onChange} />;

    case 'text': {
      const b = block as TextBlock;
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">תוכן</label>
            <ReactQuill
              theme="snow"
              value={b.html}
              onChange={(html) => onChange({ ...b, html })}
              modules={{ toolbar: [['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['link'], ['clean']] }}
              className="text-sm"
            />
          </div>
          <TimeGateField value={b.minTimeSeconds} onChange={(v) => onChange({ ...b, minTimeSeconds: v })} />
        </div>
      );
    }

    case 'image': {
      const b = block as ImageBlock;
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">URL תמונה</label>
            <input
              type="url"
              value={b.url}
              onChange={(e) => onChange({ ...b, url: e.target.value })}
              placeholder="https://..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">טקסט חלופי</label>
            <input
              type="text"
              value={b.alt ?? ''}
              onChange={(e) => onChange({ ...b, alt: e.target.value || undefined })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">רוחב</label>
            <select
              value={b.width ?? 'full'}
              onChange={(e) => onChange({ ...b, width: e.target.value as ImageBlock['width'] })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="full">רוחב מלא</option>
              <option value="large">גדול</option>
              <option value="medium">בינוני</option>
            </select>
          </div>
          <TimeGateField value={b.minTimeSeconds} onChange={(v) => onChange({ ...b, minTimeSeconds: v })} />
        </div>
      );
    }

    case 'video':
      return <VideoEditor block={block as VideoBlock} onChange={onChange} />;

    case 'quiz':
      return <QuizEditor block={block as QuizBlock} onChange={onChange} />;

    case 'divider': {
      const b = block as DividerBlock;
      return (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">סגנון קו</label>
          <select
            value={b.style ?? 'solid'}
            onChange={(e) => onChange({ ...b, style: e.target.value as DividerBlock['style'] })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="solid">רציף</option>
            <option value="dashed">מקווקו</option>
            <option value="dotted">נקודות</option>
          </select>
        </div>
      );
    }
  }
}

function CourseSettingsForm({
  settings,
  onChange
}: {
  settings: PanelProps['courseSettings'];
  onChange: PanelProps['onCourseSettingsChange'];
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">ציון עובר (%)</label>
        <input
          type="number"
          min={0}
          max={100}
          value={settings.passing_score}
          onChange={(e) => onChange('passing_score', Number(e.target.value))}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">זמן משוער (דקות)</label>
        <input
          type="number"
          min={1}
          value={settings.estimated_minutes}
          onChange={(e) => onChange('estimated_minutes', e.target.value)}
          placeholder="לא מוגדר"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">מוזיקת רקע (URL)</label>
        <input
          type="url"
          value={settings.background_music_url}
          onChange={(e) => onChange('background_music_url', e.target.value)}
          placeholder="https://... (mp3)"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
        <p className="text-xs text-gray-400 mt-1">יושמע בזמן הצפייה בלומדה</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">תמונת תצוגה (URL)</label>
        <input
          type="url"
          value={settings.thumbnail_url}
          onChange={(e) => onChange('thumbnail_url', e.target.value)}
          placeholder="https://..."
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}
