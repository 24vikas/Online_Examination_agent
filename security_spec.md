# Security Specification & Threat Model: Online Examination System Agent

## 1. Data Invariants

1. **User Identity Invariant**: A student can only register, submit answers, log integrity events, and submit grievances under their own authenticated `uid`.
2. **Role Integrity**: A student cannot elevate their role to `faculty` or modify their own eligibility attributes (`feeCleared`, `attendanceRate`).
3. **Exam Lifecycle Invariant**: Only faculty can create, update, or publish exams and approve subjective grades. Students have read access only to published exams.
4. **Integrity Log Immutability**: Students can append integrity event logs during their active exam session, but cannot edit, clear, or delete logs once recorded. Only faculty can review integrity flags and record human decisions without applying automated unfair penalties.
5. **Submission Immutability & Gate**: Once a submission is marked `submitted`, student responses cannot be altered. Objective scores are deterministic and subjective evaluations require faculty review before `published_results`.
6. **Grievance Protection**: Students can file grievances only for their own exam submissions, and cannot alter faculty responses or award themselves revised marks.

## 2. The Dirty Dozen Attack Payloads

1. **Payload 1 (Role Escalation)**: Student attempts to update `role: "faculty"` in `/users/{userId}`.
2. **Payload 2 (Fee Bypass)**: Student attempts to set `feeCleared: true` and `attendanceRate: 100` on their own profile without administrative clearance.
3. **Payload 3 (Exam Question Injection)**: Student attempts to write a question to `/exams/{examId}/questions/{questionId}`.
4. **Payload 4 (Exam Tampering)**: Student attempts to change passing marks or exam dates in `/exams/{examId}`.
5. **Payload 5 (Submission Spoofing)**: Student A submits an exam submission under Student B's `studentId`.
6. **Payload 6 (Score Self-Award)**: Student sends a submission payload with `totalScore: 100, facultyApproved: true, isPassed: true`.
7. **Payload 7 (Post-Submission Tampering)**: Student attempts to update answers after status is changed to `submitted`.
8. **Payload 8 (Integrity Log Deletion)**: Student attempts to delete their recorded `tab_switch` or `multiple_faces` integrity flag.
9. **Payload 9 (Integrity Log Exoneration)**: Student attempts to update an integrity flag setting `facultyReviewed: true, facultyDecision: "cleared"`.
10. **Payload 10 (Grievance Self-Award)**: Student updates a grievance document setting `status: "resolved", newAwardedMarks: 100`.
11. **Payload 11 (ID Poisoning Attack)**: Attacker sends an operation using a 2KB junk string or SQL/NoSQL injection string as the document ID.
12. **Payload 12 (Denial-of-Wallet Payload)**: Attacker sends a 1MB payload string in a text field trying to exhaust database quotas.

All of these malicious payloads are rejected by strict validation helpers, path variable checks, size bounds, and attribute-based security rules.
