import { configureStore } from '@reduxjs/toolkit'

import filtersReducer from './features/filters/filtersSlice'
import todosReducer from './features/todos/todosSlice'

export const store = configureStore({
  reducer: {
    // Define a top-level state field named `todos`, handled by `todosReducer`
    todos: todosReducer,
    filters: filtersReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
