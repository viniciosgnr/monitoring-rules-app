# Design Spec: Alert Review Page Event ID and Time Open Column Refinements

This spec covers:
- Renaming "Event Manager" column to "Event ID".
- Removing external simulation links from the Event ID column and displaying it as plain text formatted as `event_<FPSO><YY>-<acronym><id>` (e.g. `event_UNY26-FW1`).
- Moving "Time Open" layout inline to match adjacent columns, including adding a search/filter input text field.

## Proposed Changes

- Edit `components/alert-review/AlertTable.tsx` to:
  1. Define a helper function `getEventId(row: AlertRow): string`.
  2. Map incoming database rows using `useMemo` to pre-calculate `eventId` and `timeOpen` values.
  3. Replace `Event Manager` column header text with `Event ID` and replace its `<FilterInput field="id" />` with `<FilterInput field="eventId" />`.
  4. Replace `Time Open` column header's empty spacer `div` with `<FilterInput field="timeOpen" />`.
  5. Replace cell rendering of `Event Manager` button link with plain text rendering of `{row.eventId}`.
  6. Use `{row.timeOpen}` in cell rendering.

## Verification Plan

### Automated Tests
- Run `npm run build` to verify Next.js compiles without errors.
- Run `npm run lint` to verify ESLint compliance.

### Manual Verification
- Access the **Alert Review** page and confirm:
  1. The column title is "Event ID".
  2. The rows show "event_UNY26-FW1" (or similar generated pattern based on FPSO, date, type, ID) as plain text.
  3. The "Time Open" column header has a search filter input field.
  4. Typing into both the "Event ID" filter and "Time Open" filter correctly filters the records list.
