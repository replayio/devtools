import { PayloadAction, createSlice } from '@reduxjs/toolkit'

export const StatusFilters = {
  All: 'all',
  Active: 'active',
  Completed: 'completed',
} as const

interface FiltersState {
  status: 'all' | 'active' | 'completed'
  colors: string[]
}

const initialState: FiltersState = {
  status: StatusFilters.All,
  colors: [],
}

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    statusFilterChanged(state, action) {
      state.status = action.payload
    },
    colorFilterChanged: {
      reducer(
        state,
        action: PayloadAction<{
          color: string
          changeType: 'added' | 'removed'
        }>
      ) {
        let { color, changeType } = action.payload
        const { colors } = state
        switch (changeType) {
          case 'added': {
            if (!colors.includes(color)) {
              colors.push(color)
            }
            break
          }
          case 'removed': {
            state.colors = colors.filter(
              (existingColor) => existingColor !== color
            )
            break
          }
          default:
            return
        }
      },
      prepare(color, changeType) {
        return {
          payload: { color, changeType },
        }
      },
    },
  },
})

export const { colorFilterChanged, statusFilterChanged } = filtersSlice.actions

export default filtersSlice.reducer
