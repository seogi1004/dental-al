## Architectural Choices
- Pure TypeScript interfaces and types for domain objects.
-  as a type alias for  to match existing usage in the codebase.
-  restricted to 'FULL', 'AM', 'PM' based on application logic.
## Architectural Choices
- Pure TypeScript interfaces and types for domain objects.
- StaffData as a type alias for Staff[] to match existing usage in the codebase.
- LeaveType restricted to 'FULL', 'AM', 'PM' based on application logic.
### Architecture: Service Layer
- Chose to duplicate the `handleResponse` helper in each service file to keep services self-contained for now, following the specific task focus.
- Re-exported all services from `services/index.ts` for easier imports in the future.
- Decisions: Separated sheet data management from leave calculations into two distinct hooks.
- Decisions: Kept fetch logic in useEffect-friendly callbacks to maintain consistency with the existing polling pattern.
