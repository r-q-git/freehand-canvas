import {
  BaseIframeMessage,
  AddObjectPayload,
} from '../models/drawing.model';

/**
 * Union type for all iframe message payloads
 */
export type IframeMessage = BaseIframeMessage<AddObjectPayload>;

/**
 * Service for handling iframe communication with parent window
 *
 * @example
 * // Using the helper method (recommended):
 * QlIframeMessageService.sendAddObject(dataString, 'imagebox', metaData);
 *
 * // Using the base method with full type safety:
 * QlIframeMessageService.sendMessageToParent({
 *   type: IframeMessageType.ADD_OBJECT,
 *   payload: {
 *     dataString: dataString,
 *     type: 'imagebox',
 *     metaData
 *   }
 * });
 *
 * // For production, specify the exact parent origin:
 * QlIframeMessageService.sendAddObject(
 *   dataString,
 *   'imagebox',
 *   metaData,
 *   'https://parent-domain.com'
 * );
 */
export class QlIframeMessageService {
  /**
   * Send a typed message to the parent window
   * @param message - The message object conforming to IframeMessage schema
   * @param targetOrigin - The origin of the parent window. Use '*' only in development.
   *                       In production, specify the exact origin for security.
   */
  static sendMessageToParent(
    message: IframeMessage,
    targetOrigin: string = '*',
  ) {
    console.log(message);

    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage(message, targetOrigin);
    }
  }
}
