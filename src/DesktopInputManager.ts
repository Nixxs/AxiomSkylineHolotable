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
    const mouseInfo = sgWorld.Window.GetMouseInfo();

    this.pressed.leftButton = !!(mouseInfo.Flags & 1) && !this.getLeftButton();
    this.pressed.rightButton = !!(mouseInfo.Flags & 2) && !this.getRightButton();
    this.pressed.middleButton = !!(mouseInfo.Flags & 4) && !this.getMiddleButton();
    this.pressed.shift = !!(mouseInfo.Flags & 8) && !this.getShift();
    this.pressed.control = !!(mouseInfo.Flags & 16) && !this.getControl();

    this.state.leftButton = !!(mouseInfo.Flags & 1);
    this.state.rightButton = !!(mouseInfo.Flags & 2);
    this.state.middleButton = !!(mouseInfo.Flags & 4);
    this.state.shift = !!(mouseInfo.Flags & 8);
    this.state.control = !!(mouseInfo.Flags & 16);
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
    return sgWorld.Window.PixelToWorld(pX, pY, 1)
  }

  static getCursorPosition() {
    return this.getCursor().Position;
  }
}
