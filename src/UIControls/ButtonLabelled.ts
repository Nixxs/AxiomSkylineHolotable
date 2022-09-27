import { sgWorld } from "../Axiom";
import { Button } from "../Button";
import { deleteItemSafe, GetObject, roomToWorldCoord } from "../ProgramManager";

export class ButtonLabelled extends Button {
  labelID?: string;

  override Draw() {
    super.Draw();
    const pos = roomToWorldCoord(this.roomPosition);
    if (this.labelID === undefined) {
      const labelStyle = sgWorld.Creator.CreateLabelStyle(0);
      labelStyle.TextAlignment = "Left";
      labelStyle.Bold = true;
      labelStyle.BackgroundColor = sgWorld.Creator.CreateColor(0, 0, 0, 0);
      const label = sgWorld.Creator.CreateTextLabel(pos, this.name, labelStyle, this.groupID, this.name + " label");
      this.labelID = label.ID;
    } else {
      const obj = GetObject(this.labelID, ObjectTypeCode.OT_LABEL);
      if (obj !== null)
        obj.Position = pos;
    }
  }

  override show(value: boolean) {
    if (this.labelID === undefined) this.Draw();
    super.show(value);
    if (this.labelID === undefined) return;
    const obj = GetObject(this.labelID, ObjectTypeCode.OT_LABEL);
    if (obj !== null)
      obj.Visibility.Show = value;
  }

  override destroy(): void {
    super.destroy();
    deleteItemSafe(this.labelID)
  }
}
