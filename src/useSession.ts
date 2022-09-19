import {
  useCallback,
  useEffect,
  useState
} from 'preact/hooks'
import {
  Session,
  CodeSnippetExecState,
  ProcessManager,
  OutStdoutResponse,
  OutStderrResponse,
} from '@devbookhq/sdk'
import { useIdleTimer } from 'react-idle-timer'

import { createDeferredPromise } from './createDeferredPromise'

export const rootdir = '/code'

export async function createSessionProcess(
  cmd: string,
  manager?: ProcessManager,
  onStdout?: (o: OutStdoutResponse) => void,
  onStderr?: (o: OutStderrResponse) => void,
  processID?: string,
) {
  if (!manager) {
    throw new Error('Cannot create process - process manager is not defined')
  }

  const {
    resolve,
    promise: exited,
  } = createDeferredPromise()

  const onExit = () => {
    resolve()
  }

  const process = await manager.start({
    cmd,
    onStdout,
    onStderr,
    onExit,
    rootdir,
    processID,
  })

  return {
    exited,
    processID: process.processID,
    kill: process.kill,
    sendStdin: process.sendStdin,
  }
}

export type SessionState = 'closed' | 'opening' | 'open'

export enum CodeSnippetExtendedState {
  Failed = 'Failed',
  Loading = 'Loading',
}

export type CodeSnippetState = CodeSnippetExtendedState | CodeSnippetExecState

export interface Opts {
  codeSnippetID?: string
  debug?: boolean
}

function useSession({
  /**
   * If the `codeSnippetID` is undefined the session will not be initialized.
   */
  codeSnippetID,
  /**
   * If enabled, the edits to a VM's filesystem will be saved for the next session.
   */
  debug,
}: Opts) {
  const [sessionState, setSessionState] = useState<{
    session?: Session,
    state: SessionState,
    id?: string,
    open?: Promise<void>
  }>({ state: 'closed' })
  const initSession = useCallback(async () => {
    if (!codeSnippetID) return

    const newSession = new Session({
      id: codeSnippetID,
      onDisconnect() {
        setSessionState(s => s.session === newSession ? { ...s, state: 'closed' } : s)
      },
      onReconnect() {
        setSessionState(s => s.session === newSession ? { ...s, state: 'open' } : s)
      },
      onClose() {
        setSessionState(s => s.session === newSession ? { ...s, state: 'closed' } : s)
      },
      debug,
      __debug_hostname: '127.0.0.1',
      __debug_devEnv: 'local',
    })

    const open = newSession.open()
    let close: (() => Promise<void>) | undefined

    setSessionState(oldState => {
      oldState.session?.close().catch((err) => {
        console.error(err)
      })
      return { session: newSession, state: 'opening', id: codeSnippetID, open }
    })

    await open

    setSessionState(s => s.session === newSession ? { ...s, state: 'open' } : s)

    return { session: newSession, close }
  }, [
    debug,
    codeSnippetID,
  ])

  const onIdle = useCallback(() => {
    setSessionState(s => {
      if (s.state === 'closed') return s

      s.session?.close().catch((err) => {
        console.error(err)
      })

      return { state: 'closed' }
    })
  }, [])

  const {
    reset,
  } = useIdleTimer({
    timeout: 20 * 60 * 1000,
    onIdle,
  })

  /**
   * This function resets the idle timer and creates a new session if the current one is not active.
   */
  const refresh = useCallback(async () => {
    reset()
    if (sessionState.state === 'closed') {
      const result = await initSession()
      return { session: result?.session }
    } else {
      await sessionState.open
      return { session: sessionState.session }
    }
  }, [
    sessionState,
    initSession,
    reset,
  ])

  useEffect(function startSession() {
    const result = initSession()

    return () => {
      result.then(r => r?.close?.())
    }
  }, [initSession])


  return {
    refresh,
    session: sessionState.state === 'open' ? sessionState.session : undefined,
    state: sessionState.state,
  }
}

export default useSession