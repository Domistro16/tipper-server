import { jest } from '@jest/globals';

// Mock all model dependencies
const mockCourseProgressFindOne = jest.fn();
const mockCourseProgressFindOneAndUpdate = jest.fn();
const mockPointsFindOne = jest.fn();
const mockPointsFindOneAndUpdate = jest.fn();

jest.unstable_mockModule('../../dbconfig.js', () => ({
  db: { query: jest.fn() },
  DB_connection: jest.fn()
}));

jest.unstable_mockModule('../../CourseProgress.js', () => ({
  default: {
    findOne: mockCourseProgressFindOne,
    findOneAndUpdate: mockCourseProgressFindOneAndUpdate
  }
}));

jest.unstable_mockModule('../../Points.js', () => ({
  default: {
    findOne: mockPointsFindOne,
    findOneAndUpdate: mockPointsFindOneAndUpdate
  }
}));

// Mock ethers contract
const mockGetCourse = jest.fn();
const mockUpdateCourseProgress = jest.fn();
const mockEnroll = jest.fn();

jest.unstable_mockModule('ethers', () => ({
  ethers: {
    JsonRpcProvider: jest.fn(() => ({})),
    Wallet: jest.fn(() => ({})),
    Contract: jest.fn(() => ({
      getCourse: mockGetCourse,
      updateCourseProgress: mockUpdateCourseProgress,
      enroll: mockEnroll
    }))
  }
}));

// Import after mocking
const { default: express } = await import('express');
const { default: router } = await import('../../router.js');

describe('API Endpoints', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api', router);

    // Set test environment variables
    process.env.API_KEY = 'test-api-key';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/progress/:userId/:courseId', () => {
    it('should return course progress for a user', async () => {
      const mockDate = new Date();
      const mockProgress = {
        userId: 'user123',
        courseId: 'course456',
        completedLessons: [1, 2, 3],
        lastWatched: 3,
        progress: 30,
        updatedAt: mockDate
      };

      mockCourseProgressFindOne.mockResolvedValue(mockProgress);

      const supertest = (await import('supertest')).default;
      const response = await supertest(app)
        .get('/api/progress/user123/course456')
        .expect(200);

      // Check individual properties instead of exact match (Date object serialization)
      expect(response.body.userId).toBe('user123');
      expect(response.body.courseId).toBe('course456');
      expect(response.body.completedLessons).toEqual([1, 2, 3]);
      expect(response.body.lastWatched).toBe(3);
      expect(response.body.progress).toBe(30);
      expect(mockCourseProgressFindOne).toHaveBeenCalledWith({
        userId: 'user123',
        courseId: 'course456'
      });
    });

    it('should return empty object if no progress found', async () => {
      mockCourseProgressFindOne.mockResolvedValue(null);

      const supertest = (await import('supertest')).default;
      const response = await supertest(app)
        .get('/api/progress/user123/course456')
        .expect(200);

      expect(response.body).toEqual({});
    });
  });

  describe('GET /api/points/:userId', () => {
    it('should return points for a user', async () => {
      mockPointsFindOne.mockResolvedValue({
        userId: 'user123',
        points: 500,
        updatedAt: new Date()
      });

      const supertest = (await import('supertest')).default;
      const response = await supertest(app)
        .get('/api/points/user123')
        .expect(200);

      expect(response.body).toBe(500);
    });

    it('should return 0 if user has no points', async () => {
      mockPointsFindOne.mockResolvedValue(null);

      const supertest = (await import('supertest')).default;
      const response = await supertest(app)
        .get('/api/points/user123')
        .expect(200);

      expect(response.body).toBe(0);
    });
  });

  describe('POST /api/progress/update', () => {
    it('should update course progress and award points', async () => {
      // Mock blockchain contract response
      mockGetCourse.mockResolvedValue([
        { lessons: [1, 2, 3, 4, 5], level: 'beginner' },
        null,
        null,
        null
      ]);

      // Mock existing progress (no lessons completed yet)
      mockCourseProgressFindOne.mockResolvedValue(null);

      // Mock updated progress
      mockCourseProgressFindOneAndUpdate.mockResolvedValue({
        userId: 'user123',
        courseId: 'course456',
        completedLessons: [1],
        lastWatched: 1,
        progress: 20,
        updatedAt: new Date()
      });

      // Mock points update
      mockPointsFindOneAndUpdate.mockResolvedValue({
        userId: 'user123',
        points: 100,
        updatedAt: new Date()
      });

      const supertest = (await import('supertest')).default;
      const response = await supertest(app)
        .post('/api/progress/update')
        .set('x-api-key', 'test-api-key')
        .send({
          userId: 'user123',
          courseId: 'course456',
          lessonIndex: 1
        })
        .expect(200);

      expect(mockCourseProgressFindOneAndUpdate).toHaveBeenCalled();
      expect(mockPointsFindOneAndUpdate).toHaveBeenCalled();
    });

    it('should reject request with invalid API key', async () => {
      const supertest = (await import('supertest')).default;
      const response = await supertest(app)
        .post('/api/progress/update')
        .set('x-api-key', 'invalid-key')
        .send({
          userId: 'user123',
          courseId: 'course456',
          lessonIndex: 1
        })
        .expect(400);

      expect(response.body.error).toBe('Invalid API key');
    });
  });

  describe('POST /api/enroll/:userId/:courseId', () => {
    it('should reject request with invalid API key', async () => {
      const supertest = (await import('supertest')).default;
      await supertest(app)
        .post('/api/enroll/user123/course456')
        .set('x-api-key', 'invalid-key')
        .expect(400);
    });
  });
});
