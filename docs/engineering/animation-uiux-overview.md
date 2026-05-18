# Animation & UI/UX Deep Specification: Sleep + Breathwork App

Related docs:

- Use [Animation Engineering Index](animation-engineering-index.md) for code-first animation implementation docs.
- Use [Animation Source Alignment](animation-source-alignment.md) for source hierarchy and conflict decisions.
- Use [Motion, Animation, And Haptics](../design/motion-animation-haptics.md) for product-level motion rules.
- Use [Animation UI/UX Deep Spec Source](animation-ui-ux-deep-spec-source.md) for the preserved source document.

## Executive Summary

This document is the definitive animation and UI/UX specification for every interaction in the Sleep + Breathwork app. It covers: what every competitor does with animation and what they get catastrophically wrong, every animation category from macro screen transitions to micro haptic feedback, the exact technical implementation for React Native Reanimated, and the psychological principles behind every motion decision. Read this before writing a single line of animation code.

**The core principle:** Every animation in this app must do one of three things — **guide the user's breath, signal system state, or reward progress.** Any animation that does not serve at least one of these functions is decorative noise that increases cognitive load and must be cut.

***
