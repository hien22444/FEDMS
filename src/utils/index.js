/* eslint-disable */
export * from './local-storage';
export * from './help';
export * from './util';
export * from './socket';
export * from './iframe-cookie';

export function sendToIframe(type, payload) {
  const iframe = document.getElementById('preview-iframe');
  iframe?.contentWindow?.postMessage({ type, payload }, '*');
}

export function listenFromIframe(callback) {
  window.addEventListener('message', event => {
    callback(event.data);
  });
}
