import { db } from './dbconfig.js';

const Droptip = {
  // Find one droptip by droptipId
  async findOne({ droptipId }) {
    const result = await db.query(
      'SELECT * FROM droptips WHERE droptip_id = $1',
      [droptipId]
    );
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      droptipId: row.droptip_id,
      droptip: row.droptip,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  // Find all droptips with optional filter
  async find(filter = {}) {
    let query = 'SELECT * FROM droptips';
    const values = [];

    if (filter['droptip.available']) {
      query += " WHERE droptip->>'available' = $1";
      values.push(String(filter['droptip.available']));
    }

    const result = await db.query(query, values);
    return result.rows.map(row => ({
      id: row.id,
      droptipId: row.droptip_id,
      droptip: row.droptip,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      toArray: async () => result.rows.map(r => ({
        id: r.id,
        droptipId: r.droptip_id,
        droptip: r.droptip,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }))
    }));
  },

  // Save a new droptip
  async save(droptipData) {
    const { droptipId, droptip } = droptipData;
    const result = await db.query(
      'INSERT INTO droptips (droptip_id, droptip) VALUES ($1, $2) RETURNING *',
      [droptipId, JSON.stringify(droptip)]
    );

    const row = result.rows[0];
    return {
      id: row.id,
      droptipId: row.droptip_id,
      droptip: row.droptip,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  // Update one droptip
  async findOneAndUpdate(filter, update, options = {}) {
    const { droptipId } = filter;
    const { $set } = update;

    const updates = [];
    const values = [droptipId];
    let paramIndex = 2;

    if ($set) {
      Object.keys($set).forEach(key => {
        if (key === 'droptip') {
          updates.push(`droptip = $${paramIndex}`);
          values.push(JSON.stringify($set[key]));
        } else {
          updates.push(`${key} = $${paramIndex}`);
          values.push($set[key]);
        }
        paramIndex++;
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE droptips
      SET ${updates.join(', ')}
      WHERE droptip_id = $1
      RETURNING *
    `;

    const result = await db.query(query, values);
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      droptipId: row.droptip_id,
      droptip: row.droptip,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  // Create a new instance (for save pattern)
  create(data) {
    return {
      droptipId: data.droptipId,
      droptip: data.droptip,
      save: async function() {
        return await Droptip.save(this);
      }
    };
  }
};

export default Droptip;