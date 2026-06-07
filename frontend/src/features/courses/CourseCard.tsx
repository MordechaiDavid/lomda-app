'use client';

import { useRouter } from 'next/navigation';
import { useLang } from '../../lib/i18n';

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  image?: string | null;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function CourseCard({ id, title, description, image, onEdit, onDelete }: CourseCardProps) {
  const router = useRouter();
  const { t } = useLang();

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-lg">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={title} className="mb-4 h-40 w-full object-cover rounded-xl" />
      ) : null}
      <h2 className="text-2xl font-semibold mb-2 text-slate-900">{title}</h2>
      <p className="text-sm leading-6 text-gray-600">{description}</p>

      <div className="mt-4 flex gap-2 justify-start">
        <button
          onClick={() => {
            document.documentElement.requestFullscreen().catch(() => {});
            router.push(`/dashboard/courses/${id}/preview`);
          }}
          title="הצג לומדה (תצוגה מקדימה)"
          className="flex items-center justify-center w-8 h-8 rounded-md bg-emerald-500 text-white hover:bg-emerald-600 transition"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
        <button
          onClick={() => { router.push(`/dashboard/courses/${id}/edit`); onEdit?.(id); }}
          title="ערוך קורס (בנאי גרפי)"
          className="flex items-center justify-center w-8 h-8 rounded-md bg-amber-500 text-white hover:bg-amber-600 transition"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button
          onClick={() => { if (confirm(t('למחוק קורס זה?', 'Delete this course?'))) onDelete?.(id); }}
          title="מחק קורס"
          className="flex items-center justify-center w-8 h-8 rounded-md bg-red-500 text-white hover:bg-red-600 transition"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default CourseCard;
