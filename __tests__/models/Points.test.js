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

const { default: Points } = await import('../../Points.js');

describe('Points Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('should find a points record', async () => {
      const mockRow = {
        id: 1,
        user_id: 'user123',
        points: 500,
        updated_at: new Date()
      };

      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const result = await Points.findOne({ userId: 'user123' });

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM points WHERE user_id = $1',
        ['user123']
      );

      expect(result).toEqual({
        id: 1,
        userId: 'user123',
        points: 500,
        updatedAt: mockRow.updated_at
      });
    });

    it('should return null if no record found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await Points.findOne({ userId: 'user123' });

      expect(result).toBeNull();
    });
  });

  describe('findOneAndUpdate', () => {
    it('should increment points with $inc operation', async () => {
      const mockRow = {
        id: 1,
        user_id: 'user123',
        points: 550,
        updated_at: new Date()
      };

      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const result = await Points.findOneAndUpdate(
        { userId: 'user123' },
        {
          $inc: { points: 50 },
          $set: { updatedAt: new Date() }
        },
        { new: true, upsert: true }
      );

      expect(mockQuery).toHaveBeenCalled();
      expect(result.userId).toBe('user123');
      expect(result.points).toBe(550);
    });

    it('should insert new record with upsert when no existing record', async () => {
      const mockRow = {
        id: 1,
        user_id: 'newuser',
        points: 100,
        updated_at: new Date()
      };

      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const result = await Points.findOneAndUpdate(
        { userId: 'newuser' },
        {
          $inc: { points: 100 },
          $set: { updatedAt: new Date() }
        },
        { new: true, upsert: true }
      );

      expect(result.userId).toBe('newuser');
      expect(result.points).toBe(100);
    });

    it('should handle negative point increments', async () => {
      const mockRow = {
        id: 1,
        user_id: 'user123',
        points: 450,
        updated_at: new Date()
      };

      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const result = await Points.findOneAndUpdate(
        { userId: 'user123' },
        {
          $inc: { points: -50 },
          $set: { updatedAt: new Date() }
        }
      );

      expect(result.points).toBe(450);
    });

    it('should handle zero point increment', async () => {
      const mockRow = {
        id: 1,
        user_id: 'user123',
        points: 0,
        updated_at: new Date()
      };

      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const result = await Points.findOneAndUpdate(
        { userId: 'user123' },
        {
          $inc: { points: 0 }
        }
      );

      expect(result.points).toBe(0);
    });
  });
});
