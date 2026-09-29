<div align="center">

# Cloaker

**Zero-knowledge, ephemeral secret sharing.**  
Send passwords, tokens, and sensitive configs with end-to-end encryption and self-destruction.

---

</div>

## Key Features

- **Zero-Knowledge Encryption** — Encrypted in-memory using Web Crypto API (`AES-256-GCM`). Decryption keys live exclusively in the URL fragment (`#k=...`) and never reach the server.
- **Pointer-Reference Architecture** — Generate up to 3 independent links for one secret without duplicating payloads in storage.
- **Flexible Destruction Policies**:
  - **Burn on Read**: Link pointer is deleted atomically upon decryption.
  - **Destroy on Expiry**: Reusable link until the countdown timer expires.
- **Ephemeral Storage** — Backed by serverless Upstash Redis with native TTL expiration.
- **Rate Limited** — Edge-safe IP rate limiting on secret creation and reveal endpoints.

---

## How It Works

```
[ Sender Browser ]  -- (AES-256-GCM Encrypt) -->  Ciphertext & IV  --> [ Upstash Redis ]
         |
         +--> Shareable URL: https://cloaker.app/s/<linkId>#k=<keyString>
                                                               |
                                                   (Key stays in fragment,
                                                    never sent over HTTP)
                                                               |
[ Recipient Browser ] <-- Ciphertext & IV <-- [ Atomically Burn Link Pointer ]
         |
         +--> (Decrypts in memory using #k=...) --> Plaintext
```

---

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/RahilMaiyani/Cloaker.git
cd cloaker
npm install
```

### 2. Environment Variables

Create a `.env.local` file:

```env
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router, React 19)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com)
- **Cryptography**: W3C Web Crypto API (`SubtleCrypto`)
- **Database**: [Upstash Redis](https://upstash.com) & `@upstash/ratelimit`
- **Icons**: [Lucide React](https://lucide.dev)

---

<div align="center">

Made for private, secure, and ephemeral sharing.

</div>
