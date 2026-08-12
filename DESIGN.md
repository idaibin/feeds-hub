---
name: Feeds Hub
description: Mobile-first text information feed with compact, high-signal cards and topic accents.
colors:
  background: "#f8fafc"
  surface: "#ffffff"
  surface-muted: "#f1f5f9"
  on-surface: "#0f172a"
  on-surface-muted: "#64748b"
  on-surface-strong: "#334155"
  primary: "#0569ed"
  primary-strong: "#034a9a"
  signal: "#069fb4"
  error: "#b42318"
  error-strong: "#8f1d14"
typography:
  feed-title:
    fontFamily: Avenir Next
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.36
  feed-summary:
    fontFamily: Avenir Next
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.68
  label-small:
    fontFamily: Avenir Next
    fontSize: 12px
    fontWeight: 700
    lineHeight: 1.5
  metadata:
    fontFamily: SFMono-Regular
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1.5
rounded:
  focus: 4px
  control: 7px
  card: 8px
  menu: 10px
  full: 999px
spacing:
  xs: 4px
  sm: 8px
  md: 10px
  lg: 12px
  xl: 16px
  desktop-card-gap: 16px
  mobile-card-gap: 10px
components:
  site-shell:
    backgroundColor: "{colors.background}"
    textColor: "{colors.on-surface}"
  site-header:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.on-surface-strong}"
  brand-accent:
    textColor: "{colors.signal}"
  feed-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.card}"
    padding: 11px
  feed-summary:
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.feed-summary}"
  empty-state:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-muted}"
    rounded: "{rounded.card}"
  pagination-control:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary-strong}"
    rounded: "{rounded.control}"
    height: 32px
  pagination-error:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.error}"
    rounded: "{rounded.control}"
    height: 32px
  pagination-error-action:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.error-strong}"
    rounded: "{rounded.control}"
    height: 32px
---

# Feeds Hub Design System

## Overview

Feeds Hub is a mobile-first, text-only information surface for readers who need to scan
high-signal events quickly. The interface should feel compact, calm, technical, and
trustworthy. Content hierarchy and readable typography take priority over decoration;
topic color is a navigation cue, not a replacement for text.

The accepted shared boundary covers the site shell, topic switcher, feed cards, list
feedback, and detail surfaces. Product behavior remains in `docs/rules/`; this document
owns shared visual semantics only.

## Colors

- **Background and surfaces:** use the cool neutral background with white or muted
  surfaces to separate content without heavy containers.
- **Text:** use `on-surface` for primary reading content, `on-surface-muted` for summaries
  and metadata, and `on-surface-strong` for emphasized utility text.
- **Primary:** use blue for focus, navigation emphasis, and recoverable actions. Do not
  use it as a generic decoration on every element.
- **Signal:** use teal as a supporting brand accent.
- **Error:** use the error pair only for actionable failure feedback. Error meaning must
  also be expressed with text and semantics, never by color alone.
- Topic-specific accent colors may vary by category. They remain local content cues and
  must preserve readable text and the shared surface hierarchy.

## Typography

The sans-serif stack starts with Avenir Next and falls back through Chinese system sans
fonts. Feed titles use a strong 20px hierarchy; summaries use 14px with generous line
height; compact controls and category labels use the small label role. Timestamps and
technical metadata use the monospace stack.

If Avenir Next or SFMono-Regular is unavailable, the declared repository fallback stack
is authoritative. Do not download or substitute a web font merely to force visual parity.

## Layout

The feed is fluid and mobile-first. Desktop feed columns use a 480px minimum card width
with a 16px gap. At `640px` and below, the layout uses a single compact reading surface,
10px page insets, and a 10px card rhythm. The fixed header is 60px on desktop and 54px on
mobile. Feedback belongs to the natural end of the feed and must not create a nested
scroll container.

Use the spacing tokens for shared rhythm. Page- or component-specific composition may
use an intermediate measured value only when it remains local and does not create a
second spacing system.

## Elevation & Depth

Hierarchy comes primarily from surface contrast, thin borders, and restrained cool
shadows. Feed cards use a soft shadow and may lift slightly on hover-capable devices.
Menus may use a stronger shadow because they temporarily layer above content. Failure,
loading, and end feedback remain in the document flow and must not look like floating
dialogs.

## Shapes

Cards and content panels use the card radius. Compact controls use the control radius;
menus use the menu radius. Fully rounded shapes are reserved for small status dots and
similar indicators. Focus rings use a small radius and remain visually distinct from the
component border.

## Components

- **Site header:** fixed, compact, and balanced between brand and the right-side topic
  selector. Mobile hides the secondary brand line but keeps the brand identity.
- **Topic selector:** exposes the current topic in text, retains keyboard focus, and uses
  the menu surface only while expanded.
- **Feed card:** contains one event, text only. Category, timestamp, title, and summary
  follow the shared type hierarchy. Hover lift must be disabled by reduced-motion rules
  or omitted where hover is unavailable.
- **Pagination control:** uses the native button element, primary action color, a minimum
  32px height, visible focus, and a disabled loading state that prevents duplicate work.
- **Pagination error:** uses `role="alert"`, the error color role, explicit Chinese copy,
  and a native retry button. It is mutually exclusive with the end state.
- **End state:** is quiet, centered metadata. It appears only after a successful response
  confirms that no more content exists.

## Do's and Don'ts

- Do keep each feed card bound to one event and prioritize readable text.
- Do preserve loaded cards during loading, failure, and retry.
- Do use semantic HTML, visible keyboard focus, and text for every state meaning.
- Do keep the mobile surface free of horizontal overflow at 390px.
- Do honor `prefers-reduced-motion` for brand and card motion.
- Don't introduce image-led cards, dense dashboards, or a parallel component library.
- Don't use topic accents as global primary colors or error colors.
- Don't present request failure as the successful end of pagination.
- Don't copy shared tokens into Feature Specs; reference this document instead.
