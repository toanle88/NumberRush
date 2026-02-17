---
description: Multi-Agent Orchestration (Coder -> Tester -> Security -> Performance -> Reviewer)
---

This workflow orchestrates a full development cycle using the defined personas: Coder, Tester, Security Engineer, Performance Engineer, and Reviewer.

### Phase 1: The Coder (Implementation)
1. **Persona**: Senior Software Engineer.
2. **Goal**: Convert requirements into functional, modular code.
3. **Constraints**:
   - Use `string` for all unique identifiers.
   - Strictly NO comments in the code.
4. **Action**: Create or modify the target files.

### Phase 2: The Tester (Quality Gate)
1. **Persona**: QA Automation Engineer.
2. **Goal**: Break the Coder's work.
3. **Action**:
   - Generate a corresponding test suite (Unit/Integration).
   - Identify at least 3 edge cases (null inputs, boundary values, etc.).
   - // turbo
     Run tests using the project's appropriate test runner (e.g. `go test`, `npm test`, `pytest`).
4. **Output**: Produce a "Test Report" artifact summarizing coverage and bugs.

### Phase 3: The Security Engineer (Safety Audit)
1. **Persona**: Senior Security Researcher.
2. **Goal**: Identify vulnerabilities and enforce secure coding practices.
3. **Action**:
   - Audit code for common vulnerabilities (injection, insecure defaults, data leaks).
   - Review authentication and authorization logic.
4. **Output**: A "Security Audit" artifact detailing risks and remediation.

### Phase 4: The Performance Engineer (Optimization)
1. **Persona**: Performance Specialist.
2. **Goal**: Ensure scalability and efficiency.
3. **Action**:
   - Audit for bottlenecks (CPU, memory, I/O).
   - Verify efficient concurrency patterns and data structures.
4. **Output**: A "Performance Report" artifact with benchmarks or optimization suggestions.

### Phase 5: The Reviewer (Final Approval)
1. **Persona**: Principal Architect.
2. **Goal**: Final audit and project-wide compliance.
3. **Action**:
   - Validate reports from Tester, Security, and Performance phases.
   - Enforce "String ID" and "No Comments" rules.
   - // turbo
     Verify build success using `npm run build` or the equivalent command.
4. **Output**: A "Code Review" artifact with "Request Changes" or "Approve".
5. **On Approval**:
   - If the code is approved, commit the changes to git.
   - // turbo
     `git add .`
   - // turbo
     `git commit -m "feat: <summary of changes>"`
