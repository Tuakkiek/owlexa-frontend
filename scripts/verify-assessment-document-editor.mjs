import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const readSource = (path) =>
  readFileSync(new URL(path, `file:///${projectRoot.replaceAll("\\", "/")}/`), "utf8");

const page = readSource("src/pages/teacher/StructuredAssessmentEditorPage.tsx");
const api = readSource("src/api/assessmentDocumentApi.ts");
const types = readSource("src/types/assessmentDocument.ts");
const model = readSource(
  "src/features/assessment-document/model/documentState.ts",
);
const imageEditor = readSource(
  "src/features/assessment-document/block-editor/ImageBlockEditor.tsx",
);
const audioEditor = readSource(
  "src/features/assessment-document/block-editor/AudioBlockEditor.tsx",
);
const app = readSource("src/App.tsx");
const legacyBuilder = readSource("src/pages/teacher/AssessmentBuilderPage.tsx");

const checks = [];
const verify = (name, assertion) => {
  assertion();
  checks.push(name);
};

verify("create/edit route modes and safe ID parsing", () => {
  assert.match(page, /!\/\^\[1-9\]\\d\*\$\/\.test\(value\)/);
  assert.match(page, /Number\.isSafeInteger\(parsed\)/);
  assert.match(page, /isEditMode \? null : createEmptyAssessmentDocumentState\(\)/);
  assert.match(page, /assessmentDocumentApi\.getDocument\(parsedAssessmentId\)/);
  assert.match(page, /fromAssessmentDocumentResponse\(response\)/);
});

verify("load and command race ownership", () => {
  assert.match(page, /const loadSequence = useRef\(0\)/);
  assert.match(page, /const operationSequence = useRef\(0\)/);
  assert.match(page, /const editorStateRef = useRef\(editorState\)/);
  assert.match(page, /currentSequence !== loadSequence\.current/);
  assert.match(page, /activeOperationRef\.current != null/);
  assert.match(page, /const currentState = editorStateRef\.current/);
});

verify("create, update, and server reconciliation", () => {
  assert.match(page, /toCreateAssessmentDocumentRequest\(currentState\)/);
  assert.match(page, /assessmentDocumentApi\.create\(request\)/);
  assert.match(page, /toUpdateAssessmentDocumentRequest\(currentState\)/);
  assert.match(page, /assessmentDocumentApi\.update\(/);
  assert.match(page, /markSavedAndReconcile\(response\)/);
  assert.match(page, /skipNextLoadAssessmentIdRef\.current = response\.id/);
});

verify("derived dirty state and publish preconditions", () => {
  assert.match(model, /comparableSnapshot\(snapshotFromState\(state\)\)/);
  assert.match(model, /comparableSnapshot\(state\.baseline\)/);
  assert.match(model, /toPublishAssessmentDocumentRequest/);
  assert.match(model, /isAssessmentDocumentDirty\(state\)/);
  assert.match(page, /isEditable &&\s*!isDirty &&\s*!isBusy/);
  assert.match(page, /!hasVersionConflict/);
});

verify("published and archived documents are read-only", () => {
  assert.match(
    model,
    /isAssessmentDocumentEditable[\s\S]*state\.status === "DRAFT"/,
  );
  assert.match(page, /const canMutate = isEditable && !isBusy/);
  assert.match(page, /editable=\{canMutate\}/);
  assert.match(page, /disabled=\{!canMutate\}/);
});

verify("duplicate Questions are rejected atomically", () => {
  assert.match(model, /hasQuestion\(state\.blocks, block\.questionId\)/);
  assert.match(model, /"DUPLICATE_QUESTION"/);
  assert.match(page, /let workingState = currentState/);
  assert.match(page, /workingState = result\.state/);
  assert.match(page, /replaceEditorState\(workingState\)/);
});

verify("block ordering is deterministic and immutable", () => {
  assert.match(model, /\.sort\(\(a, b\) => a\.position - b\.position\)/);
  assert.match(model, /const next = blocks\.slice\(\)/);
  assert.match(model, /next\[index\] = next\[targetIndex\]/);
});

verify("image and audio uploads own stale completion state", () => {
  for (const source of [imageEditor, audioEditor]) {
    assert.match(source, /const uploadSequence = useRef\(0\)/);
    assert.match(source, /const mountedRef = useRef\(true\)/);
    assert.match(source, /const isCurrentUpload/);
    assert.match(source, /if \(!file \|\| !editable\) return/);
    assert.match(source, /const uploadDisabled = isUploading/);
  }
});

verify("publish sends the optimistic version and reconciles read-only state", () => {
  assert.match(types, /interface PublishAssessmentDocumentRequest[\s\S]*version: number/);
  assert.match(api, /`\$\{BASE_URL\}\/\$\{assessmentId\}\/publish`/);
  assert.match(page, /toPublishAssessmentDocumentRequest\(currentState\)/);
  assert.match(page, /assessmentDocumentApi\.publish\(/);
  assert.match(page, /title: "Phát hành đề cấu trúc\?"/);
  assert.match(page, /replaceEditorState\(markSavedAndReconcile\(response\)\)/);
  assert.doesNotMatch(page, /assessmentDocumentApi\.(archive|delete)/);
});

verify("version conflicts preserve local state and offer confirmed reload", () => {
  assert.match(page, /apiError\.response\?\.status === 409/);
  assert.match(page, /ASSESSMENT_VERSION_CONFLICT/);
  assert.match(page, /setHasVersionConflict\(true\)/);
  assert.match(page, /title: "Tải phiên bản mới nhất\?"/);
  assert.match(page, /thay đổi cục bộ chưa lưu sẽ bị mất/);
  assert.match(page, /beginOperation\("reload"\)/);
  assert.match(page, /assessmentDocumentApi\.getDocument\(/);
  assert.match(page, /setHasVersionConflict\(false\)/);
});

verify("dirty navigation is protected", () => {
  assert.match(page, /window\.addEventListener\("beforeunload"/);
  assert.match(page, /event\.returnValue = ""/);
  assert.match(page, /title: "Rời khỏi trình soạn đề\?"/);
  assert.match(page, /navigate\("\/teacher\/assessments"\)/);
});

verify("structured routes remain teacher-scoped", () => {
  assert.match(app, /path="\/teacher\/assessment-documents\/new"/);
  assert.match(
    app,
    /path="\/teacher\/assessment-documents\/:assessmentId\/edit"/,
  );
  assert.match(app, /allowedRoles=\{\["TEACHER"\]\}/);
});

verify("legacy Assessment Builder remains isolated", () => {
  assert.match(legacyBuilder, /assessmentBuilderApi\.create/);
  assert.match(legacyBuilder, /assessmentBuilderApi\.publish/);
  assert.match(legacyBuilder, /openCreate/);
  assert.match(legacyBuilder, /navigate\("\/teacher\/assessment-documents\/new"\)/);
  assert.doesNotMatch(legacyBuilder, /assessmentDocumentApi/);
  assert.doesNotMatch(legacyBuilder, /features\/assessment-document/);
});

for (const name of checks) {
  console.log(`PASS ${name}`);
}
console.log(`\n${checks.length} structured assessment regression checks passed.`);
