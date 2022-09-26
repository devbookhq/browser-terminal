import {
  useEffect,
} from 'preact/hooks'

export type MessageListener<T = any> = (data: T) => void
export type ListenterAddedHandler = (port: chrome.runtime.Port) => void

export interface Opts {
  port?: chrome.runtime.Port
  onMessage?: MessageListener
  onListenerAdded?: ListenterAddedHandler
}

function usePortMessage({
  port,
  onMessage,
  onListenerAdded,
}: Opts) {
  useEffect(function registerHandler() {
    if (!port) return
    if (!onMessage) return

    port.onMessage.addListener(onMessage)
    onListenerAdded?.(port)

    return () => {
      port.onMessage.removeListener(onMessage)
    }
  }, [
    port,
    onListenerAdded,
    onMessage,
  ])
}

export default usePortMessage