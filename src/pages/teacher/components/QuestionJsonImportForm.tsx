import { useMemo, useState } from "react";
import { questionBankApi } from "../../../api/questionBankApi";
import { Button } from "../../../components/ui/Button";
import type {
  QuestionCollectionResponse,
  QuestionImportValidationResponse,
} from "../../../types/questionBank";

interface QuestionJsonImportFormProps {
  collections: QuestionCollectionResponse[];
  initialCollectionId?: number | "";
  onImported: (count: number) => Promise<void>;
  onCancel: () => void;
}

const MAX_JSON_CHARACTERS = 1_000_000;

const JSON_TEMPLATE = `{
  "version": "2.0",
  "questions": [
    {
      "sectionCode": "PART_5",
      "displayOrder": 101,
      "type": "MULTIPLE_CHOICE",
      "content": "...",
      "difficulty": "EASY",
      "points": 1,
      "options": [
        {
          "content": "...",
          "isCorrect": true
        },
        {
          "content": "...",
          "isCorrect": false
        }
      ]
    }
  ]
}`;

const buildAiPrompt = (collection: QuestionCollectionResponse | null) => {
  if (!collection) {
    return "Select a Question Collection to generate the AI prompt.";
  }

  return `You are generating question data for the Owlexa Question Bank.

====================================================
TARGET QUESTION COLLECTION
====================================================

Collection Name:
${collection.name}

Collection Code:
${collection.code}

Every generated question belongs to this collection.

Do NOT include collection information in the JSON.

Return ONLY valid JSON.

====================================================
IMPORTANT FIELD DEFINITIONS
====================================================

content
------------------------------------

The content is ONLY the question text/stem stored in the Question Bank.

This field should contain:

- question sentence
- question prompt
- blank reference, if the question is tied to a blank in a passage
- plain text only, no HTML formatting

This field must NOT contain:

- reading passage
- dialogue
- announcement
- table
- advertisement
- schedule
- memo
- email
- article
- review
- invoice
- any shared context used by multiple questions

For listening questions:

Content may be empty.

For reading questions:

Content should contain ONLY the question itself, never the reading passage.
The reading passage will be created later in the Assessment Content Block when building the test.

Always output content as plain text only.
Do NOT include any HTML tags such as <p>, </p>, <div>, <span>, <br>, <table>, or <img> in question content.

------------------------------------
options
------------------------------------

Options are the answer choices shown to the student.

Preserve the original answer choice order exactly as shown in the source.

MULTIPLE_CHOICE questions must contain EXACTLY ONE correct option.

------------------------------------
sectionCode
------------------------------------

sectionCode identifies the section of the source question.

Use values such as PART_1, PART_2, PART_3, PART_4, PART_5, PART_6, PART_7.

------------------------------------
displayOrder
------------------------------------

displayOrder preserves the original question number/order from the source.

For example, TOEIC question 101 should use "displayOrder": 101.

====================================================
SCHEMA
====================================================

${JSON_TEMPLATE}

====================================================
RULES
====================================================

- Output valid JSON only.
- Do not wrap JSON inside Markdown.
- Do not include explanations.
- Do not include comments.
- Preserve the original question numbering using displayOrder.
- Preserve answer choice order exactly as the source.
- MULTIPLE_CHOICE questions must contain EXACTLY ONE correct answer.
- Content may be empty ONLY for listening questions.
- Use the correct sectionCode such as PART_1, PART_2, PART_3, PART_4, PART_5, PART_6, PART_7.
- Do NOT include any shared reading/listening material in question content.
- If multiple questions share one passage/email/ad/table/article, import each question separately and omit the shared passage from every question.
- Shared passages belong to Assessment Content Blocks, not Question Bank import JSON.
- If the question itself references an image, convert it into a plain text placeholder:

[IMAGE_PLACEHOLDER]

- Do NOT use HTML formatting in question content. For example, use "content": "Question sentence here.", NOT "content": "<p>Question sentence here.</p>".
- Do NOT invent missing information.
- Do NOT rewrite the source.
- Keep the wording identical, but convert any visual formatting into readable plain text.

====================================================
SPECIAL TOEIC RULES
====================================================

For TOEIC Part 5:

- content should contain ONLY the sentence with the blank.
- options contain the four answer choices.

Example:

"content":
"Former Sendai Company CEO Ken Nakata spoke about ------- career experiences."

----------------------------------------------------

For TOEIC Part 1-4:

content:

May be empty if no transcript exists.

----------------------------------------------------

For TOEIC Part 6-7:

content:

Contains ONLY the individual question text/stem.

Do NOT include the passage, email, advertisement, memo, schedule, table, article, review, invoice, or any shared document.

Examples:

Part 6:
"content": "131. Which choice best completes the blank?"

Part 7:
"content": "194. What is a purpose of the e-mail?"

====================================================

Return ONLY the JSON object.`;
};

const extractErrorMessage = (err: any, fallback: string) =>
  err?.response?.data?.message ?? err?.message ?? fallback;

export const QuestionJsonImportForm = ({
  collections,
  initialCollectionId = "",
  onImported,
  onCancel,
}: QuestionJsonImportFormProps) => {
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | "">(
    initialCollectionId,
  );
  const [jsonText, setJsonText] = useState("");
  const [preview, setPreview] =
    useState<QuestionImportValidationResponse | null>(null);
  const [error, setError] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");

  const selectedCollection = useMemo(
    () =>
      selectedCollectionId
        ? collections.find((collection) => collection.id === selectedCollectionId) ?? null
        : null,
    [collections, selectedCollectionId],
  );

  const aiPrompt = useMemo(
    () => buildAiPrompt(selectedCollection),
    [selectedCollection],
  );

  const validateJsonText = () => {
    if (!selectedCollectionId) {
      throw new Error("Please select a Question Collection before importing.");
    }
    if (!jsonText.trim()) {
      throw new Error("Please paste the JSON to import.");
    }
    if (jsonText.length > MAX_JSON_CHARACTERS) {
      throw new Error("JSON is too large. Maximum length is 1,000,000 characters.");
    }
    try {
      JSON.parse(jsonText);
    } catch {
      throw new Error("JSON is not valid.");
    }
    return jsonText;
  };

  const handleCopyPrompt = async () => {
    if (!selectedCollection) return;
    await navigator.clipboard.writeText(aiPrompt);
    setCopyStatus("Prompt copied.");
    window.setTimeout(() => setCopyStatus(""), 1800);
  };

  const handleValidate = async () => {
    setError("");
    setPreview(null);
    try {
      setIsValidating(true);
      const json = validateJsonText();
      setPreview(await questionBankApi.validateImport(Number(selectedCollectionId), json));
    } catch (err: any) {
      setError(extractErrorMessage(err, "Could not validate JSON."));
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async () => {
    setError("");
    try {
      setIsImporting(true);
      const json = validateJsonText();
      const result = await questionBankApi.importJson(Number(selectedCollectionId), json);
      await onImported(result.importedCount);
    } catch (err: any) {
      setError(extractErrorMessage(err, "Could not import JSON."));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Question Collection
        </label>
        <select
          value={selectedCollectionId}
          onChange={(event) => {
            const value = event.target.value ? Number(event.target.value) : "";
            setSelectedCollectionId(value);
            setPreview(null);
            setError("");
          }}
          className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="">Select Collection</option>
          {collections.map((collection) => (
            <option key={collection.id} value={collection.id}>
              {collection.code} - {collection.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2 rounded-card border border-surface-border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Generate Questions with AI
            </h3>
            {selectedCollection && (
              <p className="mt-1 text-xs text-gray-500">
                {selectedCollection.name} · {selectedCollection.code}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {copyStatus && <span className="text-xs text-green-700">{copyStatus}</span>}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleCopyPrompt}
              disabled={!selectedCollection}
            >
              Copy AI Prompt
            </Button>
          </div>
        </div>
        <pre className="max-h-72 overflow-auto rounded-card border border-surface-border bg-surface-page p-3 whitespace-pre-wrap text-xs text-gray-700">
          {aiPrompt}
        </pre>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">JSON</label>
        <textarea
          value={jsonText}
          onChange={(event) => {
            setJsonText(event.target.value);
            setPreview(null);
            setError("");
          }}
          placeholder="Paste AI-generated JSON here..."
          className="min-h-[240px] w-full resize-y rounded-input border border-surface-border bg-white px-3 py-2 font-mono text-sm text-gray-900 outline-none focus:border-primary"
        />
        <div className="text-xs text-gray-500">
          {jsonText.length.toLocaleString()} / {MAX_JSON_CHARACTERS.toLocaleString()} characters
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {preview && (
        <div className="space-y-3 rounded-card border border-surface-border bg-white p-4">
          <div className="text-sm font-semibold text-gray-900">
            Preview · {preview.collectionName} · {preview.collectionCode} · {preview.questionCount} questions
          </div>
          <div className="max-h-80 space-y-3 overflow-auto">
            {preview.questions.map((question) => (
              <div
                key={question.questionNumber}
                className="border-t border-surface-border pt-3 text-sm"
              >
                <div className="font-medium text-gray-900">
                  {question.sectionCode} · Question {question.displayOrder}
                </div>
                <div className="mt-1 line-clamp-2 text-gray-500">
                  {question.content}
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                  <span>{question.difficulty ?? "No difficulty"}</span>
                  <span>{question.points ?? "-"} points</span>
                  <span>{question.optionCount} options</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={handleValidate}
          isLoading={isValidating}
          disabled={!selectedCollectionId || isImporting}
        >
          Preview
        </Button>
        <Button
          type="button"
          onClick={handleImport}
          isLoading={isImporting}
          disabled={!selectedCollectionId || !preview || isValidating}
        >
          Import
        </Button>
      </div>
    </div>
  );
};
