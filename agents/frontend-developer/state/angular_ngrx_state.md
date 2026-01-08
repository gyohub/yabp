# Angular State Management with NgRx (Standalone)

## Golden Rules 🌟
1.  **Feature State**: Use `createFeature` (NgRx 14+) to reduce boilerplate for reducers and selectors.
2.  **Immutability**: NgRx enforces immutability. Never mutate state directly.
3.  **Effects**: Use `createEffect` (functional effects) for side effects like API calls.
4.  **Actions**: Group actions using `createActionGroup` for better organization and type safety.
5.  **Facade Pattern**: optionally wrap the Store in a Facade Service to hide complexity from Components.

## Technology-Specific Best Practices
-   **DevTools**: Always include `provideStoreDevtools()` in your app config for debugging.
-   **Signals**: Use `store.selectSignal()` to consume state as Signals in components.

## Complete Code Example

```typescript
// state/books.actions.ts
import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Book } from './book.model';

export const BooksActions = createActionGroup({
  source: 'Books',
  events: {
    'Enter': emptyProps(),
    'Load Books': emptyProps(),
    'Load Books Success': props<{ books: Book[] }>(),
    'Load Books Failure': props<{ error: string }>(),
  }
});
```

```typescript
// state/books.reducer.ts
import { createFeature, createReducer, on } from '@ngrx/store';
import { BooksActions } from './books.actions';
import { Book } from './book.model';

interface State {
  books: Book[];
  loading: boolean;
  error: string | null;
}

const initialState: State = {
  books: [],
  loading: false,
  error: null,
};

export const booksFeature = createFeature({
  name: 'books',
  reducer: createReducer(
    initialState,
    on(BooksActions.loadBooks, (state) => ({ ...state, loading: true })),
    on(BooksActions.loadBooksSuccess, (state, { books }) => ({ ...state, books, loading: false })),
    on(BooksActions.loadBooksFailure, (state, { error }) => ({ ...state, error, loading: false })),
  ),
});
```

```typescript
// books.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { BooksActions } from './state/books.actions';
import { booksFeature } from './state/books.reducer';

@Component({
  selector: 'app-books',
  standalone: true,
  template: `
    @if (loading()) { <p>Loading...</p> }
    
    <ul>
      @for (book of books(); track book.id) {
        <li>{{ book.title }}</li>
      }
    </ul>
  `
})
export class BooksComponent implements OnInit {
  private store = inject(Store);
  
  // Signal Selectors
  books = this.store.selectSignal(booksFeature.selectBooks);
  loading = this.store.selectSignal(booksFeature.selectLoading);

  ngOnInit() {
    this.store.dispatch(BooksActions.enter());
  }
}
```

## Security Considerations
-   **Secrets**: NgRx state is client-side. Do not store secrets.
-   **Replay Attacks**: Effects that dispatch actions based on other actions should be carefully designed to avoid infinite loops.
