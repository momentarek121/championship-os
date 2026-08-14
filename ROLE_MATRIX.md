# Championship OS Role Matrix

The project owner and users with the `admin` role are the Super Admin boundary. They can manage tournament setup, registration, weigh-in, brackets, scoring, and staff roles.

| Role | Dashboard | Registration and check-in | Weigh-in results | Brackets | Scoring |
|---|---:|---:|---:|---:|---:|
| Admin / owner | Yes | Yes | Yes | Yes | Yes |
| Organizer | Yes | Yes | Yes | Yes | Yes |
| Registration staff | Yes | Yes | No | No | No |
| Weigh-in staff | Yes | No | Yes | No | No |
| Referee | Yes | No | No | No | Yes |
| Mat manager | Yes | No | No | Yes | Yes |
| Athlete | No | No | No | No | No |

The athlete experience is intentionally **public and accreditation-code based** rather than account-authenticated: an athlete uses the code issued after registration to view their own tournament status, next match, mat, and bracket history. The `athlete` database role is reserved for future authenticated athlete accounts and is not used to bypass this safe public portal boundary.

The backend enforces the matrix through capability-specific procedures and field-level registration update checks. Role changes are admin-only, audited, and cannot demote the project owner.
