import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const readSource = (path) =>
  readFileSync(
    new URL(path, `file:///${projectRoot.replaceAll("\\", "/")}/`),
    "utf8",
  );

const sharedRenderer = readSource(
  "src/features/assignment-document/StructuredSubmissionDocument.tsx",
);
const teacherAttempt = readSource(
  "src/pages/teacher/components/TeacherSubmissionAttemptDetail.tsx",
);
const teacherReview = readSource(
  "src/pages/teacher/components/TeacherReviewDraftPanel.tsx",
);
const studentResult = readSource(
  "src/pages/student/components/StudentReleasedResult.tsx",
);
const reviewTypes = readSource("src/types/teacherReview.ts");
const submissionTypes = readSource("src/types/submission.ts");

const checks = [];
const verify = (name, assertion) => {
  assertion();
  checks.push(name);
};

verify("shared renderer preserves mixed block position context", () => {
  assert.match(
    sharedRenderer,
    /\.sort\(\(left, right\) => left\.position - right\.position\)/,
  );
  for (const blockType of [
    "RICH_TEXT",
    "IMAGE",
    "AUDIO",
    "QUESTION",
    "DIVIDER",
    "PAGE_BREAK",
  ]) {
    assert.match(sharedRenderer, new RegExp(`case "${blockType}"`));
  }
  assert.match(
    sharedRenderer,
    /items\.map\(\(item\) => \[item\.assignmentItemId, item\]\)/,
  );
  assert.match(
    sharedRenderer,
    /itemsById\.get\(block\.assignmentItemId\)/,
  );
});

verify("teacher review routes structured and legacy snapshots independently", () => {
  assert.match(teacherAttempt, /attempt\.documentFormat === "STRUCTURED_V1"/);
  assert.match(teacherAttempt, /<StructuredSubmissionDocument/);
  assert.match(teacherAttempt, /blocks=\{attempt\.blocks\}/);
  assert.match(teacherAttempt, /items=\{attempt\.items\}/);
  assert.match(
    teacherAttempt,
    /<RichTextRenderer value=\{attempt\.assignmentContent\}/,
  );
  assert.match(
    teacherAttempt,
    /renderQuestionReview\(item, item\.displayOrder\)/,
  );
});

verify("teacher answers and grading remain keyed by AssignmentItem", () => {
  assert.match(
    teacherAttempt,
    /attempt\.answers\.map\(\(answer\) => \[answer\.assignmentItemId, answer\]\)/,
  );
  assert.match(
    teacherAttempt,
    /answersByItemId\.get\(item\.assignmentItemId\)/,
  );
  assert.match(
    teacherReview,
    /assignmentItemId: item\.assignmentItemId/,
  );
  assert.match(
    teacherReview,
    /updateItem\([\s\S]*item\.assignmentItemId/,
  );
});

verify("released result contract exposes only student-safe snapshots", () => {
  assert.match(
    reviewTypes,
    /interface StudentReviewResultResponse[\s\S]*documentFormat: AssessmentDocumentFormat[\s\S]*items: StudentAttemptItemResponse\[\][\s\S]*blocks: AssignmentBlockResponse\[\][\s\S]*answers: SubmissionAnswerResponse\[\]/,
  );
  const studentItem = submissionTypes.match(
    /export interface StudentAttemptItemResponse \{[\s\S]*?\n\}/,
  )?.[0];
  assert.ok(studentItem);
  assert.doesNotMatch(
    studentItem,
    /isCorrect|explanation|sampleAnswer|gradingCriteria/,
  );
  assert.doesNotMatch(
    studentResult,
    /isCorrect|explanation|sampleAnswer|gradingCriteria/,
  );
});

verify("released structured result keeps answers and feedback in block order", () => {
  assert.match(studentResult, /result\.documentFormat === "STRUCTURED_V1"/);
  assert.match(studentResult, /blocks=\{result\.blocks\}/);
  assert.match(studentResult, /items=\{result\.items\}/);
  assert.match(
    studentResult,
    /result\.answers\.map\(\(answer\) => \[answer\.assignmentItemId, answer\]\)/,
  );
  assert.match(
    studentResult,
    /result\.essayItems\.map\(\(item\) => \[item\.assignmentItemId, item\]\)/,
  );
  assert.match(
    studentResult,
    /renderQuestionResult\(item, questionNumber\)/,
  );
});

verify("legacy released feedback presentation remains isolated", () => {
  assert.match(
    studentResult,
    /result\.essayItems[\s\S]*\.sort\(\(a, b\) => a\.displayOrder - b\.displayOrder\)/,
  );
  assert.match(studentResult, /Question \{item\.displayOrder\}/);
  assert.match(studentResult, /item\.questionTitle/);
  assert.match(studentResult, /item\.teacherComment/);
});

verify("review and result cards retain responsive accessibility hooks", () => {
  assert.match(sharedRenderer, /aria-label=\{ariaLabel\}/);
  assert.match(sharedRenderer, /max-w-full/);
  assert.match(sharedRenderer, /className="w-full"/);
  assert.match(teacherAttempt, /aria-labelledby=/);
  assert.match(studentResult, /aria-labelledby=/);
  assert.match(studentResult, /overflow-x-auto/);
});

for (const name of checks) {
  console.log(`PASS ${name}`);
}
console.log(`\n${checks.length} structured review/result checks passed.`);
