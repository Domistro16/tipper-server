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

const { default: Droptip } = await import('../../droptips.js');

describe('Droptip Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('should find a droptip by droptipId', async () => {
      const mockRow = {
        id: 1,
        droptip_id: 'drop123',
        droptip: { available: true, amount: 100 },
        created_at: new Date(),
        updated_at: new Date()
      };

      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const result = await Droptip.findOne({ droptipId: 'drop123' });

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM droptips WHERE droptip_id = $1',
        ['drop123']
      );

      expect(result).toEqual({
        id: 1,
        droptipId: 'drop123',
        droptip: { available: true, amount: 100 },
        createdAt: mockRow.created_at,
        updatedAt: mockRow.updated_at
      });
    });

    it('should return null if no record found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await Droptip.findOne({ droptipId: 'drop123' });

      expect(result).toBeNull();
    });
  });

  describe('find', () => {
    it('should find all droptips without filter', async () => {
      const mockRows = [
        {
          id: 1,
          droptip_id: 'drop1',
          droptip: { available: true },
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          droptip_id: 'drop2',
          droptip: { available: false },
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      mockQuery.mockResolvedValue({ rows: mockRows });

      const result = await Droptip.find();

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM droptips',
        []
      );

      expect(result).toHaveLength(2);
    });

    it('should find droptips with available filter', async () => {
      const mockRows = [
        {
          id: 1,
          droptip_id: 'drop1',
          droptip: { available: true },
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      mockQuery.mockResolvedValue({ rows: mockRows });

      const result = await Droptip.find({ 'droptip.available': true });

      expect(mockQuery).toHaveBeenCalledWith(
        "SELECT * FROM droptips WHERE droptip->>'available' = $1",
        ['true']
      );

      expect(result).toHaveLength(1);
    });
  });

  describe('save', () => {
    it('should save a new droptip', async () => {
      const mockRow = {
        id: 1,
        droptip_id: 'drop123',
        droptip: { available: true, amount: 100 },
        created_at: new Date(),
        updated_at: new Date()
      };

      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const result = await Droptip.save({
        droptipId: 'drop123',
        droptip: { available: true, amount: 100 }
      });

      expect(mockQuery).toHaveBeenCalledWith(
        'INSERT INTO droptips (droptip_id, droptip) VALUES ($1, $2) RETURNING *',
        ['drop123', JSON.stringify({ available: true, amount: 100 })]
      );

      expect(result.droptipId).toBe('drop123');
    });
  });

  describe('findOneAndUpdate', () => {
    it('should update a droptip with $set operation', async () => {
      const mockRow = {
        id: 1,
        droptip_id: 'drop123',
        droptip: { available: false, amount: 100 },
        created_at: new Date(),
        updated_at: new Date()
      };

      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const result = await Droptip.findOneAndUpdate(
        { droptipId: 'drop123' },
        {
          $set: { droptip: { available: false, amount: 100 } }
        },
        { new: true }
      );

      expect(mockQuery).toHaveBeenCalled();
      expect(result.droptipId).toBe('drop123');
      expect(result.droptip.available).toBe(false);
    });

    it('should return null if droptip not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await Droptip.findOneAndUpdate(
        { droptipId: 'nonexistent' },
        { $set: { droptip: { available: false } } }
      );

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new droptip instance with save method', async () => {
      const mockRow = {
        id: 1,
        droptip_id: 'drop123',
        droptip: { available: true },
        created_at: new Date(),
        updated_at: new Date()
      };

      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const droptip = Droptip.create({
        droptipId: 'drop123',
        droptip: { available: true }
      });

      expect(droptip.droptipId).toBe('drop123');
      expect(droptip.save).toBeDefined();

      const result = await droptip.save();
      expect(result.droptipId).toBe('drop123');
    });
  });
});
