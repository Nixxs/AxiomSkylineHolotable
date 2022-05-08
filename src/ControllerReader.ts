import { sgWorld } from "./Axiom";
import { getRoomExtent, getVRControllersInfo } from "./ProgramManager";

interface ControllerInfo {
  wandPosition: IPosition;
  button1: boolean;
  button2: boolean;
  button1Pressed: boolean;
  button2Pressed: boolean;
  trigger: boolean;
  triggerPressed: boolean;
  headPosition: IPosition;
  scaleFactor: number;
}

type RoomExtent = {
  min: [number, number, number];
  max: [number, number, number];
}

export class ControllerReader {
  static controllerInfo?: Partial<ControllerInfo>;
  static roomExtent?: RoomExtent;

  static Update() {
    var VRControllersInfo = getVRControllersInfo();
    if (VRControllersInfo !== undefined) {
      const rightHand = 1; // 0=left,1=right

      const prevTrigger = this.controllerInfo?.trigger ?? false;
      const prevButton1 = this.controllerInfo?.button1 ?? false;
      const prevButton2 = this.controllerInfo?.button2 ?? false;

      this.controllerInfo = {};

      const triggerOn = VRControllersInfo.IndexTrigger && VRControllersInfo.IndexTrigger[rightHand] != 0
      const button1On = (VRControllersInfo.Buttons & 0x2) != 0;
      const button2On = (VRControllersInfo.Buttons & 0x1) != 0;

      this.controllerInfo.triggerPressed = triggerOn && !prevTrigger;
      this.controllerInfo.button1Pressed = button1On && !prevButton1;
      this.controllerInfo.button2Pressed = button2On && !prevButton2;

      this.controllerInfo.trigger = triggerOn;
      this.controllerInfo.button1 = button1On;
      this.controllerInfo.button2 = button2On;

      if (VRControllersInfo.HavePosition != undefined && VRControllersInfo.HavePosition[rightHand]) {
        this.controllerInfo.wandPosition = sgWorld.Navigate.GetPosition(3); // Naive way to create gPosRightHandPos
        this.controllerInfo.wandPosition.Distance = 100000;
        this.controllerInfo.wandPosition.X = VRControllersInfo.Position[rightHand][0];
        this.controllerInfo.wandPosition.Y = VRControllersInfo.Position[rightHand][2];
        this.controllerInfo.wandPosition.Altitude = VRControllersInfo.Position[rightHand][1];
        if (VRControllersInfo.HaveOrientation != undefined && VRControllersInfo.HaveOrientation[rightHand]) {
          this.controllerInfo.wandPosition.Yaw = VRControllersInfo.Yaw[rightHand];
          this.controllerInfo.wandPosition.Pitch = VRControllersInfo.Pitch[rightHand];
          this.controllerInfo.wandPosition.Roll = VRControllersInfo.Roll[rightHand];
          this.controllerInfo.headPosition = sgWorld.Navigate.GetPosition(3);
          var tmpHeadsetpos = sgWorld.GetParam(8601) as IPosition;
          this.controllerInfo.headPosition.X = tmpHeadsetpos.X;
          this.controllerInfo.headPosition.Y = tmpHeadsetpos.Y;
          this.controllerInfo.headPosition.Altitude = tmpHeadsetpos.Altitude;
          this.controllerInfo.headPosition.Yaw = tmpHeadsetpos.Yaw;
          this.controllerInfo.headPosition.Pitch = tmpHeadsetpos.Pitch;
          this.controllerInfo.headPosition.Roll = tmpHeadsetpos.Roll;
        }
      }
      this.controllerInfo.scaleFactor = VRControllersInfo.ScaleFactor;
    } else {
      if (this.controllerInfo !== undefined) {
        this.controllerInfo.triggerPressed = false;
        this.controllerInfo.button1Pressed = false;
        this.controllerInfo.button2Pressed = false;
      }
    }
    if (this.roomExtent === undefined) {
      const roomExtent = getRoomExtent();
      this.roomExtent = {
        min: [roomExtent.minX, roomExtent.minY, roomExtent.minZ],
        max: [roomExtent.maxX, roomExtent.maxY, roomExtent.maxZ]
      };
    }
  }
}
