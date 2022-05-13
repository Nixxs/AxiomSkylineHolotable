import { sgWorld } from "./Axiom";
import { ControllerReader } from "./ControllerReader";
import { ProgramManager, roomToWorldCoord } from "./ProgramManager";

export class Button {
  ID?: string;
  scale = 1;
  callback: (id?: string) => void = () => { };
  constructor(public name: string, public roomPosition: IPosition, public modelPath: string,
    public groupID: string = "",
    callback?: (id?: string) => void, hidden?: boolean) {
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
      this.callback(this.ID); // callback optionally provides the id of the button for use
      ProgramManager.getInstance().setButton1Pressed(1, false);
    }
  }

  Draw() {
    const pos = roomToWorldCoord(this.roomPosition);
    if (this.ID === undefined) {
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

  destroy() {
    if(!this.ID) return;
    sgWorld.Creator.DeleteObject(this.ID);
  }
}
