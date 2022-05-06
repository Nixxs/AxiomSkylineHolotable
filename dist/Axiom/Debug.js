define(["require", "exports", "./ControllerReader"], function (require, exports, ControllerReader_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.runConsole = exports.debugHandleRefreshGesture = exports.debug = void 0;
    var debug = /** @class */ (function () {
        function debug() {
        }
        debug.stacktrace = function (f) {
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
            }
            else {
                return "";
            }
        };
        debug.test = function (i) {
            if (i <= 1)
                console.log(debug.stacktrace(arguments.callee));
            else
                debug.test(i - 1);
        };
        return debug;
    }());
    exports.debug = debug;
    var debugHandleRefreshGestureTimer = undefined;
    function debugHandleRefreshGesture() {
        // Point the wand directly up for 2 sec to refresh page
        if (ControllerReader_1.ControllerReader.controllerInfo && ControllerReader_1.ControllerReader.controllerInfo.wandPosition && ControllerReader_1.ControllerReader.controllerInfo.wandPosition.Pitch > 70 && debugHandleRefreshGestureTimer == undefined) {
            console.log("started debug refresh gesture");
            debugHandleRefreshGestureTimer = setTimeout(function () {
                window.location.reload();
            }, 2000);
        }
        else if (ControllerReader_1.ControllerReader.controllerInfo && ControllerReader_1.ControllerReader.controllerInfo.wandPosition && ControllerReader_1.ControllerReader.controllerInfo.wandPosition.Pitch < 70 && debugHandleRefreshGestureTimer) {
            clearTimeout(debugHandleRefreshGestureTimer);
            console.log("canceling debug refresh gesture");
            debugHandleRefreshGestureTimer = undefined;
        }
    }
    exports.debugHandleRefreshGesture = debugHandleRefreshGesture;
    // interactive debug console
    console.log = function (str) {
        var el = document.getElementById("consoleOutput");
        if (el === null)
            throw new Error("No console output element");
        var wasNearBottom = el.scrollHeight - el.clientHeight <= el.scrollTop + el.clientHeight * 0.5;
        el.textContent += String(str) + "\n";
        if (wasNearBottom)
            el.scrollTop = el.scrollHeight - el.clientHeight;
    };
    function runConsole() {
        var el = document.getElementById("consoleInput");
        if (el === null || !(el instanceof HTMLInputElement))
            throw new Error("Expected console input to be an input element");
        var input = el.value;
        console.log("> " + input);
        try {
            console.log("= " + String(eval.call(window, input)));
        }
        catch (e) {
            console.log("! " + String(e));
        }
        el.value = "";
    }
    exports.runConsole = runConsole;
});
