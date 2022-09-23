// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from 'preact'
import App from './App'
import { createIsland } from 'preact-island'

const btn = createIsland(App)
btn.render({
  initialProps: { },
  selector: 'html',
})
