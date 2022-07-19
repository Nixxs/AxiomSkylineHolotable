import { sgWorld } from "../Axiom";
import { Button } from "../Button";
import { ControllerReader } from "../ControllerReader";
import { deleteItemSafe, GetObject, ProgramManager, roomToWorldCoord } from "../ProgramManager";

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
      labelStyle.BackgroundColor = sgWorld.Creator.CreateColor(0, 0, 0, 0);
      const label = sgWorld.Creator.CreateTextLabel(pos, this.name, labelStyle, this.groupID, "label" + this.name);
      this.labelId = label.ID;
    } else {
      // Move the button to be in the right spot
      const obj = GetObject(this.ID, ObjectTypeCode.OT_MODEL);
      if (obj !== null) {
        obj.Position = pos;
        obj.Position.Altitude = obj.Position.Altitude
        obj.ScaleFactor = this.scale * (ControllerReader.controllerInfos[1].scaleFactor ?? 1.5);
        obj.ScaleX = obj.ScaleFactor * 2
      }
      const objLbl = GetObject(this.labelId, ObjectTypeCode.OT_LABEL);
      if (objLbl !== null) {
        objLbl.Position = pos;
      }
      // objLbl.Position.Pitch = 90
    }
  }

  show(value: boolean) {
    super.show(value);
    if (!this.labelId) return;
    const obj = GetObject(this.labelId, ObjectTypeCode.OT_LABEL);
    if (obj !== null) {
      obj.Visibility.Show = value;
    }
  }

  destroy(): void {
    super.destroy();
    if (!this.labelId) return;
    deleteItemSafe(this.labelId)
  }




}
