import fetch from 'isomorphic-fetch'
import { Session } from '@devbookhq/sdk'
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
const portManager = new PortManager()

async function pingDevbookd() {
  return fetch('http://127.0.0.1:8010/ping', {
    method: 'GET',
  })
}

async function main() {
  try {
    await pingDevbookd()
    console.log('Devbookd is running')
  } catch(err) {
    console.error('Error pinging devbookd', err)
    chrome.tabs.create({
      active: true,
      url: 'https://usedevbook.com/browser-terminal/install',
    })
    // TODO: Prompt user to install devbookd
  }

  await session.open()
  console.log('devbookd session opened, creating new terminal...')
  const term = await session.terminal?.createSession({
    onData: () => {},
    onChildProcessesChange: () => {},
    size: { cols: 9999, rows: 9999 },
  })
  if (!term) throw new Error('failed to create new terminal')
  console.log('New terminal created with ID', term.terminalID)

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

  chrome.runtime.onConnect.addListener(port => {
    console.log('New port connection', { portName: port.name })
    portManager.add(port, term.terminalID)
  })
}

main()
