// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h, Fragment } from 'preact'
import { useState, useRef } from 'preact/hooks'
import '../styles/embed.css'

import Terminal from './Terminal'
import useOnClickOutside from './useOnClickOutside'

export interface Props {
}

function TerminalButton({
}: Props) {
  const terminalWrapperRef = useRef<HTMLDivElement | null>(null)
  const [isHidden, setIsHidden] = useState(true)

  function  handleClickOutside() {
    console.log('Clicked outside!')
    setIsHidden(true)
  }

  useOnClickOutside(terminalWrapperRef, handleClickOutside)

  return (
    <Fragment>
      <div className={`
        ${isHidden ? 'dbk-terminal dbk-terminal-hidden' : 'dbk-terminal'}
      `}
        ref={terminalWrapperRef}
      >
        <Terminal
          onRunningCmdChange={console.log}
          autofocus={true}
        />
      </div>

      <button
        className="
          dbk-button
        "
        onClick={() => setIsHidden(val => !val)}
      >
        Open terminal
      </button>
    </Fragment>
  )
}

export default TerminalButton
