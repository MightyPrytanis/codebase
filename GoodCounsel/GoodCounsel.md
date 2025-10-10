# GoodCounsel Module Readme  
  
## Overview  
  
**GoodCounsel** is an indispensable core component of LexFiat, dedicated to promoting attorney health, wellness, ethical decision-making, holistic professional and personal growth.[^1]. It is built on the foundational elements of what we are now calling Cognisint, (formerly prototyped as "Annunciator") a wellness-promoting module contained within the Cyrano MCP ecosystem.  
  
As a whole, LexFiat shifts routine, mundane yet still stress-inducing tasks to automated workflows, allowing attorneys to focus on client relationships, intellectually challenging and meaningful work, professional fulfillment, and personal well-being. GoodCounsel concerns itself with the "things that matter" while the rest of LexFiat handles the "things that must be done." This functionality differentiates LexFiat from virtually any other legal-focused app on the market today. 
  
## Key Features  
  
- **Wellness Support:** Automated, context-aware reminders and prompts addressing physical, mental, and social health.  
- **Ethics & Professional Growth:** Tools for tracking ethical obligations, personal development, and reflective practice, in alignment with project-wide `ETHICS.md`.  
- **Workflow Awareness:** Integration with other LexFiat components to balance workflow and wellness in a cohesive, context-aware and mutually-reinforcing time and effort management strategy.  
- **Extensibility:** Designed so the core logic can be adapted with different interfaces (“skins”) for use in other legal, health, or professional applications.  
  
## Simulated Sample Messages from GoodCounsel

- "You've been working without a break for almost two hours. It's time to stand up, stretch, walk around, and go to the bathroom or get a drink of water. The work will be here when you get back - it's healthier and more productive to spend five minutes refreshing and refocusing now than trying to plow through it nonstop."
- "You haven't talked with Jim Hartley in over two weeks.  The hearing on his brother's estate is coming up soon, and you know how he gets nervous before hearings. A five minute phone call this afternoon may head off a panicked email over the weekend.  Should I add that to your calendar?"
- "You have a very light schedule today, but as of now, Thursday and Friday are going to be super busy.  Do you want to do a few easy things today to help you stay ahead of your calendar and not get overwhelmed at the end of the week?"
- "ICLE just announced a new seminar on QDRO preparation next month; you can attend in person or remotely. It might be good for you (and everyone else in attendance) for you to participate. You don't have anything on the calendar for that afternoon – do you want me to register you for the seminar?  There's no additional charge for ICLE partners to attend."

## Ethical Guidance  
  
GoodCounsel is governed by the principles in LexFiat’s `ETHICS.md`, prioritizing user privacy, autonomy, transparency, and sustainable professional development.  It also integrates materials from the ABA and state bar ethics rules and decisions, and may include features like gamified elements ("pop quizzes") and both quick refreshers and deep dives on various points of legal ethics.

## Attorney Wellness: An Ethical Imperative  
  
The legal profession has a well-documented history of neglecting attorney well-being, often stigmatizing vulnerability and discouraging help-seeking. Too many attorneys have endured a lower quality of life and persistent fear that seeking support might jeopardize their reputation, licensure, or advancement. This problem is rooted not in individual failing, but in institutional cultures that have often marginalized empathy and prioritized image or productivity over authentic care and interpersonal development. 
  
GoodCounsel is designed to stand firmly and unapologetically against that broken and cruel legacy; we reject the professional and institutional paradigm that punishes attorneys for being human beings, with lives, emotions, obligations, and needs outside of their jobs. We believe that attorneys deserve to be healthy humans; not coincidentally, healthy humans create better work product, and their client relationships are stronger, so everyone wins.
  
## User Confidentiality and Data Privacy  
  
Privacy and Confidentiality are foundational to GoodCounsel’s mission to create a safe space for open, honest reflection and self-care by legal professionals.  GoodCounsel employs strict end-to-end privacy for all user disclosures, and all GoodCounsel features—reminders, risk assessments, personal logs, and wellness tools—are fully private by default.    
  
Personal information provided by a user is never shared with employers, supervisors, coworkers, licensing authorities, or other third parties except when required to prevent imminent harm to the user or others, or when otherwise mandated by law.  If a mandatory disclosure or reporting scenario were to arise, a user will be clearly and promptly advised, unless doing so would itself create or heighten risk of harm.  
  
## Pathways to Help and Advocacy  
  
Beyond privacy, GoodCounsel provides practical support, offering not just emergency contacts but access to tailored professional resources, stepwise support planning, and options for private or anonymous outreach whenever needed. This approach is foundational to user trust, autonomy, and effective personal wellbeing.  
  
The module may suggest a variety of actionable pathways to help, including referrals to trusted professional support, peer and confidential legal assistance programs, stepwise wellness resources, and—where preferred—private or anonymous outreach options. The module may deliver a range of AI-powered recommendations, including:  
  
- **Contextual Resource Matching:** Suggests locally relevant, profession-appropriate counselors, peer support programs, or confidential affinity groups.  
- **Proactive Peer or Mentor Connection:** With user consent, can discreetly facilitate referral to a trusted peer, mentor, or a confidential ombudsperson.  
- **Ongoing Self-Assessment Tools:** Includes regular check-ins and helps create an actionable wellness plan, not just emergency response.  
- **Professional Navigation:** Offers stepwise, guided options for reaching out—pacing recommendations based on user readiness, offering draft communication templates, and follow-up support.  
- **True Anonymity Controls:** Where possible, enables anonymous or pseudonymous initial outreach to support networks.  
  
These pathways, combined with robust privacy practices, help GoodCounsel protect attorney autonomy while providing real support—moving beyond token gestures to compassionate, practical help. It's simply not good enough to offer a struggling user a helpline number and wish them the best: Assistance with burnout, mental health challenges, ethical dilemmas, addiction, relationships, and other wellness issues will be addressed with individualized, practical solutions.   

## Roadmap  
  
GoodCounsel is a key differentiator of LexFiat—nobody else is doing this. LexFiat's other components handle the grind (intake, email, triage, drafting, research) so attorneys can focus on the work (and life) that matters. Without GoodCounsel, LexFiat is just another law practice management app.  

Before build, refer to the Annunciator app on GitHub—it’s a context-aware reminder system that might have useful ideas or even some reusable code.  Also take a look at the “Cosmos” folder for some early work that was done on a “next action AI” system that alerts users when it’s time to follow up with a client– this is originally designed for the mortgage industry, but the concept applies here.  Both of those core functions are important to GoodCounsel. 

This is v1 of a feature that will receive additional attention (and maybe some rebranding) down the road as we expand its capabilities beyond the legal domain.  

## Integration  
  
- **Backend:** Leverages Cyrano MCP’s automation, notification, and scheduling tools for context awareness and delivery.  
- **Frontend/UI:** User experience is integrated with theLexFiat UI, and includes an adaptable widget for the LexFiat "dashboard" or "assembly line."  It is easily adaptable for inclusion with other Cyrano ecosystem apps.

  
## Usage  
  
1. Ensure Cyrano MCP is active and accessible from LexFiat.  
2. Configure GoodCounsel for desired workflows, reminders, and wellness tracking.  
3. For integration in other apps, adapt the backend API and customize UI components as needed.   
  

  
[^1]: And, when necessary, recovery. 
***  
  
