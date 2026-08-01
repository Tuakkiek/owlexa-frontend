import type { EditorDocument } from "../components/editor";

export const extractQuestionIdsFromDoc = (node: any): number[] => {
  if (!node) return [];
  const ids: number[] = [];
  if (node.type === "assessmentQuestion" && node.attrs?.questionId != null) {
    ids.push(Number(node.attrs.questionId));
  }
  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      ids.push(...extractQuestionIdsFromDoc(child));
    }
  }
  return ids;
};

export const stripQuestionNodes = (doc: any): EditorDocument => {
  if (!doc || typeof doc !== "object") return doc;
  if (Array.isArray(doc)) {
    return doc
      .filter((child) => child.type !== "assessmentQuestion")
      .map(stripQuestionNodes);
  }
  if (doc.content && Array.isArray(doc.content)) {
    const filteredContent = doc.content
      .filter((child: any) => child.type !== "assessmentQuestion")
      .map(stripQuestionNodes);
    return {
      ...doc,
      content: filteredContent,
    };
  }
  return doc;
};
