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

import useTerminal from './useTerminal'
import useSession from './useSession'
import Text from './/Text'
import SpinnerIcon from './Spinner'

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
}

const Terminal = forwardRef<Handler, Props>(({
  onStart,
  autofocus,
  onRunningCmdChange,
  isHidden,
}, ref) => {
  const {
    session,
  } = useSession({ codeSnippetID: 'YG6GSDSZ9Pll' })

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

  return (
    <Fragment>
      {errMessage && (
        <div className={cn(
          'flex-1',
          { flex: !isHidden },
          { hidden: isHidden },
          'justify-center',
          'items-center',
          'bg-black-850',
          'lg:rounded-b-xl',
        )}>
          <Text
            className="text-red-400"
            size={Text.size.S2}
            text={errMessage}
          />
        </div>
      )}

      {isLoading && !errMessage && (
        <div className={cn(
          'flex-1',
          { 'flex': !isHidden },
          { 'hidden': isHidden },
          'justify-center',
          'items-center',
          'bg-black-850',
          'lg:rounded-b-xl',
        )}>
          <SpinnerIcon />
        </div>
      )}

      {!isLoading && !errMessage && (
        <div className={cn(
          'flex-1',
          { 'hidden': isHidden },
          'relative',
          'bg-black-850',
          'lg:rounded-b-xl',
        )}>
          {/*
          * We assign the `sizeRef` and the `terminalRef` to a child element intentionally
          * because the fit addon for xterm.js resizes the terminal based on the PARENT'S size.
          * The child element MUST have set the same width and height of it's parent, hence
          * the `w-full` and `h-full`.
          */}
          <div
            className="
              absolute
              w-full
              h-full
            "
            ref={assignRefs}
          />
        </div>
      )}
    </Fragment>
  )
})

Terminal.displayName = 'Terminal'
export default Terminal