import { ProgramManager } from "./ProgramManager";

export declare const SGWorld: ISGWorld;
export const basePath = "\\\\192.168.1.19/d/C-ARMSAS/axiom/";

window.addEventListener("load", ProgramManager.getInstance().Init);
