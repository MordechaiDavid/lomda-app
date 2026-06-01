import CourseCard from './CourseCard';
import { mockCourses } from './mockCourses';

interface CourseSummary {
  id: string;
  title: string;
  description: string;
}

export default function CourseList() {
  const courses = mockCourses;

  if (!courses.length) {
    return <p className="text-center text-gray-600">No courses available yet.</p>;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <CourseCard key={course.id} id={course.id} title={course.title} description={course.description} />
      ))}
    </div>
  );
}
