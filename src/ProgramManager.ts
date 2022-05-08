import { sgWorld } from "./Axiom";
import { Button } from "./Button";
import { ControllerReader } from "./ControllerReader";
import { debug, debugHandleRefreshGesture } from "./Debug";
import { DesktopInputManager } from "./DesktopInputManager";
import { vecAdd, YPRToQuat } from "./Mathematics";
import { UIManager } from "./UIManager";
import { UserModeManager } from "./UserManager";

export function setComClientForcedInputMode() {
  sgWorld.SetParam(8166, 1); // Force COM input mode (Meaning your code here is in control)
}
export function unsetComClientForcedInputMode() {
  sgWorld.SetParam(8166, 0); // UNForce COM input mode (Meaning your code here is NOT in control)
}
export function getVRControllersInfo() {
  var VRCstr = sgWorld.GetParam(8600) as string; // get the VR controls status
  var VRC = JSON.parse(VRCstr);
  return VRC;
}
export function getRoomExtent() {
  var extent = sgWorld.SetParamEx(9015) as string; // get the VR controls status
  var roomExtent = JSON.parse(extent);
  return roomExtent;
}

function roomToWorldCoordEx(position: IPosition) {
  let pos = sgWorld.SetParamEx(9014, position) as IPosition;
  // bug? got a object mismatch using this position when se on an object
  pos = sgWorld.Creator.CreatePosition(pos.X, pos.Y, pos.Altitude, 3, pos.Yaw, pos.Pitch, pos.Roll, pos.Distance);
  return pos;
}
function worldToRoomCoordEx(position: IPosition) {
  return sgWorld.SetParamEx(9013, position) as IPosition;
}

function roomToWorldCoordD(position: IPosition) {
  let ret = sgWorld.Navigate.GetPosition(3);
  ret.X += position.X / 40000;
  ret.Y += (position.Altitude + 2) / 40000;
  ret.Altitude += position.Y - 3;
  ret.Yaw = position.Yaw;
  ret.Pitch = position.Pitch;
  ret.Roll = position.Roll;
  return ret;
}
function worldToRoomCoordD(position: IPosition) {
  let ret = sgWorld.Navigate.GetPosition(3);
  ret.Cartesian = true;
  ret.X = 40000 * position.X - ret.X;
  ret.Y = 40000 * position.Altitude - ret.Y;
  ret.Y -= 2;
  ret.Altitude = position.Y - ret.Altitude;
  ret.Altitude += 3;
  ret.Yaw = position.Yaw;
  ret.Pitch = position.Pitch;
  ret.Roll = position.Roll;
  return ret;
}

let roomToWorldCoordF = roomToWorldCoordEx;
let worldToRoomCoordF = worldToRoomCoordEx;

export function roomToWorldCoord(position: IPosition) {
  var temp = position.Y;
  position.Y = position.Altitude;
  position.Altitude = temp;
  var ret = roomToWorldCoordF(position);
  position.Altitude = position.Y;
  position.Y = temp;
  return ret;
}
export function worldToRoomCoord(position: IPosition) {
  var ret = worldToRoomCoordF(position);
  var temp = ret.Y;
  ret.Y = ret.Altitude;
  ret.Altitude = temp;
  return ret;
}

export const enum ProgramMode {
  Unknown,
  Desktop,
  Table
}

/**
 * Handles running the script in any program mode
 */
export class ProgramManager {
  static OnFrame() { }
  static OneFrame = function () { }
  static DoOneFrame(f: () => void) { ProgramManager.OneFrame = f; }

  private mode = ProgramMode.Unknown;
  private modeTimer = 0;
  public currentlySelected = "";

  getMode() { return this.mode; }
  setMode(newMode: ProgramMode) {
    if (this.modeTimer != 0)
      // Don't revert back to unknown mode yet
      clearTimeout(this.modeTimer);
    this.modeTimer = setTimeout(() => {
      // revert back to unknown mode if no updates after some time
      this.mode = ProgramMode.Unknown;
    }, 2000);
    if (this.mode < newMode) {
      // upgrade mode
      this.mode = newMode;
      console.log(`Entered ${this.mode == 2 ? "Table" : this.mode == 1 ? "Desktop" : "Unknown"} mode`);
    }
  }

  userModeManager?: UserModeManager;
  uiManager?: UIManager;
  buttons: Button[] = [];

  private static instance?: ProgramManager;
  public static getInstance(): ProgramManager {
    if (this.instance === undefined) {
      this.instance = new ProgramManager();
    }

    return this.instance;
  }

  private constructor() {
    console.log("ProgramManager:: constructor");
  }

  getButtonsGroup(groupName: string) {
    let groupId = "";
    groupId = sgWorld.ProjectTree.FindItem(groupName);
    if (groupId) {
      sgWorld.ProjectTree.DeleteItem(groupId);
    }
    groupId = sgWorld.ProjectTree.CreateGroup(groupName);
    return groupId;
  }

  getButton1Pressed() {
    switch (this.mode) {
      case ProgramMode.Table:
        return ControllerReader.controllerInfo?.button1Pressed ?? false;
      case ProgramMode.Desktop:
        return DesktopInputManager.getLeftButtonPressed();
    }
    return false;
  }

  setButton1Pressed(pressed: boolean) {
    switch (this.mode) {
      case ProgramMode.Table:
        ControllerReader.controllerInfo!.button1Pressed = pressed;
      case ProgramMode.Desktop:
        DesktopInputManager.setLeftButtonPressed(pressed);
    }
  }

  getButton2Pressed() {
    switch (this.mode) {
      case ProgramMode.Table:
        return ControllerReader.controllerInfo?.button2Pressed ?? false;
      case ProgramMode.Desktop:
        return DesktopInputManager.getRightButtonPressed();
    }
    return false;
  }

  getButton3() {
    switch (this.mode) {
      case ProgramMode.Table:
        return ControllerReader.controllerInfo?.trigger ?? false;
      case ProgramMode.Desktop:
        return DesktopInputManager.getMiddleButton();
    }
    return false;
  }

  getButton3Pressed() {
    switch (this.mode) {
      case ProgramMode.Table:
        return ControllerReader.controllerInfo?.triggerPressed ?? false;
      case ProgramMode.Desktop:
        return DesktopInputManager.getMiddleButtonPressed();
    }
    return false;
  }

  getCursorPosition() {
    switch (this.mode) {
      case ProgramMode.Table:
        return ControllerReader.controllerInfo!.wandPosition!;
      case ProgramMode.Desktop:
        return DesktopInputManager.getCursorPosition();
    }
  }

  Update() {
    switch (this.mode) {
      case ProgramMode.Table:
        ControllerReader.Update();  // Read controllers info
        break;
      case ProgramMode.Desktop:
        DesktopInputManager.Update();
        break;
    }
    this.uiManager?.Update();
    this.userModeManager?.Update();
  }

  Draw() {
    this.uiManager?.Draw();
    this.userModeManager?.Draw();
  }

  Init() {
    try {
      console.log("init:: " + new Date(Date.now()).toISOString());
      setComClientForcedInputMode();
      // Wait for managers to initialise on first frame
      const afterFirst = () => {
        sgWorld.AttachEvent("OnFrame", () => {
          var prev = ProgramManager.OneFrame;
          ProgramManager.OneFrame = () => { };
          ProgramManager.getInstance().setMode(ProgramMode.Desktop);
          if (ProgramManager.getInstance().getMode() == ProgramMode.Desktop) {
            roomToWorldCoordF = roomToWorldCoordD;
            worldToRoomCoordF = worldToRoomCoordD;
            prev();
            ProgramManager.OnFrame();
            Update();
            Draw();
            roomToWorldCoordF = roomToWorldCoordEx;
            worldToRoomCoordF = worldToRoomCoordEx;
          }
        });
        sgWorld.AttachEvent("OnSGWorld", (eventID, _eventParam) => {
          if (eventID == 14) {
            // This is the place were you need to read wand information and respond to it.
            ProgramManager.getInstance().setMode(ProgramMode.Table);
            if (ProgramManager.getInstance().getMode() == ProgramMode.Table) {
              Update();
              Draw();
              debugHandleRefreshGesture();
            }
          }
        });
        sgWorld.AttachEvent("OnCommandExecuted", (CommandID: string, parameters: any) => {
          console.log(CommandID + " " + JSON.stringify(parameters))
        });
      };
      const firstTableFrame = (eventID: number, _eventParam: unknown) => {
        if (eventID == 14) {
          this.userModeManager = new UserModeManager();
          this.uiManager = new UIManager();
          this.userModeManager?.Init();
          this.uiManager?.Init();
          sgWorld.DetachEvent("OnFrame", firstDesktopFrame);
          sgWorld.DetachEvent("OnSGWorld", firstTableFrame);
          afterFirst();
        }
      };
      const firstDesktopFrame = () => {
        this.userModeManager = new UserModeManager();
        this.uiManager = new UIManager();
        // TODO combine init and construct again
        this.userModeManager?.Init();
        this.uiManager?.Init();
        sgWorld.DetachEvent("OnFrame", firstDesktopFrame);
        sgWorld.DetachEvent("OnSGWorld", firstTableFrame);
        afterFirst();
      };
      sgWorld.AttachEvent("OnSGWorld", firstTableFrame);
      sgWorld.AttachEvent("OnFrame", firstDesktopFrame);
    } catch (e) {
      console.log("init error");
      console.log(e);
    }
  }
}

let recentProblems: number = 0;

function Update() {
  if (recentProblems == 0) {
    try {
      ProgramManager.getInstance().Update();
    } catch (e) {
      ++recentProblems;
      console.log("Update error");
      console.log(e);
      console.log("CallStack:\n" + debug.stacktrace(debug.info));
      setTimeout(() => {
        if (recentProblems > 0) {
          console.log(String(recentProblems) + " other problems");
          recentProblems = 0;
        }
      }, 5000);
    }
  } else {
    ++recentProblems;
    ProgramManager.getInstance().Update();
    --recentProblems;
  }
}

function Draw() {
  if (recentProblems == 0) {
    try {
      ProgramManager.getInstance().Draw();
    } catch (e) {
      ++recentProblems;
      console.log("Draw error");
      console.log(e);
      console.log("CallStack:\n" + debug.stacktrace(debug.info));
      setTimeout(() => {
        if (recentProblems > 0) {
          console.log(String(recentProblems) + " other problems");
          recentProblems = 0;
        }
      }, 5000);
    }
  } else {
    ++recentProblems;
    ProgramManager.getInstance().Draw();
    --recentProblems;
  }
}

function WorldGetPosition() {
  var pos = worldToRoomCoord(sgWorld.Navigate.GetPosition(3));
  return [pos.X, pos.Y, pos.Altitude];
}

function WorldSetPosition(v: any) {
  var newPos = worldToRoomCoord(sgWorld.Navigate.GetPosition(3));
  newPos.X = v[0];
  newPos.Y = v[1];
  sgWorld.Navigate.SetPosition(roomToWorldCoord(newPos));
}

export function WorldIncreasePosition(v: any) {
  WorldSetPosition(vecAdd(v, WorldGetPosition()));
}

export function WorldGetScale() {
  return sgWorld.Navigate.GetPosition(3).Altitude;
}

export function WorldGetOri() {
  var pos = worldToRoomCoord(sgWorld.Navigate.GetPosition(3));
  return YPRToQuat(pos.Yaw, pos.Pitch, pos.Roll);
}

export function deviceHeightOffset() {
  return 0.615;
}

export function MaxZoom() {
  // arbitrary limit to max zoom
  return 99999999999;
}
