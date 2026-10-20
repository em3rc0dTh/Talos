# Talos External Field Trial — Cloudflare Tunnel

Status: EXTERNAL FIELD-TRIAL EXPOSURE
Purpose: expose only the Talos One-App running on the developer machine to a named external tester without publishing Temporal Web or opening inbound router ports.

## Certified local origin

The external trial reuses the existing local field-trial stack:

- Talos One-App: `http://localhost:8787`
- Temporal gRPC: `localhost:17233` — local only
- Temporal Web: `http://localhost:18233` — local only
- Perception gateway: container-internal — not published through the tunnel

The tunnel MUST publish only Talos port 8787.

## Target

```text
Tester
  ↓ HTTPS
talos-test.vtkall.com
  ↓
Cloudflare Access
  ↓
Cloudflare Tunnel
  ↓
http://localhost:8787
  ↓
Talos One-App
```

Temporal Web is diagnostic infrastructure and is intentionally excluded from the public route.

## 0. Preflight

Start the certified Talos field-trial stack and verify:

```powershell
Invoke-RestMethod http://localhost:8787/api/status
```

Expected product status: `READY`.

## 1. Install cloudflared

Install the current Windows 64-bit `cloudflared` release from Cloudflare, then verify:

```powershell
cloudflared --version
```

## 2. Authenticate this machine

```powershell
cloudflared tunnel login
```

Complete the browser flow for the Cloudflare zone that owns `vtkall.com`.

This writes the account certificate under `%USERPROFILE%\.cloudflared`. Never copy that certificate or tunnel credential JSON into this repository.

## 3. Create the field-trial tunnel

```powershell
cloudflared tunnel create talos-field-trial
cloudflared tunnel list
```

Record the returned tunnel UUID.

## 4. Route the hostname

```powershell
cloudflared tunnel route dns <TUNNEL_UUID> talos-test.vtkall.com
```

This creates the DNS route to the Cloudflare Tunnel. It does not expose Temporal Web.

## 5. Run with the Talos-only ingress config

Use the helper in this repository:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-cloudflare-field-trial.ps1 `
  -TunnelId "<TUNNEL_UUID>" `
  -Hostname "talos-test.vtkall.com"
```

The helper validates the Talos origin, writes a local config under `%USERPROFILE%\.cloudflared`, and runs the tunnel in the foreground.

Stop the tunnel with `Ctrl+C`.

## 6. Protect the hostname with Cloudflare Access

In Cloudflare Zero Trust:

1. Go to **Access controls → Applications**.
2. Create a **Self-hosted and private** application.
3. Add public hostname `talos-test.vtkall.com`.
4. Add an **Allow** policy for the exact tester email address.
5. Use your configured identity provider. For an external tester, One-time PIN can be enabled and restricted to the tester email.
6. Do not add `temporal-test.vtkall.com`, port 18233, or any Temporal route.

Access applications deny by default unless a user matches an Allow policy.

## 7. External verification

From a device/network that is not the Talos host:

1. Open `https://talos-test.vtkall.com`.
2. Confirm Cloudflare Access challenges the tester.
3. Authenticate as the explicitly allowed tester.
4. Confirm Talos Simple Mode loads.
5. Complete the field-trial journey.
6. Confirm the Talos UI reaches `Process complete`.

The Talos operator may independently validate the exact Workflow ID / Run ID in local Temporal Web.

## Safety rules

- Do not publish port 18233.
- Do not publish port 17233.
- Do not commit `cert.pem`, tunnel credential JSON, Access secrets, Gemini keys, or other credentials.
- Keep production integrations disabled.
- Stop `cloudflared` when the supervised trial window ends.
- A Cloudflare route does not authorize Talos automation, deployment, or workflow execution; Talos authority gates remain unchanged.
