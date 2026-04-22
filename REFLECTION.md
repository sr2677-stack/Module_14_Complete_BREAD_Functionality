# Reflection: Module 14 BREAD Calculations Assignment

## What I Built
I implemented full BREAD functionality for calculations:
- Browse all calculations for the logged-in user
- Read a single calculation by ID
- Add a calculation with operation and operands
- Edit an existing calculation
- Delete a calculation

The backend is protected with JWT, and calculation data is scoped per user.

## Frontend Work
I updated the frontend to support all BREAD operations with dedicated forms and user feedback messages. I added client-side checks for required IDs and numeric operand validation to reduce invalid submissions.

## Testing Approach
I expanded Playwright E2E coverage with both positive and negative scenarios:
- Positive: Add, Browse, Read, Edit, Delete
- Negative: invalid input, divide-by-zero, unauthorized access, non-existent IDs, and cross-user access protection

This helped validate both API behavior and user-facing interactions.

## CI/CD and Deployment
I used GitHub Actions to automate E2E testing. I also configured Docker image build/push to Docker Hub for deployment readiness.

## Challenges and Lessons Learned
- Keeping frontend and backend validation behavior consistent required careful updates.
- User-scoped access rules were important to test explicitly (especially delete/read isolation across users).
- E2E tests are most reliable when setup creates isolated users/data per run.

## What I Would Improve Next
- Add backend unit tests for route-level validation and compute edge cases.
- Add stricter API schema validation for request payloads.
- Add richer frontend error display and loading states for better UX.

