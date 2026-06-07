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
import type { ContentBlock, BlockType, Course, CourseStep } from '../../types/course';
import { StepsPanel } from './StepsPanel';
import { CourseCanvas } from './CourseCanvas';
import { PropertiesPanel } from './PropertiesPanel';
import { createDefaultBlock, createDefaultStep, normalizeToSteps } from './utils';
import { apiService } from '../../lib/apiService';

interface Props {
  course: Course;
  onSaved?: (updated: Course) => void;
}

export function CourseBuilder({ course, onSaved }: Props) {
  const [steps, setSteps] = useState<CourseStep[]>(() =>
    normalizeToSteps(course.content as unknown[])
  );
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const [courseSettings, setCourseSettings] = useState({
    passing_score: course.passing_score ?? 70,
    background_music_url: course.background_music_url ?? '',
    estimated_minutes: course.estimated_minutes ? String(course.estimated_minutes) : '',
    thumbnail_url: course.thumbnail_url ?? ''
  });
  const [isPublished, setIsPublished] = useState(course.is_published);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // ── Active step helpers ────────────────────────────────────────────────────
  const activeStep = steps[activeStepIdx] ?? steps[0];
  const activeBlocks = activeStep?.blocks ?? [];
  const selectedBlock = activeBlocks.find((b) => b.id === selectedBlockId) ?? null;

  const updateActiveStep = useCallback((updater: (s: CourseStep) => CourseStep) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === activeStepIdx ? updater(s) : s))
    );
  }, [activeStepIdx]);

  // ── Step management ────────────────────────────────────────────────────────
  const addStep = useCallback(() => {
    const newStep = createDefaultStep(steps.length);
    setSteps((prev) => [...prev, newStep]);
    setActiveStepIdx(steps.length);
    setSelectedBlockId(null);
  }, [steps.length]);

  const deleteStep = useCallback((idx: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i })));
    setActiveStepIdx((prev) => Math.min(prev, Math.max(0, steps.length - 2)));
    setSelectedBlockId(null);
  }, [steps.length]);

  const renameStep = useCallback((idx: number, title: string) => {
    setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, title } : s)));
  }, []);

  const moveStep = useCallback((idx: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= steps.length) return;
    setSteps((prev) => arrayMove(prev, idx, newIdx).map((s, i) => ({ ...s, order: i })));
    setActiveStepIdx(newIdx);
  }, [steps.length]);

  // ── Block management ────────────────────────────────────────────────────────
  const addBlock = useCallback((type: BlockType) => {
    const newBlock = createDefaultBlock(type);
    newBlock.order = activeBlocks.length;
    updateActiveStep((s) => ({ ...s, blocks: [...s.blocks, newBlock] }));
    setSelectedBlockId(newBlock.id);
  }, [activeBlocks.length, updateActiveStep]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.data.current?.isPalette) {
      const blockType = active.data.current.blockType as BlockType;
      addBlock(blockType);
      return;
    }
    if (active.id !== over.id) {
      updateActiveStep((s) => {
        const oldIdx = s.blocks.findIndex((b) => b.id === active.id);
        const newIdx = s.blocks.findIndex((b) => b.id === over.id);
        return { ...s, blocks: arrayMove(s.blocks, oldIdx, newIdx).map((b, i) => ({ ...b, order: i })) };
      });
    }
  }, [addBlock, updateActiveStep]);

  const handleBlockChange = useCallback((updated: ContentBlock) => {
    updateActiveStep((s) => ({
      ...s,
      blocks: s.blocks.map((b) => (b.id === updated.id ? updated : b))
    }));
  }, [updateActiveStep]);

  const handleDeleteBlock = useCallback((id: string) => {
    updateActiveStep((s) => ({ ...s, blocks: s.blocks.filter((b) => b.id !== id) }));
    if (selectedBlockId === id) setSelectedBlockId(null);
  }, [updateActiveStep, selectedBlockId]);

  // ── Save / Publish ────────────────────────────────────────────────────────
  const save = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await apiService.updateCourse(course.id, {
        content: steps as unknown as import('../../types/course').ContentBlock[],
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
      const res = await apiService.publishCourse(course.id);
      setIsPublished(true);
      setSaveMsg('פורסם ✓');
      onSaved?.(res.data.data);
    } catch {
      setSaveMsg('שגיאה בפרסום');
    } finally {
      setPublishing(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-white" dir="rtl">
      {/* Toolbar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <a href="/courses" className="text-sm text-gray-400 hover:text-gray-600">← לומדות</a>
          <span className="text-gray-200">|</span>
          <h1 className="text-sm font-semibold text-gray-800 truncate max-w-xs">{course.title}</h1>
          {isPublished && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">מפורסם</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>{steps.length} שלבים</span>
          <span>·</span>
          <span>{steps.reduce((n, s) => n + s.blocks.length, 0)} רכיבים</span>
        </div>
        <div className="flex items-center gap-2">
          {saveMsg && <span className="text-sm text-gray-500">{saveMsg}</span>}
          <button
            onClick={() => window.open(`/dashboard/courses/${course.id}/preview`, '_blank')}
            title="הצג לומדה (תצוגה מקדימה)"
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            הצג לומדה
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {saving ? 'שומר...' : 'שמור טיוטה'}
          </button>
          {!isPublished && (
            <button
              onClick={publish}
              disabled={publishing || saving}
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {publishing ? 'מפרסם...' : 'פרסם לומדה'}
            </button>
          )}
        </div>
      </header>

      {/* Progress bar showing step completion (for visual reference) */}
      <div className="h-1 bg-gray-100 flex-shrink-0">
        {steps.map((_, idx) => (
          <div
            key={idx}
            onClick={() => { setActiveStepIdx(idx); setSelectedBlockId(null); }}
            className={`inline-block h-full cursor-pointer transition-colors ${
              idx === activeStepIdx ? 'bg-blue-500' : 'bg-gray-200 hover:bg-gray-300'
            }`}
            style={{ width: `${100 / steps.length}%` }}
            title={steps[idx].title}
          />
        ))}
      </div>

      {/* Main 3-panel layout */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex flex-1 overflow-hidden">
          <StepsPanel
            steps={steps}
            activeStepIndex={activeStepIdx}
            onSelectStep={(i) => { setActiveStepIdx(i); setSelectedBlockId(null); }}
            onAddStep={addStep}
            onDeleteStep={deleteStep}
            onRenameStep={renameStep}
            onMoveStep={moveStep}
            onAddBlock={addBlock}
          />

          {/* Canvas for blocks within active step */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Step header */}
            <div className="px-6 pt-4 pb-2 flex-shrink-0 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3 max-w-2xl mx-auto">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {activeStepIdx + 1}
                </span>
                <input
                  type="text"
                  value={activeStep?.title ?? ''}
                  onChange={(e) => renameStep(activeStepIdx, e.target.value)}
                  className="flex-1 text-sm font-semibold text-gray-800 bg-transparent outline-none border-b border-transparent focus:border-blue-400 pb-0.5"
                  placeholder="שם השלב..."
                />
                <span className="text-xs text-gray-400">{activeBlocks.length} רכיבים</span>
              </div>
            </div>

            <CourseCanvas
              blocks={activeBlocks}
              selectedId={selectedBlockId}
              onSelect={setSelectedBlockId}
              onDelete={handleDeleteBlock}
            />
          </div>

          <PropertiesPanel
            block={selectedBlock}
            onChange={handleBlockChange}
            courseSettings={courseSettings}
            onCourseSettingsChange={(key, value) =>
              setCourseSettings((prev) => ({ ...prev, [key]: value }))
            }
          />
        </div>
        <DragOverlay>
          <div className="bg-blue-100 border-2 border-blue-400 rounded-lg px-4 py-2 text-sm text-blue-700 shadow-lg">
            גורר רכיב...
          </div>
        </DragOverlay>
      </DndContext>
    </div>
  );
}
