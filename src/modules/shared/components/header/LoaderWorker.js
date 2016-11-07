onmessage = function (event) {
  var n = 0;
  var newtime = 500;
  var requestStop = false;

  postMessage(n);
  multiStep = function () {
    n += 25;
    postMessage(n);
    if (n === 100) requestStop = true;
    if (!requestStop) {
      setTimeout(multiStep, newtime);
    }
  }
  multiStep();
}