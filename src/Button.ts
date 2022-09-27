import { sgWorld } from "./Axiom";
import { ControllerReader } from "./ControllerReader";
import { Vector } from "./math/vector";
import { deleteItemSafe, GetObject, ProgramManager, roomToWorldCoord } from "./ProgramManager";

let selectedButton: Button | null = null;
export function SimulateSelectedButton() {
  selectedButton?.Simulate();
}

export class Button {
  ID?: string;
  scale = new Vector<3>([1, 1, 1]);
  initError = false;

  constructor(public name: string, public roomPosition: IPosition, public modelPath: string, public groupID: string = "", public callback: (id?: string) => void = () => { }, hidden?: boolean, public tooltip: string = "", public color?: IColor) {
    const newButton = document.createElement("option");
    newButton.textContent = name;
    document.getElementById("buttons")?.appendChild(newButton);
    if (hidden === true) {
      this.show(false);
    }
    newButton.addEventListener("click", () => { selectedButton = this; })
    selectedButton ??= this;
  }

  Simulate() {
    console.log(`simulating click on ${this.name}`);
    this.callback(this.ID);
  }

  // buttonPressed is whether the button was down this frame but not last frame
  Update() {
    const button1Pressed = ProgramManager.getInstance().getButton1Pressed(1);
    const selectedID = ProgramManager.getInstance().userModeManager?.getCollisionID(1);
    if (this.ID !== undefined && this.ID === selectedID && button1Pressed) {
      this.callback(this.ID); // callback optionally provides the id of the button for use
      ProgramManager.getInstance().setButton1Pressed(1, false);
    }
  }

  Draw() {
    if (this.initError) return;
    const pos = roomToWorldCoord(this.roomPosition);
    if (this.initError) return;
    if (this.ID === undefined) {
      try {
        const obj = sgWorld.Creator.CreateModel(pos, this.modelPath, 1, 0, this.groupID, this.name);
        obj.BestLOD = 0;
        obj.Tooltip.Text = this.tooltip;
        this.ID = obj.ID;
        if (this.color !== undefined) {
          // tint the model
          obj.Terrain.Tint = this.color;
        }
      } catch (error) {
        console.log("Button Error :: " + error + " " + this.modelPath)
        this.initError = true;
      }
    } else {
      // Move the button to be in the right spot
      const obj = GetObject(this.ID, ObjectTypeCode.OT_MODEL);
      if (obj === null) return;
      obj.Position = pos;
      obj.ScaleX = this.scale.data[0] * (ControllerReader.controllerInfos[1].scaleFactor ?? 1);
      obj.ScaleY = this.scale.data[1] * (ControllerReader.controllerInfos[1].scaleFactor ?? 1);
      obj.ScaleZ = this.scale.data[2] * (ControllerReader.controllerInfos[1].scaleFactor ?? 1);
    }
  }

  setPosition(pos: IPosition) {
    this.roomPosition = pos;
  }

  // scale should be the actual side lengths of the button in room space
  // (for the math to work then, the button model should have 1m side length)
  setScale(scale: Vector<3>) {
    this.scale = scale;
  }

  show(value: boolean) {
    if (this.ID === undefined) this.Draw();
    if (this.ID === undefined) return;
    const obj = GetObject(this.ID, ObjectTypeCode.OT_MODEL);
    if (obj !== null)
      obj.Visibility.Show = value;
  }

  destroy() {
    if (this.ID === undefined) return;
    try {
      deleteItemSafe(this.ID)
    } catch (error) {
      // its already been destroyed don't worry
    }
  }
}
