# Attendance Tracker

React + TypeScript time tracking app with Tailwind CSS and Vite.

## Project Structure

```
src/
  components/
    calendar/      # CalendarView, DayRow, WeekSummary, TimeSpanVisual
    editing/       # EditDayModal, TimestampInput
    settings/      # SettingsModal, RawDataEditorModal
    tracking/      # StartStopButton, CurrentSession, LunchButtons
    ValidationBanner.tsx
  context/
    AttendanceContext.tsx  # Main state + actions for time tracking
    SettingsContext.tsx    # Work hours settings
  hooks/
    useMonthData.ts        # Month-specific calculations
  pages/
    HomePage.tsx           # Main view with routing
  utils/
    calculations.ts        # Time/hour calculations
    czechHolidays.ts       # Public holiday detection
    storage.ts             # localStorage persistence
    validation.ts          # Entry validation
  constants/index.ts       # Thresholds, defaults, colors
  types/index.ts           # TypeScript types
```

## Key Constants

- `WEEKLY_TARGET_HOURS`: 30h
- `SPECIAL_DAY_HOURS`: 6h (sick/vacation/holiday credit)
- `DEFAULT_DAILY_WORK_HOURS`: 8h
- `MAX_ENTRIES_PER_DAY`: 10

## Data Storage

localStorage keys:
- `attendance-tracker-data`: Time entries by date
- `attendance-tracker-settings`: Work hours config

## Commands

```bash
pnpm dev      # Start dev server
pnpm build    # Production build
pnpm lint     # Run ESLint
```

## Notes

- Czech public holidays are auto-detected
- Half-day sick/vacation credits 3h
- Validation prevents overlapping entries and unclosed sessions
