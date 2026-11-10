# ADR 0029 — The tool route renders the Tool inline; the dashboard keeps the dialog

- **Status:** Accepted
- **Date:** 2026-11-11
- **Amends:** ADR-0027 item 10, which had kept the tile-opens-a-dialog model out of scope

## Context

Every Tool was a tile that opened a full-screen dialog. On its own route
(`/tools/<key>`) the page showed that tile in a small card and passed
`autoOpen`, so the dialog opened over the page at once. Closing the dialog
navigated home.

That made a Tool's own URL a modal over an empty page. It had three costs:
- The page's real content (the Tool) sat outside the document flow.
- The page heading was hidden behind the dialog.
- Every e2e spec had to find a dialog to reach a Tool.

ADR-0027 deferred this because every shell renders `ToolDialogFrame`. That
made the change one place, once Tools were on shells.

## Decision

1. **A Tool presentation context** (`ToolPresentationProvider`,
   `useToolPresentation`, in `src/components/common/dialog/`):
   - `{ kind: 'dialog' }` is the default, so the dashboard, the command
     palette and every unit spec are unchanged.
   - The tool page provides `{ kind: 'page', registerReset }`.
2. **`ToolDialogFrame` on a page** skips the tile and the dialog. It renders
   the Tool inline in a `<section data-slot="tool-surface">`, with its
   description on top.
   - The Tool's children see `dialog` again (`DialogPresentation`), so any
     dialog a Tool opens itself stays a real one.
   - `autoOpen` is still passed, because the Codec `?mode=` deep link is
     gated on it.
3. **The page owns close.** The tool page is a full-width `Card`
   (`variant="page"`: no hover lift, the Tool name as `h1`) bounded under
   the app header, with inner scrolling like the dialog's body.
   - The frame registers its `onReset` with the page.
   - The card's close dot runs that reset and then goes home, so "close"
     still means "done with this Tool". The reset clears the input and
     keeps controls, as before.
   - Leaving any other way (browser back, sidebar, command palette) keeps
     the saved input.
4. **Exceptions.**
   - **DB Diagram** drew its own tile around a `ToolDialogShell`. It moves
     onto `ToolDialogFrame`, so it goes inline too.
   - **Protobuf Codec and Data URI** keep their own tiles and real dialogs
     on every route. Protobuf Codec opens one dialog per action
     (Encode/Decode) with no in-dialog mode switch. Data URI has two
     dialogs with different inputs and is bespoke by ADR-0020. Both are
     `custom` Tools.
5. **Tests.**
   - E2e specs reach a Tool through `toolSurface(page)`, which matches an
     inline surface or a dialog, the last one in the DOM winning. They no
     longer assume `[role="dialog"]` on a tool route.
   - `e2e/layout-journeys.spec.ts` covers both presentations: inline with
     close-resets-and-goes-home, and dashboard dialog with
     Escape-resets.
   - `ToolDialogFrame.dom.spec.tsx` covers page mode.

## Consequences

- A Tool's URL is now a real page. Its heading and content are in the
  document, and there is no modal or focus trap on load.
- One component changed, and every Tool except Protobuf Codec and Data URI
  now renders inline on its route. The layout shells are untouched.
- `[[Tool dialog frame]]` is now a misnomer on the page, but the name is
  kept because the dashboard path still is a dialog.
- The prerender plugin only stamps meta tags, so it is unaffected.
