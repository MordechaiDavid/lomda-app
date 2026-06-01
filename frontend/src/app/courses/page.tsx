import CourseList from '../../features/courses/CourseList';

export default function CoursesPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-4xl font-bold text-slate-900">Available Courses</h1>
          <p className="mt-3 text-gray-600">
            Browse the learning library and select a course to review the content and quiz preview.
          </p>
        </div>

        <CourseList />
      </div>
    </main>
  );
}
