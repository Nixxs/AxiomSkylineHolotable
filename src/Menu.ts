/**
 * Menus are a collection of buttons that are to arranged into a grid in a specified menu area.
 * Buttons are laid out starting from one corner to the opposite.
 * Once buttons no longer fit into their growing direction they shrink until they're small enough to fit another strip or another into a strip
 */

import { basePath, sgWorld } from "./Axiom";
import { Button } from "./Button";
import { Quaternion } from "./math/quaternion";
import { Vector } from "./math/vector";
import { degsToRads, radsToDegs } from "./Mathematics";
import { ProgramManager } from "./ProgramManager";
import { CreatePosition } from "./SGWorld";

export class Menu {
  public buttonLines: Button[][] = [[]];
  public xDirection: Vector<3>;
  public yDirection: Vector<3>;
  public recomputeButtons = true;
  public isVisible: boolean = true;
  public roomOrigin: IPosition;

  private static uniqueGroupID() { return Date.now().toString() + Math.floor(Math.random() * 100000000).toString(); }

  constructor(public anchor: Vector<3>, public orientation: Quaternion, public xPositive: boolean, public zPositive: boolean, public horizontalLines: boolean, public buttonSize: Vector<3>, public lineLengthLimit: number = 0, public groupID: string = sgWorld.ProjectTree.CreateGroup(Menu.uniqueGroupID(), ProgramManager.getInstance().groupID)) {
    this.xDirection = orientation.GetXAxis(xPositive ? 1 : -1);
    this.yDirection = orientation.GetZAxis(zPositive ? 1 : -1);
    this.roomOrigin = CreatePosition(...anchor.data, AltitudeTypeCode.ATC_TERRAIN_ABSOLUTE, ...orientation.Copy().PostApplyXAxis(degsToRads(90)).GetYPR().map(radsToDegs), 1);
  }

  protected nextButtonLine() {
    let line = this.buttonLines.length - 1;
    let step = this.buttonLines[line].length;
    if (step === this.lineLengthLimit) {
      this.newLine();
      ++line;
      step = 0;
    }
    return { line, step };
  }

  protected buttonScale() {
    return this.buttonSize.Copy().Mul(0.9);
  }

  addButton(button: Button) {
    let { line, step } = this.nextButtonLine();
    this.buttonLines[line].push(button);
    button.roomPosition = this.roomOrigin.Copy();
    [button.roomPosition.X, button.roomPosition.Y, button.roomPosition.Altitude]
      = this.getButtonPosition(line, step).data;
    button.setScale(this.buttonScale());
  }

  newLine() {
    this.buttonLines.push([]);
  }

  createButton(name: string, icon: string, callback?: (id?: string) => void, tooltip: string = ""): Button {
    const pos = sgWorld.Creator.CreatePosition(0, 0, 0.7, 3);
    const btn = new Button(name, pos, basePath + "ui/" + icon, this.groupID, callback, false, tooltip);
    this.addButton(btn);
    return btn;
  }

  Update() {
    for (let line of this.buttonLines)
      for (let button of line)
        button.Update();
  }

  getButtonPosition(line: number, step: number) {
    const x = this.horizontalLines ? step : line;
    const y = this.horizontalLines ? line : step;
    return this.anchor.Copy().Add(this.xDirection.Copy().Mul((x + 0.5) * this.buttonSize.data[0])).Add(this.yDirection.Copy().Mul((y + 0.5) * this.buttonSize.data[1]));
  }

  Draw() {
    for (let line of this.buttonLines)
      for (let button of line)
        button.Draw();
  }

  show(visibility: boolean) {
    for (let line of this.buttonLines)
      for (let button of line)
        button.show(visibility);
    this.isVisible = visibility;
  }
}
