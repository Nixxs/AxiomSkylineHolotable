import { sgWorld } from "./Axiom";
import { ControllerReader } from "./ControllerReader";
import { ProgramManager, roomToWorldCoord } from "./ProgramManager";

export class Button {
  ID?: string;
  scale = 1;
  callback: () => void = () => { };
  constructor(public name: string, public roomPosition: IPosition, public modelPath: string,
    public groupID: string = "",
    callback?: () => void, hidden?: boolean) {
    const newButton = document.createElement("button");
    newButton.textContent = name;
    if (callback) {
      this.callback = callback;
    }
    newButton.addEventListener("click", () => {
      console.log(`simulating click on ${name}`);
      if (callback) {
        ProgramManager.DoOneFrame(callback);
      }
    });
    document.getElementById("buttons")?.appendChild(newButton);
    if (hidden === true) {
      this.show(false);
    }
  }

  // buttonPressed is whether the button was down this frame but not last frame
  Update() {
    const button1Pressed = ProgramManager.getInstance().getButton1Pressed(1);
    const selectedID = ProgramManager.getInstance().userModeManager?.getCollisionID(1);
    if (this.ID !== undefined && this.ID === selectedID && button1Pressed) {
      this.callback();
      ProgramManager.getInstance().setButton1Pressed(1, false);
    }
  }

  Draw() {
    const pos = roomToWorldCoord(this.roomPosition);
    if (this.ID === undefined) {
      console.log(`Creating ${this.name} button with model path ${this.modelPath}`);
      const obj = sgWorld.Creator.CreateModel(pos, this.modelPath, this.scale, 0, this.groupID, this.name);
      this.ID = obj.ID;
    } else {
      // Move the button to be in the right spot
      const obj: ITerrainModel = sgWorld.Creator.GetObject(this.ID) as ITerrainModel;
      obj.Position = pos;
      obj.ScaleFactor = this.scale * (ControllerReader.controllerInfos[1].scaleFactor ?? 1.5);
    }
  }

  setPosition(pos: IPosition) {
    console.log(`setPosition:: ${this.ID} (${roomToWorldCoord(pos).ToString()})`);
    this.roomPosition = pos;
  }

  // scale should be the actual side length of the button in room space
  // (for the math to work then, the button model should have 1m side length)
  setScale(scale: number) {
    this.scale = scale;
  }

  show(value: boolean) {
    if (!this.ID) this.Draw();
    if (!this.ID) return;
    let obj: ITerrainModel = sgWorld.Creator.GetObject(this.ID) as ITerrainModel;
    obj.Visibility.Show = value;
  }
}
