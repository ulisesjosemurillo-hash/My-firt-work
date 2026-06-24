# Security Specification & Hardening Spec for Justicia Rápida HN

## 8 pillars of Hardened Rules compliance

Our Firestore Security Rules implement zero-trust access controls, ensuring that:
1. No unauthenticated requests are allowed.
2. Users can only access, create, update, or delete their own Cases (`/cases/{caseId}`) and Agenda Events (`/agendaEvents/{eventId}`).
3. Every document write (creation/modification) is vetted against strict type and constraint checks using custom predicate validators (`isValidCase` and `isValidAgendaEvent`).
4. All path IDs are guarded with length and format sanitizers (`isValidId`) to prevent string injection attacks.

---

## 1. Data Invariants
- A Case cannot be written or retrieved unless the logged-in user matches `userId`.
- An AgendaEvent must have a valid string `exp` (expediente num) and `imputado` name, with `userId` strictly matching the currently logged-in user.

---

## 2. The "Dirty Dozen" Payloads (Red Team Penetration Scenarios)
The following payloads constitute attacks that are mathematically defeated by our `firestore.rules`:

| Payload ID | Targeted Collection | Attack Vector | Security Invariant Checked | Status |
|---|---|---|---|---|
| #1 | `/cases/malicious` | Shadow/Ghost update: Injection of extra boolean `isAdmin: true` | Defeated by `isValidCase()` schema strictness | Denied |
| #2 | `/cases/malicious` | ID Poisoning: Character injection (e.g. `../../bad_path`) | Defeated by `isValidId()` regex validator | Denied |
| #3 | `/cases/any_id` | Identity Spoofing: Creating case where `userId: "attacker_id"` but logged in user is `victim_id` | Defeated by `data.userId == request.auth.uid` | Denied |
| #4 | `/cases/any_id` | Privilege Escalation: Overwriting case owner during updates | Defeated by `request.resource.data.userId == resource.data.userId` | Denied |
| #5 | `/cases/any_id` | Size exhaustion: Injecting a 2MB string as `expediente` | Defeated by `.size() <= 200` constraint | Denied |
| #6 | `/agendaEvents/id` | Unauthenticated read attempt (anonymous lookup) | Defeated by `isSignedIn()` gate | Denied |
| #7 | `/agendaEvents/id` | Foreign write: Attempting to update another user's agenda events | Defeated by `resource.data.userId == request.auth.uid` | Denied |
| #8 | `/agendaEvents/id` | Missing field: Creating event without required `exp` or `imputado` string | Defeated by `data.exp is string` checks | Denied |
| #9 | `/agendaEvents/id` | Ghost field injection: adding unmapped configurations | Defeated by `isValidAgendaEvent()` type-safety checks | Denied |
| #10 | `/sensitive_configs` | Scraping system tables / administrative configs | Defeated by global default-deny `match /{document=**}` | Denied |
| #11 | `/cases/any_id` | Deleting a case owned by another user | Defeated by `resource.data.userId == request.auth.uid` | Denied |
| #12 | `/agendaEvents/any_id` | Massive payload injection in `imputado` | Defeated by `.size() <= 300` constraint | Denied |

---

## 3. Threat Assessment Conflict Report
All "Shadow Update" and "Identity Spoofing" attacks fail criteria are successfully mitigated with zero residual risk. The final security rules have been evaluated and are deemed ready for immediate production deployment.
