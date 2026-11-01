-- Question 1: Open jobs and their recruiters
SELECT
    job_postings.title,
    recruiters.name AS recruiter_name
FROM job_postings
JOIN recruiters
    ON job_postings.recruiter_id = recruiters.id
WHERE job_postings.status = 'open';


-- Question 2: Number of applicants who reached the Final stage for each job
SELECT
    job_postings.title,
    COUNT(DISTINCT interviews.applicant_id) AS final_applicants
FROM job_postings
LEFT JOIN interviews
    ON job_postings.id = interviews.job_posting_id
    AND interviews.stage = 'Final'
GROUP BY job_postings.id, job_postings.title;


-- Question 3: People who applied to more than one job
-- Email is converted to lowercase so different capitalization is treated
-- as the same email/person.
SELECT
    MIN(applicants.full_name) AS person_name,
    LOWER(TRIM(applicants.email)) AS email,
    COUNT(DISTINCT interviews.job_posting_id) AS number_of_jobs
FROM applicants
JOIN interviews
    ON applicants.id = interviews.applicant_id
WHERE applicants.email IS NOT NULL
  AND TRIM(applicants.email) <> ''
GROUP BY LOWER(TRIM(applicants.email))
HAVING COUNT(DISTINCT interviews.job_posting_id) > 1;


-- Question 4: Final interview conversion rate for recruiters
-- Only recruiters with at least 3 Final interviews are shown.
SELECT
    recruiters.name AS recruiter_name,
    COUNT(*) AS total_final_interviews,
    SUM(CASE WHEN interviews.outcome = 'passed' THEN 1 ELSE 0 END) AS passed,
    ROUND(
        100.0 * SUM(CASE WHEN interviews.outcome = 'passed' THEN 1 ELSE 0 END)
        / COUNT(*),
        2
    ) AS conversion_rate
FROM recruiters
JOIN job_postings
    ON recruiters.id = job_postings.recruiter_id
JOIN interviews
    ON job_postings.id = interviews.job_posting_id
WHERE interviews.stage = 'Final'
GROUP BY recruiters.id, recruiters.name
HAVING COUNT(*) >= 3;
