import { SGWorld } from "./Axiom";
import { DesktopInputManager } from "./DesktopInputManager";
import { Ray } from "./Ray";
import { Sphere } from "./Sphere";

export class Laser {
  ray: Ray = new Ray();
  tip: Sphere = new Sphere();

  collision?: {
    originPoint: IPosition,
    hitPoint: IPosition,
    rayLength: number,
    objectID?: string,
    isNothing: boolean
  };

  UpdateTable(position: IPosition) {
    SGWorld.SetParam(8300, position); // Pick ray
    const hitObjectID = SGWorld.GetParam(8310) as string | undefined;
    let distToHitPoint = SGWorld.GetParam(8312) as number;    // Get distance to hit point
    let isNothing = false;
    if (distToHitPoint == 0) {
      distToHitPoint = SGWorld.Navigate.GetPosition(3).Altitude / 2;
      isNothing = true;
    }

    if (isNothing !== this.collision?.isNothing) {
      console.log(isNothing ? "Nothing" : "Something");
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
      originPoint: SGWorld.Navigate.GetPosition(3),
      hitPoint: DesktopInputManager.getCursorPosition(),
      rayLength: SGWorld.Navigate.GetPosition(3).DistanceTo(DesktopInputManager.getCursorPosition()),
      objectID: DesktopInputManager.getCursor().ObjectID,
      isNothing: DesktopInputManager.getCursor().ObjectID === ''
    };
  }

  Draw() {
    this.ray.Draw(this.collision);
    this.tip.Draw(this.collision);
  }
}
