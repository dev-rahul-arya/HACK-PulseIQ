# PulseIQ Health Intelligence

PulseIQ is a personal health co-pilot that aggregates your health data to provide actionable insights, weekly stories, and gentle nudges. It uses AI (Claude) to analyze cross-signal patterns in your sleep, resting heart rate, HRV, and activity to help you understand your health better.

## Features

- **Daily Insights:** AI-generated personalized observations based on your last 24 hours of health data.
- **Weekly Stories:** A reflective summary of your week's health trends.
- **Timeline & Metrics:** Visualize your health data over time with interactive charts.
- **Privacy-First:** Utilizes local storage (IndexedDB via Dexie) for fast, secure on-device data management.
- **PWA Support:** Installable as a Progressive Web App for a native-like experience.

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS, Framer Motion
- **State Management:** Zustand
- **Database:** Dexie (IndexedDB)
- **Charts:** Recharts
- **AI Integration:** Anthropic Claude API (proxied via Vite for local dev)

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm or pnpm

### Installation

1. Clone the repository and navigate to the `app` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Copy `.env.example` to `.env.local` and add your Anthropic API key.
   ```bash
   cp .env.example .env.local
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure
- `src/components/`: Reusable UI components and feature-specific views.
- `src/data/`: Sample data for testing and demonstration.
- `src/db/`: Dexie database schema and queries.
- `src/services/`: External integrations (AI, notifications, profile).
- `src/store/`: Zustand global state management.
- `src/utils/`: Helper functions for calculations and formatting.
