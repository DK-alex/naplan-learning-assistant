export const DOMAIN_PROGRESS_KEYS = Object.freeze([
  "Writing",
  "Reading",
  "Spelling",
  "Grammar & Punctuation",
  "Numeracy",
]);

function timestamp(value) {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function validPercentage(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function practicePercentage(record, reportingArea) {
  const breakdown = validPercentage(record?.score_breakdown?.[reportingArea]?.percentage);
  if (breakdown !== null) return breakdown;

  if (record?.domain === reportingArea) {
    return validPercentage(record.percentage);
  }
  return null;
}

function latestPracticePercentage(history, domain, reportingArea) {
  const latest = (Array.isArray(history) ? history : [])
    .filter((record) => record?.domain === domain && timestamp(record.completed_at) > 0)
    .map((record) => ({ record, percentage: practicePercentage(record, reportingArea) }))
    .filter(({ percentage }) => percentage !== null)
    .sort(({ record: left }, { record: right }) => (
      timestamp(right.completed_at) - timestamp(left.completed_at)
    ))[0];
  return latest?.percentage ?? null;
}

function latestWritingPercentage(writingReports) {
  const latest = (Array.isArray(writingReports) ? writingReports : [])
    .filter((record) => (
      timestamp(record?.generated_at) > 0
      && Number.isFinite(record?.report?.total_score)
      && Number.isFinite(record?.report?.maximum_score)
      && record.report.maximum_score > 0
    ))
    .sort((left, right) => timestamp(right.generated_at) - timestamp(left.generated_at))[0];

  if (!latest) return null;
  return validPercentage(
    (latest.report.total_score / latest.report.maximum_score) * 100,
  );
}

export function calculateDomainProgress(history, writingReports) {
  return {
    Writing: latestWritingPercentage(writingReports),
    Reading: latestPracticePercentage(history, "Reading", "Reading"),
    Spelling: latestPracticePercentage(history, "Conventions of language", "Spelling"),
    "Grammar & Punctuation": latestPracticePercentage(
      history,
      "Conventions of language",
      "Grammar & Punctuation",
    ),
    Numeracy: latestPracticePercentage(history, "Numeracy", "Numeracy"),
  };
}
