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
} from 'preact/hooks'
export type MessageListener = (data: any) => void

interface Props {
  children: ComponentChild
}

interface ReturnValue {
  port?: chrome.runtime.Port
  terminalId?: string
  isTabActive?: boolean
}

export const PortContext = createContext<ReturnValue | undefined>(undefined)

export function PortContextProvider({ children }: Props) {
  const portId = useId()
  const [port, setPort] = useState<chrome.runtime.Port>()
  const [terminalId, setTerminalId] = useState<string>()
  const [isTabActive, setIsTabActive] = useState<boolean>()

  const messageHandler = useCallback((msg: any) => {
    console.log('Message handler', msg)
    if (msg.terminalId) setTerminalId(msg.terminalId)
    if (msg.type === 'activated') setIsTabActive(true)
    if (msg.type === 'deactivated') setIsTabActive(false)
  }, [])

  useEffect(function connect() {
    console.log('Will connect to port', portId)
    const p = chrome.runtime.connect({ name: portId })
    p.onMessage.addListener(messageHandler)
    p.postMessage({ type: 'register' })
    setPort(p)
    return () => {
      p.onMessage.removeListener(messageHandler)
    }
  }, [portId, messageHandler])

  const val: ReturnValue = {
    port,
    terminalId,
    isTabActive,
  }
  return (
    <PortContext.Provider value={val}>
      {children}
    </PortContext.Provider>
  )
}

function usePort() {
  const ctx = useContext(PortContext)
  if (!ctx) {
    throw new Error('usePort must be used withing PortContextProvider')
  }
  return ctx
}

export default usePort