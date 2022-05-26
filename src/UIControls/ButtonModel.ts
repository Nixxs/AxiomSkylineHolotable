import { basePath, sgWorld } from "../Axiom";
import { Button } from "../Button";
import { ControllerReader } from "../ControllerReader";
import { getItemById, ProgramManager, roomToWorldCoord } from "../ProgramManager";

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
        const obj: ITerrainModel = getItemById(this.ID) as ITerrainModel;
        if (!obj) return;
        obj.Position = pos;
        obj.Position.Altitude = obj.Position.Altitude
        obj.ScaleFactor = this.scale * (ControllerReader.controllerInfos[1].scaleFactor ?? 1.5);

        const model: ITerrainModel = getItemById(this.modelId) as ITerrainModel;
        if (!model) return;
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
    let obj: ITerrainModel = sgWorld.Creator.GetObject(this.modelId) as ITerrainModel;
    obj.Visibility.Show = value;
  }

  destroy(): void {
    super.destroy();
    if (!this.modelId) return;
    ProgramManager.getInstance().deleteItemSafe(this.modelId)
  }




}