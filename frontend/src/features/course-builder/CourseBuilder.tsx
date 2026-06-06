'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { ContentBlock, BlockType, Course } from '../../types/course';
import { BlockPalette } from './BlockPalette';
import { CourseCanvas } from './CourseCanvas';
import { PropertiesPanel } from './PropertiesPanel';
import { createDefaultBlock } from './utils';
import { apiService } from '../../lib/apiService';

interface Props {
  course: Course;
  onSaved?: (updated: Course) => void;
}

export function CourseBuilder({ course, onSaved }: Props) {
  const [blocks, setBlocks] = useState<ContentBlock[]>(
    (course.content ?? []).map((b, i) => ({ ...b, order: i }))
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [courseSettings, setCourseSettings] = useState({
    passing_score: course.passing_score ?? 70,
    background_music_url: course.background_music_url ?? '',
    estimated_minutes: course.estimated_minutes ? String(course.estimated_minutes) : '',
    thumbnail_url: course.thumbnail_url ?? ''
  });
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const selectedBlock = blocks.find((b) => b.id === selectedId) ?? null;

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      // Dropped from palette → add new block
      if (active.data.current?.isPalette) {
        const blockType = active.data.current.blockType as BlockType;
        const newBlock = createDefaultBlock(blockType);
        newBlock.order = blocks.length;
        setBlocks((prev) => [...prev, newBlock]);
        setSelectedId(newBlock.id);
        return;
      }

      // Reorder within canvas
      if (active.id !== over.id) {
        setBlocks((prev) => {
          const oldIdx = prev.findIndex((b) => b.id === active.id);
          const newIdx = prev.findIndex((b) => b.id === over.id);
          return arrayMove(prev, oldIdx, newIdx).map((b, i) => ({ ...b, order: i }));
        });
      }
    },
    [blocks]
  );

  const handleBlockChange = useCallback((updated: ContentBlock) => {
    setBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  }, []);

  const handleDelete = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  const handleCourseSettingChange = useCallback((key: string, value: string | number) => {
    setCourseSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const save = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await apiService.updateCourse(course.id, {
        content: blocks,
        passing_score: courseSettings.passing_score,
        background_music_url: courseSettings.background_music_url || null,
        estimated_minutes: courseSettings.estimated_minutes ? Number(courseSettings.estimated_minutes) : null,
        thumbnail_url: courseSettings.thumbnail_url || null
      });
      setSaveMsg('נשמר ✓');
      onSaved?.(res.data.data);
    } catch {
      setSaveMsg('שגיאה בשמירה');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 3000);
    }
  };

  const publish = async () => {
    setPublishing(true);
    try {
      await save();
      await apiService.publishCourse(course.id);
      setSaveMsg('פורסם ✓');
    } catch {
      setSaveMsg('שגיאה בפרסום');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white" dir="rtl">
      {/* Toolbar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-gray-800 truncate max-w-xs">{course.title}</h1>
          {course.is_published && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">מפורסם</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {saveMsg && <span className="text-sm text-gray-500">{saveMsg}</span>}
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {saving ? 'שומר...' : 'שמור טיוטה'}
          </button>
          {!course.is_published && (
            <button
              onClick={publish}
              disabled={publishing || saving}
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {publishing ? 'מפרסם...' : 'פרסם קורס'}
            </button>
          )}
        </div>
      </header>

      {/* Main 3-panel layout */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-1 overflow-hidden">
          <BlockPalette />
          <CourseCanvas
            blocks={blocks}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onDelete={handleDelete}
          />
          <PropertiesPanel
            block={selectedBlock}
            onChange={handleBlockChange}
            courseSettings={courseSettings}
            onCourseSettingsChange={handleCourseSettingChange}
          />
        </div>
        <DragOverlay>
          {/* Visual ghost while dragging */}
          <div className="bg-blue-100 border-2 border-blue-400 rounded-lg px-4 py-2 text-sm text-blue-700 shadow-lg">
            גורר רכיב...
          </div>
        </DragOverlay>
      </DndContext>
    </div>
  );
}
