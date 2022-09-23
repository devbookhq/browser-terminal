// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h, Fragment } from 'preact'
import { useState, useRef } from 'preact/hooks'
import '../styles/embed.css'

import Terminal, { Handler } from './Terminal'
import useOnClickOutside from './useOnClickOutside'

import {
  PortContextProvider,
} from './usePort'

export interface Props {
}

function TerminalButton({
}: Props) {
  const terminalWrapperRef = useRef<HTMLDivElement | null>(null)
  const terminalRef = useRef<Handler>(null)
  const [isHidden, setIsHidden] = useState(true)

  function handleClickOutside() {
    setIsHidden(true)
  }
  function onTerminalButtonClick() {
    setIsHidden(val => !val)
    //terminalRef?.current?.handleInput('')
    setTimeout(() => {
      terminalRef.current?.focus()
    }, 150)
  }

  //useEventListener('keydown', e => {
  //  if (e.code === 'Backquote') {
  //    setIsHidden(false)
  //    setTimeout(() => {
  //      terminalRef.current?.focus()
  //    }, 150)
  //  }
  //})

  useOnClickOutside(terminalWrapperRef, handleClickOutside)

  return (
    <PortContextProvider>
      <div className={`
        ${isHidden ? 'dbk-app dbk-app-hidden' : 'dbk-app'}
      `}
        ref={terminalWrapperRef}
      >
        <div className="dbk-header">
        </div>

        <div className="dbk-terminal">
          <Terminal
            ref={terminalRef}
            onRunningCmdChange={console.log}
            autofocus={true}
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
          {`>_`}
        </button>
      </div>
    </PortContextProvider>
  )
}

export default TerminalButton
