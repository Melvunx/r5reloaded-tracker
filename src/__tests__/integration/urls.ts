export const TEST_DATABASE_NAME = "apex_tracker_test";

/** URL de la base de test : la même instance Postgres que `DATABASE_URL`, mais une base à part. */
export function testDatabaseUrl(databaseUrl: string) {
  const url = new URL(databaseUrl);
  url.pathname = `/${TEST_DATABASE_NAME}`;
  return url.toString();
}
