# Backend Standards & Architecture Rules

These rules apply to the Java/Spring Boot backend in `mrk-bike-training-backend`.

## SOLID Principles

All backend code MUST follow SOLID principles:

### Single Responsibility (SRP)
- Each class has ONE reason to change.
- Controllers handle HTTP request/response mapping only — no business logic.
- Services contain business logic for a single domain.
- Repositories handle data access only.
- Split large services if they manage multiple unrelated concerns.

### Open/Closed (OCP)
- Classes should be open for extension, closed for modification.
- Use interfaces and abstract classes to allow new behavior without changing existing code.
- Prefer strategy/template patterns over if/else chains for varying behavior.

### Liskov Substitution (LSP)
- Subtypes must be substitutable for their base types without altering correctness.
- Don't override methods in ways that violate the parent's contract.

### Interface Segregation (ISP)
- Prefer small, focused interfaces over large ones.
- Clients should not be forced to depend on methods they don't use.

### Dependency Inversion (DIP)
- Depend on abstractions (interfaces), not concrete implementations.
- Use Spring's dependency injection (`@Autowired` or constructor injection) consistently.
- Prefer constructor injection over field injection.

## Layered Architecture

```
Controller → Service (interface) → ServiceImpl → Repository
```

- **Controller**: REST endpoint mapping, request validation, response shaping. No business logic.
- **Service Interface**: Defines the contract for business operations.
- **Service Implementation**: Contains all business logic, transaction management.
- **Repository**: Spring Data JPA interface for data access.
- **Entity**: JPA entity mapped to the database table.
- **DTO**: Data Transfer Object for API request/response — decoupled from entities.

## Data Models — Schema Alignment

- The authoritative schema is: `D:\MrkBikeTraining\mrk-bike-training-backend\db\postgres\schema.sql`
- All JPA entities MUST map exactly to the tables and columns defined in `schema.sql`.
- Column names in entities use `@Column(name = "snake_case_name")` to map to DB columns.
- If the schema changes (DDL update), the corresponding JPA entities and DTOs MUST be updated.
- DTOs use camelCase field names for JSON serialization — these must align with frontend TypeScript models for seamless data transfer.

## Days-of-Week Columns

- Any column storing days of the week (e.g., `preferred_days`, `available_days`) is stored as a **comma-separated VARCHAR** using 2-letter abbreviations:
  `Mo,Tu,We,Th,Fr,Sa,Su`
- The backend stores and returns only these 2-letter codes.
- The frontend is responsible for displaying full day names to the user.
- **Use the `DayOfWeekCode` enum** (`com.mrk.training.model.DayOfWeekCode`) for all day-related logic:
  - `DayOfWeekCode.Mo` — enum constant, `.name()` returns "Mo"
  - `.getShortName()` → "Mon"
  - `.getFullName()` → "Monday"
  - `DayOfWeekCode.fromCode("Mo")` → parses a 2-letter string to the enum
  - `DayOfWeekCode.codesToFullNames("Mo,Tu,Fr")` → "Monday, Tuesday, Friday"
- Do NOT hardcode day mappings inline — always reference the enum.
- Mapping reference:
  | Code | Short | Full |
  |------|-------|-----------|
  | Mo | Mon | Monday |
  | Tu | Tue | Tuesday |
  | We | Wed | Wednesday |
  | Th | Thu | Thursday |
  | Fr | Fri | Friday |
  | Sa | Sat | Saturday |
  | Su | Sun | Sunday |

## Time Range Columns

- Any column storing time ranges (e.g., `preferred_time`) is stored as a **comma-separated VARCHAR** of ranges in 12-hour format:
  `07:30 AM-10:00 AM,02:00 PM-04:00 PM`
- Format: `HH:MM AM/PM-HH:MM AM/PM` (each range is start-end separated by hyphen)
- Multiple ranges are separated by commas.
- Validation regex: `^\d{1,2}:\d{2}\s?(AM|PM)\s?-\s?\d{1,2}:\d{2}\s?(AM|PM)$` (applied per range)
- The backend validates the format on the request DTO.

## Schema Reference

#[[file:mrk-bike-training-backend/db/postgres/schema.sql]]

## API & DTO Conventions

- Request/Response DTOs are separate from JPA entities.
- Use mapper classes or MapStruct to convert between Entity ↔ DTO.
- API field names (JSON) use camelCase and must be compatible with the Angular frontend models in `core/models/api.models.ts`.
- Validate request DTOs using Jakarta Bean Validation (`@NotNull`, `@Size`, etc.).

## Error Handling

- Use a global `@RestControllerAdvice` for consistent error responses.
- Return structured error JSON: `{ "error": "message", "details": [...] }`.
- Don't expose stack traces or internal details in production responses.

## Naming Conventions

- Entities: singular, PascalCase (e.g., `Vehicle`, `TrainerProfile`, `ScheduleSlot`).
- Repositories: `<Entity>Repository`.
- Services: `<Domain>Service` (interface), `<Domain>ServiceImpl` (implementation).
- Controllers: `<Domain>Controller`.
- DTOs: `<Entity>Api` or `<Entity>Request` / `<Entity>Response`.

## Function Design

- Functions should do ONE thing (SRP applies at function level too).
- Keep functions short — if a method exceeds ~20 lines, extract sub-methods.
- Use descriptive method names that convey intent (e.g., `calculateMonthlySalary` not `calc`).
- Avoid side effects where possible; make dependencies explicit via parameters.
