---
name: Beta Test Support
description: Comprehensive beta testing support skill for Cyrano Pathfinder - handles registration, onboarding, installation, evaluation, and feedback management for beta testers
version: 1.0.0
domain: beta-testing
proficiency: ['beta-testing', 'onboarding', 'installation-support', 'feedback-management']
stability: beta

# Contract definition
input_schema:
  type: object
  required: ['action', 'user_query']
  properties:
    action:
      type: string
      enum: ['registration', 'onboarding', 'installation', 'evaluation', 'feedback', 'walkthrough', 'troubleshooting']
      description: The type of beta test support needed
    user_query:
      type: string
      description: User's question or issue description
    context:
      type: object
      description: Additional context (invitation_token, user_id, step, error_message, etc.)
      properties:
        invitation_token:
          type: string
          description: Invitation token for registration
        user_id:
          type: string
          description: Beta tester user ID
        step:
          type: string
          description: Current step in onboarding/installation process
        error_message:
          type: string
          description: Error message if troubleshooting
        feedback_type:
          type: string
          enum: ['bug', 'feature-request', 'general', 'praise']
          description: Type of feedback being submitted

output_schema:
  type: object
  properties:
    response:
      type: string
      description: Helpful response to the user's query
    next_steps:
      type: array
      items:
        type: object
        properties:
          step: string
          description: string
          action_url: string
      description: Next steps in the process
    resources:
      type: array
      items:
        type: object
        properties:
          title: string
          url: string
          description: string
      description: Relevant documentation or resources
    resolved:
      type: boolean
      description: Whether the issue was resolved
    escalation_needed:
      type: boolean
      description: Whether human support is needed

side_effects:
  reads:
    - 'beta_tester_registry'
    - 'invitation_database'
    - 'feedback_database'
    - 'installation_logs'
  writes:
    - 'beta_tester_registry'
    - 'feedback_database'
    - 'support_tickets'

usage_policy:
  should_call_when:
    - 'User asks about beta testing registration or invitation'
    - 'User needs help with installation or setup'
    - 'User has questions about the beta test process'
    - 'User wants to submit feedback or report issues'
    - 'User needs troubleshooting assistance'
    - 'User asks "how do I..." related to beta testing'
  should_not_call_when:
    - 'User is asking about production features unrelated to beta testing'
    - 'User is already a registered beta tester asking about app features'
  requires_context:
    - 'portal_context' # Must be called from beta portal

error_modes:
  - code: 'INVALID_INVITATION'
    description: Invitation token is invalid or expired
    recoverable: true
  - code: 'INSTALLATION_FAILED'
    description: Installation process failed
    recoverable: true
  - code: 'ALREADY_REGISTERED'
    description: User is already registered as beta tester
    recoverable: true
  - code: 'FEEDBACK_SUBMISSION_FAILED'
    description: Feedback submission failed
    recoverable: true

# Workflow binding
workflow_id: 'beta-test:beta-test-support-v1'
engine: 'mae'

# Knowledge scoping
knowledge_scope:
  per_skill:
    - 'beta-test-onboarding-guide'
    - 'beta-test-installation-guide'
    - 'beta-test-feedback-process'
  shared:
    - 'cyrano-architecture'
    - 'lexfiat-overview'
    - 'arkiver-overview'

# Resources
resources:
  - 'docs/guides/BETA_TEST_ONBOARDING_GUIDE.md'
  - 'docs/guides/BETA_TEST_INSTALLATION_GUIDE.md'
  - 'docs/guides/BETA_TEST_FEEDBACK_PROCESS.md'

# Prompts
prompts:
  - 'When helping with registration, guide user through single-email-link setup process'
  - 'For installation issues, provide step-by-step troubleshooting with clear actions'
  - 'For feedback, collect structured information (type, description, steps to reproduce)'
  - 'Always be encouraging and supportive - beta testers are valuable partners'
  - 'If issue cannot be resolved automatically, create support ticket with all context'

# Checklist
checklist:
  - 'Verify invitation token is valid'
  - 'Check if user is already registered'
  - 'Guide through installation steps'
  - 'Collect feedback in structured format'
  - 'Log all interactions for improvement'
---

# Beta Test Support Skill

## Purpose

This skill provides comprehensive support for beta testers throughout their entire journey - from invitation to feedback submission. It enables Cyrano Pathfinder to assist with registration, onboarding, installation, evaluation, and feedback management.

## Capabilities

### 1. Registration Support
- Validate invitation tokens
- Guide through account creation
- Handle invitation expiration/renewal
- Verify email and set up credentials

### 2. Onboarding Assistance
- Walk through beta test process
- Explain what to expect
- Set up initial configuration
- Guide through first steps

### 3. Installation Support
- Provide step-by-step installation instructions
- Troubleshoot installation errors
- Verify system requirements
- Test installation success

### 4. Evaluation Guidance
- Explain evaluation criteria
- Guide through testing scenarios
- Help with feature discovery
- Provide testing tips

### 5. Feedback Management
- Collect structured feedback
- Categorize feedback (bug, feature request, general, praise)
- Submit feedback to database
- Acknowledge receipt and follow-up

### 6. Process Walkthrough
- Explain beta test timeline
- Describe feedback submission process
- Outline evaluation expectations
- Provide contact information

### 7. Troubleshooting
- Diagnose common issues
- Provide solutions for known problems
- Escalate complex issues
- Track resolution

## Usage Examples

### Registration
**User:** "I received an invitation email. How do I get started?"

**Skill Response:**
1. Validate invitation token
2. Guide through account creation
3. Provide installation link
4. Set expectations for next steps

### Installation
**User:** "Installation failed with error: 'Module not found'"

**Skill Response:**
1. Diagnose the error
2. Provide specific fix steps
3. Verify system requirements
4. Test installation after fix

### Feedback
**User:** "I found a bug where the dashboard doesn't load on mobile"

**Skill Response:**
1. Collect structured feedback:
   - Type: bug
   - Description: Dashboard doesn't load on mobile
   - Steps to reproduce
   - Expected vs actual behavior
2. Submit to feedback database
3. Acknowledge receipt
4. Provide ticket number for tracking

## Integration

This skill integrates with:
- **Beta Portal:** Embedded in cognisint.com/beta portal
- **Cyrano Pathfinder:** Available as skill overlay
- **Feedback Database:** Submits structured feedback
- **Support System:** Creates tickets when escalation needed

## Success Metrics

- 95%+ of registration issues resolved automatically
- 90%+ of installation issues resolved without human support
- 100% of feedback collected in structured format
- Average resolution time < 5 minutes
- Beta tester satisfaction > 4.5/5
