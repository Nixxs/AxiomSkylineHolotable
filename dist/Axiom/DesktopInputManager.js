define(["require", "exports", "./Axiom"], function (require, exports, Axiom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DesktopInputManager = void 0;
    var DesktopInput = /** @class */ (function () {
        function DesktopInput() {
            this.leftButton = false;
            this.rightButton = false;
            this.middleButton = false;
            this.shift = false;
            this.control = false;
        }
        return DesktopInput;
    }());
    var DesktopInputManager = /** @class */ (function () {
        function DesktopInputManager() {
        }
        DesktopInputManager.Update = function () {
            this.pressed.leftButton = this.getLeftButton() && !this.getLeftButtonPressed();
            this.pressed.rightButton = this.getRightButton() && !this.getRightButton();
            this.pressed.middleButton = this.getMiddleButton() && !this.getMiddleButton();
            this.pressed.shift = this.getShift() && !this.getShift();
            this.pressed.control = this.getControl() && !this.getControl();
            this.state.leftButton = this.getLeftButton();
            this.state.rightButton = this.getRightButton();
            this.state.middleButton = this.getMiddleButton();
            this.state.shift = this.getShift();
            this.state.control = this.getControl();
        };
        DesktopInputManager.getLeftButton = function () { return this.state.leftButton; };
        DesktopInputManager.getRightButton = function () { return this.state.rightButton; };
        DesktopInputManager.getMiddleButton = function () { return this.state.middleButton; };
        DesktopInputManager.getShift = function () { return this.state.shift; };
        DesktopInputManager.getControl = function () { return this.state.control; };
        DesktopInputManager.getLeftButtonPressed = function () { return this.pressed.leftButton; };
        DesktopInputManager.getRightButtonPressed = function () { return this.pressed.rightButton; };
        DesktopInputManager.getMiddleButtonPressed = function () { return this.pressed.middleButton; };
        DesktopInputManager.getShiftPressed = function () { return this.pressed.shift; };
        DesktopInputManager.getControlPressed = function () { return this.pressed.control; };
        DesktopInputManager.setLeftButtonPressed = function (pressed) { this.pressed.leftButton = pressed; };
        DesktopInputManager.getCursor = function () {
            var pX = Axiom_1.SGWorld.Window.GetMouseInfo().X;
            var pY = Axiom_1.SGWorld.Window.GetMouseInfo().Y;
            return Axiom_1.SGWorld.Window.PixelToWorld(pX, pY, 4);
        };
        DesktopInputManager.getCursorPosition = function () {
            return this.getCursor().Position;
        };
        DesktopInputManager.state = new DesktopInput();
        DesktopInputManager.pressed = new DesktopInput();
        return DesktopInputManager;
    }());
    exports.DesktopInputManager = DesktopInputManager;
});
