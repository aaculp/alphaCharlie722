# Requirements Document

## Introduction

This specification defines the requirements for updating the On The Way (OTW) React Native application documentation to accurately reflect recent code changes implemented between January 2025 and January 2026. The documentation update encompasses backend architecture changes (Supabase database schema, migrations, RLS policies), frontend component additions and modifications, new hooks and services, and updated data flow patterns.

## Glossary

- **OTW**: On The Way - the React Native mobile application
- **Supabase**: Backend-as-a-Service platform providing PostgreSQL database, authentication, and real-time subscriptions
- **RLS**: Row Level Security - PostgreSQL security feature for access control
- **React Query**: Data fetching and state management library for React applications
- **Pulse System**: Community feedback feature allowing users to tag and like venue attributes
- **@ Search**: Username-based search functionality triggered by @ symbol
- **Display Name**: User-visible name that can differ from username
- **StatCard**: Reusable component for displaying profile statistics
- **Documentation System**: The collection of markdown files in the docs/ directory describing system architecture
- **Migration**: Database schema change script with timestamp identifier
- **Hook**: React custom hook for encapsulating reusable logic
- **Component**: React component representing UI elements
- **Service**: API client module for backend communication

## Requirements

### Requirement 1: Document Backend Database Schema Changes

**User Story:** As a backend developer, I want comprehensive documentation of all database schema changes, so that I can understand the data model and write correct queries.

#### Acceptance Criteria

1. WHEN documenting the profiles table, THE Documentation System SHALL include the username and display_name columns with their types, constraints, and purposes
2. WHEN documenting new tables, THE Documentation System SHALL include user_tags and tag_likes tables with complete column definitions, foreign key relationships, and indexes
3. WHEN documenting migrations, THE Documentation System SHALL list migration 20250125000000 (username fields) and 20250125000001 (search RLS policy) with their purposes
4. WHEN documenting RLS policies, THE Documentation System SHALL include the user search policy with its security rules and rationale
5. WHEN documenting database triggers, THE Documentation System SHALL include review system triggers with their functions and behaviors

### Requirement 2: Document Backend Service APIs

**User Story:** As a frontend developer, I want documentation of backend service methods, so that I can correctly integrate API calls in the application.

#### Acceptance Criteria

1. WHEN documenting UserFeedbackService, THE Documentation System SHALL include all API methods with their parameters, return types, and usage examples
2. WHEN documenting data validation scripts, THE Documentation System SHALL include the @ search validation script with its purpose and execution instructions
3. WHEN documenting service methods, THE Documentation System SHALL include error handling patterns and expected response formats

### Requirement 3: Document Frontend Hooks

**User Story:** As a frontend developer, I want documentation of all custom hooks, so that I can reuse them correctly in components.

#### Acceptance Criteria

1. WHEN documenting useSearchMode hook, THE Documentation System SHALL include its interface, return values, and @ search detection logic
2. WHEN documenting useUsersQuery hook, THE Documentation System SHALL include its parameters, React Query integration, and usage examples
3. WHEN documenting useSwipeGesture hook updates, THE Documentation System SHALL include the new threshold values and their rationale
4. WHEN documenting hooks, THE Documentation System SHALL include TypeScript interfaces for parameters and return types

### Requirement 4: Document Frontend Components

**User Story:** As a frontend developer, I want documentation of all components with their props and features, so that I can use and modify them correctly.

#### Acceptance Criteria

1. WHEN documenting UserFeedback component, THE Documentation System SHALL include its props, Pulse system integration, and user interaction flows
2. WHEN documenting VenueSearchCard component, THE Documentation System SHALL include its props, reusability features, and usage examples
3. WHEN documenting StatCard component, THE Documentation System SHALL include its props, styling patterns, and profile integration
4. WHEN documenting ProfileScreen updates, THE Documentation System SHALL include the new layout, StatCard usage, and data sources
5. WHEN documenting SearchScreen updates, THE Documentation System SHALL include unified search logic, venue and user search integration, and @ search mode behavior

### Requirement 5: Document Utility Functions

**User Story:** As a developer, I want documentation of utility functions, so that I can use consistent patterns across the codebase.

#### Acceptance Criteria

1. WHEN documenting display name utilities, THE Documentation System SHALL include all functions with their signatures, behaviors, and edge cases
2. WHEN documenting username validation utilities, THE Documentation System SHALL include validation rules, regex patterns, and error messages
3. WHEN documenting utility functions, THE Documentation System SHALL include code examples demonstrating typical usage

### Requirement 6: Update Architecture Documentation

**User Story:** As a developer joining the project, I want updated architecture documentation, so that I can understand the system structure and data flow.

#### Acceptance Criteria

1. WHEN updating component hierarchy, THE Documentation System SHALL include new components (UserFeedback, VenueSearchCard, StatCard) in the correct positions
2. WHEN updating data flow documentation, THE Documentation System SHALL include React Query patterns, user search flow, and Pulse system data flow
3. WHEN updating architecture diagrams, THE Documentation System SHALL use consistent notation and maintain visual clarity
4. WHEN updating high-level overview, THE Documentation System SHALL include new features (username system, Pulse system) with their purposes

### Requirement 7: Maintain Documentation Quality Standards

**User Story:** As a documentation maintainer, I want consistent formatting and structure, so that documentation is easy to navigate and maintain.

#### Acceptance Criteria

1. WHEN updating any documentation file, THE Documentation System SHALL update the "Last Updated" date to the current date
2. WHEN adding code examples, THE Documentation System SHALL use proper markdown code blocks with language identifiers
3. WHEN adding new sections, THE Documentation System SHALL maintain consistent heading hierarchy and formatting
4. WHEN referencing related documentation, THE Documentation System SHALL include cross-references with relative file paths
5. WHEN documenting features, THE Documentation System SHALL include both technical details and user-facing descriptions

### Requirement 8: Provide Complete Code Examples

**User Story:** As a developer implementing features, I want complete code examples, so that I can understand correct usage patterns.

#### Acceptance Criteria

1. WHEN documenting hooks, THE Documentation System SHALL include complete usage examples with imports, initialization, and typical use cases
2. WHEN documenting components, THE Documentation System SHALL include JSX examples with realistic props and data
3. WHEN documenting services, THE Documentation System SHALL include async/await patterns and error handling
4. WHEN documenting database queries, THE Documentation System SHALL include SQL examples with proper formatting

### Requirement 9: Document Migration History

**User Story:** As a database administrator, I want a complete migration history, so that I can understand schema evolution and plan future changes.

#### Acceptance Criteria

1. WHEN documenting migrations, THE Documentation System SHALL list all migrations in chronological order with timestamps
2. WHEN documenting each migration, THE Documentation System SHALL include the migration purpose, affected tables, and rollback considerations
3. WHEN documenting schema changes, THE Documentation System SHALL include before and after states for modified tables
