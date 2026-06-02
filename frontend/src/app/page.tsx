import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      <div className="max-w-3xl text-center">
        <h1 className="text-5xl font-bold mb-6">Welcome to Lomda</h1>
        <p className="text-xl text-gray-600 mb-8">
          Enterprise Learning Management System for compliance training, course distribution, and employee learning tracking.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/courses" className="rounded-full bg-blue-600 px-6 py-3 text-white text-lg font-semibold transition hover:bg-blue-700">
            Browse Courses
          </Link>
          <Link href="/login" className="rounded-full border border-blue-600 px-6 py-3 text-blue-600 text-lg font-semibold transition hover:bg-blue-50">
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
