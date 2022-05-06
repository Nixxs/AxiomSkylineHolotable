import { ProgramManager } from "./ProgramManager";

declare const SGWorld: ISGWorld;
export const sgWorld = SGWorld;
export const basePath = "D:/git/AxiomSkylineHolotable/dist/Axiom/";

if (document.readyState === 'complete')
  ProgramManager.getInstance().Init();
else
  window.addEventListener("load", ProgramManager.getInstance().Init);
