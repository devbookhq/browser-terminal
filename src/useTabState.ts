import {
  useState,
  useCallback,
  useEffect,
} from 'preact/hooks'
import usePort from './usePort'

function useTabState() {
  const [isActive, setIsActive] = useState(false)
  const port = usePort()

  const messageHandler = useCallback((msg: any) => {
    console.log('Message handler tabState', msg)
    if (msg.type === 'activated') setIsActive(true)
    if (msg.type === 'deactivated') setIsActive(false)
  }, [])

  useEffect(function registerHandler() {
    console.log('Register tabState handler', port)
    if (!port) return

    port.onMessage.addListener(messageHandler)
    return () => {
      port.onMessage.removeListener(messageHandler)
    }
  }, [port, messageHandler])
  return isActive
}

export default useTabState