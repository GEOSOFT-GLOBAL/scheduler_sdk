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

### Basic Setup

```tsx
import { TimetablelyProvider, TimetableGrid } from '@geosoft/timetablely-sdk';

function App() {
  return (
    <TimetablelyProvider
      config={{
        apiUrl: 'https://api.timetablely.com/api/v1',
        apiKey: 'your-api-key',
        sessionId: 'your-session-id',
      }}
    >
      <TimetableGrid />
    </TimetablelyProvider>
  );
}
```

### Using Hooks

```tsx
import { useTimetable, useTimetableActions } from '@geosoft/timetablely-sdk';

function TimetableManager() {
  const { timetable, isLoading, error, refresh } = useTimetable();
  const { updateCell, generateTimetable } = useTimetableActions();

  const handleGenerate = async () => {
    await generateTimetable('standard');
  };

  const handleCellUpdate = async (cellId: string) => {
    await updateCell(cellId, {
      content: 'Updated content',
      backgroundColor: '#f0f0f0',
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
  onCellClick={(cellId) => console.log('Clicked:', cellId)}
/>
```

## API

### TimetablelyProvider

Provider component that wraps your app and provides timetable context.

**Props:**
- `config`: Configuration object
  - `apiUrl`: API base URL
  - `apiKey`: Optional API key for authentication
  - `sessionId`: Session/class ID to load

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
  apiUrl: string;
  apiKey?: string;
  sessionId: string;
}

interface TimetableCell {
  id: string;
  row: number;
  col: number;
  content: string;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  isMerged?: boolean;
  mergeSpan?: { rows: number; cols: number };
}
```

## License

MIT
