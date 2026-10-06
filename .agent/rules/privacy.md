---
trigger: always_on
---

# Privacy Rules

Controls data protection obligations.

- **Privacy notice.** Show at activation. Require acceptance before the PIN is set. State what is stored, who sees it, how long it is kept, and how to request a copy or deletion. Plain English. One screen. Reason: PRD FR-58.
- **Controller and processor.** The gym is the data controller. The developer is a data processor acting on the gym's instructions. State this in the notice and in the contract. Reason: PRD FR-59. Under the Nigeria Data Protection Act this decides who answers for a breach.
- **Retention: attendance, question logs, access logs.** Twenty four months from creation, then delete. Reason: PRD FR-60. The clock starts when the row is written, not when the member last interacts.
- **Retention: payment records and receipts.** Seven years from creation. Reason: PRD FR-60. These are financial records.
- **Retention: member identity.** While the membership is active and for twenty four months after `cancelledAt`. If `cancelledAt` is null, retain while active. Reason: PRD FR-60. The clock starts at the recorded cancellation date.
- **Exit export.** If the gym ends the contract, deliver a full CSV export of all gym and member data within fourteen days. Reason: PRD FR-61.
- **Exit deletion.** Delete all data from the developer's systems within thirty days of the export being confirmed. Reason: PRD FR-61.
- **Contract before launch.** Write the export and deletion terms into the contract before launch, not after. Reason: PRD FR-61.
- **Copy or deletion request.** A member requests a copy or deletion by messaging the desk on WhatsApp. Staff confirm identity against the registered number. The owner fulfils the request within thirty days. Reason: PRD FR-58 states the right. This is the only channel in version one because there is no email or SMS.
- **Access log.** Every private query writes a `PrivateAccessLog` row with the session member ID, the queried member ID, and the calling function. Reason: PRD FR-16b. `structure.md` and `ci.md` reference this rule. The nightly sweep in `jobs.md` asserts the two IDs match.
- **Question log visibility.** Member facing reads of `QuestionLog` are private. The owner sees the log with the member number attached. State this in the notice. Reason: PRD section 8.5 and FR-58. The owner is the data controller and cannot fix a wrong record without knowing whose it is.
- **No private data in the vector store.** See `retrieval.md`. This file does not repeat the rule.