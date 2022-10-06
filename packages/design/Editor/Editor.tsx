import * as React from 'react'

import type { MonacoOptions } from './hooks/use-monaco'
import { useMonaco } from './hooks/use-monaco'

const MIN_LINE_COUNT = 10
const LINE_HEIGHT = 20

export function Editor({
  value,
  id,
  height,
  lineNumbers,
  folding,
  fontSize,
  focusRange,
  highlightPosition,
  onChange,
  onMount,
}: { height?: string | number } & Omit<MonacoOptions, 'containerRef'>) {
  const ref = React.useRef()
  const countOfLines = value
    ? Math.max(value.split('\n').length, MIN_LINE_COUNT)
    : MIN_LINE_COUNT

  useMonaco({
    containerRef: ref,
    value,
    id,
    lineNumbers,
    folding,
    fontSize,
    focusRange,
    highlightPosition,
    onChange,
    onMount,
  })

  return (
    <div ref={ref} style={{ height: height ?? countOfLines * LINE_HEIGHT }} />
  )
}
