import { jest } from '@jest/globals';

// Mock the database
const mockQuery = jest.fn();
const mockDb = {
  query: mockQuery
};

// Mock the dbconfig module
jest.unstable_mockModule('../../dbconfig.js', () => ({
  db: mockDb
}));

const { default: CourseProgress } = await import('../../CourseProgress.js');

describe('CourseProgress Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('should find a course progress record', async () => {
      const mockRow = {
        id: 1,
        user_id: 'user123',
        course_id: 'course456',
        completed_lessons: [1, 2, 3],
        last_watched: 3,
        progress: 30.5,
        updated_at: new Date()
      };

      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const result = await CourseProgress.findOne({
        userId: 'user123',
        courseId: 'course456'
      });

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM course_progress WHERE user_id = $1 AND course_id = $2',
        ['user123', 'course456']
      );

      expect(result).toEqual({
        id: 1,
        userId: 'user123',
        courseId: 'course456',
        completedLessons: [1, 2, 3],
        lastWatched: 3,
        progress: 30.5,
        updatedAt: mockRow.updated_at
      });
    });

    it('should return null if no record found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await CourseProgress.findOne({
        userId: 'user123',
        courseId: 'course456'
      });

      expect(result).toBeNull();
    });
  });

  describe('findOneAndUpdate', () => {
    it('should update progress with $addToSet, $set, and $inc operations', async () => {
      const mockRow = {
        id: 1,
        user_id: 'user123',
        course_id: 'course456',
        completed_lessons: [1, 2, 3, 4],
        last_watched: 4,
        progress: 40.0,
        updated_at: new Date()
      };

      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const result = await CourseProgress.findOneAndUpdate(
        { userId: 'user123', courseId: 'course456' },
        {
          $addToSet: { completedLessons: 4 },
          $set: { lastWatched: 4, updatedAt: new Date() },
          $inc: { progress: 10 }
        },
        { new: true, upsert: true }
      );

      expect(mockQuery).toHaveBeenCalled();
      expect(result.userId).toBe('user123');
      expect(result.courseId).toBe('course456');
      expect(result.completedLessons).toEqual([1, 2, 3, 4]);
    });

    it('should insert new record with upsert when no existing record', async () => {
      const mockRow = {
        id: 1,
        user_id: 'newuser',
        course_id: 'newcourse',
        completed_lessons: [1],
        last_watched: 1,
        progress: 10.0,
        updated_at: new Date()
      };

      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const result = await CourseProgress.findOneAndUpdate(
        { userId: 'newuser', courseId: 'newcourse' },
        {
          $addToSet: { completedLessons: 1 },
          $set: { lastWatched: 1, updatedAt: new Date() },
          $inc: { progress: 10 }
        },
        { new: true, upsert: true }
      );

      expect(result.userId).toBe('newuser');
      expect(result.courseId).toBe('newcourse');
    });

    it('should cap progress at 100', async () => {
      const mockRow = {
        id: 1,
        user_id: 'user123',
        course_id: 'course456',
        completed_lessons: [1, 2, 3, 4, 5],
        last_watched: 5,
        progress: 100.0,
        updated_at: new Date()
      };

      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const result = await CourseProgress.findOneAndUpdate(
        { userId: 'user123', courseId: 'course456' },
        {
          $addToSet: { completedLessons: 5 },
          $set: { lastWatched: 5, updatedAt: new Date() },
          $inc: { progress: 20 }
        }
      );

      expect(result.progress).toBe(100.0);
    });
  });
});
