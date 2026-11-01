# Recruiter Bot

A simple backend API that stores candidates and job openings in SQLite and ranks matches using skills, experience, culture keywords, and availability.

## Requirements

- Node.js (LTS recommended)
- npm

## Setup

```bash
npm install
npm start
```

The server runs at:

```text
http://localhost:3000
```

The SQLite database (`recruiter.db`) and its tables are created automatically when the server starts. The sample candidates and jobs are seeded automatically if the tables are empty.

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Check whether the API is running |
| GET | `/candidates` | List all candidates |
| GET | `/jobs` | List all jobs |
| GET | `/candidates/:id` | Get one candidate |
| GET | `/jobs/:id` | Get one job |
| GET | `/jobs/:id/matches` | Rank candidates for a job |
| GET | `/candidates/:id/matches` | Rank jobs for a candidate |
| POST | `/ingest` | Add or update candidates and jobs |

## Matching score

The matching score uses the following weighted components:

- Required skill overlap: 70 points
- Experience: 20 points
- Culture keyword overlap: 10 points
- Availability: a small bonus or penalty

The API also returns matched skills, missing skills, eligibility against minimum experience, and a short explanation of the score.

## Example ingestion request

Send a POST request to `http://localhost:3000/ingest` with JSON:

```json
{
  "candidates": [
    {
      "name": "Alex",
      "skills": ["research", "public-speaking"],
      "experience": 5,
      "availability": "Immediate",
      "traits": ["curious", "organized"],
      "quirk": "Enjoys solving difficult problems."
    }
  ],
  "jobs": [
    {
      "title": "Research Engineer",
      "requiredSkills": ["research", "public-speaking"],
      "minExperience": 2,
      "cultureKeywords": ["curious"],
      "tagline": "Turn questions into answers."
    }
  ]
}
```

## Notes

- This is a small demonstration backend; it does not include a frontend or authentication.
- Matching weights are intentionally simple and can be adjusted in `server.js`.
- The database file is generated locally and should not be committed.
