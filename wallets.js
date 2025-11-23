import { db } from './dbconfig.js';

const Member = {
  // Find one member by UserId
  async findOne({ UserId }) {
    const result = await db.query(
      'SELECT * FROM members WHERE user_id = $1',
      [UserId]
    );
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      UserId: row.user_id,
      iv: row.iv,
      s: row.s,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  // Save a new member
  async save(memberData) {
    const { UserId, iv, s } = memberData;
    const result = await db.query(
      'INSERT INTO members (user_id, iv, s) VALUES ($1, $2, $3) RETURNING *',
      [UserId, iv, s]
    );

    const row = result.rows[0];
    return {
      id: row.id,
      UserId: row.user_id,
      iv: row.iv,
      s: row.s,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  // Create a new instance (for save pattern)
  create(data) {
    return {
      UserId: data.UserId,
      iv: data.iv,
      s: data.s,
      save: async function() {
        return await Member.save(this);
      }
    };
  },

  // Delete a member
  async deleteOne({ UserId }) {
    const result = await db.query(
      'DELETE FROM members WHERE user_id = $1 RETURNING *',
      [UserId]
    );
    return result.rowCount > 0;
  }
};

export default Member;