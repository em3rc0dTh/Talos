# B8 Tryable Reference App CI Result

Status: **PASS**

```text
workspace lock sync         success
npm ci                      success
Temporal lock gate          success
architecture guard          success
B8 app smoke test           success
```

The smoke test boots the full native Canvas → validation → Manager correction → semantic freeze → capability → execution design pipeline, launches a real local Temporal server and Worker, starts HTTP/browser app state, then executes APPROVED and REJECTED requests through Workflow Updates.
