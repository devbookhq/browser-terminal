// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from 'preact'
import { createIsland } from 'preact-island'

import TerminalButton from './TerminalButton'

const btn = createIsland(TerminalButton)
btn.render({
  initialProps: {
  },
  //selector: 'body',
  selector: '#dbk',
  // inline: true
})
