# Kaiju Integration Documentation

## Overview

The Kaiju page (`/kaiju`) is a cyberpunk-themed Japan trip planner that integrates with Payload CMS for persistent activity storage. This document covers the complete integration between the frontend components and the MongoDB database via Payload CMS.

## Architecture

### Frontend Structure
```
src/app/(frontend)/kaiju/
├── components/
│   ├── JapanTripPlanner.tsx     # Main container component
│   ├── TripHeader.tsx           # Hero section with neon effects
│   ├── FloatingDaySelector.tsx  # Day navigation component
│   ├── DayContent.tsx           # Day-specific content display
│   └── ActivityModal.tsx        # Activity creation/editing modal
├── hooks/
│   └── useScrollPosition.ts     # Scroll position tracking
├── lib/
│   └── actions.ts               # Server actions for CRUD operations
└── data/
    └── tripData.ts              # Static trip structure
```

## Payload CMS Collection

### KaijuActivities Collection
Located in `src/lib/payload/payload.config.ts`:

```typescript
{
  slug: 'kaiju-activities',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'time',
      type: 'text',
    },
    {
      name: 'hasTime',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Transportation', value: 'transportation' },
        { label: 'Food', value: 'food' },
        { label: 'Activity', value: 'activity' },
        { label: 'Accommodation', value: 'accommodation' },
      ],
      defaultValue: 'activity',
    },
    {
      name: 'dayIndex',
      type: 'number',
      required: true,
      index: true,
    },
  ],
}
```

**Key Design Decisions:**
- Simplified structure mirrors the `Activity` interface exactly
- `dayIndex` field enables day-specific activity filtering
- Database indexing on `dayIndex` for efficient queries
- Removed complex fields (location, city, phase) that were over-engineered

## Server Actions

### CRUD Operations
Located in `src/app/(frontend)/kaiju/lib/actions.ts`:

```typescript
// Create new activity
export async function createKaijuActivity(activity: Activity, dayIndex: number)

// Update existing activity
export async function updateKaijuActivity(taskId: string, activity: Activity, dayIndex: number)

// Delete activity
export async function deleteKaijuActivity(taskId: string)

// Fetch activities for specific day
export async function fetchActivitiesByDay(dayIndex: number): Promise<Activity[]>
```

**Implementation Details:**
- Uses `getPayload()` to access Payload CMS instance
- Transforms Payload documents to match `Activity` interface
- Includes proper error handling and logging
- Day-aware operations for filtering activities

## Frontend Integration

### State Management
The `JapanTripPlanner` component manages:

```typescript
const [currentDay, setCurrentDay] = useState(0)
const [activities, setActivities] = useState<Record<number, Activity[]>>(
  initialTripData || {}
)
const [isModalOpen, setIsModalOpen] = useState(false)
const [editingActivity, setEditingActivity] = useState<EditingActivity | null>(null)
```

### Day Selection Integration
- `FloatingDaySelector` controls `currentDay` state
- Activities are filtered and displayed based on selected day
- New activities are automatically assigned to current day
- Day switching triggers activity refetch for selected day

### Hydration Handling
Fixed React hydration issues with proper client-side checks:

```typescript
// Always call hooks (React rules), but guard their usage
const router = useRouter()
const { isScrolledPastHero } = useScrollPosition()

// Ensure we're on the client before using browser APIs
useEffect(() => {
  setIsClient(true)
}, [])
```

## UI/UX Features

### Cyberpunk Theme
- **Neon Sign Effects**: Hero heading uses realistic text shadows and electrical flicker animations
- **Grid Background**: Animated cyberpunk grid overlay
- **Color Scheme**: Cyan and pink neon colors throughout
- **Kaiju Terminology**: "Deploy Mission" → "New", themed toast messages

### Toast Notifications
Using Sonner for user feedback:
- "Kaiju activity deployed successfully!" (create)
- "Kaiju activity updated successfully!" (update)
- "Kaiju activity eliminated successfully!" (delete)
- Error messages for failed operations

## Database Configuration

### Environment Variables
```bash
# .env.local
DATABASE_URI=mongodb://localhost:27017/orcapod
PAYLOAD_SECRET=your-secret-key
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
```

### MongoDB Connection
- Uses `@payloadcms/db-mongodb` adapter
- Database name: `orcapod`
- Collection: `kaiju-activities`
- Automatic indexing on `dayIndex` field

## Common Issues & Solutions

### 1. Activities Not Persisting
**Problem**: Activities created but not saved to database
**Solution**: Removed conditional checks that prevented saves when `initialTripData` was null

### 2. React Hydration Errors
**Problem**: `useContext` null errors during SSR/hydration
**Solution**: Always call hooks but guard browser API usage with `isClient` state

### 3. Day Selection Not Working
**Problem**: Activities not filtering by selected day
**Solution**: Implemented `fetchActivitiesByDay()` and proper state updates on day change

### 4. Database Configuration Mismatch
**Problem**: Environment and config using different database names
**Solution**: Made database names consistent across `.env.local` and `payload.config.ts`

## Testing Checklist

- [ ] Navigate to `/kaiju` page loads without errors
- [ ] FloatingDaySelector appears after scrolling past hero
- [ ] Day navigation updates activity display
- [ ] "New" button opens activity modal
- [ ] Activity creation saves to database and updates UI
- [ ] Activity editing preserves existing data
- [ ] Activity deletion removes from database and UI
- [ ] Toast notifications appear for all operations
- [ ] Page refresh maintains selected day activities
- [ ] Database inspection shows correct `dayIndex` values

## Performance Considerations

- Activities loaded on-demand per day (not all at once)
- Database queries filtered by `dayIndex` for efficiency
- Optimistic UI updates with server action integration
- Proper loading states during async operations

## Future Enhancements

- Activity drag-and-drop reordering
- Bulk activity operations
- Activity templates/favorites
- Export trip itinerary functionality
- Real-time collaboration features