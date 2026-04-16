# Schema

### profiles
- id: uuid (pk)
- display_name: text
- strava_athlete_id: bigint (fk)
- strava_tokens: jsonb

### plans
- id: uuid (pk)
- user_id: uuid (required, fk)
- name: text (required)
- status: text (required)
- goal: text (required)
- race_type: text (required)
- target_elevation_m: integer
- current_weekly_km: numeric (required)
- race_date: date (required)
- volume_increase_pct: numeric (required)
- options: jsonb (required)
- weeks: jsonb (required)

### progress
- id: uuid (pk)
- plan_id: uuid (required, fk)
- day_key: text (required)
- completed: boolean (required)
- rating: smallint (required)
- note: text (required)
- strava_url: text (required)
- strava_activity_id: bigint (fk)
- actual_km: numeric
- description: text
- is_extra: boolean (required)
- deleted: boolean (required)

### example_plans
- id: text (pk)
- name: text (required)
- description: text (required)
- goal: text (required)
- weeks: jsonb (required)
