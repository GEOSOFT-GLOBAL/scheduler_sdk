# Timetablely SDK

React SDK for integrating Timetablely scheduling functionality into your applications.

## Installation

```bash
npm install @geosoft/timetablely-sdk
# or
pnpm add @geosoft/timetablely-sdk
# or
yarn add @geosoft/timetablely-sdk
```

## Usage

### Importing Styles

Before using any SDK components, import the CSS styles:

```tsx
import "@geosoft/timetablely-sdk/styles";
```

Place this import at the top of your application entry point (e.g., `main.tsx` or `App.tsx`), before importing any SDK components.

### Basic Setup

```tsx
import "@geosoft/timetablely-sdk/styles"; // Import styles first
import { TimetablelyProvider, TimetableGrid } from "@geosoft/timetablely-sdk";

function App() {
  return (
    <TimetablelyProvider
      config={{
        apiKey: "your-api-key",
        apiSecret: "your-api-secret",
        // apiUrl: 'https://custom-api.example.com/v1', // Optional: defaults to production
      }}
    >
      <TimetableGrid />
    </TimetablelyProvider>
  );
}
```

### Using Hooks

```tsx
import { useTimetable, useTimetableActions } from "@geosoft/timetablely-sdk";

function TimetableManager() {
  const { timetable, isLoading, error, refresh } = useTimetable();
  const { updateCell, generateTimetable } = useTimetableActions();

  const handleGenerate = async () => {
    await generateTimetable("standard");
  };

  const handleCellUpdate = async (cellId: string) => {
    await updateCell(cellId, {
      content: "Updated content",
      backgroundColor: "#f0f0f0",
    });
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <button onClick={handleGenerate}>Generate Timetable</button>
      <button onClick={refresh}>Refresh</button>
      {/* Your timetable UI */}
    </div>
  );
}
```

### Custom Styling

```tsx
<TimetableGrid
  className="my-timetable"
  cellClassName="my-cell"
  onCellClick={(cellId) => console.log("Clicked:", cellId)}
/>
```

#### Customizing Design Tokens

The SDK uses CSS custom properties for theming. Override them in your CSS:

```css
:root {
  /* Primary colors */
  --ttly-primary: #2563eb;
  --ttly-primary-foreground: #ffffff;

  /* Grid dimensions */
  --ttly-cell-height: 120px;
  --ttly-cell-width: 160px;
  --ttly-header-height: 48px;

  /* Cell colors */
  --ttly-cell-bg: #ffffff;
  --ttly-cell-selected-bg: #93c5fd;
  --ttly-cell-editing-bg: #fefce8;
  --ttly-cell-merged-bg: #d1fae5;

  /* Other theme colors */
  --ttly-background: #ffffff;
  --ttly-foreground: #1f2937;
  --ttly-border: #e5e7eb;
  --ttly-muted: #f3f4f6;
}

/* Dark mode */
.dark {
  --ttly-background: #1f2937;
  --ttly-foreground: #f3f4f6;
  --ttly-cell-bg: #2d3748;
  --ttly-border: #4b5563;
}
```

## API

### TimetablelyProvider

Provider component that wraps your app and provides timetable context.

**Props:**

- `config`: Configuration object
  - `apiKey`: Your API key (required)
  - `apiSecret`: Your API secret (required)
  - `apiUrl`: Optional API base URL (defaults to `https://api.timetablely.com/v1`)

### TimetableGrid

Component that renders the timetable grid.

**Props:**

- `className`: Optional CSS class for the grid container
- `cellClassName`: Optional CSS class for cells
- `onCellClick`: Optional callback when a cell is clicked

### useTimetable()

Hook for accessing timetable data.

**Returns:**

- `timetable`: Current timetable data
- `isLoading`: Loading state
- `error`: Error message if any
- `refresh`: Function to refresh timetable data

### useTimetableActions()

Hook for timetable actions.

**Returns:**

- `updateCell(cellId, updates)`: Update a specific cell
- `generateTimetable(type)`: Generate timetable ('standard' or 'ai')
- `isLoading`: Loading state
- `error`: Error message if any

## Types

```typescript
interface TimetableConfig {
  apiKey: string;
  apiSecret: string;
  apiUrl?: string; // Optional, defaults to production URL
}

interface TimetableCell {
  id: string;
  row: number;
  col: number;
  content: string;
  backgroundColor?: string;
  textAlign?: "left" | "center" | "right";
  isMerged?: boolean;
  mergeSpan?: { rows: number; cols: number };
}
```

## License

MIT
