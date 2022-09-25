// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h, Fragment } from 'preact'
import { useState, useRef, useEffect } from 'preact/hooks'
import '../styles/app.css'

import Terminal, { Handler } from './Terminal'
import useOnClickOutside from './useOnClickOutside'

import usePort from './PortProvider'

export interface Props {
}

function App({
}: Props) {
  const [size, setSize] = useState<{ rows: number, cols: number }>()
  const { isTabActive, terminalId, tabId } = usePort()
  const terminalWrapperRef = useRef<HTMLDivElement | null>(null)
  const terminalRef = useRef<Handler>(null)
  const [isHidden, setIsHidden] = useState(true)

  function handleClickOutside() {
    setIsHidden(true)
  }

  function onTerminalButtonClick() {
    setIsHidden(val => !val)
    //terminalRef?.current?.handleInput('')
    terminalRef.current?.handleInput('\x0C')
    setTimeout(() => {
      terminalRef.current?.focus()
    }, 150)
  }

  useOnClickOutside(terminalWrapperRef, handleClickOutside)

  return (
    <Fragment>
      <div className={`
        ${isHidden ? 'dbk-app dbk-app-hidden' : 'dbk-app'}
      `}
        ref={terminalWrapperRef}
      >
        <div className="dbk-header">
          <div className="dbk-header-section">
            tabID: {tabId}
          </div>
          <div className="dbk-header-section">
            terminalID: {terminalId}
          </div>
          <div className="dbk-header-section">
            isTabActive: {isTabActive ? 'true' : 'false'}
          </div>
          <div className="dbk-header-section">
            rows: {size?.rows}
            {', '}
            cols: {size?.cols}
          </div>
        </div>

        <div className="dbk-terminal">
          <Terminal
            ref={terminalRef}
            onRunningCmdChange={console.log}
            autofocus={true}
            onSizeChange={setSize}
          />
        </div>
      </div>

      <div className="dbk-btn-wrapper">
        <button
          className="
            dbk-button
          "
          onClick={onTerminalButtonClick}
        >
          {`>_ (${terminalId};${isTabActive})`}
        </button>
      </div>
    </Fragment>
  )
}

export default App
