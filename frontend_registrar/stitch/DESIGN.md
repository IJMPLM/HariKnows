# Design System Document

## 1. Overview & Creative North Star: "The Academic Atelier"
This design system moves away from the sterile, "spreadsheet-heavy" look of traditional administrative software. Our Creative North Star is **The Academic Atelier**—a space that combines the precision of high-end editorial design with the warmth of a modern library. 

The system rejects the "boxed-in" feeling of legacy registrar tools. Instead of rigid grids and heavy borders, we utilize **Tonal Architecture** and **Intentional Asymmetry**. By leveraging substantial whitespace and subtle shifts in surface depth, we create a high-efficiency environment that feels calm, premium, and authoritative. Administrative staff should feel they are "curating" student records rather than merely processing data.

---

## 2. Colors & Surface Architecture
We employ a sophisticated Material 3-derived palette that prioritizes legibility and ocular comfort during long work sessions.

### The "No-Line" Rule
To achieve a premium, custom feel, **1px solid borders are prohibited for sectioning.** Physical boundaries must be defined exclusively through background color shifts. For example, a student profile section (`surface-container-low`) should sit directly on the `surface` background without a stroke.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the following tiers to define importance and "lift":
- **Base Layer:** `surface` (#f8f9fb) – The primary canvas.
- **Sectioning:** `surface-container-low` (#f1f4f7) – For grouping secondary metadata.
- **Primary Content Panels:** `surface-container-lowest` (#ffffff) – Reserved for the most critical active work areas (e.g., a student's main transcript view).
- **Elevated Interactions:** `surface-container-highest` (#dbe4ea) – For header bars or navigation rails that need to feel anchored.

### The Glass & Gradient Rule
To move beyond a "standard" admin feel, floating elements (like side-panels or dropdowns) should utilize **Glassmorphism**. Apply a 20px-40px backdrop blur with a semi-transparent `surface` color. 
*   **Signature CTA Texture:** For primary action buttons, use a subtle linear gradient from `primary` (#0053db) to `primary_dim` (#0048c1) at a 135° angle to provide a "jewel-like" depth that flat hex codes lack.

---

## 3. Typography: Editorial Authority
The type system pairs the functional clarity of **Inter** with the structural sophistication of **Manrope**.

- **The Headline Strategy (Manrope):** Large scales (`display-lg` to `headline-sm`) use Manrope. This adds a "custom-built" architectural feel to student names and department titles. 
- **The Functional Core (Inter):** All body text, data points, and labels use Inter. It is optimized for the dense information density required by registrar staff.
- **Hierarchy through Scale:** Use `display-md` (2.75rem) for page titles to create a strong editorial entry point. Contrast this with `label-sm` (0.6875rem) in `on_surface_variant` (#586065) for secondary metadata to ensure the eye knows exactly where to land first.

---

## 4. Elevation & Depth
We define hierarchy through **Tonal Layering** rather than structural lines.

- **The Layering Principle:** Depth is achieved by "stacking." A `surface-container-lowest` card placed on a `surface-container-low` background creates a soft, natural lift without the clutter of shadows.
- **Ambient Shadows:** When an element must float (e.g., a modal or a floating action button), use an extra-diffused shadow: `box-shadow: 0 20px 40px rgba(43, 52, 56, 0.06)`. Note the use of a tinted `on-surface` color rather than pure black.
- **The "Ghost Border" Fallback:** If a border is required for accessibility (e.g., in a high-density data table), use the `outline_variant` token at **20% opacity**. Never use 100% opaque strokes.

---

## 5. Components

### Buttons & Navigation
- **Primary Action:** Uses the signature `primary` gradient. Roundedness is set to `md` (0.375rem) for a professional yet modern silhouette.
- **Secondary Action:** `secondary_container` (#d9e3f4) text on a transparent background. No border.
- **Tertiary/Ghost:** Use `on_surface_variant` for low-priority actions like "Cancel."

### Document Cards (The Success Green)
Document status (e.g., "Transcript Verified") should use the `tertiary` (#006d4a) and `tertiary_container` (#69f6b8) tokens. 
*   **Design Note:** Forbid divider lines within cards. Use `8` (1.75rem) or `10` (2.25rem) spacing from the scale to separate content blocks.

### Input Fields
- **Container:** Use `surface_container_highest` with a bottom-only "Ghost Border" of 1px at 20% opacity. 
- **Focus State:** Transitions to a 2px `primary` bottom border with a subtle `primary_container` glow.

### Registrar-Specific Components
- **The Academic Timeline:** A vertical track using `surface_dim` (#d1dce2) lines (the only exception to the No-Line rule) with `primary` nodes to track student progress.
- **Status Badges:** Use `full` (9999px) roundedness with `secondary_fixed` (#d9e3f4) backgrounds for a "pill" look that stands out against square record panels.

---

## 6. Do’s and Don’ts

### Do:
- **Use Intentional Asymmetry:** Align primary data to the left, but allow secondary metadata to float in wider right-hand gutters to create "breathing room."
- **Nesting Surfaces:** Place white panels (`surface-container-lowest`) inside light gray sections (`surface-container-low`) to denote importance.
- **Respect the Spacing Scale:** Stick strictly to the defined scale (e.g., use `5` [1.1rem] for internal padding, never a random pixel value).

### Don’t:
- **Don't use 1px Solid Outlines:** This is the quickest way to make the system look "off-the-shelf."
- **Don't use pure Black (#000000):** Use `on_surface` (#2b3438) for all high-contrast text.
- **Don't Crowd the Data:** If a student record feels "busy," increase the vertical spacing to `12` (2.75rem) rather than adding a divider line.