import { basePath, sgWorld } from "./Axiom";
import { GetObject, ProgramManager } from "./ProgramManager";


/**
 * Android app reports locations to an endpoint
 *
 * @class GpsTracking
 */
export class GpsTracking {

  jsonURL = "https://defense-3d-mission-default-rtdb.asia-southeast1.firebasedatabase.app/.json"
  modelFile = basePath + `model/ScaleModels/Boxer_IFV.xpl2`;
  modelIds: { user: string; id: string; }[] = []
  previousPoints: GpsObject[] = [];
  modelScaleFactor = 10; // if you need it to be bigger increase this

  constructor() {
    this.init();
  }

  init() {
    ProgramManager.getInstance().deleteGroup("TrackedUsers");
    setInterval(() => {
      this.getLocation().then(gps => {
        this.updateLocation(gps)
      })
    }, 1000);
  }

  getLocation(): Promise<GpsObject[]> {
    return new Promise((resolve) => {
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
          // sadly this response is horribly structured. Should have been an array...
          const data = JSON.parse(this.response);
          const newData = []
          for (var key in data) {
            newData.push({
              user: key.split(":")[1].trim(),
              position: data[key]
            });
          }
          // console.log(JSON.stringify(newData))
          resolve(newData)
        }
      };
      xhr.open("GET", this.jsonURL, false);
      xhr.send();
    })

  }


  updateLocation(locations: GpsObject[]) {
    try {

      locations.forEach((location) => {
        if (location.user !== "36ad9289e2eeaf1f") { // no idea who this is and they are in perth
          const pos = sgWorld.Creator.CreatePosition(location.position.longitude, location.position.latitude, 10, AltitudeTypeCode.ATC_TERRAIN_RELATIVE);
          const modelId = this.modelIds.filter((m) => m.user === location.user);
          if (modelId.length > 0) {
            const model = GetObject(modelId[0].id, ObjectTypeCode.OT_MODEL);
            if (model) {
              model.Position = pos;
              model.Position.Yaw = this.getBearing(location)
            }
          } else {
            // create a new model
            const grp = ProgramManager.getInstance().getGroupID("TrackedUsers");
            const model = sgWorld.Creator.CreateModel(pos, this.modelFile, 1, 0, grp, location.user);
            this.modelIds.push({ user: location.user, id: model.ID });
            model.ScaleFactor = this.modelScaleFactor;
          }
        }
      })
      this.previousPoints = locations;
    } catch (error) {
      console.log(error)
    }
  }

  getBearing(currentPoint: GpsObject) {
    const points = this.previousPoints.filter(p => p.user === currentPoint.user);
    if (points.length === 0) {
      return 90;
    }
    return this.bearing(points[0].position.latitude, points[0].position.longitude,
      currentPoint.position.latitude, currentPoint.position.longitude)

  }

  bearing(startLat: number, startLng: number, destLat: number, destLng: number) {
    startLat = this.toRadians(startLat);
    startLng = this.toRadians(startLng);
    destLat = this.toRadians(destLat);
    destLng = this.toRadians(destLng);

    const y = Math.sin(destLng - startLng) * Math.cos(destLat);
    const x = Math.cos(startLat) * Math.sin(destLat) -
      Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);
    let bearing = Math.atan2(y, x);
    bearing = this.toDegrees(bearing);
    return (bearing + 360) % 360;
  }

  // Converts from degrees to radians.
  toRadians(degrees: number) {
    return degrees * Math.PI / 180;
  };

  // Converts from radians to degrees.
  toDegrees(radians: number) {
    return radians * 180 / Math.PI;
  }
}
export interface GpsObject {
  user: string
  position: Position
}

export interface Position {
  latitude: number
  longitude: number
}
