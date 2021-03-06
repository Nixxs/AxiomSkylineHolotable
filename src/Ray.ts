import { sgWorld } from "./Axiom";
import { collisionInfo } from "./Laser";
import { GetObject } from "./ProgramManager";

export class Ray {
  constructor(private groupID: string) { }
  ID?: string;
  Draw(pickRayInfo: collisionInfo) {
    const verticesArray = new Array(6);
    verticesArray[0] = pickRayInfo.originPoint.X;
    verticesArray[1] = pickRayInfo.originPoint.Y;
    verticesArray[2] = pickRayInfo.originPoint.Altitude;
    verticesArray[3] = pickRayInfo.hitPoint.X;
    verticesArray[4] = pickRayInfo.hitPoint.Y;
    verticesArray[5] = pickRayInfo.hitPoint.Altitude;
    if (this.ID === undefined) {
      const RightRay = sgWorld.Creator.CreatePolylineFromArray(verticesArray, pickRayInfo.isNothing ? 0xFF0000FF : 0xFFFFFFFF, 3, this.groupID, "ray");
      RightRay.SetParam(200, 0x200);  // Make sure that the ray object itself will not be pickable
      this.ID = RightRay.ID;
    } else {
      try {
        const obj = GetObject(this.ID, ObjectTypeCode.OT_POLYLINE);
        if (obj !== null) {
          obj.Geometry = sgWorld.Creator.GeometryCreator.CreateLineStringGeometry(verticesArray);
          obj.LineStyle.Color.abgrColor = (pickRayInfo.objectID !== undefined) ? 0xFF0000FF : 0xFFFF0000;
        }
      } catch (error) {
        console.error("Ray error");
      }
    }
  }
}
