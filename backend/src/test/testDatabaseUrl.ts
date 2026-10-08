/**
 * The database the integration tests use: `ukride_test`, in the same Docker
 * container as development, but a separate database. The development data in
 * `ukride` is never touched.
 */
export const TEST_DATABASE_URL = 'postgresql://ukride:ukride@localhost:5432/ukride_test';
