export * from './local-storage';
export * from './help';
export * from './util';
export * from './socket';
export * from './iframe-cookie';

export function sendToIframe(type: string, payload: unknown) {
  const iframe = document.getElementById(
    'preview-iframe',
  ) as HTMLIFrameElement;
  iframe?.contentWindow?.postMessage({ type, payload }, '*');
}

export function listenFromIframe(callback: (data: unknown) => void) {
  window.addEventListener('message', (event: MessageEvent<unknown>) => {
    callback(event.data);
  });
}
