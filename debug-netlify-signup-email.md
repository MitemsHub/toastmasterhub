# Debug Session: netlify-signup-email
- **Status**: [OPEN]
- **Issue**: Hosted signup shows the generic access-code failure banner even after successful deployment.
- **Debug Server**: Pending startup
- **Log File**: .dbg/trae-debug-log-netlify-signup-email.ndjson

## Reproduction Steps
1. Open the deployed landing page.
2. Switch to `Request code`.
3. Enter valid VPE name, email, and OTC.
4. Submit the form.
5. Observe the generic error banner instead of a usable access code flow.

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | Appwrite VPE lookup/create fails in production. | Med | Low | Pending |
| B | Appwrite succeeds but the SMTP send fails on Netlify. | High | Low | Pending |
| C | Production env parsing or missing vars break the signup action. | Med | Low | Pending |
| D | The request times out or partially fails and collapses into `signup-failed`. | Med | Med | Pending |
| E | A stale error state is masking a successful request. | Low | Low | Pending |

## Log Evidence
- Static evidence from hosted behavior and code path review points most strongly to hypothesis **B**:
  - Local signup succeeds with the same Appwrite + OTC flow.
  - Hosted deploy succeeds and renders correctly, so the remaining failure path is after form submission.
  - Signup currently creates/updates the VPE before attempting email delivery.
  - The generic banner appears when the email step throws, which matches the hosted-only symptom.
- Follow-up backend verification isolated a deeper issue:
  - direct Appwrite document create and update succeed
  - the custom Appwrite REST client was generating invalid query strings like `equal("email",["value"])`
  - Appwrite Cloud accepts JSON-string queries with `attribute`, for example `{"method":"equal","attribute":"email","values":["value"]}`
  - this invalid lookup query was causing hosted signup to fail before the email step

## Verification Conclusion
- Implemented a resilience fix:
  - if VPE creation succeeds but email delivery fails, the generated access code is preserved
  - the hosted user now receives the access code directly in the signup success banner instead of dead-ending on the generic failure state
- Implemented the root-cause fix:
  - Appwrite query builder now emits JSON-string queries for `equal`, `orderAsc` / `orderDesc`, and `limit`
- Pending user redeploy + verification
