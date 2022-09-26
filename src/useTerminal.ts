import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'preact/hooks'
import type { Terminal as XTermTerminal } from 'xterm'
import {
  TerminalManager,
  TerminalSession,
  ChildProcess,
} from '@devbookhq/sdk'

// import usePort from './usePort'
import usePort from './PortProvider'
import * as portMessage from './portMessage'

export const newLine = '\n'

interface SessionDataProxy {
  onDataHandler?: (data: string) => void
  onData: (data: string) => void
}

export interface Opts {
  terminalManager?: TerminalManager
}

function useTerminal({
  terminalManager,
}: Opts) {
  const [size, setSize] = useState<{ rows: number, cols: number }>()
  const [sessionDataProxy, setSessionDataProxy] = useState<SessionDataProxy>()
  const [terminal, setTerminal] = useState<XTermTerminal>()
  const [terminalSession, setTerminalSession] = useState<TerminalSession>()
  const [error, setError] = useState<string>()
  const [isLoading, setIsLoading] = useState(true)
  const [childProcesses, setChildProcesss] = useState<ChildProcess[]>([])
  const [runningProcessCmd, setRunningProcessCmd] = useState<string>()
  const [cmd, setCmd] = useState<{ cmdContent?: string, wasExecuted?: boolean }>({})
  const runningProcessID = useMemo(() => {
    if (runningProcessCmd && childProcesses.length > 0) {
      return childProcesses[0].pid
    }
    return undefined
  }, [runningProcessCmd, childProcesses])

  const runCmd = useCallback(async (cmd: string) => {
    setCmd({ cmdContent: cmd, wasExecuted: false })
  }, [])

  const stopCmd = useCallback(() => {
    if (!runningProcessID) return
    terminalManager?.killProcess(runningProcessID)
  }, [
    runningProcessID,
    terminalManager,
  ])

  const portMessageHandler = useCallback((msg: portMessage.Message) => {
    console.log('PORT MESSAGE HANDLER:', msg.type, { terminalSession })
    if (msg.type === portMessage.Type.RegisterResponse) {
      terminalSession?.sendData('\x0C')
    }
  }, [terminalSession])

  const { isTabActive, terminalID: terminalId } = usePort({
    onMessage: portMessageHandler,
  })

  useEffect(function resizeTerminalOnActiveTab() {
    if (!isTabActive) return
    if (!terminal) return
    if (!terminalSession) return
    console.log('Resizing terminal', { cols: terminal.cols, rows: terminal.rows })
    terminalSession.resize({ cols: terminal.cols, rows: terminal.rows })
  }, [
    isTabActive,
    terminal,
    terminalSession,
  ])

  useEffect(function toggleTerminalWriteDataOnActiveTab() {
    if (!isTabActive) {
      if (!sessionDataProxy) return
      sessionDataProxy.onDataHandler = undefined
    } else {
      if (!sessionDataProxy) return
      if (!terminal) return
      sessionDataProxy.onDataHandler = data => terminal.write(data)
    }

    return () => {
      sessionDataProxy.onDataHandler = undefined
    }
  }, [isTabActive, terminal, sessionDataProxy])

  useEffect(function initialize() {
    async function init() {
      if (!terminalId) return
      if (!terminalManager) return

      setRunningProcessCmd(undefined)
      setChildProcesss([])

      setIsLoading(true)
      const xterm = await import('xterm')

      const term = new xterm.Terminal({
        bellStyle: 'none',
        cursorStyle: 'block',
        fontSize: 13,
        theme: {
          background: 'rgba(0, 0, 0, 0)',
          foreground: '#FFFFFF',
          cursor: '#FFFFFF',
        },
        allowTransparency: true,
      })

      try {
        const newProxy: SessionDataProxy = {
          onDataHandler: data => term.write(data),
          onData: (data: string) => {
            newProxy.onDataHandler?.(data)
          },
        }

        console.log('Creating new terminal session', terminalId)
        const tsession = await terminalManager.createSession({
          terminalID: terminalId,
          //onData: (data) => term.write(data),
          onData: data => newProxy.onData(data),
          onChildProcessesChange: setChildProcesss,
          size: { cols: term.cols, rows: term.rows },
        })
        console.log('SENDING CTRL+L')
        tsession.sendData('\x0C')

        term.onData((data) => tsession.sendData(data))
        term.onResize((size) => {
          setSize(size)
          tsession.resize(size)
        })

        setSessionDataProxy(newProxy)
        setTerminal(term)
        setTerminalSession(tsession)
        setError(undefined)
        setIsLoading(false)

        return () => {
          newProxy.onDataHandler = undefined
          term.dispose()
          setTerminal(undefined)
        }
      } catch (err: any) {
        console.error(err.message)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    const disposePromise = init()
    return () => {
      setChildProcesss([])
      setRunningProcessCmd(undefined)
      disposePromise.then((dispose) => dispose?.())
    }
  }, [
    terminalManager,
    terminalId,
  ])

  useEffect(function executeCmd() {
    if (!cmd.wasExecuted && cmd.cmdContent && terminalSession) {
      setRunningProcessCmd(cmd.cmdContent);
      (async function () {
        try {
          await terminalSession?.sendData('\x0C' + cmd.cmdContent + '\n')
          setCmd(c => ({ cmdContent: c.cmdContent, wasExecuted: true }))
        } catch (e) {
          setRunningProcessCmd(undefined)
        }
      })()
    }
  }, [
    cmd,
    terminalSession,
  ])

  return useMemo(() => ({
    terminal,
    terminalSession,
    error,
    isLoading,
    stopCmd,
    isCmdRunning: !!runningProcessID,
    runCmd,
    childProcesses,
    size,
  }), [
    terminal,
    childProcesses,
    isLoading,
    error,
    runningProcessID,
    stopCmd,
    runCmd,
    terminalSession,
    size,
  ])
}

export default useTerminal