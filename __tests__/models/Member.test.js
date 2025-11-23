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

const { default: Member } = await import('../../wallets.js');

describe('Member Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('should find a member by UserId', async () => {
      const mockRow = {
        id: 1,
        user_id: 'user123',
        iv: 'encrypted_iv',
        s: 'encrypted_salt',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const result = await Member.findOne({ UserId: 'user123' });

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM members WHERE user_id = $1',
        ['user123']
      );

      expect(result).toEqual({
        id: 1,
        UserId: 'user123',
        iv: 'encrypted_iv',
        s: 'encrypted_salt',
        createdAt: mockRow.created_at,
        updatedAt: mockRow.updated_at
      });
    });

    it('should return null if no member found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await Member.findOne({ UserId: 'user123' });

      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should save a new member', async () => {
      const mockRow = {
        id: 1,
        user_id: 'user123',
        iv: 'encrypted_iv',
        s: 'encrypted_salt',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const result = await Member.save({
        UserId: 'user123',
        iv: 'encrypted_iv',
        s: 'encrypted_salt'
      });

      expect(mockQuery).toHaveBeenCalledWith(
        'INSERT INTO members (user_id, iv, s) VALUES ($1, $2, $3) RETURNING *',
        ['user123', 'encrypted_iv', 'encrypted_salt']
      );

      expect(result).toEqual({
        id: 1,
        UserId: 'user123',
        iv: 'encrypted_iv',
        s: 'encrypted_salt',
        createdAt: mockRow.created_at,
        updatedAt: mockRow.updated_at
      });
    });
  });

  describe('create', () => {
    it('should create a new member instance with save method', async () => {
      const mockRow = {
        id: 1,
        user_id: 'user123',
        iv: 'encrypted_iv',
        s: 'encrypted_salt',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const member = Member.create({
        UserId: 'user123',
        iv: 'encrypted_iv',
        s: 'encrypted_salt'
      });

      expect(member.UserId).toBe('user123');
      expect(member.iv).toBe('encrypted_iv');
      expect(member.s).toBe('encrypted_salt');
      expect(member.save).toBeDefined();

      const result = await member.save();
      expect(result.UserId).toBe('user123');
    });
  });

  describe('deleteOne', () => {
    it('should delete a member by UserId', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ user_id: 'user123' }],
        rowCount: 1
      });

      const result = await Member.deleteOne({ UserId: 'user123' });

      expect(mockQuery).toHaveBeenCalledWith(
        'DELETE FROM members WHERE user_id = $1 RETURNING *',
        ['user123']
      );

      expect(result).toBe(true);
    });

    it('should return false if member not found', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0
      });

      const result = await Member.deleteOne({ UserId: 'nonexistent' });

      expect(result).toBe(false);
    });
  });
});
