# Owlexa Design System v2.0

## Design Philosophy

- Minimal, Enterprise, Professional, Clean, Spacious
- Reference: DeepSeek Platform, Linear, Stripe, GitHub, Notion
- No: gradient, glassmorphism, neumorphism, large shadows, excessive colors

---

## Color System (60-30-10)

| Role          | Value   | Tailwind       |
| ------------- | ------- | -------------- |
| Primary       | #F97316 | primary        |
| Primary Hover | #EA580C | primary-hover  |
| Primary Light | #FFF7ED | primary-light  |
| Page BG       | #F9FAFB | surface-page   |
| Card BG       | #FFFFFF | surface-card   |
| Hover BG      | #F3F4F6 | surface-hover  |
| Border        | #E5E7EB | surface-border |
| Text Heading  | #111827 | text-gray-900  |
| Text Body     | #6B7280 | text-gray-500  |
| Text Muted    | #9CA3AF | text-gray-400  |
| Success       | #10B981 | success        |
| Warning       | #F59E0B | warning        |
| Error         | #EF4444 | error          |
| Info          | #3B82F6 | info           |

---

## Border Radius (use dedicated CSS classes)

| Element      | Radius | Class           |
| ------------ | ------ | --------------- |
| Input        | 12px   | `rounded-input` |
| Button       | 12px   | `rounded-btn`   |
| Card         | 16px   | `rounded-card`  |
| Modal/Drawer | 16px   | `rounded-card`  |
| Dropdown     | 12px   | `rounded-input` |
| Badge/Pill   | 9999px | `rounded-full`  |

**NEVER use raw `rounded-lg`, `rounded-xl`, `rounded-2xl` in components.**

---

## Shadow

- Card: `shadow-sm`
- Hover: `shadow-md`
- No other shadows.

---

## Border

- Always `border border-surface-border` (1px, gray-200)
- No black borders. No border-2 unless specified.

---

## Typography

| Role          | Size            | Weight        | Class                                  |
| ------------- | --------------- | ------------- | -------------------------------------- |
| Page Title    | 32px (text-3xl) | font-semibold | `text-3xl font-semibold text-gray-900` |
| Section Title | 24px (text-2xl) | font-semibold | `text-2xl font-semibold text-gray-900` |
| Card Title    | 18px (text-lg)  | font-semibold | `text-lg font-semibold text-gray-900`  |
| Body          | 14px (text-sm)  | font-normal   | `text-sm text-gray-500`                |
| Caption       | 12px (text-xs)  | font-normal   | `text-xs text-gray-400`                |

---

## Spacing Scale

Use only: 4, 8, 12, 16, 24, 32, 40, 48
Mapped to Tailwind: p-1, p-2, p-3, p-4, p-6, p-8, p-10, p-12

No odd numbers like p-5, gap-1.5, m-7, etc.

---

## Card Standard

- `rounded-card border border-surface-border bg-white p-6`
- Padding always p-6 (24px)
- White background, no colored backgrounds

---

## Button Standard

- All buttons use shared `<Button>` component
- Variants: primary, secondary, danger, outline, ghost
- Border radius: `rounded-btn`

---

## Page Layout Structure

```
PageContainer
  PageHeader (title + description + actions)
  Toolbar (optional: search, filters, actions)
  Content (cards, tables, etc.)
```
