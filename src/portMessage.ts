export enum Type {
  RegisterRequest = 'registerRequest',
  RegisterResponse = 'registerResponse',
  ActivatedEvent = 'activatedEvent',
  DeactivatedEvent = 'deactivatedEvent',
}

// Sent from a content script when a terminal wants to register itself.
export interface RegisterRequest {
  type: Type.RegisterRequest
}

// Sent to a content script as a response to RegisterRequest message.
export interface RegisterResponse {
  type: Type.RegisterResponse
  payload: {
    terminalID: string
    tabID: number
  },
}

// Sent to a content script when a tab becomes active.
export interface ActivatedEvent {
  type: Type.ActivatedEvent
}


// Sent to a content script when a tab becomes inactive.
export interface DeactivatedEvent {
  type: Type.DeactivatedEvent
}

export type Message =
  RegisterRequest |
  RegisterResponse |
  ActivatedEvent |
  DeactivatedEvent
