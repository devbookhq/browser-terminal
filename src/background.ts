import fetch from 'isomorphic-fetch'
import {
  Session,
  TerminalSession,
} from '@devbookhq/sdk'
import { PortManager } from './port'

//chrome.action.onClicked.addListener(tab => {
//  //chrome.scripting.executeScript({
//  //  target: { tabId: tab.id! },
//  //  files: ['index.js']
//  //})
//})

//
//
//chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
//  console.log('TAB UPDATED', tabId)
//  chrome.scripting.executeScript({
//    target: { tabId },
//    files: ['index.js']
//  })
//})
//


const session = new Session({
  id: 'placeholder',
  debug: true,
  __debug_hostname: '127.0.0.1',
  __debug_devEnv: 'local',
})
let term: TerminalSession | undefined
const portManager = new PortManager()

function pingDevbookd() {
  return fetch('http://127.0.0.1:49982/ping', {
    method: 'GET',
  })
}

async function init() {
  // We check if devbookd is runing. If not, we open a tab prompting user to install devbookd
  try {
    await pingDevbookd()
    // This makes sure we don't reinitialize temrin, if init is called multiple times.
    if (term) return
  } catch(err) {
    console.error('Error pinging devbookd', err)
    chrome.tabs.create({
      active: true,
      url: 'https://usedevbook.com/browser-terminal/install',
    })
    term = undefined
    return
  }

  await session.open()
  console.log('devbookd session opened, creating new terminal...')
  term = await session.terminal?.createSession({
    onData: () => {},
    onChildProcessesChange: () => {},
    size: { cols: 9999, rows: 9999 },
  })
  if (!term) throw new Error('failed to create new terminal')
  console.log('New terminal created with ID', term.terminalID)
}

// Initialize the extension when user clicks on the extension icon.
chrome.action.onClicked.addListener(() => {
  init()
  // TODO: Toggle the terminal window.
})

// When a new port connects.
chrome.runtime.onConnect.addListener(port => {
  console.log('New port connection', { portName: port.name })
  if (!term) throw new Error('Cannot add new port to port manager, terminal is undefined')
  portManager.add(port, term.terminalID)
})

// When a user changes activate tab.
chrome.tabs.onActivated.addListener(tabInfo => {
  portManager.activateTab(tabInfo.tabId)
})

// Sometimes chrome.tabs.onActivated didn't trigger when changing
// windows. This approach did though.
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  const [tab] = await chrome.tabs.query({ windowId, active: true })

  const tabID = tab.id
  if (!tabID) {
    console.error('Chrome windows focus has changed but new active tab has no ID', { activeTab: tab })
    return
  }

  portManager.activateTab(tabID)
})

init()
