# SwiftBoost Digital

## Overview

SwiftBoost Digital is a comprehensive SaaS platform offering over 37 AI-powered tools designed to assist businesses with marketing, content creation, and strategic planning. The platform features a 4-tier subscription model (Free, Core, Pro, Pro+) to cater to diverse user needs, including advanced "Intelligence Suite" tools for high-tier users. Key capabilities include AI-driven content generation, automated social media posting across multiple platforms, and intelligent cold email campaigns. The project aims to provide a robust, scalable, and production-ready solution for businesses seeking to leverage AI for growth and efficiency, with a clear monetization strategy.

## User Preferences

I prefer concise and direct communication. When making changes or suggesting improvements, please prioritize efficiency and scalability. I appreciate an iterative development approach where major changes are discussed before implementation. Please ensure that all new features integrate seamlessly with the existing architecture and maintain the established coding standards. Do not make changes to the folder `swift-digital/middleware` or any file within it, as this contains the core tier system logic.

## System Architecture

SwiftBoost Digital is built with a clear separation of concerns, featuring a frontend, backend, AI integration layer, and a robust database.

**UI/UX Decisions:**
- **Frontend:** HTML5, CSS3, and Vanilla JavaScript for performance and flexibility.
- **Themes:** 7 complete themes, including an exclusive "PRO+ gold theme," allowing for instant theme switching.
- **Responsiveness:** Mobile-first design ensures optimal viewing across devices.
- **Navigation:** Hamburger menu, 7 category pages, and 40+ individual tool pages with smart back button navigation.
- **User Experience:** Professional compact UI, copy-to-clipboard functionality, real-time location detection, smooth transitions, progress indicators, and clear error handling.
- **Analytics:** Chart.js for visualizing activity, reach, engagement, and conversion metrics.

**Technical Implementations:**
- **Tier System:** A 4-tier subscription model (Free, Core, Pro, Pro+) with dedicated middleware (`swift-digital/middleware/tierMiddleware.js`) for access control and credit limits. Contextual upgrade prompts are displayed for locked features.
- **Authentication:** Supabase Auth for email/password registration, secure login, session management, and support for multiple business profiles.
- **Automation:**
    - **Social Media Posting:** AI-generated content with a 10-minute scheduler, Supabase file uploads, and connections to Instagram, Facebook, TikTok, and LinkedIn.
    - **Cold Email Automation:** AI-powered email generation using Groq, a 10-minute scheduler, and Resend API integration for delivery.
- **AI Integration:**
    - **Primary Model:** Groq llama-3.1-8b-instant for fast, efficient generation.
    - **Fallback:** OpenRouter gpt-4o-mini for redundancy.
    - **Advanced Tools:** PRO+ tools utilize enhanced prompts with detailed JSON format specifications.
    - **Location Awareness:** GPS coordinates (latitude/longitude), city, and country data integrated into AI analysis for geo-targeted results.

**Feature Specifications:**
- **Tool Pages:** Each of the 37+ AI tools has its own dedicated page.
- **PRO+ Intelligence Suite:** 6 exclusive tools providing advanced analytics like Competitor Intelligence, Multi-Channel Campaign Planning, Forecasting, Deep SEO Intelligence, Opportunity Scanning, and Enhanced Business Strategy.

**System Design Choices:**
- **Backend:** Express.js (Node.js) with 25+ route modules for modularity.
- **Schedulers:** 10-minute schedulers for both social media posting and cold email automation, managed by dedicated backend workers.
- **Data Persistence:** Supabase (PostgreSQL) as the cloud database, with SQLite for local development. Supabase Storage is used for media file uploads.
- **API Design:** Multi-endpoint support for different AI generation tasks (`/api/generate`, `/api/generatePost`, `/api/generateEmail`).

## External Dependencies

- **AI Services:**
    - **Groq API:** Primary AI content generation and processing.
    - **OpenRouter:** AI fallback service.
- **Database & Storage:**
    - **Supabase:** Cloud PostgreSQL database, authentication (Supabase Auth), and file storage (Supabase Storage).
- **Email Service:**
    - **Resend API:** For reliable automated email delivery in cold email campaigns.
- **Payment Processing:**
    - **Stripe SDK:** Integrated for optional payment processing.
- **Analytics Visualization:**
    - **Chart.js:** Used for rendering analytics charts on the frontend.