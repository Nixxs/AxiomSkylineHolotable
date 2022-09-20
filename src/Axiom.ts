import { ProgramManager } from "./ProgramManager";

declare const SGWorld: ISGWorld;
declare const SessionManager: ISessionManager;
export const sgWorld = SGWorld;
export const sessionManager = SessionManager;

function getBasePath() {
  return new Promise<string>(go => {
    const folder = window.location.pathname.match(/^[\/\\]*(.*[\/\\])/)?.[1];
    if (folder === undefined) {
      // Wait for folder
      const div = document.createElement("div");
      div.id = "folderInput";
      const label = document.createElement("label")
      const input = document.createElement("input");
      const button = document.createElement("button");

      label.textContent = "Please manually enter the folder";
      alert("Please manually enter the folder");
      input.focus();

      button.textContent = "Confirm";

      button.onclick = () => {
        div.parentNode?.removeChild(div);

        go(input.value);
      };

      div.appendChild(label);
      label.appendChild(input);
      div.appendChild(button);
      document.body.appendChild(div);
      return;
    }
    go(decodeURI(folder));
  });
}

export let basePath = "";
(async () => {
  basePath = await getBasePath();
  if (document.readyState === 'complete')
    ProgramManager.getInstance().Init();
  else
    window.addEventListener("load", ProgramManager.getInstance().Init);
})();
