import { sgWorld } from "./Axiom";
import { ControllerReader } from "./ControllerReader";
import { ProgramManager, roomToWorldCoord } from "./ProgramManager";

export class Button {
  ID?: string;
  callback: () => void = () => { };
  constructor(public name: string, public roomPosition: IPosition, public modelPath: string,
    public groupID: string = "",
    callback?: () => void) {
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
  }

  // buttonPressed is whether the button was down this frame but not last frame
  Update(button1Pressed: boolean, selectedID?: string) {
    if (this.ID !== undefined && this.ID === selectedID && button1Pressed) {
      this.callback();
      return false;
    }
    return button1Pressed;
  }

  Draw() {
    const pos = roomToWorldCoord(this.roomPosition);
    const scaleFactor = (ControllerReader.controllerInfo?.scaleFactor ?? 1) / 12;
    if (this.ID === undefined) {
      const obj = sgWorld.Creator.CreateModel(pos, this.modelPath, scaleFactor, 0, this.groupID, this.name);
      this.ID = obj.ID;
    } else {
      // Move the button to be in the right spot
      const obj: ITerrainModel = sgWorld.Creator.GetObject(this.ID) as ITerrainModel;
      obj.Position = pos;
      obj.ScaleFactor = scaleFactor
    }
  }

  setPosition(pos: IPosition) {
    console.log("setPosition:: " + this.ID);
    if (this.ID) {
      const boxSize = (ControllerReader.controllerInfo?.scaleFactor ?? 1) / 12;
      this.roomPosition = pos;
      let obj: ITerrainModel = sgWorld.Creator.GetObject(this.ID) as ITerrainModel;
      obj.Position = pos;
      obj.ScaleFactor = boxSize
    } else {
      this.roomPosition = pos;
      this.Draw();
    }
  }

  show(value: boolean) {
    if (!this.ID) this.Draw();
    if (!this.ID) return;
    let obj: ITerrainModel = sgWorld.Creator.GetObject(this.ID) as ITerrainModel;
    obj.Visibility.Show = value;
  }
}
