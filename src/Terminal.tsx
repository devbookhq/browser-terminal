import { h, Fragment } from 'preact'
import {
  forwardRef,
} from 'preact/compat'
import {
  useEffect,
  useImperativeHandle,
  useRef,
  useLayoutEffect,
  useState,
  useCallback,
  MutableRef,
} from 'preact/hooks'
import cn from 'classnames'
import {
  CodeSnippetExecState,
} from '@devbookhq/sdk'
import { useResizeDetector } from 'react-resize-detector'
import type { FitAddon } from 'xterm-addon-fit'

import '../styles/terminal.css'
import useTerminal from './useTerminal'
import useSession from './useSession'

export interface Handler {
  handleInput: (input: string) => void
  focus: () => void
  resize: () => void
  runCmd: (cmd: string) => Promise<void>
  stopCmd: () => void
}

export interface Props {
  autofocus?: boolean
  onStart?: (handler: Omit<Handler, 'runCmd' | 'stopCmd'>) => (Promise<void> | void)
  onRunningCmdChange: (state: CodeSnippetExecState) => void
  isHidden?: boolean
  onSizeChange: ({rows, cols}: { rows: number, cols: number }) => void
}

const Terminal = forwardRef<Handler, Props>(({
  onStart,
  autofocus,
  onRunningCmdChange,
  isHidden,
  onSizeChange,
}, ref) => {
  const {
    session,
  } = useSession()

  const [fitAddon, setFitAddon] = useState<FitAddon>()
  const terminalRef = useRef(null) as MutableRef<HTMLDivElement | null>
  const {
    terminal,
    terminalSession,
    error: errMessage,
    isLoading,
    runCmd,
    isCmdRunning,
    stopCmd,
    size,
  } = useTerminal({ terminalManager: session?.terminal })

  const onResize = useCallback(() => {
    if (!fitAddon) return

    const dim = fitAddon.proposeDimensions()

    if (!dim) return
    if (isNaN(dim.cols) || isNaN(dim.rows)) return

    fitAddon.fit()
  }, [fitAddon])

  const assignRefs = useCallback((el: HTMLDivElement | null) => {
    terminalRef.current = el
    sizeRef.current = el
  }, [])

  const handleInput = useCallback((input: string) => terminalSession?.sendData(input), [terminalSession])

  const focus = useCallback(() => {
    terminal?.focus()
  }, [
    terminal,
  ])

  const { ref: sizeRef } = useResizeDetector({ onResize })

  useEffect(() => {
    if (!size) return
    onSizeChange(size)
  }, [size])

  useImperativeHandle(ref, () => ({
    handleInput,
    focus,
    runCmd,
    stopCmd,
    resize: onResize,
  }), [
    handleInput,
    focus,
    runCmd,
    stopCmd,
    onResize,
  ])

  useEffect(function updateCmdState() {
    onRunningCmdChange(isCmdRunning ? CodeSnippetExecState.Running : CodeSnippetExecState.Stopped)
  }, [
    isCmdRunning,
    onRunningCmdChange,
  ])

  useLayoutEffect(function attachTerminal() {
    (async function () {
      if (!terminalRef.current) return
      if (!terminal) return

      const fit = await import('xterm-addon-fit')
      const webLinks = await import('xterm-addon-web-links')

      terminal.loadAddon(new webLinks.WebLinksAddon())

      const fitAddon = new fit.FitAddon()
      terminal.loadAddon(fitAddon)

      terminal.open(terminalRef.current)
      fitAddon.fit()

      setFitAddon(fitAddon)

      if (autofocus) terminal.focus()
    })()
  }, [
    terminal,
    autofocus,
  ])

  useEffect(function handleOnStart() {
    if (!onStart) return
    if (!focus) return
    if (!handleInput) return

    onStart({
      handleInput,
      focus,
      resize: onResize,
    })
  }, [
    onStart,
    focus,
    handleInput,
    onResize,
  ])

  // TODO: Handle loading and errMessage
  return (
    <Fragment>
      <div className={cn(
        'dbk-size-terminal-wrapper',
        { 'dbk-terminal-size-wrapper-visible': !isHidden },
        { 'dbk-terminal-size-wrapper-hidden': isHidden },
      )}>
        {/*
        * We assign the `sizeRef` and the `terminalRef` to a child element intentionally
        * because the fit addon for xterm.js resizes the terminal based on the PARENT'S size.
        * The child element MUST have set the same width and height of it's parent, hence
        * the `w-full` and `h-full`.
        */}
        <div
          className="dbk-terminal-el"
          ref={assignRefs}
        />
      </div>
    </Fragment>
  )
})

Terminal.displayName = 'Terminal'
export default Terminal