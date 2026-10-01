<div align="center">

# 🔒 Cloaker

**Zero-Knowledge, Ephemeral Secret Sharing**  
Send sensitive credentials, `.env` configs, and API keys with end-to-end encryption, QR share cards, and atomic self-destruction.

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3-black?style=flat&logo=next.js)](https://nextjs.org)
[![React 19](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat&logo=tailwindcss)](https://tailwindcss.com)
[![Upstash Redis](https://img.shields.io/badge/Upstash-Redis-00E599?style=flat&logo=redis)](https://upstash.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## ✨ Features

- **🛡️ True Zero-Knowledge Architecture**  
  Payloads are encrypted and decrypted exclusively in the browser using the **Web Crypto API (`AES-256-GCM`)**. The 256-bit encryption key lives in the URL hash fragment (`#k=...`), meaning the key is **never sent to the server, never logged in headers, and never stored in Redis**.

- **🔢 6-Digit Passcode Gate & 3-Strike Defense**  
  Add an optional 6-digit PIN gate. Verification uses client-salted **SHA-256 hashes**. If an intruder enters 3 incorrect passcodes, Cloaker **atomically purges the link and payload from storage** (HTTP 410 Self-Destruct).

- **📷 High-Resolution Secret Share Cards & QR Code**  
  Generate an exportable cryptographic badge with a stylized neon emerald-to-mint QR code (`qr-code-styling`). Export the entire card at **3x retina DPI** as a PNG (`html-to-image`) or beam it to nearby devices via the native Web Share API (`navigator.share`).

- **🔗 Pointer-Reference Multi-Link Architecture**  
  Generate 1 to 3 independent, distinct links sharing a single encrypted master payload. Prevents ciphertext duplication in memory while allowing granular per-link distribution.

- **🔥 Flexible Destruction Policies**  
  - **Burn on Read:** Link pointer is permanently deleted the exact instant the secret is unlocked.
  - **Destroy on Expiry:** Link remains reusable until the countdown timer closes (5m, 1h, 24h, 7d).

- **🛑 Instant Sender Kill-Switch (Revoke Links)**  
  Senders can instantly revoke and wipe an active secret and all associated links directly from the creator dashboard before anyone reads them.

- **👤 Optional Sender Attribution & Note Subject**  
  Optionally attach a note subject (e.g. *Stripe Production API Keys*) and sender name/email so recipients can safely verify authenticity before revealing or entering their PIN.

- **⚡ Edge Rate Limiting & DoS Protection**  
  Protected by `@upstash/ratelimit` with strict sliding-window request throttling on creation and burn endpoints.

---

## 🔬 Cryptographic & Security Model

```
[ Sender Browser ]
  │
  ├── 1. Generate random 256-bit key (AES-256-GCM)
  ├── 2. Encrypt plaintext in-memory -> Ciphertext + 96-bit IV
  ├── 3. (Optional) Compute passcodeHash = SHA-256(PIN + Salt)
  │
  ▼ POST /api/secrets (Transmits ONLY Ciphertext, IV, Salt, PasscodeHash)
[ Upstash Serverless Redis ]
  ├── Stores: secret:payload:<masterId> (TTL enforced)
  └── Stores: secret:link:<linkId> (Pointers & Strike Tracker)
  │
  ▲ Shareable Link: https://cloaker.app/s/<linkId>#k=<keyString>
  │                                                   │
  │                  (Fragment stays in browser memory, never sent over HTTP)
  │
[ Recipient Browser ]
  ├── 1. GET /api/secrets/<linkId>/meta -> Returns verification metadata & strike count
  ├── 2. (Optional) Prompts 6-digit PIN -> POST /api/secrets/<linkId>/burn
  │      └── Mismatch: Increments strike in Redis (Max 3 strikes -> Purges payload)
  │      └── Match (or Open): Returns Ciphertext + IV, deletes link if Burn-on-Read
  └── 3. Decrypts Ciphertext in-memory using #k= fragment -> Plaintext revealed
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js `20.x` or later
- An [Upstash Redis](https://upstash.com) database (free tier works perfectly)

### 1. Clone & Install

```bash
git clone https://github.com/RahilMaiyani/Cloaker.git
cd Cloaker
npm install
```

### 2. Configure Environment

Create a `.env.local` file in the root directory:

```env
UPSTASH_REDIS_REST_URL="https://your-upstash-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your_upstash_redis_rest_token"
```

### 3. Run the Development Server

```bash
npm run dev
```

Visit [`http://localhost:3000`](http://localhost:3000) in your browser.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16.3](https://nextjs.org) (Turbopack, App Router, React 19) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com) & Custom OGL Shader |
| **Cryptography** | Web Crypto API (`AES-GCM`, `SHA-256`, `SubtleCrypto`) |
| **Storage & Rate Limit** | [Upstash Redis](https://upstash.com) & `@upstash/ratelimit` |
| **Card Export & QR** | `qr-code-styling`, `html-to-image` (3x Retina DPI) |
| **Icons & UI** | [Lucide React](https://lucide.dev) |

---
<div align="center">

Made with 🛡️ for secure, private, and zero-knowledge communication.

</div>
