import {
  useState,
  useCallback,
  useEffect,
} from 'preact/hooks'
import usePort from './usePort'

function useTerminalId() {
  const [terminalId, setTerminalId] = useState()
  const port = usePort()

  const messageHandler = useCallback((msg: any) => {
    console.log('Message handler terminal', msg)
    if (msg.terminalId) setTerminalId(msg.terminalId)
  }, [])

  useEffect(function registerHandler() {
    console.log('Register terminal handler', port)
    if (!port) return

    port.onMessage.addListener(messageHandler)
    return () => {
      port.onMessage.removeListener(messageHandler)
    }
  }, [port, messageHandler])

  console.log('Will return terminalID', { terminalId })
  return terminalId
}

export default useTerminalId