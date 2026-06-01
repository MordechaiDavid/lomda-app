import CourseDetail from '../../../features/courses/CourseDetail';

interface CourseDetailPageProps {
  params: { id: string };
}

export default function CourseDetailPage({ params }: CourseDetailPageProps) {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-4xl font-bold text-slate-900">Course Details</h1>
        </div>

        <CourseDetail courseId={params.id} />
      </div>
    </main>
  );
}
