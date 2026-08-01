import type { AssessmentItemResponse } from "../types/assessmentBuilder";

export const MIN_STARTING_QUESTION_NUMBER = 1;
export const MAX_DISPLAY_ORDER = 2_147_483_647;

export const deriveStartingQuestionNumber = (
  items: readonly Pick<AssessmentItemResponse, "displayOrder">[] | null | undefined,
) => {
  const firstDisplayOrder = items
    ?.map((item) => item.displayOrder)
    .filter(
      (displayOrder) =>
        Number.isInteger(displayOrder) &&
        displayOrder >= MIN_STARTING_QUESTION_NUMBER,
    )
    .sort((left, right) => left - right)[0];

  return firstDisplayOrder ?? MIN_STARTING_QUESTION_NUMBER;
};

export const createSequentialDisplayOrders = (
  startingQuestionNumber: number,
  questionCount: number,
) =>
  Array.from(
    { length: questionCount },
    (_, index) => startingQuestionNumber + index,
  );
