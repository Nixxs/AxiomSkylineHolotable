import { sgWorld } from "./Axiom";

export class Ray {
  ID?: string;
  Draw(pickRayInfo: any) {
    var verticesArray = new Array(6);
    verticesArray[0] = pickRayInfo.originPoint.X;
    verticesArray[1] = pickRayInfo.originPoint.Y;
    verticesArray[2] = pickRayInfo.originPoint.Altitude;
    verticesArray[3] = pickRayInfo.hitPoint.X;
    verticesArray[4] = pickRayInfo.hitPoint.Y;
    verticesArray[5] = pickRayInfo.hitPoint.Altitude;
    if (this.ID === undefined) {
      var RightRay = sgWorld.Creator.CreatePolylineFromArray(verticesArray, pickRayInfo.isNothing ? 0xFF0000FF : 0xFFFFFFFF, 3, "", "ray");
      RightRay.SetParam(200, 0x200);  // Make sure that the ray object itself will not be pickable
      this.ID = RightRay.ID;
    } else {
      var obj = sgWorld.Creator.GetObject(this.ID) as ITerrainPolyline;
      obj.Geometry = sgWorld.Creator.GeometryCreator.CreateLineStringGeometry(verticesArray);
      obj.LineStyle.Color.abgrColor = (pickRayInfo.objectID !== undefined) ? 0xFF0000FF : 0xFFFF0000;
    }
  }
}
