import { basePath, sgWorld } from "../Axiom";
import { Button } from "../Button";
import { ControllerReader } from "../ControllerReader";
import { deleteItemSafe, GetObject, roomToWorldCoord } from "../ProgramManager";

export class ButtonModel extends Button {
  modelId: string = "";

  override Draw() {
    if (this.initError) return;
    const pos = roomToWorldCoord(this.roomPosition);
    try {
      if (this.ID === undefined) {
        const obj = sgWorld.Creator.CreateModel(pos, basePath + "/ui/blank.xpl2", 1, 0, this.groupID, this.name);
        obj.BestLOD = 0;
        obj.Tooltip.Text = this.tooltip;
        this.ID = obj.ID;
        // create a model and float above
        const model = sgWorld.Creator.CreateModel(pos, this.modelPath, 1, 0, this.groupID, this.name);
        this.modelId = model.ID;
        model.SetParam(200, 0x200);
      } else {
        // Move the button to be in the right spot
        const obj = GetObject(this.ID, ObjectTypeCode.OT_MODEL);
        if (obj === null) return;
        obj.Position = pos;
        obj.ScaleX = this.scale.data[0] * (ControllerReader.controllerInfos[1].scaleFactor ?? 1);
        obj.ScaleY = this.scale.data[1] * (ControllerReader.controllerInfos[1].scaleFactor ?? 1);
        obj.ScaleZ = this.scale.data[2] * (ControllerReader.controllerInfos[1].scaleFactor ?? 1);

        const model = GetObject(this.modelId, ObjectTypeCode.OT_MODEL);
        if (model === null) return;
        model.Position = pos;
        model.ScaleX = this.scale.data[0] * (ControllerReader.controllerInfos[1].scaleFactor ?? 1);
        model.ScaleY = this.scale.data[1] * (ControllerReader.controllerInfos[1].scaleFactor ?? 1);
        model.ScaleZ = this.scale.data[2] * (ControllerReader.controllerInfos[1].scaleFactor ?? 1);
        if (this.color)
          model.Terrain.Tint = this.color;
      }
    } catch (error) {
      console.error("button error :: " + this.modelPath);
      this.initError = true;
    }
  }

  override show(value: boolean) {
    super.show(value);
    if (this.modelId === undefined) return;
    const obj = GetObject(this.modelId, ObjectTypeCode.OT_MODEL);
    if (obj !== null)
      obj.Visibility.Show = value;
  }

  override destroy(): void {
    super.destroy();
    deleteItemSafe(this.modelId)
  }
}
