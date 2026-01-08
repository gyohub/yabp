# React State Management with Zustand

## Golden Rules 🌟
1.  **Simplicity**: Zustand is minimalist. Create a store with `create()` and use it anywhere. No providers needed for global state.
2.  **Selectors**: Always select only the state you need `useStore(state => state.bears)` to prevent unnecessary re-renders.
3.  **Actions**: Define actions (functions to modify state) *inside* the store to keep business logic encapsulated.
4.  **Immutability**: Zustand uses immutability under the hood (via generic updates), but if using nested objects, consider `immer` middleware or careful spreading.
5.  **DevTools**: Use the `devtools` middleware to debug state changes.

## Technology-Specific Best Practices
-   **Persistence**: Use `persist` middleware to save state to `localStorage` automatically.
-   **Slices**: For large stores, use the Slice Pattern to split the store into smaller, manageable files.
-   **Async**: Async actions are just async functions in the store; no thunks or sagas required.

## Complete Code Example

```tsx
// src/store/useBearStore.ts
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface BearState {
  bears: number
  utils: {
      type: string
  }
  increase: (by: number) => void
  reset: () => void
  fetchBears: () => Promise<void>
}

export const useBearStore = create<BearState>()(
  devtools(
    persist(
      (set) => ({
        bears: 0,
        utils: { type: 'grizzly' },
        
        // Synchronous Action
        increase: (by) => set((state) => ({ bears: state.bears + by })),
        
        reset: () => set({ bears: 0 }),

        // Asynchronous Action
        fetchBears: async () => {
             const response = await fetch('/api/bears')
             const count = await response.json()
             set({ bears: count })
        },
      }),
      {
        name: 'bear-storage', // unique name for localStorage
      }
    )
  )
)
```

```tsx
// src/components/BearCounter.tsx
'use client'
import { useBearStore } from '../store/useBearStore'

export const BearCounter = () => {
  // Good: Select only what you need
  const bears = useBearStore((state) => state.bears)
  const increase = useBearStore((state) => state.increase)

  return (
    <div>
      <h1>{bears} around here...</h1>
      <button onClick={() => increase(1)}>one up</button>
    </div>
  )
}
```

## Security Considerations
-   **Persistence**: Be careful what you persist to `localStorage`. Do not persist sensitive tokens or PII.
-   **SSOT**: Ensure the store remains the Single Source of Truth; avoid syncing with local component state unnecessarily.
