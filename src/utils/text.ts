const parseHtml = (html: string): string => {
  const document = new DOMParser().parseFromString(html, "text/html");
  return document.body.textContent ?? "";
};

export const htmlToText = (
  html: string | null | undefined,
): string => {
  if (!html) return "";
  return parseHtml(html);
};

export const stripHtml = (
  html: string | null | undefined,
): string => htmlToText(html).replace(/\s+/g, " ").trim();
