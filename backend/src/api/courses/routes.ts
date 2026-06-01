import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/v1/courses
router.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      courses: [],
      total: 0,
      page: 1,
      pageSize: 20
    }
  });
});

// GET /api/v1/courses/:id
router.get('/:id', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      id: req.params.id,
      title: 'Course Title',
      description: 'Course Description',
      content: [],
      quizzes: []
    }
  });
});

// POST /api/v1/courses
router.post('/', (req: Request, res: Response) => {
  res.status(201).json({
    success: true,
    data: {
      id: 'course-id',
      title: req.body.title,
      message: 'Course created successfully'
    }
  });
});

export default router;
