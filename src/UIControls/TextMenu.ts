import { basePath, sgWorld } from "../Axiom";
import { Vector } from "../math/vector";
import { ButtonLabelled } from "./ButtonLabelled";
import { MenuPaging } from "./MenuPaging";

export class TextMenu extends MenuPaging {
  createButton(name: string, icon: string, callback?: (id?: string) => void) {
    const pos = sgWorld.Creator.CreatePosition(0, 0, 0.7, 3);
    const button = new ButtonLabelled(name, pos, basePath + "ui/" + icon, this.groupID, callback);
    super.addButton(button);
    return button;
  }

  override buttonScale(): Vector<3> {
    const ret = super.buttonScale();
    ret.data[0] *= 2;
    return ret;
  }

  override pageButtonSize(): Vector<3> {
    return super.pageButtonSize();
  }
}
