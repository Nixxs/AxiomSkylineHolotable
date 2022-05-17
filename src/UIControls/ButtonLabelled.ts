import { sgWorld } from "../Axiom";
import { Button } from "../Button";
import { ControllerReader } from "../ControllerReader";
import { ProgramManager, roomToWorldCoord } from "../ProgramManager";

export class ButtonLabelled  extends Button {

  Draw() {
    const pos = roomToWorldCoord(this.roomPosition);
    if (this.ID === undefined) {
      const obj = sgWorld.Creator.CreateModel(pos, this.modelPath, this.scale, 0, this.groupID, this.name);
      this.ID = obj.ID;
     // const obj = sgWorld.Creator.CreateLabel(pos, this.modelPath, this.scale, 0, this.groupID, this.name);
    } else {
      // Move the button to be in the right spot
      const obj: ITerrainModel = sgWorld.Creator.GetObject(this.ID) as ITerrainModel;
      obj.Position = pos;
      obj.ScaleFactor = this.scale * (ControllerReader.controllerInfos[1].scaleFactor ?? 1.5);
    }
  }

 
}
