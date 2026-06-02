import { Router, Request, Response } from 'express';
import sampleCourses from '../../data/mockCourses.js';

const router = Router();

// GET /api/v1/courses
router.get('/', (req: Request, res: Response) => {
  const page = Number(req.query.page || 1);
  const pageSize = Number(req.query.pageSize || 20);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const pagedCourses = sampleCourses.slice(start, end);

  res.json({
    success: true,
    data: {
      courses: pagedCourses,
      total: sampleCourses.length,
      page,
      pageSize,
      hasMore: end < sampleCourses.length
    }
  });
});

// GET /api/v1/courses/:id
router.get('/:id', (req: Request, res: Response) => {
  const course = sampleCourses.find((item) => item.id === req.params.id);

  if (!course) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'COURSE_NOT_FOUND',
        message: 'Course not found'
      }
    });
  }

  res.json({
    success: true,
    data: course
  });
});

// POST /api/v1/courses
router.post('/', (req: Request, res: Response) => {
  const newCourse = req.body;
  // Add to in-memory list
  sampleCourses.unshift(newCourse);
  
  res.status(201).json({
    success: true,
    data: newCourse
  });
});

export default router;
