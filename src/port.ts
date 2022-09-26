import * as message from './portMessage'

export class Port implements chrome.runtime.Port {
  isTabActive = false
  get tabID() { return this.port.sender?.tab?.id }
  get name() { return this.port.name }
  get onMessage() { return this.port.onMessage }
  get onDisconnect() { return this.port.onDisconnect }

  constructor(
    private portManager: PortManager,
    private port: chrome.runtime.Port,
    private terminalID: string,
  ) {
    this.disconnectHandler = this.disconnectHandler.bind(this)
    this.messageHandler = this.messageHandler.bind(this)

    this.port.onDisconnect.addListener(this.disconnectHandler)
    this.port.onMessage.addListener(this.messageHandler)
  }

  destroy() {
    this.port.onDisconnect.removeListener(this.disconnectHandler)
    this.port.onMessage.removeListener(this.messageHandler)
  }

  private disconnectHandler(p: chrome.runtime.Port) {
    console.log('Port disconnected', { portName: p.name })
    const tabID = p.sender?.tab?.id
    if (!tabID) {
      throw new Error(`Cannot remove port from the map, port '${p.name}' has no tab ID`)
    }
    this.portManager.remove(tabID)
    this.destroy()
  }

  private messageHandler(msg: message.Message) {
    console.log('Received message on port', { portName: this.name, msg })
    if (msg.type === message.Type.RegisterRequest) {
      if (!this.tabID) throw new Error(`Cannot register port '${this.name}', tabID is not defined`)
      this.register()
      this.portManager.activateTab(this.tabID)
    }
  }

  private register() {
    if (!this.tabID) throw new Error(`Cannot register port '${this.port.name}', tab ID is undefiend`)
    const msg: message.RegisterResponse = {
      type: message.Type.RegisterResponse,
      payload: {
        tabID: this.tabID,
        terminalID: this.terminalID,
      },
    }
    this.port.postMessage(msg)
  }

  notifyActivatedTab() {
    if (this.isTabActive) return
    const msg: message.ActivatedEvent = {
      type: message.Type.ActivatedEvent
    }
    this.port.postMessage(msg)
    this.isTabActive = true
  }

  notifyDeactivatedTab() {
    if (!this.isTabActive) return
    const msg: message.DeactivatedEvent = {
      type: message.Type.DeactivatedEvent
    }
    this.port.postMessage(msg)
    this.isTabActive = false
  }

  postMessage(message: message.Message) {
    this.port.postMessage(message)
  }

  disconnect() {
    this.port.disconnect()
  }
}

export class PortManager {
  private ports = new Map<number, Port>()

  add(chromePort: chrome.runtime.Port, terminalID: string) {
    const port = new Port(this, chromePort, terminalID)
    if (port.tabID === undefined) throw new Error(`Cannot add port '${chromePort.name}' to map, tabID is undefined`)
    this.ports.set(port.tabID, port)
  }

  remove(tabID: number) {
    return this.ports.delete(tabID)
  }

  // Calls `notifyActivatedTab()` on the port associated with the passed tabID
  // and calls `notifyDeactivatedTab()` on all other ports.
  activateTab(tabID: number) {
    console.log('Activated tab', tabID)
    const port = this.ports.get(tabID)
    if (!port) {
      console.log(`Tab '${tabID}' activated but has no associated port with it`)
      return
    }

    // Notify others ports (tabs) to deactivate.
    console.log('Will go through all other tabs to deactivate them. Tab count to go through:', this.ports.size - 1)
    this.ports.forEach((p, tid) => {
      if (tid !== tabID) {
        console.log(`Deactivating tab '${tid}'`)
        p.notifyDeactivatedTab()
      }
    })
    port.notifyActivatedTab()
  }
}
