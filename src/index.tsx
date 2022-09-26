// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from 'preact'
import { createIsland } from 'preact-island'
import { PortContextProvider } from './PortProvider'
import App from './App'

const app = () => (
  <PortContextProvider>
    <App/>
  </PortContextProvider>
)

const island = createIsland(app)
island.render({
  initialProps: { },
  selector: 'html',
})
