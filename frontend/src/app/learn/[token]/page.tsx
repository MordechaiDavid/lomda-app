'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CoursePlayer } from '../../../features/course-player/CoursePlayer';
import { apiService } from '../../../lib/apiService';
import type { Course, Enrollment } from '../../../types/course';

interface TokenData {
  course_id: string;
  course_title: string;
  passing_score: number;
  campaign_id: string;
  recipient_status: string;
}

export default function LearnPage() {
  const { token } = useParams<{ token: string }>();
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function init() {
      try {
        // 1. Resolve the email token
        const tokenRes = await apiService.resolveLearnToken(token);
        const td: TokenData = tokenRes.data.data;
        setTokenData(td);

        // 2. Load course content
        const courseRes = await apiService.getCourse(td.course_id);
        const c: Course = courseRes.data.data;
        setCourse({ ...c, passing_score: td.passing_score });

        // 3. Enroll (idempotent — won't fail if already enrolled)
        const enrollRes = await apiService.enrollInCourse(td.course_id);
        setEnrollment(enrollRes.data.data);
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
        setError(msg ?? 'קישור לא תקין או שפג תוקפו');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-600">טוען לומדה...</p>
        </div>
      </div>
    );
  }

  if (error || !course || !enrollment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="bg-white rounded-2xl shadow p-8 text-center max-w-sm mx-4">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">לא ניתן לטעון את הלומדה</h2>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (tokenData?.recipient_status === 'completed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="bg-white rounded-2xl shadow p-8 text-center max-w-sm mx-4">
          <div className="text-4xl mb-3">✅</div>
          <h2 className="text-lg font-semibold text-green-800 mb-2">כבר השלמת את הלומדה!</h2>
          <p className="text-sm text-gray-500">סיימת את הקורס &ldquo;{course.title}&rdquo;</p>
        </div>
      </div>
    );
  }

  return (
    <CoursePlayer
      course={course}
      enrollmentId={enrollment.id}
      campaignToken={token}
      initialStep={enrollment.current_step}
    />
  );
}
