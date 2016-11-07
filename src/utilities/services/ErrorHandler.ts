// https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onerror

const errorHandler = (msg, url, lineNo, columnNo, error) => {

  let message = {
    'Message': msg,
    'URL': url,
    'Line': lineNo,
    'Column': columnNo,
    'Error object': JSON.stringify(error),
  };

  if (process.env.NODE_ENV === 'production') {
    // Call backend logger
    // return true; // Mute it?!

    /* tslint:disable:no-console */
    console.log(message);
    /* tslint:enable:no-console */
  }

  return false;
};

if (window) {
  window.onerror = errorHandler;
}
