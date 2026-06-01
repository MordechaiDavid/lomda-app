'use client';

import Link from 'next/link';

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
}

export function CourseCard({ id, title, description }: CourseCardProps) {
  return (
    <Link
      href={`/courses/${id}`}
      className="block rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <h2 className="text-2xl font-semibold mb-2 text-slate-900">{title}</h2>
      <p className="text-sm leading-6 text-gray-600">{description}</p>
      <div className="mt-4 text-blue-600 font-semibold">View course →</div>
    </Link>
  );
}

export default CourseCard;
