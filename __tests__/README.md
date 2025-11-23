# Test Suite Documentation

This directory contains the test suite for the tipper-server PostgreSQL migration.

## Test Structure

```
__tests__/
├── models/           # Unit tests for database models
│   ├── CourseProgress.test.js
│   ├── Points.test.js
│   ├── Droptip.test.js
│   └── Member.test.js
├── api/             # Integration tests for API endpoints
│   └── endpoints.test.js
└── README.md        # This file
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test __tests__/models/CourseProgress.test.js
```

## Test Types

### Unit Tests (models/)
These tests verify that each model correctly:
- Generates proper SQL queries
- Handles database responses correctly
- Converts between snake_case (database) and camelCase (application)
- Implements MongoDB-style operations ($addToSet, $inc, $set)
- Handles edge cases (null values, empty arrays, etc.)

**Note:** Unit tests use mocked database connections and don't require a live database.

### Integration Tests (api/)
These tests verify that:
- API endpoints work correctly
- Request validation functions properly
- Error handling works as expected
- Database operations integrate correctly with the API layer

**Note:** Integration tests also use mocks and don't require a live database.

## Test Coverage

The test suite covers:
- ✅ CourseProgress model (findOne, findOneAndUpdate with upsert)
- ✅ Points model (findOne, findOneAndUpdate with atomic increments)
- ✅ Droptip model (findOne, find, save, findOneAndUpdate, create)
- ✅ Member model (findOne, save, create, deleteOne)
- ✅ API endpoints (GET /progress, GET /points, POST /progress/update, POST /enroll)

## Writing New Tests

When adding new features, follow these guidelines:

1. **Model tests** should verify SQL query generation and data transformation
2. **API tests** should verify request/response handling and validation
3. Use descriptive test names that explain what's being tested
4. Mock external dependencies (database, blockchain contracts, etc.)
5. Test both success and error cases

## Example Test

```javascript
describe('Model Method', () => {
  it('should perform specific operation', async () => {
    // Arrange: Set up test data and mocks
    const mockData = { ... };
    mockQuery.mockResolvedValue({ rows: [mockData] });

    // Act: Call the method being tested
    const result = await Model.method(params);

    // Assert: Verify the results
    expect(result).toEqual(expectedValue);
    expect(mockQuery).toHaveBeenCalledWith(expectedQuery, expectedParams);
  });
});
```

## Continuous Integration

These tests are designed to run in CI/CD pipelines without requiring:
- A live PostgreSQL database
- External API connections
- Blockchain network access

All external dependencies are mocked for fast, reliable testing.

## Troubleshooting

### "Cannot find module" errors
Make sure you've installed dependencies:
```bash
npm install
```

### ES Module errors
The project uses ES modules. Jest is configured with `--experimental-vm-modules` flag.

### Mock errors
If mocks aren't working, ensure:
1. Mocks are defined before imports
2. Using `jest.unstable_mockModule()` for ES modules
3. Imports use `await import()` syntax

## Future Improvements

- [ ] Add database integration tests with a test PostgreSQL instance
- [ ] Add end-to-end tests for complete user workflows
- [ ] Add performance tests for query optimization
- [ ] Add load tests for concurrent operations
