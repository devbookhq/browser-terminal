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
import { createDeferredPromise } from './createDeferredPromise'

export const newLine = '\n'

export async function createTerminalProcess(
  cmd: string,
  manager: TerminalManager,
  onData?: (data: string) => void
) {
  let hasStarted = false
  let isRunning = false

  const {
    resolve,
    promise: finished,
  } = createDeferredPromise()

  const finish = () => {
    isRunning = false
    resolve()
  }

  const term = await manager.createSession({
    onData: (data) => onData?.(data),
    onChildProcessesChange: (cps) => {
      if (cps.length > 0) {
        hasStarted = true
        isRunning = true
      } else {
        if (hasStarted) {
          finish()
        }
      }
    },
    size: { cols: 9999, rows: 9999 },
  })

  await term.sendData(cmd + newLine)

  // Ensure that even if the command finished so quickly that it was not reported from the env this function finsihes
  setTimeout(() => {
    hasStarted = true
    if (!isRunning) {
      finish()
    }
  }, 10_000)

  return {
    finished,
    sendData: term.sendData,
    destroy: () => {
      term.destroy()
      finish()
    }
  }
}

//
// == For local debugging of the terminal ==
//
// term.writeln('$ ')
// term.focus()
// term.onKey(function (key, ev) {
//   if (key.key === '\r') {
//     term.writeln('$')
//   } else {
//     term.write(key.key)
//   }
// })
// setTerminal(term)
// return
//
// ====
//

export interface Opts {
  terminalManager?: TerminalManager
}

function useTerminal({
  terminalManager,
}: Opts) {
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

  useEffect(function initialize() {
    async function init() {
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
        const session = await terminalManager.createSession({
          onData: (data) => term.write(data),
          onChildProcessesChange: setChildProcesss,
          size: { cols: term.cols, rows: term.rows },
        })

        term.onData((data) => session.sendData(data))
        term.onResize((size) => session.resize(size))

        setTerminal(term)
        setTerminalSession(session)
        setError(undefined)
        setIsLoading(false)

        return () => {
          term.dispose()
          session.destroy()
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
  }, [terminalManager])

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
  }), [
    terminal,
    childProcesses,
    isLoading,
    error,
    runningProcessID,
    stopCmd,
    runCmd,
    terminalSession,
  ])
}

export default useTerminal