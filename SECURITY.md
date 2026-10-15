# Security

Please report suspected vulnerabilities through [GitHub's private reporting form](https://github.com/leozh0u/perch/security/advisories/new). Do not put credentials, private video links or exploit details in a public issue.

Only the latest published preview is maintained. Download updates from [Releases](https://github.com/leozh0u/perch/releases); Perch does not update itself automatically.

Perch loads video websites in sandboxed, isolated renderers without Node integration or the local UI's privileged bridge. These controls reduce risk; they are not a guarantee against browser/runtime vulnerabilities. The [scoped security review](docs/SECURITY_REVIEW.md) records the checks and remaining limits.

The app is currently ad-hoc signed and unnotarised. Sign-in workflows are outside the supported scope. The persistent media partition uses Electron's default cookie-store setting; do not treat it as an encrypted credential vault.
