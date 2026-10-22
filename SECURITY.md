# Security policy

## Supported versions

This repository is a reference project without versioned releases. Only the `main` branch is maintained.

## Reporting a vulnerability

Do not open a public issue for a security problem. Use GitHub's private vulnerability reporting instead: open the **Security** tab of this repository and choose **Report a vulnerability**. You will get an acknowledgement within 5 business days.

## Scope notes

- The app is static and offline-capable: it makes no network requests of its own and stores data only in the visitor's browser (`localStorage`) and in files the visitor exports. Anything pasted into an assessment stays on that device.
- The main input surface is the **Import JSON** file. It is parsed with `JSON.parse` and validated field by field before use; the app renders values as text (React escapes them) and never as HTML.
- Do not put real personal data, credentials or confidential system details into an assessment you intend to share. Exported files contain exactly what you typed.
- CI scans the working tree and the full git history for secrets.
