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
  MessageListener,
  ListenterAddedHandler,
} from './usePortMessage'
import * as message from '../portMessage'

export interface Props {
  children: ComponentChild
}

export interface Port {
  port?: chrome.runtime.Port
  terminalID?: string
  tabID?: number
  isTabActive?: boolean
}

export const portContext = createContext<Port | undefined>(undefined)

export function PortContextProvider({ children }: Props) {
  const port = usePortConnection()

  const [terminalID, setTerminalID] = useState<string>()
  const [isTabActive, setIsTabActive] = useState<boolean>()
  const [tabID, setTabID] = useState<number>()

  const handleMessage = useCallback<MessageListener>((msg: message.Message) => {
    console.log('PORT MESSAGE', msg)
    if (!msg.type) {
      console.error(msg)
      throw new Error(`Received a port message but field 'type' is missing`)
    }
    switch (msg.type) {
      case message.Type.RegisterResponse:
        const { terminalID, tabID } = msg.payload
        setTerminalID(terminalID)
        setTabID(tabID)
      break
      case message.Type.ActivatedEvent:
        setIsTabActive(true)
      break
      case message.Type.DeactivatedEvent:
        setIsTabActive(false)
      break
    }
  }, [])

  const triggerRegistration = useCallback<ListenterAddedHandler>((port) => port.postMessage({ type: message.Type.RegisterRequest }), [])

  usePortMessage({
    port,
    onMessage: handleMessage,
    onListenerAdded: triggerRegistration,
  })

  const value = useMemo(() => ({
    port,
    terminalID,
    tabID,
    isTabActive,
  }), [
    port,
    terminalID,
    tabID,
    isTabActive,
  ])

  return (
    <portContext.Provider value={value}>
      {children}
    </portContext.Provider>
  )
}

export interface UsePortOpts {
  onMessage?: MessageListener
}

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