import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { AssessmentQuestionNodeView } from "../nodeViews/AssessmentQuestionNodeView";

export const AssessmentQuestionNode = Node.create({
  name: "assessmentQuestion",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      questionId: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const value = element.getAttribute("data-question-id");
          return value ? Number(value) : null;
        },
      },
      points: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const value = element.getAttribute("data-points");
          return value ? Number(value) : null;
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="assessment-question"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "assessment-question",
        "data-question-id": HTMLAttributes.questionId,
        "data-points": HTMLAttributes.points,
      }),
      `[Câu hỏi #${HTMLAttributes.questionId}]`,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AssessmentQuestionNodeView);
  },
});
