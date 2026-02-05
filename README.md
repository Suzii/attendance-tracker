# Attendance Tracker

A React-based time tracking application for logging work hours, managing vacation/sick days, and monitoring weekly targets. Data is stored locally in the browser.

## Features

### Time Tracking
- **Start/Stop tracking** with a single click
- **Multiple entries per day** (up to 10)
- **Lunch break insertion** (30min or 1h) to split work sessions
- **Real-time elapsed time** display while tracking

### Special Days
- **Vacation**: Full-day or half-day (AM/PM)
- **Sick days**: Full-day or half-day (AM/PM)
- **Public holidays**: Czech holidays auto-detected, extra work can be logged on top

### Calendar View
- **Month-based navigation** with URL support (`/2025/02`)
- **Visual time bars** showing when work occurred during each day
- **Weekly summaries** with color-coded status:
  - Purple: Overtime (115%+ of target)
  - Green: Met target
  - Yellow: Slightly under
  - Red: Well under target
- **Monthly totals** with progress bar

### Settings
- **Configurable daily work hours** (default: 8h)
- **Per-month overrides** for different schedules
- **Raw data editor** for fixing corrupted data

## UI Overview

| Component | Description |
|-----------|-------------|
| Start/Stop Button | Large toggle button to begin/end work sessions |
| Current Session | Shows elapsed time while tracking |
| Lunch Buttons | Quick insert 0.5h or 1h breaks |
| Day Row | Shows date, time bar visualization, total hours, and edit button |
| Week Summary | Weekly hours vs target with status color |
| Month Progress | Bottom bar showing monthly totals |
| Edit Day Modal | Full editor for time entries and special day status |
| Settings Modal | Configure work hours globally or per-month |

## Use Cases

1. **Track daily work** - Click START when you begin, STOP when done
2. **Add lunch breaks** - Use lunch buttons to split sessions
3. **Log vacation** - Edit a day and mark as vacation (full/half)
4. **Record sick time** - Mark days as sick to credit hours
5. **Review weekly progress** - Check color-coded weekly summaries
6. **Edit past entries** - Click edit on any day to modify times
7. **Adjust work hours** - Change expected hours in settings for specific months

## Tech Stack

- React 19 + TypeScript
- Tailwind CSS
- Vite
- localStorage for persistence

## Development

```bash
pnpm install
pnpm dev
```

## Deployment

Hosted on Netlify. Push to `main` to deploy.
