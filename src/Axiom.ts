import { ProgramManager } from "./ProgramManager";

declare const SGWorld: ISGWorld;
declare const SessionManager: ISessionManager;
export const sgWorld = SGWorld;
export const sessionManager = SessionManager;
export const basePath = "T:/ReubenWillson/Axiom/";

if (document.readyState === 'complete')
  ProgramManager.getInstance().Init();
else
  window.addEventListener("load", ProgramManager.getInstance().Init);
