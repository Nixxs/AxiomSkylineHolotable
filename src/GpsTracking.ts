import { basePath, sgWorld } from "./Axiom";
import { degsToRads, radsToDegs } from "./Mathematics";
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
    setInterval(() => {
      this.getLocation().then(gps => {
        this.updateLocation(gps)
      })
    }, 5000);
  }

  getLocation(): Promise<GpsObject[]> {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
          // sadly this response is horribly structured. Should have been an array...
          const data = JSON.parse(this.response); // XXX JSON.parse returns unknown
          const newData = [];
          for (let key in data) {
            newData.push({
              user: key.split(":")[1].trim(),
              position: data[key]
            });
          }
          resolve(newData);
        }
      };
      xhr.open("GET", this.jsonURL, false);
      xhr.send();
    });
  }

  updateLocation(locations: GpsObject[]) {
    try {
      if (this.previousPoints.length === 0) this.previousPoints = locations;
      for (let location of locations) {
        if (location.user === "36ad9289e2eeaf1f") continue; // XXX no idea who this is and they are in perth 
        const pos = sgWorld.Creator.CreatePosition(location.position.longitude, location.position.latitude, 10, AltitudeTypeCode.ATC_TERRAIN_RELATIVE);
        const modelId = this.modelIds.filter(m => m.user === location.user);
        if (modelId.length > 0) {
          // delta x
          const points = this.previousPoints.filter(p => p.user === location.user);
          // something is going wrong. occasional nan
          if (!location.position.longitude || !location.position.latitude) {
            location.position.longitude = points[0].position.longitude;
            location.position.latitude = points[0].position.latitude;
          }
          const deltaX = location.position.longitude - points[0].position.longitude;
          const deltaY = location.position.latitude - points[0].position.latitude;
          // 5 seconds between updates
          const changeX = deltaX / 400;
          const changeY = deltaY / 400;
          if (changeX !== 0 && changeY !== 0) {
            console.log(`${location.user} deltaX ${Math.round(deltaX * 100) / 100} deltaY ${Math.round(deltaY * 100) / 100}`);
            const model = GetObject(modelId[0].id, ObjectTypeCode.OT_MODEL);
            if (model) {
              for (let index = 0; index < 100; index++) {
                this.sleep(100).then(() => {
                  if (model.Position.X !== location.position.longitude)
                    model.Position.X += changeX;
                  if (model.Position.Y !== location.position.latitude)
                    model.Position.Y += changeY;
                });
              }
              // something is going wrong. occasional nan
              if (!location.position.longitude || !location.position.latitude) {
                location.position.longitude = points[0].position.longitude;
                location.position.latitude = points[0].position.latitude;
              }
              model.Position.Yaw = this.getBearing(location);
            }
          }
        } else {
          // create a new model
          const grp = sgWorld.ProjectTree.CreateGroup("TrackedUsers", ProgramManager.getInstance().groupID);
          const model = sgWorld.Creator.CreateModel(pos, this.modelFile, 1, 0, grp, location.user);
          this.modelIds.push({ user: location.user, id: model.ID });
          model.ScaleFactor = this.modelScaleFactor;
        }
      }
      this.previousPoints = locations;
    } catch (error) {
      console.log("updateLocation error");
      console.log(error);
    }
  }

  sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
    startLat = degsToRads(startLat);
    startLng = degsToRads(startLng);
    destLat = degsToRads(destLat);
    destLng = degsToRads(destLng);

    const y = Math.sin(destLng - startLng) * Math.cos(destLat);
    const x = Math.cos(startLat) * Math.sin(destLat) -
      Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);
    let bearing = Math.atan2(y, x);
    bearing = radsToDegs(bearing);
    return (bearing + 360) % 360;
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
