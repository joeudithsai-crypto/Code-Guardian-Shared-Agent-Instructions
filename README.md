# Code-Guardian-Shared-Agent-Instructions

Orchestrator: Evaluates the user code snippet and routes to the Scanner.
Scanner: Receives code, detects security issues, logic bugs, etc. Outputs a structured list of findings with severity.
Fixer: Receives findings + code, generates a unified diff patch.
Reviewer: Evaluates the fix in a sandbox environment:
If tests fail or regressions/safety issues are found, logs the rejection and routes back to the Fixer.
If successful, approves the patch and compiles a summary report.
