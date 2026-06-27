# LinkedIn Auto-Post Generator

Daily AI-generated LinkedIn posts for Chandan Kushwaha, in a LinkedIn-style feed.
This covers **Phase 1 (MVP)** and **Phase 2 (reminders)** of the
[project PRD](./LinkedIn_AutoPost_PRD_Chandan.md).

## What's in Phase 1

- **AI post generator** — Gemini (`gemini-2.5-flash`) writes a personalized post using Chandan's real profile, projects, and metrics.
- **Topic rotation** — one of seven topic categories per day of week (Career, Tech Deep Dive, Project Story, etc.).
- **LinkedIn-style 3-column UI** — profile sidebar, center feed, stats/streak sidebar. Built with Tailwind in LinkedIn's palette.
- **Persistent history** — posts saved to `localStorage`, survive refresh.
- **Post status** — `pending` → `posted`, with timestamps.
- **One-click post** — opens LinkedIn's compose window pre-filled (no API approval needed for MVP).
- **Copy to clipboard** — on every card.
- **Auto-generate** — today's post is created automatically on first load if it doesn't exist.

## What's in Phase 2

- **Settings modal** — email address, daily reminder time, reminder/push toggles, topic relevance filters. Saved to `localStorage`.
- **Best-time algorithm** — recommends an optimal posting slot by day of week (Tue–Thu peak; 8–9 AM / 5–6 PM IST), shown in the sidebar and settings.
- **Email reminders** — EmailJS sends a daily "your post is ready" email with a preview and best-time note. Includes a test-send button.
- **Browser push notifications** — permission prompt + "time to post" notification as an email backup.
- **Daily scheduler** — while the app is open, fires the reminder once per day at the chosen time.

## Setup

```bash
npm install
cp .env.local.example .env.local   # then add your Anthropic API key
npm run dev
```

Open http://localhost:3000.

Get an API key free at https://aistudio.google.com/apikey. Without it, the app
loads but post generation returns a friendly error.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm start` — run the production build
- `npm run lint` — lint

## Project structure

```
src/
  app/
    api/generate/route.js   # Gemini post-generation endpoint
    layout.js               # root layout + fonts
    page.js                 # main feed page (client)
    globals.css             # Tailwind + LinkedIn palette
  components/
    TopNav.js
    ProfileSidebar.js       # left column — Chandan's profile
    StatsSidebar.js         # right column — stats, streak, best time, tips
    PostCard.js             # post display + actions (copy/post)
    PostSkeleton.js         # loading state
    SettingsModal.js        # reminder settings (email, time, push, topics)
    Icons.js
  lib/
    profile.js              # Chandan's profile + topic rotation
    storage.js              # localStorage helpers for posts
    settings.js             # localStorage helpers for settings
    bestTime.js             # best posting-time recommendation
    reminders.js            # EmailJS + browser notifications
    useReminderScheduler.js # daily reminder scheduler hook
```

## Notes

- **Security:** dependencies pin Next.js 14.2.35 (latest stable v14). A few
  remaining advisories are only patched in Next 16, a breaking major upgrade.
  They concern image optimization, middleware, and self-hosted RSC features
  this app does not use. Revisit when upgrading to Next 16.
- **Posting:** Phase 1 uses LinkedIn's pre-filled compose window. The full
  OAuth one-click publish lands in Phase 3.
- **Email reminders:** EmailJS keys are optional. Without them the app works
  fully, but the "Send test email" button and scheduled emails are disabled
  (push notifications still work). EmailJS public keys are safe to expose, which
  is why they use the `NEXT_PUBLIC_` prefix.
- **Scheduler limitation:** the daily reminder fires only while the app tab is
  open. True background scheduling (server cron) comes with the backend in a
  later phase.

## What is done so far

- Phase 1 ✅ MVP — AI post generator, LinkedIn-style UI, topic rotation, persistent history
- Phase 2 ✅ Reminders — email, push notifications, best-time algorithm, settings modal
- Phase 3 ✅ LinkedIn OAuth — one-click publish with image upload
- Phase 4 ✅ Trending — GitHub/HN/dev.to/npm scanner, breaking news mode
- Phase 5 ✅ Algorithm Intelligence Layer — see below
- Phase 6 🔜 Growth Dashboard — newsletter, strategic commenting, opportunity tracking

## What is in Phase 5 — Algorithm Intelligence Layer

- **AI Humanizer layer** — second Gemini pass injects Chandan real voice, projects, and metrics to bypass LinkedIn AI-detection penalty (-30% reach, -55% engagement). One-click Humanize button on every post.
- **Depth Score optimizer** — real-time score (0-100) measuring post length, structure, closing question, and Save CTA. Shows improvement tips inline.
- **PDF Carousel generator** — Gemini generates multi-slide content, html2canvas + jsPDF builds a branded 1080x1350px PDF. 6.6% avg engagement vs 2% for text.
- **Format rotation logic** — automatically alternates text > carousel > poll to avoid LinkedIn 20% consecutive-format penalty.
- **Follower growth CTA rotation** — every 7th generated post auto-appends a strategic follower nudge line.
- **Golden Hour engagement assistant** — 90-minute countdown timer activates after posting with milestone alerts (T+0, T+30, T+60, T+90 min) + 3 copy-paste reply templates.
- **Topic DNA tracker** — sidebar panel showing posts per topic in last 30 days, authority levels, and 14-day gap warnings.
- **Pre-post comment seeding** — add trusted developer friends once, get personalized DM templates to send 10 min before posting.
- **LinkedIn Profile SEO Auditor** — one-time audit: optimized 150+ char headline, About opener, missing recruiter keywords, top 3 skills to pin.
- **Opportunity Tracker** — log recruiter DMs, freelance inquiries, collaborations, speaking invites; monthly ROI dashboard.