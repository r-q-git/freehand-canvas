import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class QlIframeMessageService {
    static sendMessageToParent(message: any) {
        window.parent.postMessage(message, '*'); // Replace '*' with parent origin for security
    }
}
