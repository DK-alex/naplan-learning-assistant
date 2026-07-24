export const SUMMARY_CRITERION_KEYS = [
  "ideas",
  "text_structure",
  "vocabulary",
  "sentence_structure",
  "punctuation",
  "spelling",
];

function generatedAtValue(record) {
  const value = new Date(record?.generated_at).getTime();
  return Number.isFinite(value) ? value : 0;
}

function hasNumericScore(record) {
  return Number.isInteger(record?.report?.total_score);
}

export function getLatestWritingReportSummary(reports) {
  const ordered = (Array.isArray(reports) ? reports : [])
    .filter((record) => record?.report && generatedAtValue(record) > 0)
    .sort((left, right) => generatedAtValue(right) - generatedAtValue(left));

  const latest = ordered[0];
  if (!latest) return null;

  const report = latest.report;
  const previousComparable = ordered.slice(1).find((record) => (
    hasNumericScore(record)
    && hasNumericScore(latest)
    && record.report.genre === report.genre
    && record.report.maximum_score === report.maximum_score
  ));
  const criteria = SUMMARY_CRITERION_KEYS
    .map((key) => report.criteria?.find((criterion) => criterion.key === key))
    .filter(Boolean);
  const scorePercent = hasNumericScore(latest) && report.maximum_score > 0
    ? Math.round((report.total_score / report.maximum_score) * 100)
    : 0;

  return {
    record: latest,
    report,
    criteria,
    scorePercent,
    previousComparable,
    scoreDelta: previousComparable
      ? report.total_score - previousComparable.report.total_score
      : null,
  };
}
