import { ControllerReader } from "./ControllerReader";

export class debug {
  static info: undefined | Function;

  static stacktrace(f?: Function): string {
    const args = [];
    if (f) {
      if (f.arguments)
        for (let argument of f.arguments) {
          args.push(argument);
        }
      const function_name = f.toString().split('(')[0].substring(9);
      if (f == f.caller)
        return "[recursive] " + function_name + '(' + args.join(', ') + ')' + "\n";
      return debug.stacktrace(f.caller) + function_name + '(' + args.join(', ') + ')' + "\n";
    } else {
      return "";
    }
  }

  static test(i: number) {
    if (i <= 1)
      console.log(debug.stacktrace(arguments.callee));
    else
      debug.test(i - 1);
  }
}

let debugHandleRefreshGestureTimer: number | undefined = undefined;
export function debugHandleRefreshGesture() {
  // Point the wand directly up for 2 sec to refresh page
  if (ControllerReader.controllerInfos[1] && ControllerReader.controllerInfos[1].wandPosition && ControllerReader.controllerInfos[1].wandPosition.Pitch > 70 && debugHandleRefreshGestureTimer == undefined) {
    console.log("started debug refresh gesture");
    debugHandleRefreshGestureTimer = setTimeout(function () {
      window.location.reload();
    }, 2000);
  }
  else if (ControllerReader.controllerInfos[1] && ControllerReader.controllerInfos[1].wandPosition && ControllerReader.controllerInfos[1].wandPosition.Pitch < 70 && debugHandleRefreshGestureTimer) {
    clearTimeout(debugHandleRefreshGestureTimer);
    console.log("canceling debug refresh gesture");
    debugHandleRefreshGestureTimer = undefined;
  }
}

// interactive debug console
console.log = function (str) {
  const el = document.getElementById("consoleOutput");
  if (el === null)
    throw new Error("No console output element");
  const wasNearBottom = el.scrollHeight - el.clientHeight <= el.scrollTop + el.clientHeight * 0.5;
  el.textContent += String(str) + "\n";
  if (wasNearBottom)
    el.scrollTop = el.scrollHeight - el.clientHeight;
}

export function runConsole() {
  const el = document.getElementById("consoleInput");
  if (el === null || !(el instanceof HTMLTextAreaElement))
    throw new Error("Expected console input to be a textarea element");
  const input = el.value;
  console.log("> " + input);

  try {
    console.log("= " + String(eval.call(window, input)));
  } catch (e) {
    console.log("! " + String(e));
  }

  el.value = "";
}
