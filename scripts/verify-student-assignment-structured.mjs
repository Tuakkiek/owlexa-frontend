import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const readSource = (path) =>
  readFileSync(
    new URL(path, `file:///${projectRoot.replaceAll("\\", "/")}/`),
    "utf8",
  );

const types = readSource("src/types/submission.ts");
const page = readSource(
  "src/pages/student/StudentSubmissionAttemptPage.tsx",
);
const renderer = readSource(
  "src/features/assignment-document/StructuredSubmissionDocument.tsx",
);
const navigation = readSource(
  "src/pages/student/structuredAssignmentNavigation.ts",
);

const checks = [];
const verify = (name, assertion) => {
  assertion();
  checks.push(name);
};

verify("student attempt contract exposes structured blocks safely", () => {
  assert.match(
    types,
    /interface StudentAttemptDetailResponse[\s\S]*documentFormat: AssessmentDocumentFormat[\s\S]*blocks: AssignmentBlockResponse\[\]/,
  );
  const studentItem = types.match(
    /export interface StudentAttemptItemResponse \{[\s\S]*?\n\}/,
  )?.[0];
  assert.ok(studentItem);
  assert.doesNotMatch(
    studentItem,
    /isCorrect|explanation|sampleAnswer|gradingCriteria/,
  );
});

verify("navigator derives only linked Question blocks in position order", () => {
  assert.match(
    navigation,
    /\.sort\(\(left, right\) => left\.position - right\.position\)/,
  );
  assert.match(
    navigation,
    /\.filter\(\(block\) => block\.blockType === "QUESTION"\)/,
  );
  assert.match(
    navigation,
    /items\.map\(\(item\) => \[item\.assignmentItemId, item\]\)/,
  );
  assert.match(navigation, /itemsById\.get\(block\.assignmentItemId\)/);
  assert.match(navigation, /questionNumber: index \+ 1/);
});

verify("all structured blocks render at document positions", () => {
  assert.match(
    renderer,
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
    assert.match(renderer, new RegExp(`case "${blockType}"`));
  }
  assert.match(renderer, /StructuredRichTextRenderer value=\{block\.content\}/);
  assert.match(
    renderer,
    /<img[\s\S]*alt=\{block\.caption \|\| block\.file\.originalName\}/,
  );
  assert.match(renderer, /<audio[\s\S]*controls[\s\S]*src=\{block\.file\.url\}/);
  assert.match(renderer, /role="separator"/);
});

verify("Question rendering and navigation share assignmentItemId", () => {
  assert.match(
    renderer,
    /item\.assignmentItemId === currentAssignmentItemId/,
  );
  assert.match(page, /setCurrentAssignmentItemId\(assignmentItemId\)/);
  assert.match(
    page,
    /navigableQuestions\.map\(\(\{ item, questionNumber \}\)/,
  );
  assert.match(
    page,
    /navigableQuestions\[currentQuestionIndex [+-] 1\]\.item[\s\S]*\.assignmentItemId/,
  );
});

verify("answer persistence remains keyed by assignmentItemId", () => {
  assert.match(
    page,
    /submissionApi\.saveAnswers\(attempt\.id, \{[\s\S]*answers: currentAnswerRequests/,
  );
  assert.match(
    page,
    /requests\.push\(\{[\s\S]*assignmentItemId: item\.assignmentItemId/,
  );
  assert.match(
    page,
    /name=\{`answer-\$\{item\.assignmentItemId\}`\}/,
  );
  assert.doesNotMatch(
    renderer,
    /isCorrect|explanation|sampleAnswer|gradingCriteria/,
  );
});

verify("legacy attempt presentation remains on its original branch", () => {
  assert.match(page, /attempt\.documentFormat === "LEGACY"/);
  assert.match(page, /<ListeningAudioPlayer/);
  assert.match(page, /<RichTextRenderer value=\{attempt\.assignmentContent\}/);
  assert.match(
    page,
    /currentQuestionEntry\?\.questionNumber \?\?[\s\S]*currentQuestion\.displayOrder/,
  );
});

verify("structured attempt UI includes responsive accessibility hooks", () => {
  assert.match(renderer, /<article[\s\S]*aria-label=/);
  assert.match(page, /<section[\s\S]*aria-label=/);
  assert.match(page, /aria-current=\{isCurrent \? "step" : undefined\}/);
  assert.match(page, /focus-visible:ring-2/);
  assert.match(page, /scrollIntoView/);
  assert.match(renderer, /max-w-full/);
  assert.match(renderer, /className="w-full"/);
});

for (const name of checks) {
  console.log(`PASS ${name}`);
}
console.log(`\n${checks.length} student structured Assignment checks passed.`);
