export interface DrawingStroke {
  points: number[][];
  path: string;
  color: string;
  opacity: number;
  outlineColor: string;
  outlineWidth: number;
}

//--------- message passing to event interface
/**
 * Message types supported for iframe communication with parent window
 */
export enum IframeMessageType {
  ADD_OBJECT = 'ADD_OBJECT',
}

/**
 * Base interface for all iframe messages
 */
export interface BaseIframeMessage<T = any> {
  type: IframeMessageType;
  payload: T;
}

/**
 * Payload for ADD_OBJECT message type
 */
export interface AddObjectPayload {
  dataString: string;
  type: 'imagebox' | 'stickerbox' | 'textbox' | 'svg';
  metaData?: Record<string, any>;
}
