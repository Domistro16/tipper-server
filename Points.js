import { db } from './dbconfig.js';

const Points = {
  // Find one points record
  async findOne({ userId }) {
    const result = await db.query(
      'SELECT * FROM points WHERE user_id = $1',
      [userId]
    );
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      points: row.points,
      updatedAt: row.updated_at
    };
  },

  // Update points with upsert capability
  async findOneAndUpdate(filter, update, options = {}) {
    const { userId } = filter;
    const { $inc, $set } = update;

    const updates = [];
    const values = [userId];
    let paramIndex = 2;

    // Handle $inc for points
    if ($inc && $inc.points !== undefined) {
      updates.push(`points = points + $${paramIndex}`);
      values.push($inc.points);
      paramIndex++;
    }

    // Handle $set for updatedAt
    if ($set && $set.updatedAt !== undefined) {
      updates.push(`updated_at = $${paramIndex}`);
      values.push($set.updatedAt);
      paramIndex++;
    }

    const query = `
      INSERT INTO points (user_id, points, updated_at)
      VALUES ($1, $${paramIndex}, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id)
      DO UPDATE SET ${updates.join(', ')}
      RETURNING *
    `;

    // Add default value for insert
    values.push($inc?.points || 0);

    const result = await db.query(query, values);
    const row = result.rows[0];

    return {
      id: row.id,
      userId: row.user_id,
      points: row.points,
      updatedAt: row.updated_at
    };
  }
};

export default Points;
