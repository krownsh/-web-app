# UI Refinements Changelog - 2025-12-25

## 1. HomeScreen Changes
- **Layout Adjustment**: 
  - Adjusted the layout ratio of the main split view.
  - Left Panel (Scroll Wheel): Width reduced from 80% to 65%.
  - Right Panel (Meeting Point): Width increased from 20% to 35%.
- **Location Display**:
  - Fixed "Unknown Location" issue in Must Buy list by correctly mapping `location_ref` to `loc.name`.
- **Swipe-to-Delete**:
  - Implemented swipe-to-delete functionality for the "Must Buy" (My List) items.
  - Deleting an item removes it from the UI optimistically and syncs the deletion to LocalStorage and Supabase.

## 2. DiscoveryScreen Changes
- **Itinerary List**:
  - Fixed text clipping issues by removing `truncate` and `w-11/12` constraints from list items.
  - Added `break-words` and `line-clamp-2` to ensuring long descriptions and titles are readable.
- **Persistence**:
  - Updated `updateItem` function to correctly sync edits (time, title, location, description) to Supabase using `SupabaseService.updateRecord`.
- **UI Cleanup**:
  - Removed the "Directions" navigation button from the top-right of the map panel as requested.

## 3. ItineraryScreen Changes
- **Swipe-to-Delete**:
  - Implemented swipe-to-delete functionality for:
    - **Guide Links**: Deletes from local state.
    - **Must Buy Items**: Deletes from local state.
  - Created a reusable `SwipeableRow` component (`components/SwipeableRow.tsx`) to handle the gesture and animation.

## 4. Components
- **New Component**: `SwipeableRow`
  - A reuseable component wrapping children content.
  - Supports touch swipe (left) to reveal a delete button.
  - Styled with a red background and trash icon, mimicking native iOS behavior.
