import { db } from './dbconfig.js';

const CourseProgress = {
  // Find one course progress record
  async findOne({ userId, courseId }) {
    const result = await db.query(
      'SELECT * FROM course_progress WHERE user_id = $1 AND course_id = $2',
      [userId, courseId]
    );
    if (result.rows.length === 0) return null;

    // Convert snake_case to camelCase for compatibility
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      courseId: row.course_id,
      completedLessons: row.completed_lessons || [],
      lastWatched: row.last_watched,
      progress: parseFloat(row.progress),
      updatedAt: row.updated_at
    };
  },

  // Update course progress with upsert capability
  async findOneAndUpdate(filter, update, options = {}) {
    const { userId, courseId } = filter;
    const { $addToSet, $set, $inc } = update;

    // Build dynamic update query
    const updates = [];
    const values = [userId, courseId];
    let paramIndex = 3;

    // For insert values
    let insertLesson = null;
    let insertLastWatched = 0;
    let insertProgress = 0;

    // Handle $addToSet for completedLessons (only adds if not exists)
    if ($addToSet && $addToSet.completedLessons !== undefined) {
      insertLesson = $addToSet.completedLessons;
      updates.push(`completed_lessons = CASE
        WHEN $${paramIndex} = ANY(course_progress.completed_lessons) THEN course_progress.completed_lessons
        ELSE array_append(course_progress.completed_lessons, $${paramIndex})
      END`);
      values.push($addToSet.completedLessons);
      paramIndex++;
    }

    // Handle $set operations
    if ($set) {
      if ($set.lastWatched !== undefined) {
        insertLastWatched = $set.lastWatched;
        updates.push(`last_watched = $${paramIndex}`);
        values.push($set.lastWatched);
        paramIndex++;
      }
      if ($set.updatedAt !== undefined) {
        updates.push(`updated_at = $${paramIndex}`);
        values.push($set.updatedAt);
        paramIndex++;
      }
    }

    // Handle $inc for progress (conditional increment)
    if ($inc && $inc.progress !== undefined) {
      insertProgress = $inc.progress;
      updates.push(`progress = LEAST(course_progress.progress + $${paramIndex}, 100)`);
      values.push($inc.progress);
      paramIndex++;
    }

    const query = `
      INSERT INTO course_progress (user_id, course_id, completed_lessons, last_watched, updated_at, progress)
      VALUES ($1, $2, ${insertLesson !== null ? `ARRAY[$${paramIndex}]::INTEGER[]` : 'ARRAY[]::INTEGER[]'}, $${paramIndex + 1}, CURRENT_TIMESTAMP, $${paramIndex + 2})
      ON CONFLICT (user_id, course_id)
      DO UPDATE SET ${updates.join(', ')}
      RETURNING *
    `;

    // Add default values for insert
    if (insertLesson !== null) {
      values.push(insertLesson);
    }
    values.push(insertLastWatched, insertProgress);

    const result = await db.query(query, values);
    const row = result.rows[0];

    return {
      id: row.id,
      userId: row.user_id,
      courseId: row.course_id,
      completedLessons: row.completed_lessons || [],
      lastWatched: row.last_watched,
      progress: parseFloat(row.progress),
      updatedAt: row.updated_at
    };
  }
};

export default CourseProgress;
