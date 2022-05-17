import { basePath, sgWorld } from "../Axiom";
import { ProgramManager } from "../ProgramManager";
import { ButtonLabelled } from "./ButtonLabelled";
import { MenuPaging } from "./MenuPaging";


export class MenuVerbs extends MenuPaging {

    createButton(name: string, icon: string, callback?: (id?: string) => void) {
        // override and return the button as we need to add them all at once
        console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++")
        const groupId = ProgramManager.getInstance().getGroupID("buttons");
        const pos = sgWorld.Creator.CreatePosition(0, 0, 0.7, 3);
        const btn = new ButtonLabelled(name, pos, basePath + "ui/" + icon, groupId, callback);
        return btn;
    }
}