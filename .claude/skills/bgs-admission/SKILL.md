```markdown
# bgs-admission Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development patterns and conventions used in the `bgs-admission` TypeScript codebase. You'll learn how to structure files, write code following the project's style, manage imports/exports, and write and run tests. This guide also provides suggested commands for common workflows.

## Coding Conventions

### File Naming
- Use **camelCase** for file names.
  - Example: `userService.ts`, `admissionForm.ts`

### Import Style
- Use **relative imports** for referencing modules.
  - Example:
    ```typescript
    import { validateForm } from './formValidator';
    ```

### Export Style
- Use **named exports** instead of default exports.
  - Example:
    ```typescript
    // In admissionForm.ts
    export function submitAdmission(data: AdmissionData) { ... }

    // In another file
    import { submitAdmission } from './admissionForm';
    ```

### Commit Messages
- Follow the **Conventional Commits** specification.
- Use the `build` prefix for build-related changes.
  - Example:
    ```
    build: update dependencies for admission module
    ```

## Workflows

### Build Workflow
**Trigger:** When you need to update or manage build-related tasks, such as dependency updates or build script changes.
**Command:** `/build`

1. Make your build-related changes (e.g., update dependencies, modify build scripts).
2. Stage your changes:
    ```
    git add .
    ```
3. Commit using the conventional prefix:
    ```
    git commit -m "build: [describe your change]"
    ```
4. Push your changes to the repository:
    ```
    git push
    ```

## Testing Patterns

- Test files use the pattern `*.test.*` (e.g., `userService.test.ts`).
- The testing framework is **unknown** from the analysis, but tests should follow standard TypeScript testing patterns.
- Example test file:
    ```typescript
    // userService.test.ts
    import { getUser } from './userService';

    describe('getUser', () => {
      it('should return user data for a valid ID', () => {
        const user = getUser(1);
        expect(user).toBeDefined();
      });
    });
    ```

## Commands
| Command   | Purpose                                         |
|-----------|-------------------------------------------------|
| /build    | Run the build workflow for dependency or script updates |
```
