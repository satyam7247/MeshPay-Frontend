# Modernization Plan: Provider-Backed Bank Onboarding and Payment Disablement

**Project**: MeshPay Expo frontend and UPI Offline Mesh Spring Boot backend

**Workspace A (frontend)**: `C:\Users\Win11 Pro\Desktop\ProjectMajor`

**Workspace B (backend)**: `C:\Users\Win11 Pro\Desktop\UPI_Without_Internet`

## Technical Framework

- **Frontend**: Expo 58, React 19.3, React Native 0.88
- **Backend**: Java 17, Spring Boot 3.3.5, Maven
- **Frontend build tool**: npm / Expo CLI
- **Backend build tool**: Maven Wrapper
- **Database**: MySQL connector is present; configured runtime database is not
  established by this planning review
- **Key dependencies**: Spring Web, Spring Security, Spring Data JPA,
  Spring Validation, Expo Secure Store, Expo SQLite

## Overview

Replace simulated bank-linking and balance behavior with fail-closed,
server-side provider integrations where provider contracts and credentials are
available. Preserve existing login, registration, and general authentication
behavior. Remove simulated payments, recipient-specific QR codes, transaction
history, and ledger success claims rather than routing money to an unrelated
merchant account.

Twilio Verify and MSG91 are approved SMS onboarding options; Cashfree Secure ID
V2 is the documented bank-verification option. Setu Account Aggregator behavior
is gated on verified contracts, explicit consent, eligible production
readiness, and real financial-institution data. Unsupported or unconfigured
operations must report unavailable/configuration-pending and must not fabricate
success. Do not collect ATM/UPI PINs, CVV, passwords, or full bank-account
numbers beyond a provider-required request.

The implementation must integrate with the existing dirty/shared worktrees.
Inspect and preserve current edits, including authentication and registration;
do not reset, revert, or commit unrelated work.

## Migration Impact Summary

| Application | Existing behavior | Target behavior | Authentication | Comments |
|---|---|---|---|---|
| Spring Boot backend | Mock bank/payment flows | Provider adapters, fail closed | Preserve existing auth | No unapproved settlement |
| Expo frontend | Simulated bank/payment UI | Real status or explicit unavailable | Preserve login/signup | No fake QR or history |
| Backend docs | Incomplete provider setup | Exact implemented env names | Server-side secrets only | Separate test/prod config |

## Scope and Guardrails

- Keep all provider credentials, service identifiers, and tokens on the server
  in environment-only configuration with distinct test and production settings.
- Select SMS provider explicitly. If no supported provider is configured, return
  a clean unavailable / `NOT_CONFIGURED` response and send no OTP.
- Twilio Verify and MSG91 own OTP generation and verification. Never return or
  persist plaintext OTPs. Persist only provider challenge references and
  hashed/otherwise protected phone identifiers, with ownership, expiry,
  attempt, and rate limits.
- Cashfree bank verification must use the documented Secure ID V2 contract and
  real account/name/phone data (and IFSC only if required). Persist only a
  masked account number. Mark an account `VERIFIED` only on a documented,
  account-valid response and acceptable name match; otherwise use `PENDING` or
  `FAILED`. An HTTP/API `SUCCESS` alone is not proof of account validity.
- Setu must remain unavailable unless exact endpoint/contracts are verified.
  Production eligibility, KYC, Sahamati certification, production credentials,
  and explicit consent are prerequisites. Balance display requires real FI data
  fetched under consent and displays only returned values, timestamps, and
  currency. Use documented polling only; otherwise fail closed.
- Do not enable recipient-specific QR, payment initiation, Route settlement,
  simulated ledger activity, or fake transaction success. Recipient connected
  account / Route settlement is not approved. Do not use RazorpayX.
- Do not accept unauthenticated or unverified webhook callbacks. Do not invent
  provider fields, endpoints, or signature schemes when official contracts
  cannot be established.
- Frontend bank selection is searchable and limited to banks compatible with
  the configured provider. Collect IFSC only when that provider requires it.
  Never show a complete account number or collect PINs, CVV, or passwords.

## Plan Execution Notes

The backend and frontend repositories contain pre-existing uncommitted or
untracked work. Every task must first review its touched files and integrate
with current changes. Preserve unrelated edits and existing auth/general APIs.
No plan task authorizes a commit, reset, or broad cleanup.

Task-level provider adapter implementation is conditional on confirming the
exact official contract. If a contract cannot be established, leave that
provider operation unavailable and document the limitation rather than
guessing.

## Completion Criteria

- Provider setup absence produces explicit unavailable/configuration-pending
  responses and never triggers mock behavior.
- OTP, bank-account, consent, ownership, expiry, attempt-limit, and
  provider-status rules are tested without exposing sensitive data.
- Payment initiation, recipient QR, demo/mesh payment surfaces, fake ledger
  behavior, and fake transaction history are disabled; auth and general APIs
  continue to work.
- The frontend communicates actual provider status or unavailability and makes
  no fake payment, QR, balance, offline-queue, or transaction-success claims.
- README onboarding documents the exact environment-variable names implemented,
  provider setup, test/production separation, eligibility prerequisites, and
  unsupported capabilities.
- Targeted and full Maven tests and Expo web/Android exports are validated.

