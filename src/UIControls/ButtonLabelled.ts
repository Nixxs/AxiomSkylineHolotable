import { sgWorld } from "../Axiom";
import { Button } from "../Button";
import { ControllerReader } from "../ControllerReader";
import { GetObject, ProgramManager, roomToWorldCoord } from "../ProgramManager";

export class ButtonLabelled extends Button {

  labelId: string = "";

  Draw() {
    const pos = roomToWorldCoord(this.roomPosition);
    if (this.ID === undefined) {
      const obj = sgWorld.Creator.CreateModel(pos, this.modelPath, this.scale, 0, this.groupID, this.name);
      this.ID = obj.ID;
      const labelStyle = sgWorld.Creator.CreateLabelStyle(0);
      labelStyle.TextAlignment = "Left";
      labelStyle.Bold = true;
      labelStyle.BackgroundColor = sgWorld.Creator.CreateColor(0,0,0,0);
      const label = sgWorld.Creator.CreateTextLabel(pos, this.name, labelStyle, this.groupID, "label" + this.name);
      this.labelId = label.ID;
    } else {
      // Move the button to be in the right spot
      const obj: ITerrainModel = GetObject(this.ID) as ITerrainModel;
      if(obj) {
        obj.Position = pos;
        obj.Position.Altitude =   obj.Position.Altitude
        obj.ScaleFactor = this.scale * (ControllerReader.controllerInfos[1].scaleFactor ?? 1.5);
        obj.ScaleX =  obj.ScaleFactor * 2
      }
      const objLbl: ITerrainLabel = GetObject(this.labelId) as ITerrainLabel;
      if(objLbl){
        objLbl.Position = pos;
      }
      // objLbl.Position.Pitch = 90
    }
  }

  show(value: boolean) {
    super.show(value);
    if (!this.labelId) return;
    let obj: ITerrainLabel = GetObject(this.labelId) as ITerrainLabel;
    if(obj){
      obj.Visibility.Show = value;
    }
  }

  destroy(): void {
    super.destroy();
    if (!this.labelId) return;
    ProgramManager.getInstance().deleteItemSafe(this.labelId)
  }

 


}
