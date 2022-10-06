// modified from: https://github.com/suren-atoyan/monaco-react/blob/master/src/Editor/Editor.js
import * as React from 'react'
import loader from '@monaco-editor/loader'
import { kebabCase } from 'case-anything'
import { usePlaygroundElements, usePlaygroundPosition } from 'atoms'

import { initializeMonaco } from '../utils/initialize-monaco'
import type { Monaco } from '../utils/initialize-monaco'

export type MonacoOptions = {
  containerRef: React.RefObject<HTMLElement>
  value?: string
  id?: number
  lineNumbers?: boolean
  folding?: boolean
  fontSize?: number
  focusRange?: { column: number; lineNumber: number }
  highlightPosition?: boolean
  onChange?: (value: string) => void
  onMount?: () => void
}

export function useMonaco({
  containerRef,
  value,
  id,
  lineNumbers,
  folding,
  fontSize,
  focusRange,
  highlightPosition,
  onChange,
  onMount,
}: MonacoOptions) {
  const [isMounting, setIsMounting] = React.useState(true)
  const monacoRef = React.useRef<Monaco>(null)
  const editorRef = React.useRef<ReturnType<Monaco['editor']['create']>>(null)
  const decorationsRef = React.useRef([])
  const [elements] = usePlaygroundElements()
  const [position, setPosition] = usePlaygroundPosition()
  const [instancePosition, setInstancePosition] = React.useState(null)

  React.useEffect(() => {
    const cancelable = loader.init()

    cancelable
      .then(async (monaco) => {
        monacoRef.current = monaco
        editorRef.current = await initializeMonaco({
          container: containerRef.current,
          monaco,
          defaultValue: value,
          id,
          lineNumbers,
          folding,
          fontSize,
          onOpenEditor: (input) => {
            const [base, filename] = input.resource.path
              .replace('/node_modules/', '') // trim node_modules prefix used by Monaco Editor
              .replace('.d.ts', '') // trim .d.ts suffix from decalaration
              .split('/') // finally split the path into an array
            if (base === 'components' || base === 'hooks') {
              window.open(
                filename === 'index'
                  ? `/${base}`
                  : `/${base}/${kebabCase(filename)}`,
                '_blank'
              )
            }
          },
        })
        if (onMount) {
          /**
           * Add delay to account for loading grammars
           * TODO: look into basing on actual grammar loading time
           */
          // setTimeout(() => {
          onMount()
          // }, 300)
        }
        setIsMounting(false)
      })
      .catch((error) => {
        if (error?.type !== 'cancelation') {
          console.error('Monaco initialization: error:', error)
        }
      })

    return () => {
      if (editorRef.current) {
        editorRef.current.getModel()?.dispose()
        editorRef.current.dispose()
      } else {
        cancelable.cancel()
      }
    }
  }, [])

  /** Focus the editor on mount. */
  React.useEffect(() => {
    if (isMounting) return

    editorRef.current.focus()

    if (focusRange) {
      editorRef.current.setPosition(focusRange)
    }
  }, [isMounting])

  React.useEffect(() => {
    if (isMounting) return

    const handleChange = editorRef.current.onDidChangeModelContent(() => {
      onChange(editorRef.current.getValue())
    })

    return () => handleChange.dispose()
  }, [isMounting])

  React.useEffect(() => {
    if (isMounting) return

    const handleChangeCursor = editorRef.current.onDidChangeCursorPosition(
      () => {
        const { lineNumber, column } = editorRef.current.getPosition()
        const element = elements.list
          .slice()
          .reverse()
          .find((element) => {
            const { startLine, endLine, startColumn, endColumn } =
              element.position
            return startLine === endLine
              ? lineNumber >= startLine &&
                  lineNumber <= endLine &&
                  column >= startColumn &&
                  column <= endColumn + 1
              : lineNumber >= startLine && lineNumber <= endLine
          })

        /**
         * TODO: Need to account for multiple cursors.
         */
        if (element?.type === 'component' || element?.type === 'instance') {
          const componentIndex = elements.list.findIndex(
            (node) => node.type === 'component' && node.name === element.name
          )
          /**
           * If the component is not found then we assume it is being imported.
           * Otherwise we try to find the component in the same file.
           */
          if (componentIndex === -1) {
            setPosition(element.position)
            setInstancePosition(null)
          } else {
            /**
             * TODO: This needs to recursively find the element since it could be another instance.
             */
            const firstElement = elements.list[componentIndex + 1]
            if (firstElement) {
              setPosition(firstElement.position)
              setInstancePosition(element.position)
            } else {
              setPosition(element.position)
              setInstancePosition(null)
            }
          }
        } else {
          setPosition(element ? element.position : null)
          setInstancePosition(null)
        }
      }
    )

    return () => handleChangeCursor.dispose()
  }, [isMounting, elements?.list])

  React.useEffect(() => {
    if (isMounting) return

    const handleBlur = editorRef.current.onDidBlurEditorWidget(() => {
      setPosition(null)
    })

    return () => handleBlur.dispose()
  }, [isMounting])

  React.useEffect(() => {
    if (isMounting) return

    const handleKeyDown = editorRef.current.onKeyDown(async (event) => {
      /** Format file on save (metaKey + s) */
      if (event.keyCode === 49 && event.metaKey) {
        event.preventDefault()
        editorRef.current.getAction('editor.action.formatDocument').run()
      }
    })

    return () => handleKeyDown.dispose()
  }, [isMounting])

  React.useEffect(() => {
    if (editorRef.current && editorRef.current.getValue() !== value) {
      const currentModel = editorRef.current.getModel()
      if (currentModel) {
        editorRef.current.executeEdits('', [
          {
            range: currentModel.getFullModelRange(),
            text: value,
            forceMoveMarkers: true,
          },
        ])
        editorRef.current.pushUndoStop()
      } else {
        editorRef.current.setValue(value)
      }

      /** Clear out highlight ranges when changing the value */
      setPosition(null)
      setInstancePosition(null)
    }
  }, [value])

  React.useEffect(() => {
    if (isMounting || !highlightPosition) return

    const ranges = []

    if (position) {
      ranges.push({
        range: new monacoRef.current.Range(
          position.startLine,
          position.startColumn,
          position.endLine,
          position.endColumn
        ),
        options: {
          className: 'line-decorator',
          isWholeLine: true,
        },
      })
    }

    if (instancePosition) {
      ranges.push({
        range: new monacoRef.current.Range(
          instancePosition.startLine,
          instancePosition.startColumn,
          instancePosition.endLine,
          instancePosition.endColumn
        ),
        options: {
          className: 'line-decorator--instance',
          isWholeLine: true,
        },
      })
    }

    decorationsRef.current = editorRef.current.deltaDecorations(
      decorationsRef.current,
      ranges
    )
  }, [position, highlightPosition, instancePosition, isMounting])
}
