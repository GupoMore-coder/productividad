---
name: ecommerce-storefront-ui
description: Headless e-commerce UI design system and accessible component architecture based on Storefront UI (Vue 3 and React). Assembles high-converting product detail pages, filter sidebars, shopping cart drawers, and multi-step checkout flows with WCAG 2.1 AA accessibility and luxury brand styling. Activate when designing online storefronts, optimizing checkout UX, or building accessible e-commerce interfaces.
metadata:
  origin: Antigravity-Core
---

# 🛒 E-Commerce Storefront UI

This skill defines the **accessible, high-converting e-commerce frontend standard** (Bernard Arnault luxury brand prestige / Philip Kotler customer retention / Mustafa Suleyman frictionless interaction) for online retail experiences.

---

## 🎯 When to Use

* **More Paper & More Design Storefronts:** Crafting bespoke product detail pages, artisan stationery showcases, and interactive variant selectors.
* **Shopping Cart & Checkout Flows:** Eliminating cart abandonment with accessible drawer patterns and clear step indicators.
* **Faceted Product Filtering:** Designing responsive attribute filter bars (by material, size, color, collection).
* **Accessible Component Craft:** Implementing keyboard-friendly, screen-reader-compliant e-commerce controls.

---

## 🧭 The 4-Pillar Storefront Architecture

```
1. Product Information Modeling ──► 2. Accessible UI Assembly ──► 3. Cart State Machine ──► 4. Checkout Conversion
```

### Pillar 1: Product Information Modeling
- Structure product data with explicit pricing, SKU, stock availability, and image gallery metadata.
- Support custom engraving, personalization options, and bundle sets.

### Pillar 2: Accessible UI Assembly (React / Vue 3)
- Use semantic HTML tags (`<article>`, `<button>`, `<dialog>`).
- Enforce ARIA labels for icon-only action buttons (favorite, add to cart, share).
- Implement responsive image srcset with modern WebP/AVIF formats.

### Pillar 3: Cart State Machine & Micro-Interactions
- Manage optimistic UI updates when adding items to cart.
- Provide smooth sliding drawer with real-time tax calculation and free shipping threshold meter.

### Pillar 4: Frictionless Checkout Conversion
- Minimize form fields to essentials.
- Validate inputs inline with clear feedback messages.
- Support rapid payment methods (Apple Pay, Google Pay, Wompi/PSE).

---

## 🛡️ Accessibility & Performance Gates

- [ ] **WCAG AA Compliance:** Color contrast ratio $>4.5:1$ across all text elements.
- [ ] **Keyboard Navigable:** Entire purchase flow completable without a mouse.
- [ ] **Lighthouse Performance:** Score $>90$ on Core Web Vitals (LCP $<2.5$s).
