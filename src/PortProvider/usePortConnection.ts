import {
  useState,
  useEffect,
  useId,
} from 'preact/hooks'

function usePortConnection() {
  const portId = useId()
  const [port, setPort] = useState<chrome.runtime.Port>()

  useEffect(function connectPort() {
    const newPort = chrome.runtime.connect({ name: portId })
    setPort(newPort)
    return () => {
      newPort.disconnect()
    }
  }, [portId])

  return port
}

export default usePortConnection