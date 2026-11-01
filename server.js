// RecruiterFlow - simple recruiter matching API
// Install: npm install express better-sqlite3
// Run:     node server.js
// Open:    http://localhost:3000
//
// Uses SQLite with hand-written SQL (no ORM). Data is stored in recruiter.db.

const express = require("express");
const Database = require("better-sqlite3");

const app = express();
app.use(express.json());

const db = new Database("recruiter.db");

// ---------- Database schema (raw SQL) ----------
db.exec(`
  CREATE TABLE IF NOT EXISTS candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    skills TEXT NOT NULL,
    experience INTEGER NOT NULL,
    availability TEXT NOT NULL,
    traits TEXT NOT NULL,
    quirk TEXT
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL UNIQUE,
    required_skills TEXT NOT NULL,
    min_experience INTEGER NOT NULL,
    culture_keywords TEXT NOT NULL,
    tagline TEXT
  );
`);

// ---------- Seed data ----------
const candidates = [
  {
    name: "Sherlock H.",
    skills: ["deduction", "pattern-recognition", "forensics"],
    experience: 8, availability: "Immediate",
    traits: ["analytical", "blunt"],
    quirk: "Solves problems by eliminating the impossible; occasionally insufferable in standups."
  },
  {
    name: "Hermione G.",
    skills: ["research", "time-management", "public-speaking"],
    experience: 4, availability: "2 weeks",
    traits: ["detail-oriented", "overachiever"],
    quirk: "Reads the entire documentation before writing a single line of code."
  },
  {
    name: "Tony S.",
    skills: ["systems-design", "rapid-prototyping", "leadership"],
    experience: 12, availability: "Not looking",
    traits: ["confident", "innovative"],
    quirk: "Ships an MVP overnight, refuses to write tests."
  },
  {
    name: "Leslie K.",
    skills: ["project-management", "stakeholder-management", "public-speaking"],
    experience: 6, availability: "Immediate",
    traits: ["tenacious", "organized"],
    quirk: "Has a binder for everything, including the binder."
  },
  {
    name: "Ron S.",
    skills: ["woodworking", "minimalism", "negotiation"],
    experience: 15, availability: "Not looking",
    traits: ["stubborn", "principled"],
    quirk: "Refuses to use more than one monitor."
  },
  {
    name: "Rick S.",
    skills: ["systems-design", "rapid-prototyping", "chemistry"],
    experience: 20, availability: "Immediate",
    traits: ["genius", "reckless"],
    quirk: "Solution works, mechanism deeply concerning."
  },
  {
    name: "Elle W.",
    skills: ["persuasion", "research", "public-speaking"],
    experience: 3, availability: "Immediate",
    traits: ["optimistic", "sharp"],
    quirk: "Underestimates in every standup, correct in every retro."
  },
  {
    name: "MacGyver",
    skills: ["rapid-prototyping", "resourcefulness", "chemistry", "systems-design"],
    experience: 10, availability: "2 weeks",
    traits: ["calm", "improviser"],
    quirk: "Fixes production outages with duct tape and a paperclip metaphor."
  },
  {
    name: "Sheldon C.",
    skills: ["theoretical-analysis", "pattern-recognition", "research"],
    experience: 9, availability: "Immediate",
    traits: ["rigid", "brilliant"],
    quirk: "Correct 95% of the time, insufferable 100% of the time."
  },
  {
    name: "Katniss E.",
    skills: ["precision", "strategy", "crisis-management"],
    experience: 5, availability: "Immediate",
    traits: ["resilient", "decisive"],
    quirk: "Excellent under pressure, terrible with public speaking."
  },
  {
    name: "Michael S.",
    skills: ["sales", "public-speaking", "team-building"],
    experience: 11, availability: "Not looking",
    traits: ["enthusiastic", "chaotic"],
    quirk: "World's best boss, according to a mug he bought himself."
  },
  {
    name: "Olivia P.",
    skills: ["crisis-management", "negotiation", "strategy", "leadership"],
    experience: 13, availability: "2 weeks",
    traits: ["decisive", "intense"],
    quirk: "Handles it. Whatever it is."
  },
  {
    name: "Ted L.",
    skills: ["team-building", "optimism", "mentorship", "public-speaking"],
    experience: 7, availability: "Immediate",
    traits: ["empathetic", "persistent"],
    quirk: "Turns every technical setback into a folksy metaphor."
  },
  {
    name: "Miranda P.",
    skills: ["leadership", "negotiation", "stakeholder-management", "precision"],
    experience: 18, availability: "Not looking",
    traits: ["demanding", "decisive"],
    quirk: "Reviews every PR personally. Says nothing. Everyone panics."
  },
  {
    name: "Dwight S.",
    skills: ["sales", "negotiation", "security", "loyalty"],
    experience: 9, availability: "Immediate",
    traits: ["intense", "loyal"],
    quirk: "Assistant to the regional backend engineer."
  }
];

const jobs = [
  {
    title: "Backend Detective",
    requiredSkills: ["deduction", "pattern-recognition", "forensics"],
    minExperience: 3,
    cultureKeywords: ["analytical", "autonomous"],
    tagline: "We have a bug. We have no leads. We have you."
  },
  {
    title: "Rapid Prototyping Engineer",
    requiredSkills: ["rapid-prototyping", "systems-design"],
    minExperience: 2,
    cultureKeywords: ["innovative", "fast-paced"],
    tagline: "Ship first, document never (kidding — please document)."
  },
  {
    title: "Developer Relations Lead",
    requiredSkills: ["public-speaking", "research"],
    minExperience: 2,
    cultureKeywords: ["energetic", "curious"],
    tagline: "Explain complex things to confused humans, cheerfully."
  },
  {
    title: "Engineering Manager, Chaos Team",
    requiredSkills: ["team-building", "stakeholder-management", "leadership"],
    minExperience: 5,
    cultureKeywords: ["empathetic", "organized"],
    tagline: "Herd cats. The cats are senior engineers."
  },
  {
    title: "Incident Commander",
    requiredSkills: ["crisis-management", "strategy", "negotiation"],
    minExperience: 4,
    cultureKeywords: ["decisive", "calm-under-pressure"],
    tagline: "3am page. You're the one who picks up."
  },
  {
    title: "Sales Engineer",
    requiredSkills: ["sales", "public-speaking"],
    minExperience: 3,
    cultureKeywords: ["enthusiastic", "persistent"],
    tagline: "Sell the vision, then go build it."
  }
];

// Insert seed data only if tables are empty.
function seedDatabase() {
  const candidateCount = db.prepare("SELECT COUNT(*) AS count FROM candidates").get().count;
  const jobCount = db.prepare("SELECT COUNT(*) AS count FROM jobs").get().count;

  if (candidateCount === 0) {
    const insertCandidate = db.prepare(`
      INSERT INTO candidates (name, skills, experience, availability, traits, quirk)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertMany = db.transaction((items) => {
      for (const c of items) {
        insertCandidate.run(
          c.name, JSON.stringify(c.skills), c.experience, c.availability,
          JSON.stringify(c.traits), c.quirk
        );
      }
    });
    insertMany(candidates);
  }

  if (jobCount === 0) {
    const insertJob = db.prepare(`
      INSERT INTO jobs (title, required_skills, min_experience, culture_keywords, tagline)
      VALUES (?, ?, ?, ?, ?)
    `);
    const insertMany = db.transaction((items) => {
      for (const j of items) {
        insertJob.run(
          j.title, JSON.stringify(j.requiredSkills), j.minExperience,
          JSON.stringify(j.cultureKeywords), j.tagline
        );
      }
    });
    insertMany(jobs);
  }
}
seedDatabase();

// ---------- Helpers ----------
function parseCandidate(row) {
  return {
    ...row,
    skills: JSON.parse(row.skills),
    traits: JSON.parse(row.traits)
  };
}

function parseJob(row) {
  return {
    ...row,
    requiredSkills: JSON.parse(row.required_skills),
    cultureKeywords: JSON.parse(row.culture_keywords)
  };
}

function getCandidate(id) {
  const row = db.prepare("SELECT * FROM candidates WHERE id = ?").get(id);
  return row ? parseCandidate(row) : null;
}

function getJob(id) {
  const row = db.prepare("SELECT * FROM jobs WHERE id = ?").get(id);
  return row ? parseJob(row) : null;
}

// Score is out of 100:
// 70 points = required skill overlap
// 20 points = experience (full points at/above minimum)
// 10 points = matching culture keywords
// Availability is a small tie-breaker. Candidates below the minimum experience
// are marked ineligible and receive a lower score.
function matchCandidateToJob(candidate, job) {
  const candidateSkills = candidate.skills.map(s => s.toLowerCase());
  const matchedSkills = job.requiredSkills.filter(
    skill => candidateSkills.includes(skill.toLowerCase())
  );

  const skillScore = (matchedSkills.length / job.requiredSkills.length) * 70;
  const experienceEligible = candidate.experience >= job.min_experience;
  const experienceScore = experienceEligible
    ? 20
    : 20 * (candidate.experience / job.min_experience) * 0.5;

  const candidateTraits = candidate.traits.map(t => t.toLowerCase());
  const cultureMatches = job.cultureKeywords.filter(keyword => {
    const normalized = keyword.toLowerCase().replace(/-/g, " ");
    return candidateTraits.some(trait =>
      trait.toLowerCase().replace(/-/g, " ").includes(normalized) ||
      normalized.includes(trait.toLowerCase().replace(/-/g, " "))
    );
  });
  const cultureScore = (cultureMatches.length / job.cultureKeywords.length) * 10;

  let availabilityBonus = 0;
  if (candidate.availability.toLowerCase() === "immediate") availabilityBonus = 3;
  else if (candidate.availability.toLowerCase() === "2 weeks") availabilityBonus = 1;
  else availabilityBonus = -5;

  const score = Math.max(0, Math.min(100,
    skillScore + experienceScore + cultureScore + availabilityBonus
  ));

  const reasons = [
    `${matchedSkills.length}/${job.requiredSkills.length} required skills match`,
    experienceEligible
      ? `${candidate.experience} years meets the ${job.min_experience}-year minimum`
      : `${candidate.experience} years is below the ${job.min_experience}-year minimum`,
    cultureMatches.length
      ? `Culture match: ${cultureMatches.join(", ")}`
      : "No direct culture-keyword match",
    `Availability: ${candidate.availability}`
  ];

  return {
    candidateId: candidate.id,
    candidateName: candidate.name,
    jobId: job.id,
    jobTitle: job.title,
    score: Math.round(score * 10) / 10,
    eligible: experienceEligible,
    matchedSkills,
    missingSkills: job.requiredSkills.filter(s => !matchedSkills.includes(s)),
    cultureMatches,
    reasons
  };
}

function matchJobToCandidate(job, candidate) {
  const result = matchCandidateToJob(candidate, job);
  return {
    jobId: job.id,
    jobTitle: job.title,
    score: result.score,
    eligible: result.eligible,
    matchedSkills: result.matchedSkills,
    missingSkills: result.missingSkills,
    reasons: result.reasons
  };
}

// ---------- API routes ----------

// Basic check that the server is running.
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "RecruiterFlow API is running" });
});

// Ingestion endpoint: accepts optional candidates/jobs arrays.
// Existing records are kept; new records are inserted or updated by name/title.
app.post("/ingest", (req, res) => {
  const incomingCandidates = req.body.candidates || [];
  const incomingJobs = req.body.jobs || [];

  const insertCandidate = db.prepare(`
    INSERT INTO candidates (name, skills, experience, availability, traits, quirk)
    VALUES (@name, @skills, @experience, @availability, @traits, @quirk)
    ON CONFLICT(name) DO UPDATE SET
      skills=excluded.skills, experience=excluded.experience,
      availability=excluded.availability, traits=excluded.traits, quirk=excluded.quirk
  `);

  const insertJob = db.prepare(`
    INSERT INTO jobs (title, required_skills, min_experience, culture_keywords, tagline)
    VALUES (@title, @required_skills, @min_experience, @culture_keywords, @tagline)
    ON CONFLICT(title) DO UPDATE SET
      required_skills=excluded.required_skills,
      min_experience=excluded.min_experience,
      culture_keywords=excluded.culture_keywords,
      tagline=excluded.tagline
  `);

  try {
    const saveAll = db.transaction(() => {
      for (const c of incomingCandidates) {
        if (!c.name || !Array.isArray(c.skills) || !Number.isFinite(Number(c.experience))) {
          throw new Error("Each candidate needs name, skills array and experience number");
        }
        insertCandidate.run({
          name: c.name,
          skills: JSON.stringify(c.skills),
          experience: Number(c.experience),
          availability: c.availability || "Unknown",
          traits: JSON.stringify(c.traits || []),
          quirk: c.quirk || ""
        });
      }

      for (const j of incomingJobs) {
        if (!j.title || !Array.isArray(j.requiredSkills) || !Number.isFinite(Number(j.minExperience))) {
          throw new Error("Each job needs title, requiredSkills array and minExperience number");
        }
        insertJob.run({
          title: j.title,
          required_skills: JSON.stringify(j.requiredSkills),
          min_experience: Number(j.minExperience),
          culture_keywords: JSON.stringify(j.cultureKeywords || []),
          tagline: j.tagline || ""
        });
      }
    });
    saveAll();
    res.json({
      message: "Ingestion successful",
      candidatesReceived: incomingCandidates.length,
      jobsReceived: incomingJobs.length
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// List all candidates.
app.get("/candidates", (req, res) => {
  const rows = db.prepare("SELECT * FROM candidates ORDER BY id").all();
  res.json(rows.map(parseCandidate));
});

// List all jobs.
app.get("/jobs", (req, res) => {
  const rows = db.prepare("SELECT * FROM jobs ORDER BY id").all();
  res.json(rows.map(parseJob));
});

// Get one candidate.
app.get("/candidates/:id", (req, res) => {
  const candidate = getCandidate(Number(req.params.id));
  if (!candidate) return res.status(404).json({ error: "Candidate not found" });
  res.json(candidate);
});

// Get one job.
app.get("/jobs/:id", (req, res) => {
  const job = getJob(Number(req.params.id));
  if (!job) return res.status(404).json({ error: "Job not found" });
  res.json(job);
});

// Ranked candidates for a job.
app.get("/jobs/:id/matches", (req, res) => {
  const job = getJob(Number(req.params.id));
  if (!job) return res.status(404).json({ error: "Job not found" });

  const candidates = db.prepare("SELECT * FROM candidates").all().map(parseCandidate);
  const matches = candidates
    .map(candidate => matchCandidateToJob(candidate, job))
    .sort((a, b) => b.score - a.score);

  res.json({ job: job.title, matches });
});

// Ranked jobs for a candidate (reverse direction).
app.get("/candidates/:id/matches", (req, res) => {
  const candidate = getCandidate(Number(req.params.id));
  if (!candidate) return res.status(404).json({ error: "Candidate not found" });

  const allJobs = db.prepare("SELECT * FROM jobs").all().map(parseJob);
  const matches = allJobs
    .map(job => matchJobToCandidate(job, candidate))
    .sort((a, b) => b.score - a.score);

  res.json({ candidate: candidate.name, matches });
});

// ---------- Start server ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`RecruiterFlow API running at http://localhost:${PORT}`);
  console.log("Try GET /jobs, GET /candidates, or GET /jobs/1/matches");
});
