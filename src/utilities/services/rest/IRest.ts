// http://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html

interface IRest {
  head(url: string);
  get(url: string);
  post(url: string, payload: Object);
  put(url: string, payload: Object);
  delete(url: string, payload?: Object); // TODO: Deleting worklog requier body to be sent!
}
export default IRest;
