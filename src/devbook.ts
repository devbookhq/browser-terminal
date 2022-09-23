// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from 'preact'
import TerminalButton from './TerminalButton'
import { createIsland } from 'preact-island'

const btn = createIsland(TerminalButton)
btn.render({
  initialProps: { },
  selector: 'html',
})
