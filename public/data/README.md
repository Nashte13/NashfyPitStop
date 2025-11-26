# Race Schedule Data Management

## Manual Schedule Updates

The race schedule uses a hybrid approach:
1. **Primary**: Tries to fetch from RapidAPI
2. **Fallback**: Uses manual data from `race-schedule.json` if API fails or returns invalid data

## How to Update the Schedule

Edit `race-schedule.json` to update race information manually.

### File Location
`public/data/race-schedule.json`

### Data Format

Each race should have:
```json
{
  "round": 1,
  "raceName": "Bahrain Grand Prix",
  "country": "Bahrain",
  "locality": "Sakhir",
  "date": "2025-03-02",
  "time": "15:00:00Z",
  "circuit": "Bahrain International Circuit"
}
```

### Fields Explained

- **round**: Race number in the season (1, 2, 3, etc.)
- **raceName**: Full name of the Grand Prix
- **country**: Country where the race is held
- **locality**: City/location name
- **date**: Race date in format `YYYY-MM-DD`
- **time**: Race start time in UTC format `HH:MM:SSZ`
- **circuit**: Circuit name (optional)

### Example Update

To add or update a race:
1. Open `public/data/race-schedule.json`
2. Add or modify a race object in the `races` array
3. Save the file
4. Refresh the website

### Notes

- Dates should be in `YYYY-MM-DD` format
- Times should be in UTC (`Z` at the end)
- The system automatically converts to EAT (UTC+3) for display
- Races are automatically marked as "Done" or "Upcoming" based on current date/time

