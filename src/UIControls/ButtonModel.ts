import { basePath, sgWorld } from "../Axiom";
import { Button } from "../Button";
import { ControllerReader } from "../ControllerReader";
import { deleteItemSafe, GetObject, ProgramManager, roomToWorldCoord } from "../ProgramManager";

export class ButtonModel extends Button {

  modelId: string = "";

  Draw() {
    if (this.initError) return;
    const pos = roomToWorldCoord(this.roomPosition);
    try {

      if (this.ID === undefined) {
        const obj = sgWorld.Creator.CreateModel(pos, basePath + "/ui/blank.xpl2", this.scale, 0, this.groupID, this.name);
        obj.Terrain.Tint = ProgramManager.getInstance().userModeManager!.getColorFromString("black", 100);
        obj.Tooltip.Text = this.tooltip;
        this.ID = obj.ID;
        // create a model and float above
        const model = sgWorld.Creator.CreateModel(pos, this.modelPath, this.scale, 0, this.groupID, this.name);
        this.modelId = model.ID;
        model.SetParam(200, 0x200);

      } else {
        // Move the button to be in the right spot
        const obj = GetObject(this.ID, ObjectTypeCode.OT_MODEL);
        if (obj === null) return;
        obj.Position = pos;
        obj.Position.Altitude = obj.Position.Altitude
        obj.ScaleFactor = this.scale * (ControllerReader.controllerInfos[1].scaleFactor ?? 1.5);

        const model = GetObject(this.modelId, ObjectTypeCode.OT_MODEL);
        if (model === null) return;
        model.Position = pos;
        model.ScaleFactor = this.scale * (ControllerReader.controllerInfos[1].scaleFactor ?? 1.5);
        if (this.color) {
          // tint the model
          model.Terrain.Tint = this.color;
        }
        // objLbl.Position.Pitch = 90
      }
    } catch (error) {
      console.error("button error not found:: " + this.modelPath)
    }
  }

  show(value: boolean) {
    super.show(value);
    if (!this.modelId) return;
    const obj = GetObject(this.modelId, ObjectTypeCode.OT_MODEL);
    if (obj !== null) {
      obj.Visibility.Show = value;
    }
  }

  destroy(): void {
    super.destroy();
    if (!this.modelId) return;
    deleteItemSafe(this.modelId)
  }




}
