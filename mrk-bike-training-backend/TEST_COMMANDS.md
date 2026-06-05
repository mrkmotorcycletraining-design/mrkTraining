# Backend Test Commands

Run all unit and property tests (includes jqwik properties):

Windows (PowerShell):

cd mrk-bike-training-backend
.\gradlew.bat test

Run only property tests (if named with *Property or in property test source set):

.\gradlew.bat test --tests "*Property*"

Run integration tests (Spring Boot @SpringBootTest):

.\gradlew.bat integrationTest --info

Build and run application (skipping tests):

.\gradlew.bat clean bootRun -x test

Notes:
- Ensure the Postgres schema from `db/postgres/schema.sql` is applied before running with `spring.jpa.hibernate.ddl-auto=validate`.
- If using Testcontainers for integration tests, ensure Docker is running.
