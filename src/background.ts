import {
  Session,
} from '@devbookhq/sdk'

chrome.action.onClicked.addListener(tab => {
  //chrome.scripting.executeScript({
  //  target: { tabId: tab.id! },
  //  files: ['devbook.js']
  //})
})

//
//
//chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
//  console.log('TAB UPDATED', tabId)
//  chrome.scripting.executeScript({
//    target: { tabId },
//    files: ['dist/devbook.js']
//  })
//})
//

const ports = new Map<number, chrome.runtime.Port>()
let terminalId = ''

function notifyActiveTab(tabId: number) {
  console.log('Tab activated', tabId)

  const port = ports.get(tabId)
  if (!port) {
    throw new Error(`Tab '${tabId}' activated but has no associated port with it`)
  }

  ports.forEach((p, tid) => {
    if (tid !== tabId) {
      p.postMessage({ type: 'deactivated' })
    }
  })
  port.postMessage({ type: 'activated' })
}

const session = new Session({
  id: 'placeholder',
  debug: true,
  __debug_hostname: '127.0.0.1',
  __debug_devEnv: 'local',
})

session
.open()
.then(() => {
  console.log('devbookd session opened, creating new terminal...')
  return session.terminal?.createSession({
    onData: () => {},
    onChildProcessesChange: () => {},
    size: { cols: 9999, rows: 9999 },
  })
})
.then(term => {
  if (!term) throw new Error('failed to create new terminal')
  terminalId = term.terminalID
  console.log('New terminal created with ID', terminalId)
})

chrome.tabs.onActivated.addListener(({ tabId }) => {
  notifyActiveTab(tabId)
})

// Sometimes chrome.tabs.onActivated didn't trigger when changing
// windows. This approach did though.
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  const [tab] = await chrome.tabs.query({ windowId, active: true })

  const tabId = tab.id
  if (!tabId) {
    console.log({activeTab: tab})
    throw new Error('Chrome windows focus has changed but new active tab has no ID')
  }

  notifyActiveTab(tabId)
})

chrome.runtime.onConnect.addListener(port => {
  const tabId = port.sender?.tab?.id
  if (!tabId) {
    console.log({ portName: port.name })
    throw new Error('New connection but port has no tab ID')
  }

  console.log('New port connection', { tabId, portName: port.name })
  ports.set(tabId, port)

  port.onDisconnect.addListener(port => {
    console.log('Port disconnected', { portName: port.name })
    const tabId = port.sender?.tab?.id
    if (!tabId) {
      throw new Error('Cannot remove port from the map, port has no tab ID')
    }
    ports.delete(tabId)
  })

  port.onMessage.addListener(msg => {
    console.log('Received message on port', { portName: port.name, tabId: port.sender?.tab?.id, msg })
    if (msg.type === 'register') {
      port.postMessage({ terminalId })

      // TODO: I'm not sure if this is necessary because `chrome.tabs.onActivated` might trigger.
      ports.forEach((p, tid) => {
        if (tid !== tabId) {
          p.postMessage({ type: 'deactivated' })
        }
      })
      port.postMessage({ type: 'activated' })
    }
  })
})
