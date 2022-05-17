import { sgWorld } from "../Axiom";
import { Button } from "../Button";
import { ControllerReader } from "../ControllerReader";
import { ProgramManager, roomToWorldCoord } from "../ProgramManager";

export class ButtonLabelled extends Button {

  labelId: string = "";

  Draw() {
    const pos = roomToWorldCoord(this.roomPosition);
    if (this.ID === undefined) {
      const obj = sgWorld.Creator.CreateModel(pos, this.modelPath, this.scale, 0, this.groupID, this.name);
      this.ID = obj.ID;
      const labelStyle = sgWorld.Creator.CreateLabelStyle(0);
      const label = sgWorld.Creator.CreateTextLabel(pos, this.name, labelStyle, this.groupID, "label" + this.name);
      this.labelId = label.ID;
    } else {
      // Move the button to be in the right spot
      const obj: ITerrainModel = sgWorld.Creator.GetObject(this.ID) as ITerrainModel;
      obj.Position = pos;
      obj.ScaleFactor = this.scale * (ControllerReader.controllerInfos[1].scaleFactor ?? 1.5);
      obj.ScaleX =   obj.ScaleFactor * 4
      const objLbl: ITerrainLabel = sgWorld.Creator.GetObject(this.labelId) as ITerrainLabel;
      objLbl.Position = pos;
      objLbl.Position.Pitch = 90
    }
  }


}
