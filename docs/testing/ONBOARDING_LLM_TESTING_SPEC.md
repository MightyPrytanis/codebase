# Onboarding LLM Provider Testing Specification

**Version:** 1.0  
**Created:** 2025-12-21  
**Status:** Active Testing Guide

## Overview

This document specifies the end-to-end testing requirements for the LLM provider testing functionality in the LexFiat onboarding wizard. The implementation uses server-side API keys from `.env` to test provider connectivity without exposing keys to the frontend.

## Test Environment Setup

### Prerequisites
- Cyrano HTTP bridge running on port 5002 (or configured `VITE_CYRANO_API_URL`)
- `.env` file in `Cyrano/` directory with API keys:
  - `PERPLEXITY_API_KEY` (valid and funded) ✅ **Primary test target**
  - `OPENAI_API_KEY` (may be valid but unfunded)
  - `ANTHROPIC_API_KEY` (may be valid but unfunded)
  - Other provider keys as available

### Test Data
- Valid Perplexity key (funded account) - **Primary success case**
- Invalid/missing keys - **Error handling cases**
- Unfunded but valid keys - **Credit error cases**

---

## Test Cases

### TC-1: Perplexity Provider Test (Success Path)

**Objective:** Verify that Perplexity provider test succeeds when API key is valid and funded.

**Preconditions:**
- `PERPLEXITY_API_KEY` is set in `.env` and is valid/funded
- Cyrano HTTP bridge is running
- User is on onboarding Step 5 (AI Provider)

**Test Steps:**
1. Navigate to `/onboarding` in LexFiat
2. Complete Steps 1-4 (or skip to Step 5 if testing in isolation)
3. On Step 5, select **Perplexity** from LLM Provider options
4. Click **"Test API Connection"** button
5. Observe loading state (spinner, "Testing Connection..." text)
6. Wait for test to complete (should take 2-5 seconds)

**Expected Results:**
- ✅ Loading indicator appears immediately
- ✅ Test completes within 5 seconds
- ✅ Success message appears: "API connection successful!" (green background, CheckCircle icon)
- ✅ `llmTestResult` state is set to `'success'`
- ✅ Button remains enabled but shows success state
- ✅ User can proceed to next step (Next button enabled)

**Backend Verification:**
- `POST /api/onboarding/test-llm-provider` receives `{ provider: 'perplexity' }`
- `AIService.call('perplexity', testPrompt, ...)` executes successfully
- Response: `{ success: true, provider: 'perplexity', message: '...' }`
- HTTP 200 status

**Acceptance Criteria:**
- [ ] Test completes successfully
- [ ] Success UI state displays correctly
- [ ] No console errors
- [ ] Network request succeeds (check DevTools Network tab)
- [ ] User can proceed to Step 6

---

### TC-2: Perplexity Provider Test (Network Error)

**Objective:** Verify graceful error handling when Cyrano server is unreachable.

**Preconditions:**
- Cyrano HTTP bridge is **not running** or unreachable
- User is on onboarding Step 5

**Test Steps:**
1. Stop Cyrano HTTP bridge (or block port 5002)
2. Navigate to `/onboarding` Step 5
3. Select **Perplexity** provider
4. Click **"Test API Connection"**

**Expected Results:**
- ✅ Loading indicator appears
- ✅ Test completes (does not hang indefinitely)
- ✅ Error message appears: "Connection failed. Please check your API key." (red background, AlertCircle icon)
- ✅ `llmTestResult` state is set to `'error'`
- ✅ User can retry the test
- ✅ Console shows network error (for debugging, not user-facing)

**Acceptance Criteria:**
- [ ] Error state displays correctly
- [ ] No unhandled exceptions or crashes
- [ ] User can retry after fixing network issue
- [ ] Error message is user-friendly (not technical stack trace)

---

### TC-3: Provider Selection Without Test

**Objective:** Verify that provider can be selected and onboarding can proceed without testing (optional step).

**Preconditions:**
- User is on onboarding Step 5

**Test Steps:**
1. Select **Perplexity** (or any provider)
2. **Do not** click "Test API Connection"
3. Click **"Next"** button

**Expected Results:**
- ✅ Next button is enabled (provider selection is sufficient)
- ✅ User can proceed to Step 6
- ✅ No error or warning about untested provider
- ✅ Onboarding continues normally

**Acceptance Criteria:**
- [ ] Provider selection alone allows progression
- [ ] No blocking validation errors
- [ ] User experience is smooth

---

### TC-4: Invalid/Missing Provider Key (Backend Error)

**Objective:** Verify error handling when provider key is missing or invalid in `.env`.

**Preconditions:**
- Provider key is missing from `.env` or is invalid
- Cyrano HTTP bridge is running
- User is on onboarding Step 5

**Test Steps:**
1. Remove or invalidate provider key in `.env` (e.g., set `PERPLEXITY_API_KEY=invalid_key`)
2. Restart Cyrano HTTP bridge (if needed to reload env)
3. Navigate to `/onboarding` Step 5
4. Select the provider with invalid key
5. Click **"Test API Connection"**

**Expected Results:**
- ✅ Loading indicator appears
- ✅ Test completes (does not hang)
- ✅ Error message appears: "Connection failed. Please check your API key." (red background)
- ✅ `llmTestResult` state is set to `'error'`
- ✅ Backend logs error: `Error testing LLM provider: ...`
- ✅ HTTP 400 response with `{ success: false, provider: '...', error: '...' }`

**Acceptance Criteria:**
- [ ] Error state displays correctly
- [ ] Backend returns appropriate error message
- [ ] User can retry after fixing `.env` configuration
- [ ] Error message is clear but not exposing sensitive details

---

### TC-5: Unfunded Provider Account (Credit Error)

**Objective:** Verify error handling when provider key is valid but account has no credits.

**Preconditions:**
- Provider key is valid but account is unfunded (e.g., OpenAI, Anthropic)
- Cyrano HTTP bridge is running
- User is on onboarding Step 5

**Test Steps:**
1. Navigate to `/onboarding` Step 5
2. Select provider with unfunded account (e.g., **OpenAI** or **Anthropic**)
3. Click **"Test API Connection"**

**Expected Results:**
- ✅ Loading indicator appears
- ✅ Test completes
- ✅ Error message appears (may be provider-specific, e.g., "Insufficient credits" or generic "Connection failed")
- ✅ `llmTestResult` state is set to `'error'`
- ✅ Backend logs provider-specific error from API

**Acceptance Criteria:**
- [ ] Error state displays correctly
- [ ] Error message is informative (ideally mentions credits if provider API returns that)
- [ ] User understands they need to fund the account
- [ ] No crashes or unhandled exceptions

---

### TC-6: Multiple Provider Tests (Sequential)

**Objective:** Verify that user can test multiple providers in sequence.

**Preconditions:**
- Multiple provider keys are configured (at least Perplexity)
- User is on onboarding Step 5

**Test Steps:**
1. Select **Perplexity**, click "Test API Connection" → Should succeed
2. Select **OpenAI**, click "Test API Connection" → May fail (unfunded)
3. Select **Anthropic**, click "Test API Connection" → May fail (unfunded)
4. Select **Perplexity** again, click "Test API Connection" → Should succeed again

**Expected Results:**
- ✅ Each test runs independently
- ✅ State updates correctly for each provider
- ✅ Previous test results don't interfere with new tests
- ✅ UI reflects current provider's test status

**Acceptance Criteria:**
- [ ] Each test completes independently
- [ ] State management is correct (no stale results)
- [ ] UI updates reflect current selection

---

### TC-7: Rapid Click Prevention (Button State)

**Objective:** Verify that rapid clicking doesn't cause multiple simultaneous requests.

**Preconditions:**
- User is on onboarding Step 5
- Provider is selected

**Test Steps:**
1. Select **Perplexity**
2. Rapidly click **"Test API Connection"** button 5+ times
3. Observe behavior

**Expected Results:**
- ✅ Button is disabled during test (`disabled={testingLLM || !formData.llmApiKey}`)
- ✅ Only one network request is made (check DevTools Network tab)
- ✅ Loading state persists until test completes
- ✅ No duplicate success/error messages

**Acceptance Criteria:**
- [ ] Button is properly disabled during test
- [ ] Only one API call is made
- [ ] No race conditions or duplicate state updates

---

### TC-8: Provider Selection Change During Test

**Objective:** Verify behavior when user changes provider while test is in progress.

**Preconditions:**
- User is on onboarding Step 5

**Test Steps:**
1. Select **Perplexity**
2. Click **"Test API Connection"** (test starts)
3. While test is running, change selection to **OpenAI**
4. Observe behavior

**Expected Results:**
- ✅ Test continues (does not cancel mid-flight)
- ✅ When test completes, result applies to the provider that was selected when test started
- ✅ OR: Test is cancelled and new provider's test starts (implementation-dependent)
- ✅ No crashes or state inconsistencies

**Acceptance Criteria:**
- [ ] Behavior is consistent and predictable
- [ ] No state corruption
- [ ] User experience is clear

---

## Integration Test Scenarios

### IT-1: Full Onboarding Flow with LLM Test

**Objective:** Verify complete onboarding flow including successful LLM test.

**Test Steps:**
1. Start fresh onboarding session
2. Complete Step 1: Select jurisdiction and practice areas
3. Complete Step 2: Add counties and courts
4. Complete Step 3: Select issue tags
5. Complete Step 4: Configure storage (optional)
6. Complete Step 5: Select Perplexity, test connection (should succeed), proceed
7. Complete Step 6: Configure time tracking
8. Submit onboarding

**Expected Results:**
- ✅ All steps complete successfully
- ✅ LLM test succeeds on Step 5
- ✅ `llmProviderTested: true` is saved in practice profile
- ✅ Onboarding completion redirects to dashboard
- ✅ No errors in console or network

---

### IT-2: Onboarding with Failed LLM Test

**Objective:** Verify that onboarding can complete even if LLM test fails.

**Test Steps:**
1. Start fresh onboarding session
2. Complete Steps 1-4
3. On Step 5: Select provider with invalid/missing key
4. Click "Test API Connection" → Should fail
5. Click "Next" anyway (provider selected, test failed)
6. Complete Step 6
7. Submit onboarding

**Expected Results:**
- ✅ User can proceed despite failed test
- ✅ `llmProviderTested: false` is saved in practice profile
- ✅ Onboarding completes successfully
- ✅ Dashboard loads normally

---

## Performance Benchmarks

### Response Time Targets
- **Perplexity test (success):** < 5 seconds
- **Perplexity test (error):** < 3 seconds
- **Network error detection:** < 2 seconds

### Resource Usage
- API call should use minimal tokens (16 maxTokens in test prompt)
- No memory leaks from repeated tests
- Network requests are properly cleaned up

---

## Error Message Requirements

### User-Facing Messages
- **Success:** "API connection successful!" (green, CheckCircle icon)
- **Error (generic):** "Connection failed. Please check your API key." (red, AlertCircle icon)
- **Loading:** "Testing Connection..." with spinner

### Backend Error Handling
- Network errors → Generic user message (don't expose internal details)
- Invalid key → Generic user message
- Unfunded account → Generic user message (or provider-specific if API returns clear message)
- Server errors → Generic user message

---

## Browser/Environment Testing

### Supported Browsers
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

### Network Conditions
- Normal connection
- Slow 3G (simulate throttling)
- Offline (verify graceful degradation)

---

## Regression Testing Checklist

After any changes to onboarding or LLM testing:

- [ ] TC-1: Perplexity success path still works
- [ ] TC-2: Network error handling still works
- [ ] TC-4: Invalid key error handling still works
- [ ] IT-1: Full onboarding flow still works
- [ ] Button states and loading indicators work correctly
- [ ] No console errors or warnings
- [ ] No TypeScript/linter errors

---

## Test Execution Log

**Date:** _______________  
**Tester:** _______________  
**Environment:** Development / Staging / Production

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC-1: Perplexity Success | ⬜ Pass / ⬜ Fail | |
| TC-2: Network Error | ⬜ Pass / ⬜ Fail | |
| TC-3: Selection Without Test | ⬜ Pass / ⬜ Fail | |
| TC-4: Invalid Key | ⬜ Pass / ⬜ Fail | |
| TC-5: Unfunded Account | ⬜ Pass / ⬜ Fail | |
| TC-6: Multiple Providers | ⬜ Pass / ⬜ Fail | |
| TC-7: Rapid Click | ⬜ Pass / ⬜ Fail | |
| TC-8: Provider Change During Test | ⬜ Pass / ⬜ Fail | |
| IT-1: Full Flow Success | ⬜ Pass / ⬜ Fail | |
| IT-2: Full Flow with Failed Test | ⬜ Pass / ⬜ Fail | |

---

## Future Testing (Other Providers)

When other providers are funded/configured, repeat TC-1, TC-4, TC-5 for:
- OpenAI
- Anthropic
- Google (Gemini)
- xAI (Grok)
- DeepSeek
- OpenRouter

---

**Copyright © 2025 Cognisint LLC**  
Licensed under the Apache License, Version 2.0

)
)
)
)
)
)
)
)
)
)