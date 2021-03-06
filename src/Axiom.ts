import { ProgramManager } from "./ProgramManager";

declare const SGWorld: ISGWorld;
declare const SessionManager: ISessionManager;
export const sgWorld = SGWorld;
export const sessionManager = SessionManager;
// export const basePath = "\\\\Skyline_NAS/Data/C-ARMSAS/Axiom/";
// export const basePath = "C:/dev/Github/AxiomSkylineHolotable/dist/Axiom/";
export const basePath = "c:\\Axiom\\DW\\dist\\axiom\\";


if (document.readyState === 'complete')
  ProgramManager.getInstance().Init();
else
  window.addEventListener("load", ProgramManager.getInstance().Init);
