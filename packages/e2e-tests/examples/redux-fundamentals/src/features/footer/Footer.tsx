import { useAppDispatch, useAppSelector } from '../../hooks'
import { availableColors, capitalize } from '../filters/colors'
import {
  StatusFilters,
  colorFilterChanged,
  statusFilterChanged,
} from '../filters/filtersSlice'
import {
  allTodosCompleted,
  completedTodosCleared,
  selectTodos,
} from '../todos/todosSlice'

const RemainingTodos = ({ count }: { count: number }) => {
  const suffix = count === 1 ? '' : 's'

  return (
    <div className="todo-count">
      <h5>Remaining Todos</h5>
      <strong>{count}</strong> item{suffix} left
    </div>
  )
}

interface StatusFilterProps {
  value: string
  onChange: (value: string) => void
}

const StatusFilter = ({ value: status, onChange }: StatusFilterProps) => {
  const renderedFilters = Object.keys(StatusFilters).map((key) => {
    const value = StatusFilters[key as keyof typeof StatusFilters]
    const handleClick = () => onChange(value)
    const className = value === status ? 'selected' : ''

    return (
      <li key={value}>
        <button className={className} onClick={handleClick}>
          {key}
        </button>
      </li>
    )
  })

  return (
    <div className="filters statusFilters">
      <h5>Filter by Status</h5>
      <ul>{renderedFilters}</ul>
    </div>
  )
}

interface ColorFiltersProps {
  value: string[]
  onChange: (value: string, changeType: 'added' | 'removed') => void
}

const ColorFilters = ({ value: colors, onChange }: ColorFiltersProps) => {
  const renderedColors = availableColors.map((color) => {
    const checked = colors.includes(color)
    const handleChange = () => {
      const changeType = checked ? 'removed' : 'added'
      onChange(color, changeType)
    }

    return (
      <label key={color}>
        <input
          type="checkbox"
          name={color}
          checked={checked}
          onChange={handleChange}
        />
        <span
          className="color-block"
          style={{
            backgroundColor: color,
          }}
        ></span>
        {capitalize(color)}
      </label>
    )
  })

  return (
    <div className="filters colorFilters">
      <h5>Filter by Color</h5>
      <form className="colorSelection">{renderedColors}</form>
    </div>
  )
}

const Footer = () => {
  const dispatch = useAppDispatch()

  const todosRemaining = useAppSelector((state) => {
    const uncompletedTodos = selectTodos(state).filter(
      (todo) => !todo.completed
    )
    return uncompletedTodos.length
  })

  const { status, colors } = useAppSelector((state) => state.filters)

  const onMarkCompletedClicked = () => dispatch(allTodosCompleted())
  const onClearCompletedClicked = () => dispatch(completedTodosCleared())

  const onColorChange = (color: string, changeType: 'added' | 'removed') =>
    dispatch(colorFilterChanged(color, changeType))

  const onStatusChange = (status: string) =>
    dispatch(statusFilterChanged(status))

  return (
    <footer className="footer">
      <div className="actions">
        <h5>Actions</h5>
        <button className="button" onClick={onMarkCompletedClicked}>
          Mark All Completed
        </button>
        <button className="button" onClick={onClearCompletedClicked}>
          Clear Completed
        </button>
      </div>

      <RemainingTodos count={todosRemaining} />
      <StatusFilter value={status} onChange={onStatusChange} />
      <ColorFilters value={colors} onChange={onColorChange} />
    </footer>
  )
}

export default Footer
