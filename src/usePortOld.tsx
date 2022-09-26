import {
  h,
  createContext,
  ComponentChild,
} from 'preact'

import {
  useState,
  useEffect,
  useId,
  useCallback,
  useContext,
  useMemo,
} from 'preact/hooks'
export type MessageListener = (data: any) => void

interface Props {
  children: ComponentChild
}

interface ReturnValue {
  port?: chrome.runtime.Port
  terminalId?: string
  tabId?: number
  isTabActive?: boolean
}

export const PortContext = createContext<ReturnValue | undefined>(undefined)

export function PortContextProvider({ children }: Props) {
  const portId = useId()
  const [port, setPort] = useState<chrome.runtime.Port>()
  const [terminalId, setTerminalId] = useState<string>()
  const [isTabActive, setIsTabActive] = useState<boolean>()
  const [tabId, setTabId] = useState<number>()

  const messageHandler = useCallback((msg: any) => {
    console.log('Message handler', msg)
    if (msg.terminalId) setTerminalId(msg.terminalId)
    if (msg.tabId) setTabId(msg.tabId)
    if (msg.type === 'activated') setIsTabActive(true)
    if (msg.type === 'deactivated') setIsTabActive(false)
  }, [])

  useEffect(function connect() {
    const p = chrome.runtime.connect({ name: portId })
    p.onMessage.addListener(messageHandler)
    p.postMessage({ type: 'register' })
    setPort(p)
    return () => {
      p.onMessage.removeListener(messageHandler)
    }
  }, [portId, messageHandler])

  const val = useMemo<ReturnValue>(() => ({
    port,
    terminalId,
    tabId,
    isTabActive,
  }), [
    port,
    terminalId,
    tabId,
    isTabActive,
  ])
  return (
    <PortContext.Provider value={val}>
      {children}
    </PortContext.Provider>
  )
}

// TODO: Ability to pass an onInit function that gets called when we
// receive terminalId. This way a component can send the initial 'CTRL+L'
// to the terminal.
function usePort() {
  const ctx = useContext(PortContext)
  if (ctx === undefined) {
    throw new Error('usePort must be used within PortContextProvider')
  }
  return ctx
}

export default usePort