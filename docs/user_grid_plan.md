# User List Grid Layout Plan

## Goal
Transform the user list from a vertical stack to a responsive grid of square cards.

## Proposed Changes

### Frontend (`src/pages/admin/Users.tsx`)

#### 1. Grid Container
- Change `div className="grid gap-4"` to:
  ```tsx
  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  ```

#### 2. Card Styling
- Make cards square-ish or fixed aspect ratio
- Center align content within the card
- Stack user info vertically (Avatar/Icon on top, Name, Email, Role below)
- Move "Delete" button to a corner or keep it at the bottom

#### 3. Sorting (Optional but requested "in order")
- Ensure users are sorted by creation date (newest first) or name.
- Currently, the API returns them in default MongoDB order (usually insertion order).
- I will add client-side sorting to be safe.

## Implementation Steps

1. Update the grid container class.
2. Refactor the `Card` content layout:
   - Use `flex-col` and `items-center` for the card header.
   - Add a placeholder avatar circle with initials.
   - Style the text to be centered.
3. Verify the responsive behavior.

## Verification
- Check layout on desktop (3-4 columns)
- Check layout on tablet (2 columns)
- Check layout on mobile (1 column)
- Verify click-to-view details still works
