import { sgWorld } from "./Axiom";
import { Vector } from "./math/vector";
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
  min: Vector<3>;
  max: Vector<3>;
}

export class ControllerReader {
  // order is ["Left", "Right"]
  static controllerInfos: Partial<ControllerInfo>[] = [{}, {}];
  private static button1 = [0x200, 0x2];
  private static button2 = [0x100, 0x1];
  static roomExtent?: RoomExtent;

  static Update() {
    const VRControllersInfo = getVRControllersInfo();
    if (VRControllersInfo !== undefined) {
      for (let hand = 0; hand < 2; ++hand) {
        const prevTrigger = this.controllerInfos[hand]?.trigger ?? false;
        const prevButton1 = this.controllerInfos[hand]?.button1 ?? false;
        const prevButton2 = this.controllerInfos[hand]?.button2 ?? false;

        this.controllerInfos[hand] = {};

        const triggerOn = VRControllersInfo.IndexTrigger && VRControllersInfo.IndexTrigger[hand] != 0
        const button1On = (VRControllersInfo.Buttons & ControllerReader.button1[hand]) != 0;
        const button2On = (VRControllersInfo.Buttons & ControllerReader.button2[hand]) != 0;

        this.controllerInfos[hand].triggerPressed = triggerOn && !prevTrigger;
        this.controllerInfos[hand].button1Pressed = button1On && !prevButton1;
        this.controllerInfos[hand].button2Pressed = button2On && !prevButton2;

        this.controllerInfos[hand].trigger = triggerOn;
        this.controllerInfos[hand].button1 = button1On;
        this.controllerInfos[hand].button2 = button2On;

        if (VRControllersInfo.HavePosition != undefined && VRControllersInfo.HavePosition[hand]) {
          const wandPosition = sgWorld.Navigate.GetPosition(3);
          wandPosition.Distance = 100000;
          wandPosition.X = VRControllersInfo.Position[hand][0];
          wandPosition.Y = VRControllersInfo.Position[hand][2];
          wandPosition.Altitude = VRControllersInfo.Position[hand][1];
          if (VRControllersInfo.HaveOrientation != undefined && VRControllersInfo.HaveOrientation[hand]) {
            wandPosition.Yaw = VRControllersInfo.Yaw[hand];
            wandPosition.Pitch = VRControllersInfo.Pitch[hand];
            wandPosition.Roll = VRControllersInfo.Roll[hand];
            const headPosition = sgWorld.Navigate.GetPosition(3);
            const tmpHeadsetpos = sgWorld.GetParam(8601) as IPosition;
            headPosition.X = tmpHeadsetpos.X;
            headPosition.Y = tmpHeadsetpos.Y;
            headPosition.Altitude = tmpHeadsetpos.Altitude;
            headPosition.Yaw = tmpHeadsetpos.Yaw;
            headPosition.Pitch = tmpHeadsetpos.Pitch;
            headPosition.Roll = tmpHeadsetpos.Roll;
            this.controllerInfos[hand].headPosition = headPosition;
          }
          this.controllerInfos[hand].wandPosition = wandPosition;
        }
        this.controllerInfos[hand].scaleFactor = VRControllersInfo.ScaleFactor;
      }
    } else {
      this.controllerInfos[0].triggerPressed = false;
      this.controllerInfos[0].button1Pressed = false;
      this.controllerInfos[0].button2Pressed = false;
      this.controllerInfos[1].triggerPressed = false;
      this.controllerInfos[1].button1Pressed = false;
      this.controllerInfos[1].button2Pressed = false;
      this.controllerInfos[0].scaleFactor = 1;
      this.controllerInfos[1].scaleFactor = 1;
    }
    if (this.roomExtent === undefined) {
      const roomExtent = getRoomExtent();
      this.roomExtent = {
        min: new Vector<3>([roomExtent.minX, roomExtent.minY, roomExtent.minZ]),
        max: new Vector<3>([roomExtent.maxX, roomExtent.maxY, roomExtent.maxZ])
      };
    }
  }
}
