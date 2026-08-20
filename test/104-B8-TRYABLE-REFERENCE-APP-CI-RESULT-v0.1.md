# B8 Tryable Reference App CI Result

Status: **PASS**

```text
npm ci                     success
Temporal lock gate         success
architecture guard         success
B8 app smoke test          success
```

The smoke test boots the real Talos reference pipeline, local Temporal server/Worker and HTTP app, then executes APPROVED and REJECTED requests through Workflow Updates.
