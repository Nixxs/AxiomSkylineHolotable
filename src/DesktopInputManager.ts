import { sgWorld } from "./Axiom";

class DesktopInput {
  leftButton = false;
  rightButton = false;
  middleButton = false;
  shift = false;
  control = false;
}

export class DesktopInputManager {
  private static state = new DesktopInput();
  private static pressed = new DesktopInput();

  static Update() {
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
  }

  static getLeftButton() { return this.state.leftButton; }
  static getRightButton() { return this.state.rightButton; }
  static getMiddleButton() { return this.state.middleButton; }
  static getShift() { return this.state.shift; }
  static getControl() { return this.state.control; }

  static getLeftButtonPressed() { return this.pressed.leftButton; }
  static getRightButtonPressed() { return this.pressed.rightButton; }
  static getMiddleButtonPressed() { return this.pressed.middleButton; }
  static getShiftPressed() { return this.pressed.shift; }
  static getControlPressed() { return this.pressed.control; }

  static setLeftButtonPressed(pressed: boolean) { this.pressed.leftButton = pressed; }

  static getCursor() {
    const pX = sgWorld.Window.GetMouseInfo().X;
    const pY = sgWorld.Window.GetMouseInfo().Y;
    return sgWorld.Window.PixelToWorld(pX, pY, 4)
  }

  static getCursorPosition() {
    return this.getCursor().Position;
  }
}
