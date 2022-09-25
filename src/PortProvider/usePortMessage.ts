import {
  useEffect,
} from 'preact/hooks'

export type MessageHandler<T = any> = (data: T) => void
export type MessageRegisterHandler = (port: chrome.runtime.Port) => void

export interface Opts {
  port?: chrome.runtime.Port
  onMessage?: MessageHandler
  onMessageRegister?: MessageRegisterHandler
}

function usePortMessage({
  port,
  onMessage,
  onMessageRegister,
}: Opts) {
  useEffect(function registerHandler() {
    if (!port) return
    if (!onMessage) return

    port.onMessage.addListener(onMessage)
    onMessageRegister?.(port)

    return () => {
      port.onMessage.removeListener(onMessage)
    }
  }, [
    port,
    onMessageRegister,
    onMessage,
  ])
}

export default usePortMessage
