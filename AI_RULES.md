# AI Rules

You are building production-quality software.

Never generate demo code.

Never generate placeholder implementations when a practical production implementation is possible.

---

# Code Standards

Use

- TypeScript
- Next.js App Router
- TailwindCSS
- shadcn/ui
- Framer Motion
- Zustand
- Zod

Never use "any".

Use strict typing.

---

# Architecture

Feature-based folders.

Reusable components.

Repository pattern.

Service layer.

Custom hooks.

Strong separation of concerns.

---

# UI Rules

Everything must be mobile-first.

Never use Bootstrap styling.

Never use Material Design.

Everything should resemble Apple applications.

Use generous spacing.

Rounded corners.

Smooth animations.

Bottom sheets.

Cards.

Glass effects where appropriate.

---

# Component Rules

Never duplicate components.

Always reuse components.

Keep components under approximately 300 lines when practical.

Split logic into hooks.

Split UI into reusable pieces.

---

# State Management

Use Zustand.

Never prop-drill deeply.

Keep stores modular.

---

# Storage

Everything must work offline.

Use IndexedDB through Dexie.

Storage should be abstracted behind repositories.

---

# Forms

Always use

React Hook Form

Zod validation

---

# Animations

Use Framer Motion.

Animate

Cards

Dialogs

Bottom Sheets

Navigation

Buttons

Lists

Charts

Never allow abrupt transitions.

---

# Accessibility

Keyboard accessible.

ARIA labels.

Proper button semantics.

High contrast.

---

# Performance

Lazy load large components.

Optimize renders.

Memoize expensive calculations.

Avoid unnecessary re-renders.

---

# Workflow

Before writing code:

1. Explain the implementation.

2. List files to be modified.

3. Implement.

4. Verify the application builds.

5. Explain what changed.

Never leave the application in a broken state.

Always keep the project runnable.