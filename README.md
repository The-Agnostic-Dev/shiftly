# Shiftly

Shiftly is the staff rota for the **Bukka Republic** restaurant group in Lagos (Lekki Phase 1, Ikeja GRA and Victoria Island branches). Branch managers plan the week's shifts, kitchen and floor staff check their shifts, pick up open shifts and ask to swap, and HR uses the hours page to see who worked overtime.

It is a small NestJS 11 app with server-rendered Handlebars pages and a sprinkle of vanilla JS. Data lives in a single JSON file, seeded with demo data dated around today.

## Running it

You need Node 22.

```bash
npm install
npm run build
npm run seed      # writes fresh demo data to data/shiftly.json
npm start         # http://localhost:5113
```

`npm run start:fresh` does all three in one go. If you start without seeding, the app seeds itself on first boot. Re-run `npm run seed` whenever you want the demo data back (the dates are relative to today, so last week, this week and next week always have shifts).

With Docker:

```bash
docker compose up --build    # http://localhost:5113, reseeds on every start
```

Settings (see `.env.example`):

| Variable | Default | |
| --- | --- | --- |
| `PORT` | `5113` | HTTP port |
| `SHIFTLY_DATA_FILE` | `data/shiftly.json` | Where the data file lives |

## Tests

```bash
npm test
```

Jest unit tests for the date/time/money helpers, shift form parsing and the services (hours, swaps, open shifts). The service tests run against an in-memory copy of the seed data (see `test/helpers.ts`), so they never touch your data file.

## Demo logins

Every account uses the password **`shiftly2026`**.

| Username | Who | Sees |
| --- | --- | --- |
| `manager.lekki` | Adaeze Okafor, Lekki manager | Rota (edit), swaps (approve/decline), hours, staff |
| `manager.ikeja` | Babatunde Cole, Ikeja manager | Same, for Ikeja GRA |
| `manager.vi` | Rita Etim, VI manager | Same, for Victoria Island |
| `hr.funmi` | Funmilayo Adebayo, HR officer | All branches: rota, swaps, hours; edits staff records and pay rates |
| `tunde`, `ngozi`, `chidi`, `funke`, `musa`, ... | Staff (first name, lower case) | My shifts, open shifts, swap requests, availability, branch rota |

Lekki is the busiest demo branch: Chidi Okonkwo does the overnight cleaning shifts, Ngozi Eze cannot work Sundays, Aisha Bello cannot work Wednesdays, and there are swap requests waiting for Adaeze.

## How the rota works

- **Weeks run Monday to Sunday.** "This week" is worked out in Lagos time, whatever the server clock says.
- **Shifts** have a date, a start and end time (24 hour clock) and a position. A shift can be left open (no one assigned) for staff to pick up.
- **Overnight shifts**: if the end time is at or before the start time, the shift finishes the next morning (for example 22:00 to 06:00 is 8 hours). It is listed on the day it **starts** (marked `+1` on the rota) and all of its hours count on that day and in that week, even when it finishes on a Monday morning in the next week.
- **Clashes**: nobody can be given two shifts that overlap on the same day. This applies to adding or editing a shift, taking an open shift and approving a swap.
- **Availability**: staff tick the weekdays they cannot work. A manager can still put them on those days, but the rota shows an orange "Unavailable" warning on the shift. Staff cannot take open shifts on those days.
- **Open shifts** are first come, first served. The first person to press "Take this shift" gets it; anyone after that is told it has gone.
- **Swaps**: staff ask for a swap from *My shifts* and choose a colleague at the same branch. Nothing changes until the branch manager approves it; until then the shift stays with the person who asked. A swap cannot be approved if the colleague is already working at that time. Staff can withdraw a request while it is still waiting.

## Hours and overtime

The hours page shows each person's shifts and hours for a week. **Overtime is every hour above 40 in a Monday to Sunday week**, paid at **1.5 times** the person's hourly rate (amounts in naira, to the kobo). HR keeps the hourly rates on the staff page. Managers see their own branch; HR can switch branch.

## Project layout

```
src/
  main.ts, app.module.ts     bootstrap, view engine, static files, error pages
  seed.ts                    `npm run seed`
  common/                    dates (Lagos week maths), shift times, money, flash messages, rota events
  store/                     JSON file store, types, demo seed data
  auth/                      cookie sessions, login/logout, role guard
  rota/                      weekly rota grid
  shifts/                    add/edit/remove shifts, My shifts, taking open shifts
  swaps/                     swap requests and approvals
  hours/                     weekly hours and overtime
  staff/                     staff list and HR edits
  availability/              staff availability
  activity/                  "Recent activity" feed under the rota
  views/                     Handlebars helpers
views/                       Handlebars templates (layouts/, partials/)
public/                      CSS and the small client-side script (confirm prompts, sortable tables)
test/                        Jest tests
```

Errors from form posts (for example a clash) come back as a red message at the top of the page you were on; see `common/html-exception.filter.ts`.
