/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        /*
         * ═══════════════════════════════════════════
         *  Owlexa Design System v2.0 — 60‑30‑10 Palette
         *  60% Neutral  — gray/white bg, cards, text
         *  30% Surface  — depth layers
         *  10% Brand    — orange: sidebar, btn, link,
         *                   focus, badge, tab, progress
         * ═══════════════════════════════════════════
         */

        /* ── 10% Brand Orange ── */
        primary: {
          DEFAULT: "#F97316", // orange-500
          hover: "#EA580C", // orange-600
          active: "#C2410C", // orange-700
          light: "#FFF7ED", // orange-50
        },

        /* ── 30% Surface layering ── */
        surface: {
          page: "#F9FAFB", // gray-50
          card: "#FFFFFF", // white
          hover: "#F3F4F6", // gray-100
          border: "#E5E7EB", // gray-200
        },

        /* ── Semantic ── */
        success: "#10B981", // emerald-500
        warning: "#F59E0B", // amber-500
        error: "#EF4444", // red-500
        info: "#3B82F6", // blue-500
      },
      borderRadius: {
        input: "12px",
        btn: "12px",
        card: "16px",
      },
      fontSize: {
        "page-title": ["32px", { lineHeight: "40px", fontWeight: "600" }],
        "section-title": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "card-title": ["18px", { lineHeight: "28px", fontWeight: "600" }],
      },
      spacing: {
        18: "72px", // for edge cases only
      },
    },
  },
  plugins: [],
};
