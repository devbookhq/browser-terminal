import {
  h,
  createContext,
  ComponentChild,
} from 'preact'
import {
  useState,
  useCallback,
  useContext,
  useMemo,
} from 'preact/hooks'

import usePortConnection from './usePortConnection'
import usePortMessage, {
  MessageHandler,
  MessageRegisterHandler,
} from './usePortMessage'

export interface Props {
  children: ComponentChild
}

export interface Port {
  port: chrome.runtime.Port
  terminalId?: string
  tabId?: number
  isTabActive?: boolean
}

export const portContext = createContext<Port | undefined>(undefined)

export function PortContextProvider({ children }: Props) {
  const port = usePortConnection()

  const [terminalId, setTerminalId] = useState<string>()
  const [isTabActive, setIsTabActive] = useState<boolean>()
  const [tabId, setTabId] = useState<number>()

  const handleRegistration = useCallback<MessageHandler>((msg) => {
    if (msg.terminalId !== undefined) setTerminalId(msg.terminalId)
    if (msg.tabId !== undefined) setTabId(msg.tabId)
    if (msg.type === 'activated') setIsTabActive(true)
    if (msg.type === 'deactivated') setIsTabActive(false)
  }, [])

  const triggerRegistration = useCallback<MessageRegisterHandler>((port) => port.postMessage({ type: 'register' }), [])

  usePortMessage({
    port,
    onMessage: handleRegistration,
    onMessageRegister: triggerRegistration,
  })

  const value = useMemo(() => {
    if (!port) return
    return {
      port,
      terminalId,
      tabId,
      isTabActive,
    }
  }, [
    port,
    terminalId,
    tabId,
    isTabActive,
  ])

  return (
    <portContext.Provider value={value}>
      {children}
    </portContext.Provider>
  )
}

export interface UsePortOpts {
  onMessage?: MessageHandler
}

// We should pass function wrapped in `useCallback` here so it is not reregistered on every rerender.
function usePort(opts?: UsePortOpts) {
  const ctx = useContext(portContext)
  if (ctx === undefined) {
    throw new Error('usePort must be used within PortContextProvider')
  }

  usePortMessage({
    port: ctx.port,
    onMessage: opts?.onMessage,
  })

  return ctx
}

export default usePort
