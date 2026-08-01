import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const readSource = (path) =>
  readFileSync(
    new URL(path, `file:///${projectRoot.replaceAll("\\", "/")}/`),
    "utf8",
  );

const types = readSource("src/types/assignment.ts");
const form = readSource(
  "src/pages/teacher/components/AssignmentForm.tsx",
);
const preview = readSource(
  "src/pages/teacher/components/AssignmentPreview.tsx",
);
const documentRenderer = readSource(
  "src/pages/teacher/components/StructuredAssignmentDocument.tsx",
);
const page = readSource("src/pages/teacher/TeacherAssignmentsPage.tsx");

const checks = [];
const verify = (name, assertion) => {
  assertion();
  checks.push(name);
};

verify("assignment API types expose format and safe block payloads", () => {
  assert.match(
    types,
    /interface AssignmentBlockResponse[\s\S]*blockType: AssessmentBlockType/,
  );
  assert.match(types, /position: number/);
  assert.match(types, /content: EditorDocument \| null/);
  assert.match(types, /file: FileMetadata \| null/);
  assert.match(types, /assignmentItemId: number \| null/);
  assert.match(
    types,
    /interface AssignmentDetailResponse[\s\S]*documentFormat: AssessmentDocumentFormat[\s\S]*blocks: AssignmentBlockResponse\[\]/,
  );
  assert.match(
    types,
    /interface AssignmentListResponse[\s\S]*documentFormat: AssessmentDocumentFormat/,
  );
});

verify("create form loads every published assessment without snapshot edits", () => {
  assert.match(form, /status: "PUBLISHED"/);
  assert.match(form, /assessmentId: Number\(assessmentId\)/);
  assert.match(form, /legacy and structured assessments are both available/);
  assert.match(form, /Snapshot content is created when the assignment is published/);
  assert.doesNotMatch(form, /AssignmentBlockResponse/);
  assert.doesNotMatch(form, /blocks:/);
});

verify("preview routes structured and legacy formats independently", () => {
  assert.match(preview, /documentFormat === "STRUCTURED_V1"/);
  assert.match(preview, /documentFormat === "LEGACY"/);
  assert.match(preview, /<StructuredAssignmentDocument blocks=\{blocks\} items=\{items\}/);
  assert.match(preview, /<RichTextRenderer value=\{content\}/);
  assert.match(preview, /sortedItems\.map/);
  assert.match(preview, /structured snapshot will be available after this assignment is published/);
});

verify("all structured block types have explicit read-only renderers", () => {
  for (const blockType of [
    "RICH_TEXT",
    "IMAGE",
    "AUDIO",
    "QUESTION",
    "DIVIDER",
    "PAGE_BREAK",
  ]) {
    assert.match(documentRenderer, new RegExp(`case "${blockType}"`));
  }
  assert.match(documentRenderer, /StructuredRichTextRenderer value=\{block\.content\}/);
  assert.match(documentRenderer, /<img[\s\S]*src=\{block\.file\.url\}/);
  assert.match(documentRenderer, /<audio[\s\S]*controls[\s\S]*src=\{block\.file\.url\}/);
  assert.match(documentRenderer, /role="separator"/);
  assert.doesNotMatch(documentRenderer, /<input/);
  assert.doesNotMatch(documentRenderer, /<textarea/);
  assert.doesNotMatch(documentRenderer, /onChange=/);
});

verify("block ordering and Question snapshot linkage are deterministic", () => {
  assert.match(
    documentRenderer,
    /\.sort\(\(left, right\) => left\.position - right\.position\)/,
  );
  assert.match(documentRenderer, /new Map\(items\.map\(\(item\) => \[item\.id, item\]\)\)/);
  assert.match(documentRenderer, /itemsById\.get\(block\.assignmentItemId\)/);
  assert.match(documentRenderer, /Question snapshot is unavailable/);
});

verify("teacher page forwards structured response fields to preview", () => {
  assert.match(page, /assignment\.documentFormat === "STRUCTURED_V1"/);
  assert.match(page, /documentFormat=\{previewAssignment\.documentFormat\}/);
  assert.match(page, /blocks=\{previewAssignment\.blocks\}/);
});

for (const name of checks) {
  console.log(`PASS ${name}`);
}
console.log(`\n${checks.length} teacher structured Assignment checks passed.`);
