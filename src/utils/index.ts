/* eslint-disable @typescript-eslint/no-explicit-any */
export * from './local-storage';
export * from './help';
export * from './util';
export * from './socket';
export * from './iframe-cookie';

export function sendToIframe(type: string, payload: any) {
  const iframe = document.getElementById(
    'preview-iframe',
  ) as HTMLIFrameElement;
  iframe?.contentWindow?.postMessage({ type, payload }, '*');
}

export function listenFromIframe(callback: (data: any) => void) {
  window.addEventListener('message', event => {
    callback(event.data);
  });
}
