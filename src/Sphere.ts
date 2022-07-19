import { sgWorld } from "./Axiom";
import { collisionInfo } from "./Laser";
import { GetObject } from "./ProgramManager";

export class Sphere {
  constructor(private groupID: string) { }
  ID?: string;
  Draw(pickRayInfo: collisionInfo) {
    const rayLengthScaleFactor = pickRayInfo.rayLength * 0.004;
    const sphereRadius = Math.max(0.01, rayLengthScaleFactor);
    const spherePivot = pickRayInfo.hitPoint.Copy();
    spherePivot.Altitude -= sphereRadius / 2;
    if (this.ID == undefined) {
      const tip = sgWorld.Creator.CreateSphere(pickRayInfo.hitPoint.Copy(), sphereRadius, 0, 0x5000FF00, 0x5000FF00, 10, this.groupID, "rayTip");
      tip.SetParam(200, 0x200);
      this.ID = tip.ID;
    } else {
      const obj = GetObject(this.ID, ObjectTypeCode.OT_SPHERE);
      if (obj !== null) {
        obj.Position = pickRayInfo.hitPoint.Copy();
        obj.Position.Altitude -= sphereRadius / 2;
        obj.SetParam(200, 0x200); // not pickable
        obj.Radius = sphereRadius;
        obj.LineStyle.Color.FromARGBColor(pickRayInfo.objectID == undefined ? 0x50FFFFFF : 0x5000FF00);
      }
    }
  }
}
