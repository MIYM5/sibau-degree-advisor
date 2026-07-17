# Security Policy

SIBAU Degree Advisor is not yet a deployed application. Security reports are still welcome because the repository may later handle student-provided academic and preference information.

## Reporting a vulnerability

Do not open a public issue containing a vulnerability, secret, or personal data. Once the GitHub repository is connected, use GitHub's private vulnerability reporting feature if it is enabled. Until then, contact the project owner through a private channel already known to you.

Include a clear description, steps to reproduce, possible impact, and a suggested mitigation if available. Do not include real student records in a report.

## Data-safety principles

- Collect only the information needed to produce a recommendation.
- Do not store real student data during early local development.
- Never commit `.env` files, credentials, access tokens, or production data.
- Treat marks, interests, aptitude responses, and contact details as sensitive user data.
- Do not log complete student profiles in production.
- Keep eligibility sources auditable without storing applicant identity information.
- Add authentication and a database only after an approved privacy and security design.

## Scope status

No released versions are currently supported. This policy will be expanded before public deployment to cover dependency updates, access control, data retention, backups, incident response, and responsible disclosure timelines.
