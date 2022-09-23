// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from 'preact'
import TerminalButton from './TerminalButton'
import { createIsland } from 'preact-island'

//const body = document.querySelector('body')
//if (!body) {
//  throw new Error('body element not found')
//}

//const shadow = body.attachShadow({ mode: 'open' })
//const renderIn = document.createElement('div')
//renderIn.id = 'dbk-root'
//shadow.appendChild(renderIn)


//const island = createIsland(TerminalButton)
//island.render({
//  initialProps: {},
//  selector: '#dbk-root'
//})


const btn = createIsland(TerminalButton)
btn.render({
  initialProps: { },
  selector: 'html',
  // inline: true
})
