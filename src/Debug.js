var debug = {
  info: undefined,
  stacktrace: function stacktrace(f) {
    var args = [];
    if (f) {
      if (f.arguments)
        for (var i = 0; i < f.arguments.length; i++) {
          args.push(f.arguments[i]);
        }
      var function_name = f.toString().split('(')[0].substring(9);
      if (f == f.caller)
        return "[recursive] " + function_name + '(' + args.join(', ') + ')' + "\n";
      return debug.stacktrace(f.caller) + function_name + '(' + args.join(', ') + ')' + "\n";
    } else {
      return "";
    }
  },
  test: function test(i) {
    if (i <= 1)
      console.log(debug.stacktrace(arguments.callee));
    else
      debug.test(i - 1);
  }
}

function debugHandleRefreshGesture() {
  // Point the wand directly up for 2 sec to refresh page
  if (ControllerReader.controllerInfo && ControllerReader.controllerInfo.wandPosition && ControllerReader.controllerInfo.wandPosition.Pitch > 70 && debugHandleRefreshGesture.timer == undefined) {
    debugHandleRefreshGesture.timer = setTimeout(function () {
      window.location.reload();
    }, 2000)
  }
  else if (ControllerReader.controllerInfo && ControllerReader.controllerInfo.wandPosition && ControllerReader.controllerInfo.wandPosition.Pitch < 70 && debugHandleRefreshGesture.timer) {
    clearTimeout(debugHandleRefreshGesture.timer);
    debugHandleRefreshGesture.timer = undefined;
  }
}
debugHandleRefreshGesture.timer = undefined;

// interactive debug console
var console = {
  log: function (str) {
    if(typeof str === "object"){ // probably an error passed in
      str = JSON.stringify(str); 
    }
    var el = document.getElementById("consoleOutput");
    var wasNearBottom = el.scrollHeight - el.clientHeight <= el.scrollTop + el.clientHeight * 0.5;
    el.textContent += str + "\n";
    if (wasNearBottom)
      el.scrollTop = el.scrollHeight - el.clientHeight;
  }
}

function runConsole() {
  var input = document.getElementById("consoleInput").value;
  console.log("> " + input);

  try {
    console.log("= " + String(eval.call(window, input)));
  } catch (e) {
    console.log("! " + String(e));
  }

  document.getElementById("consoleInput").value = "";
}
