import { sgWorld } from "./Axiom";
import { ControllerReader } from "./ControllerReader";
import { DesktopInputManager } from "./DesktopInputManager";
import { Ray } from "./Ray";
import { Sphere } from "./Sphere";

export type collisionInfo = {
  originPoint: IPosition,
  hitPoint: IPosition,
  rayLength: number,
  objectID?: string,
  isNothing: boolean
};

export class Laser {
  ray: Ray = new Ray(this.groupID);
  tip: Sphere = new Sphere(this.groupID);

  constructor(private groupID: string) { }

  collision?: collisionInfo;

  UpdateTable(userIndex: number) {
    const position = ControllerReader.controllerInfos[userIndex].wandPosition?.Copy();
    if (position === undefined)
      return;
    position.Distance *= 2;
    sgWorld.SetParam(8300, position); // Pick ray
    const hitObjectID = sgWorld.GetParam(8310) as string | undefined;
    let distToHitPoint = sgWorld.GetParam(8312) as number;    // Get distance to hit point
    let isNothing = false;
    if (distToHitPoint == 0) {
      distToHitPoint = sgWorld.Navigate.GetPosition(3).Altitude / 2;
      isNothing = true;
    }

    if (isNothing !== this.collision?.isNothing) {
      // console.log(isNothing ? "Nothing" : "Something");
    }
    const hitPosition = position.Copy().Move(distToHitPoint, position.Yaw, position.Pitch);
    hitPosition.Cartesian = true;
    this.collision = {
      originPoint: position,
      hitPoint: hitPosition,
      rayLength: distToHitPoint,
      objectID: hitObjectID,
      isNothing: isNothing
    };
  }

  UpdateDesktop() {
    if (this.collision?.isNothing && DesktopInputManager.getCursor().ObjectID !== '') {
      console.log(`hitting ${DesktopInputManager.getCursor().ObjectID}`);
    } else if (!this.collision?.isNothing && DesktopInputManager.getCursor().ObjectID === '') {
      console.log('Not hitting');
    }

    this.collision = {
      originPoint: sgWorld.Navigate.GetPosition(3),
      hitPoint: DesktopInputManager.getCursorPosition(),
      rayLength: sgWorld.Navigate.GetPosition(3).DistanceTo(DesktopInputManager.getCursorPosition()),
      objectID: DesktopInputManager.getCursor().ObjectID === '' ? undefined : DesktopInputManager.getCursor().ObjectID,
      isNothing: DesktopInputManager.getCursor().ObjectID === ''
    };
  }

  Draw() {
    if (this.collision === undefined)
      return;
    this.ray.Draw(this.collision);
    this.tip.Draw(this.collision);
  }
}
