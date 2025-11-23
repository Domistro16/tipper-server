# MongoDB to PostgreSQL Migration Guide

This project has been migrated from MongoDB to PostgreSQL.

## Prerequisites

1. **PostgreSQL Database**: You need a PostgreSQL database instance (local or hosted)
2. **Node.js**: Version 14 or higher
3. **npm**: For installing dependencies

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

This will install the `pg` package (PostgreSQL client) and remove MongoDB dependencies.

### 2. Configure Environment Variables

Update your `.env` file with PostgreSQL connection details:

```env
# PostgreSQL Connection
DATABASE_URL=postgresql://username:password@localhost:5432/your_database_name
# OR
POSTGRES_URL=postgresql://username:password@localhost:5432/your_database_name

# Other existing variables...
API_KEY=your_api_key
BACKEND_WALLET_PRIVATE_KEY=your_private_key
COURSE_CONTRACT_ADDRESS=your_contract_address
ETH_PROVIDER_URL=your_provider_url
```

### 3. Initialize the Database

Run the initialization script to create all required tables:

```bash
node init-db.js
```

This will create the following tables:
- `course_progress` - Stores user course progress
- `points` - Stores user points
- `droptips` - Stores droptip information
- `members` - Stores encrypted wallet data

### 4. Migrate Existing Data (Optional)

If you have existing data in MongoDB that needs to be migrated to PostgreSQL, you'll need to:

1. Export data from MongoDB:
   ```bash
   mongoexport --uri="mongodb://your-connection-string" --collection=courseprogresses --out=courseprogresses.json
   mongoexport --uri="mongodb://your-connection-string" --collection=points --out=points.json
   mongoexport --uri="mongodb://your-connection-string" --collection=droptips --out=droptips.json
   mongoexport --uri="mongodb://your-connection-string" --collection=members --out=members.json
   ```

2. Create a migration script to import the JSON data into PostgreSQL (custom script needed based on your data structure)

### 5. Start the Server

```bash
npm start
```

## Changes Made

### Database Connection
- Replaced `mongoose` with `pg` (node-postgres)
- Connection string now uses PostgreSQL format
- Updated `dbconfig.js` to use PostgreSQL connection pool

### Schema Changes

#### course_progress table
- `userId` → `user_id` (VARCHAR)
- `courseId` → `course_id` (VARCHAR)
- `completedLessons` → `completed_lessons` (INTEGER[])
- `lastWatched` → `last_watched` (INTEGER)
- `progress` → `progress` (NUMERIC)
- `updatedAt` → `updated_at` (TIMESTAMP)

#### points table
- `userId` → `user_id` (VARCHAR)
- `points` → `points` (INTEGER)
- `updatedAt` → `updated_at` (TIMESTAMP)

#### droptips table
- `droptipId` → `droptip_id` (VARCHAR)
- `droptip` → `droptip` (JSONB)

#### members table
- `UserId` → `user_id` (VARCHAR)
- `iv` → `iv` (VARCHAR)
- `s` → `s` (TEXT)

### API Compatibility
All existing API endpoints remain unchanged. The models have been updated to maintain compatibility with the existing MongoDB-style query syntax.

## Troubleshooting

### Connection Errors
- Verify your PostgreSQL server is running
- Check that your `DATABASE_URL` or `POSTGRES_URL` is correct
- Ensure your PostgreSQL user has proper permissions

### Schema Errors
- If tables already exist, you can drop them with:
  ```sql
  DROP TABLE IF EXISTS course_progress, points, droptips, members CASCADE;
  ```
  Then run `node init-db.js` again

### Data Type Errors
- PostgreSQL is stricter about data types than MongoDB
- Ensure numeric values are proper integers/floats
- JSONB fields must contain valid JSON

## Testing

After migration, test all API endpoints:

1. **Progress Update**: `POST /api/progress/update`
2. **Get Progress**: `GET /api/progress/:userId/:courseId`
3. **Get Points**: `GET /api/points/:userId`
4. **Enrollment**: `POST /api/enroll/:userId/:courseId`

## Need Help?

If you encounter issues during migration, check:
1. PostgreSQL logs for database errors
2. Application logs for connection issues
3. Verify all environment variables are set correctly
