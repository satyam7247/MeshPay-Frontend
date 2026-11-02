# Project-wide code review checklist

Frontend JavaScript source files: 30 / 30 inspected (53 total src files including assets)

- [x] `src\components\NetworkDiagram.js`
- [x] `src\components\UI.js`
- [x] `src\context\AppContext.js`
- [x] `src\navigation\AppNavigator.js`
- [x] `src\screens\Screens.js`
- [x] `src\services\accountLockLocalService.js`
- [x] `src\services\apiClient.js`
- [x] `src\services\authService.js`
- [x] `src\services\bankAccountsService.js`
- [x] `src\services\contactsService.js`
- [x] `src\services\deviceIdentityService.js`
- [x] `src\services\meshService.js`
- [x] `src\services\notificationsService.js`
- [x] `src\services\passwordService.js`
- [x] `src\services\paymentsService.js`
- [x] `src\services\preferencesService.js`
- [x] `src\services\privacyAccountCacheService.js`
- [x] `src\services\privacyAccountService.js`
- [x] `src\services\recipientApiService.js`
- [x] `src\services\recipientCacheRepository.js`
- [x] `src\services\recipientLookupService.js`
- [x] `src\services\recipientModels.js`
- [x] `src\services\transactionsService.js`
- [x] `src\theme\colors.js`

- [x] `src\components\UpiIntentButton.js`
- [x] `src\services\upiIntentService.js`
- [x] `src\services\openLocalDatabase.js`
- [x] `src\services\offlineTransactionLedgerService.js`
- [x] `src\services\notificationsApiService.js`
- [x] `src\services\accountDeletionService.js`

Backend source/resource/test files: 127 / 127 inspected

- [x] `src\test\resources\mockito-extensions\org.mockito.plugins.MockMaker`
- [x] `src\test\java\com\demo\upimesh\service\TrustedDeviceSchemaMigrationTest.java`
- [x] `src\test\java\com\demo\upimesh\service\AccountDeletionServiceTest.java`
- [x] `src\test\java\com\demo\upimesh\PaymentNotificationIntegrationTest.java`
- [x] `src\test\java\com\demo\upimesh\controller\DemoDashboardApiTest.java`
- [x] `src\test\java\com\demo\upimesh\controller\BackendLandingControllerTest.java`
- [x] `src\test\java\com\demo\upimesh\config\SecurityRouteAuthorizationTest.java`
- [x] `src\main\java\com\demo\upimesh\config\NotificationAsyncConfig.java`
- [x] `src\main\java\com\demo\upimesh\dto\OfflineTransactionSyncResponse.java`
- [x] `src\main\java\com\demo\upimesh\dto\OfflineTransactionSyncRequest.java`
- [x] `src\main\java\com\demo\upimesh\dto\NotificationDtos.java`
- [x] `src\main\java\com\demo\upimesh\controller\AccountDeletionController.java`
- [x] `src\test\java\com\demo\upimesh\model\AccountDeletionRequestRepositoryTest.java`
- [x] `src\main\java\com\demo\upimesh\controller\OfflineTransactionSyncController.java`
- [x] `src\main\java\com\demo\upimesh\controller\NotificationController.java`
- [x] `src\main\java\com\demo\upimesh\model\AccountDeletionOtpChallengeRepository.java`
- [x] `src\main\java\com\demo\upimesh\model\AccountDeletionOtpChallenge.java`
- [x] `src\main\java\com\demo\upimesh\model\AccountDeletionRequest.java`
- [x] `src\main\java\com\demo\upimesh\model\AccountDeletionRequestRepository.java`
- [x] `src\main\java\com\demo\upimesh\model\UserNotificationRepository.java`
- [x] `src\main\java\com\demo\upimesh\model\UserNotification.java`
- [x] `src\main\java\com\demo\upimesh\model\OfflineTransactionLogRepository.java`
- [x] `src\main\java\com\demo\upimesh\model\OfflineTransactionLog.java`
- [x] `src\main\java\com\demo\upimesh\model\NotificationPushTokenRepository.java`
- [x] `src\main\java\com\demo\upimesh\model\NotificationPushToken.java`
- [x] `src\main\java\com\demo\upimesh\service\ExpoPushService.java`
- [x] `src\main\java\com\demo\upimesh\service\AccountDeletionService.java`
- [x] `src\main\java\com\demo\upimesh\service\NotificationService.java`
- [x] `src\main\java\com\demo\upimesh\service\NotificationDeliveryService.java`
- [x] `src\main\java\com\demo\upimesh\service\NotificationCreatedEvent.java`
- [x] `src\main\java\com\demo\upimesh\service\OfflineTransactionSyncService.java`
- [x] `src\main\java\com\demo\upimesh\service\PaymentSettledEvent.java`
- [x] `src\main\java\com\demo\upimesh\service\TrustedDeviceSchemaMigration.java`
- [x] `src\main\java\com\demo\upimesh\service\SettlementNotificationListener.java`

- [x] `src\main\java\com\demo\upimesh\config\AppConfig.java`
- [x] `src\main\java\com\demo\upimesh\config\SecurityConfig.java`
- [x] `src\main\java\com\demo\upimesh\config\SessionTokenFilter.java`
- [x] `src\main\java\com\demo\upimesh\controller\AccountDataController.java`
- [x] `src\main\java\com\demo\upimesh\controller\ApiController.java`
- [x] `src\main\java\com\demo\upimesh\controller\ApiExceptionHandler.java`
- [x] `src\main\java\com\demo\upimesh\controller\AuthController.java`
- [x] `src\main\java\com\demo\upimesh\controller\BackendLandingController.java`
- [x] `src\main\java\com\demo\upimesh\controller\BankAccountController.java`
- [x] `src\main\java\com\demo\upimesh\controller\DashboardController.java`
- [x] `src\main\java\com\demo\upimesh\controller\DemoDashboardController.java`
- [x] `src\main\java\com\demo\upimesh\controller\HealthController.java`
- [x] `src\main\java\com\demo\upimesh\controller\IntegrationStatusController.java`
- [x] `src\main\java\com\demo\upimesh\controller\PasswordController.java`
- [x] `src\main\java\com\demo\upimesh\controller\PaymentsController.java`
- [x] `src\main\java\com\demo\upimesh\controller\PrivacyAccountController.java`
- [x] `src\main\java\com\demo\upimesh\controller\RecipientController.java`
- [x] `src\main\java\com\demo\upimesh\crypto\HybridCryptoService.java`
- [x] `src\main\java\com\demo\upimesh\crypto\ServerKeyHolder.java`
- [x] `src\main\java\com\demo\upimesh\dto\BankAccountDtos.java`
- [x] `src\main\java\com\demo\upimesh\model\Account.java`
- [x] `src\main\java\com\demo\upimesh\model\AccountRepository.java`
- [x] `src\main\java\com\demo\upimesh\model\AppSession.java`
- [x] `src\main\java\com\demo\upimesh\model\AppSessionRepository.java`
- [x] `src\main\java\com\demo\upimesh\model\AppUser.java`
- [x] `src\main\java\com\demo\upimesh\model\AppUserRepository.java`
- [x] `src\main\java\com\demo\upimesh\model\BankAccount.java`
- [x] `src\main\java\com\demo\upimesh\model\BankAccountRepository.java`
- [x] `src\main\java\com\demo\upimesh\model\BankOtpChallenge.java`
- [x] `src\main\java\com\demo\upimesh\model\BankOtpChallengeRepository.java`
- [x] `src\main\java\com\demo\upimesh\model\MeshPacket.java`
- [x] `src\main\java\com\demo\upimesh\model\PasswordChallenge.java`
- [x] `src\main\java\com\demo\upimesh\model\PasswordChallengeRepository.java`
- [x] `src\main\java\com\demo\upimesh\model\PaymentInstruction.java`
- [x] `src\main\java\com\demo\upimesh\model\PrivacySettingsMarker.java`
- [x] `src\main\java\com\demo\upimesh\model\RecipientDataSource.java`
- [x] `src\main\java\com\demo\upimesh\model\RecipientLookupStatus.java`
- [x] `src\main\java\com\demo\upimesh\model\RecipientVerificationStatus.java`
- [x] `src\main\java\com\demo\upimesh\model\SavedRecipient.java`
- [x] `src\main\java\com\demo\upimesh\model\SavedRecipientRepository.java`
- [x] `src\main\java\com\demo\upimesh\model\Transaction.java`
- [x] `src\main\java\com\demo\upimesh\model\TransactionRepository.java`
- [x] `src\main\java\com\demo\upimesh\model\TrustedDevice.java`
- [x] `src\main\java\com\demo\upimesh\model\TrustedDeviceRepository.java`
- [x] `src\main\java\com\demo\upimesh\service\AccountAggregatorService.java`
- [x] `src\main\java\com\demo\upimesh\service\AuthService.java`
- [x] `src\main\java\com\demo\upimesh\service\BalanceEnquiryService.java`
- [x] `src\main\java\com\demo\upimesh\service\BankAccountService.java`
- [x] `src\main\java\com\demo\upimesh\service\BankDataEncryptionService.java`
- [x] `src\main\java\com\demo\upimesh\service\BankOtpService.java`
- [x] `src\main\java\com\demo\upimesh\service\BankVerificationService.java`
- [x] `src\main\java\com\demo\upimesh\service\BrevoEmailService.java`
- [x] `src\main\java\com\demo\upimesh\service\BridgeIngestionService.java`
- [x] `src\main\java\com\demo\upimesh\service\DemoRecipientLookupProvider.java`
- [x] `src\main\java\com\demo\upimesh\service\DemoService.java`
- [x] `src\main\java\com\demo\upimesh\service\IdempotencyService.java`
- [x] `src\main\java\com\demo\upimesh\service\IntegrationStatusService.java`
- [x] `src\main\java\com\demo\upimesh\service\MeshSimulatorService.java`
- [x] `src\main\java\com\demo\upimesh\service\MobileNumberNormalizer.java`
- [x] `src\main\java\com\demo\upimesh\service\OfflinePaymentPolicy.java`
- [x] `src\main\java\com\demo\upimesh\service\PasswordService.java`
- [x] `src\main\java\com\demo\upimesh\service\PaymentService.java`
- [x] `src\main\java\com\demo\upimesh\service\PaymentWebhookVerifier.java`
- [x] `src\main\java\com\demo\upimesh\service\PrivacyAccountService.java`
- [x] `src\main\java\com\demo\upimesh\service\QRCodeService.java`
- [x] `src\main\java\com\demo\upimesh\service\RecipientLookupProvider.java`
- [x] `src\main\java\com\demo\upimesh\service\RecipientPhoneIndexBackfill.java`
- [x] `src\main\java\com\demo\upimesh\service\RecipientRateLimiter.java`
- [x] `src\main\java\com\demo\upimesh\service\RecipientService.java`
- [x] `src\main\java\com\demo\upimesh\service\SessionTokenService.java`
- [x] `src\main\java\com\demo\upimesh\service\SettlementService.java`
- [x] `src\main\java\com\demo\upimesh\service\SmsProviderService.java`
- [x] `src\main\java\com\demo\upimesh\service\TransactionService.java`
- [x] `src\main\java\com\demo\upimesh\service\TrustedDeviceService.java`
- [x] `src\main\java\com\demo\upimesh\service\TwilioVerifySmsProviderService.java`
- [x] `src\main\java\com\demo\upimesh\service\VirtualDevice.java`
- [x] `src\main\java\com\demo\upimesh\UpiMeshApplication.java`
- [x] `src\main\resources\application.properties`
- [x] `src\main\resources\templates\dashboard.html`
- [x] `src\test\java\com\demo\upimesh\config\CorsConfigurationTest.java`
- [x] `src\test\java\com\demo\upimesh\controller\BankAccountControllerTest.java`
- [x] `src\test\java\com\demo\upimesh\IdempotencyConcurrencyTest.java`
- [x] `src\test\java\com\demo\upimesh\service\BankAccountServiceTest.java`
- [x] `src\test\java\com\demo\upimesh\service\BankDataEncryptionServiceTest.java`
- [x] `src\test\java\com\demo\upimesh\service\BankOtpServiceTest.java`
- [x] `src\test\java\com\demo\upimesh\service\BankVerificationServiceTest.java`
- [x] `src\test\java\com\demo\upimesh\service\MobileNumberNormalizerTest.java`
- [x] `src\test\java\com\demo\upimesh\service\OfflinePaymentPolicyTest.java`
- [x] `src\test\java\com\demo\upimesh\service\PasswordServiceTest.java`
- [x] `src\test\java\com\demo\upimesh\service\PrivacyAccountServiceTest.java`
- [x] `src\test\java\com\demo\upimesh\service\TrustedDeviceServiceTest.java`
- [x] `src\test\java\com\demo\upimesh\service\TwilioVerifySmsProviderServiceTest.java`
- [x] `src\test\resources\application.properties`

Build/config/docs reviewed: frontend `package.json`, `package-lock.json`, `app.json`, `app.config.js`, `metro.config.js`, `.env.example`, `.gitignore`, `README.md`; backend `pom.xml`, Maven wrapper config/scripts, `application.properties`, test properties, `.env.example` (key names/placeholders only), `.gitignore`, `README.md`, `MOBILE_API.md`, and `PASSWORD_API.md`.

## Review results

### Fixes applied

- Login now serializes trusted-device registration and retries only the specific concurrent device-key conflict; duplicate-account errors no longer mislabel unrelated database conflicts.
- Signup registers its first trusted device inside the same transaction as user creation, preventing the new user from being invisible to a separate transaction.
- Added a safe startup migration for the legacy trusted-device owner-only unique key; it now allows each account to register multiple devices.
- Fixed the JPA `LockModeType` package reference that failed a clean backend build.
- Escaped API-provided values before dashboard `innerHTML` rendering and validated bridge-node IDs, hop counts, and packet DTO fields.
- Auth screen status-bar style now follows the selected theme.
- Corrected stale README/API claims about camera scanning, Setu consent endpoints, database defaults, and OTP expiry.
- Configured Mockito's test-only subclass mock maker to avoid Java 25 inline class-redefinition errors.

### Validation

- Backend full test suite: 79 tests, 0 failures, 0 errors, 0 skipped; test DB is isolated H2.
- Account deletion regression suite: 16 tests pass, including push-token revocation.
- Frontend `npm ls --depth=0`: all direct dependencies resolve.
- `npx expo export --platform web`: web bundle exported successfully (779 modules). Metro exited only after being manually stopped post-export.
- Live Expo dev server at `localhost:8081`: HTML and web bundle returned HTTP 200; JS bundle MIME is `application/javascript`.
- Frontend configured API target `http://192.168.102.63:8080`: `/api/health` returned 200 and browser CORS preflight returned 200 for `http://localhost:8081`.
- Live Spring Boot JAR restarted on port 8080 and connected to configured MySQL. `/`, `/api/health`, and `/api/integrations/status` returned 200; unauthenticated `/api/auth/me`, notifications, transactions, payments, and bank-account routes returned 401.
- Database preservation: live app uses MySQL with `ddl-auto=update`; automated tests use separate H2 `create-drop`. No user tables or rows were dropped.
- Native device visual testing and real two-account settlement could not be completed in this environment; CUA browser host was unavailable and no approved PSP/Bluetooth hardware flow is configured.

### Remaining production limitation

- Payments and QR settlement require approved PSP/acquirer onboarding and verified webhooks. The app must not describe a UPI intent dispatch or Bluetooth receipt as settled money.
- Native Bluetooth mesh hardware/module is absent from this Expo build; current mesh UI reports unavailable and local logs are not settlement records.
- Cashfree Secure ID needs approved credentials/server allowlisting; Account Aggregator production approval and consent flow are pending.
- Expo push delivery requires EAS project credentials and a native device build. Brevo email is configured for development and has not been live-validated. WhatsApp Cloud API is not implemented.
- Browser SQLite preview uses session-only in-memory storage in development; durable offline persistence is supported on native SQLite. Production web persistence still depends on browser OPFS permissions.
- A visual browser check and two registered-account end-to-end transfer test remain unverified. No live transfer should be attempted until PSP approval and a controlled test setup exist.