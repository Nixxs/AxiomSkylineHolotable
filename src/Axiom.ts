declare var SGWorld: ISGWorld;
const enum ControlMode {
  Wand,
  Table,
  Wall
};

var programManager : ProgramManager; 

const basePath = "\\\\192.168.1.19/d/C-ARMSAS/axiom/";
// unc path of model

const gControlMode: ControlMode = ControlMode.Table;

const enum UserMode {
  Standard, // this can include FlyTo, but also just standard navigation; we don't distinguish them for now
  Measurement,
  DropRangeRing,
  PlaceModel,
  MoveModel
};

class UserModeManager {
  public userMode = UserMode.Standard;
  private spacing = 5000;
  private numRings = 5;
  private measurementModeFirstPoint: IPosition | null = null;
  private measurementModeLineID: string | null = null;
  private measurementTextLabelID: string | null = null;
  private currentId: string | null = null;
  private measurementLineWidth = 3;
  private measurementLineColor: IColor;
  private decimalPlaces = 3;
  private measurementLabelStyle: ILabelStyle;
  private labelStyle = SGWorld.Creator.CreateLabelStyle(0);
  public modelIds: string[] = [];

  constructor(private laser: Laser) {
    this.measurementLineColor = SGWorld.Creator.CreateColor(255, 255, 0, 255);
    this.measurementLabelStyle = SGWorld.Creator.CreateLabelStyle(0);
    this.measurementLabelStyle.PivotAlignment = "Top";
    this.measurementLabelStyle.MultilineJustification = "Left";
  }

  jumpToSydney() {
    console.log("sydney");
    SGWorld.Navigate.FlyTo(SGWorld.Creator.CreatePosition(151.2067675, -33.8667266, 5000, 3, 0, -80, 0, 5000));
    this.userMode = UserMode.Standard;
  }
  jumpToWhyalla() {
    console.log("whyalla");
    SGWorld.Navigate.FlyTo(SGWorld.Creator.CreatePosition(137.5576346, -33.0357364, 5000, 3, 0, -80, 0, 5000));
    this.userMode = UserMode.Standard;
  }

  toggleMeasurementMode() {
    if (this.userMode == UserMode.Measurement) {
      if (this.measurementModeLineID !== null) {
        SGWorld.Creator.DeleteObject(this.measurementModeLineID);
        SGWorld.Creator.DeleteObject(this.measurementTextLabelID!);
      }
      this.userMode = UserMode.Standard;
    } else {
      this.userMode = UserMode.Measurement;
    }
    this.measurementModeLineID = null;
    this.measurementTextLabelID = null;
    this.measurementModeFirstPoint = null;
  }

  toggleModelMode(modelName: string) {
    if (this.userMode == UserMode.PlaceModel) {
      console.log("end model mode");
      this.userMode = UserMode.Standard;
    } else {
      const modelPath = basePath +  `model/${modelName}.xpl2`;
      var pos = SGWorld.Window.CenterPixelToWorld(0).Position.Copy()
      pos.Pitch = 0;
      console.log("creating model:: " + modelPath);
      this.currentId = SGWorld.Creator.CreateModel(pos, modelPath, 1, 0, "", modelName).ID;
      this.modelIds.push(this.currentId)
      programManager.currentlySelected = this.currentId;
      this.userMode = UserMode.PlaceModel;
    }
  }

  toggleMoveModelMode(modelID: string){
    if (this.userMode == UserMode.MoveModel) {
      console.log("end move model mode");
      this.userMode = UserMode.Standard;
    } else {
      if (modelID != "none"){
        this.currentId = modelID;
        this.userMode = UserMode.MoveModel;
      } else {
        this.userMode = UserMode.Standard;
      }
    }
  }

  setStandardMode() {
    this.userMode = UserMode.Standard;
  }

  toggleRangeRingMode() {
    if (this.userMode == UserMode.DropRangeRing)
      this.userMode = UserMode.Standard;
    else
      this.userMode = UserMode.DropRangeRing;
  }

  dropRangeRing() {
    console.log("dropRangeRing");
    let lineColor = SGWorld.Creator.CreateColor(255, 0, 0, 255); //red for customer requirements
    const fillColor = SGWorld.Creator.CreateColor(0, 0, 0, 0); //"0x00000000";
    const pos = this.laser.collision!.hitPoint.Copy();
    const objNamePrefix = pos.X + "long" + pos.Y + "lat" + pos.Altitude + "mAlt_";

    //create centre circle
    var centerFillColour = SGWorld.Creator.CreateColor(0, 0, 0, 255);
    SGWorld.Creator.CreateCircle(pos, 500, fillColor, centerFillColour, "", "Centre Range Ring");

    for (var i = 1; i <= this.numRings; i++) {
      const radius = this.spacing * i
      const itemName = objNamePrefix + "RangeRing" + radius + "m";
      if (radius >= 25000) {
        lineColor = SGWorld.Creator.CreateColor(255, 0, 0, 255);
      } else {
        lineColor = SGWorld.Creator.CreateColor(0, 0, 0, 255);
      }
      const circle = SGWorld.Creator.CreateCircle(pos, radius, lineColor, fillColor, "", itemName);
      circle.NumberOfSegments = 50;

      const newPos = pos.Move(radius, 270, 0);
      SGWorld.Creator.CreateTextLabel(
        newPos,
        radius + "m",
        this.labelStyle,
        "",
        itemName);
    }
  }

  scaleModel(scaleVector: number): void {
    if(!this.hasSelected()) return;
    const model = SGWorld.Creator.GetObject(programManager.currentlySelected) as ITerrainModel;
    model.ScaleFactor = model.ScaleFactor += scaleVector;
  }

  deleteModel(): void {
    if(!this.hasSelected()) return;
    const model = SGWorld.Creator.GetObject(programManager.currentlySelected) as ITerrainModel;
    SGWorld.Creator.DeleteObject(programManager.currentlySelected)
  }

  undo(): void {
    console.log("undo")
    SGWorld.Command.Execute(2345)
  }

  private hasSelected(): boolean{
    if (!programManager.currentlySelected ) {
      console.log("scaleModel:: no model selected.");
      return false;
    };
    return true;
  }

 
  

  Update(button1pressed:boolean) {
    switch (this.userMode) {
      case UserMode.Standard:
        switch (gControlMode) {
          case ControlMode.Table:
            tableMode();
            selectMode(this.laser, button1pressed);
            break;
          case ControlMode.Wall:
            wallMode(this.laser!);
            break;
          case ControlMode.Wand:
            wandMode(this.laser!);
            break;
        }
        break;
      case UserMode.Measurement:
        if (this.measurementModeFirstPoint !== null && this.measurementTextLabelID !== null && this.measurementModeLineID !== null) {
          // Move the line end position to the cursor
          const teEndPos = this.laser.collision!.hitPoint.Copy();
          const teStartPos = this.measurementModeFirstPoint.Copy().AimTo(teEndPos);
          const mLine = SGWorld.Creator.GetObject(this.measurementModeLineID) as ITerrainPolyline;
          const Geometry = mLine.Geometry as ILineString;
          Geometry.StartEdit();
          Geometry.Points.Item(1).X = teEndPos.X;
          Geometry.Points.Item(1).Y = teEndPos.Y;
          Geometry.EndEdit();

          // Update the label
          const direction: string = teStartPos.Yaw.toFixed(this.decimalPlaces);
          const distance: string = teStartPos.DistanceTo(teEndPos).toFixed(this.decimalPlaces);
          const strLabelText = `${direction} ${String.fromCharCode(176)} / ${distance}m`;
          const teHalfPos = teStartPos.Move(teStartPos.DistanceTo(teEndPos) / 2, teStartPos.Yaw, 0);
          const mLabel = SGWorld.Creator.GetObject(this.measurementTextLabelID) as ITerrainLabel;
          mLabel.Text = strLabelText;
          mLabel.Position = teHalfPos;

          // Exit mode when pressed again
          if (ControllerReader.controllerInfo?.button1Pressed) {
            console.log("finished line");
            this.setStandardMode();
            // consume the button press
            ControllerReader.controllerInfo.button1Pressed = false;
            this.measurementModeLineID = null;
            this.measurementTextLabelID = null;
            this.measurementModeFirstPoint = null;
          }
        } else if (ControllerReader.controllerInfo?.button1Pressed) {
          // Create the line and label
          console.log("new line");

          this.measurementModeFirstPoint = this.laser.collision!.hitPoint.Copy();

          const teStartPos = this.measurementModeFirstPoint.Copy();
          const teEndPos = teStartPos.Copy();

          const strLineWKT = "LineString( " + teStartPos.X + " " + teStartPos.Y + ", " + teEndPos.X + " " + teEndPos.Y + " )";
          const lineGeom = SGWorld.Creator.GeometryCreator.CreateLineStringGeometry(strLineWKT);
          const mLine = SGWorld.Creator.CreatePolyline(lineGeom, this.measurementLineColor, 2, "", "__line");
          mLine.LineStyle.Width = this.measurementLineWidth;
          this.measurementModeLineID = mLine.ID;

          this.measurementTextLabelID = SGWorld.Creator.CreateTextLabel(teStartPos, "0m", this.measurementLabelStyle, "", "___label").ID;
          // consume the button press
          ControllerReader.controllerInfo.button1Pressed = false;
        }
        break;
      case UserMode.DropRangeRing:
        if (ControllerReader.controllerInfo?.button1Pressed) {
          this.dropRangeRing();
          this.setStandardMode();
          // consume the button press
          ControllerReader.controllerInfo.button1Pressed = false;
        }
        break;
      case UserMode.PlaceModel:
        if (ControllerReader.controllerInfo?.button1Pressed) {
          this.setStandardMode();
          // consume the button press
          ControllerReader.controllerInfo.button1Pressed = false;
        } else {
          if (this.laser.collision !== undefined) {
            var newModelPosition = this.laser.collision.hitPoint.Copy();
            newModelPosition.Pitch = 0;
            newModelPosition.Yaw = newModelPosition.Roll * 2;
            newModelPosition.Roll = 0;
            const modelObject = SGWorld.Creator.GetObject(this.currentId!) as ITerrainModel;
            modelObject.Position = newModelPosition;
          }
        }
        break;
      case UserMode.MoveModel:
        if (ControllerReader.controllerInfo?.button1Pressed) {
          this.setStandardMode();
          // consume the button press
          ControllerReader.controllerInfo.button1Pressed = false;
        } else {
          if (this.laser.collision !== undefined) {
            var newModelPosition = this.laser.collision.hitPoint.Copy();
            newModelPosition.Pitch = 0;
            newModelPosition.Yaw = newModelPosition.Roll * 2;
            newModelPosition.Roll = 0;
            const modelObject = SGWorld.Creator.GetObject(this.currentId!) as ITerrainModel;
            modelObject.Position = newModelPosition;
          }
        }
      break;
    }
  } 
}

interface ControllerInfo {
  wandPosition: IPosition;
  button1: boolean;
  button2: boolean;
  button1Pressed: boolean;
  button2Pressed: boolean;
  trigger: boolean;
  headPosition: IPosition;
  scaleFactor: number;
}

type RoomExtent = {
  min: [number, number, number];
  max: [number, number, number];
}

class ControllerReader {
  static controllerInfo?: Partial<ControllerInfo>;
  static roomExtent?: RoomExtent;

  static Update() {
    var VRControllersInfo = getVRControllersInfo();
    if (VRControllersInfo !== undefined) {
      const prevButton1 = this.controllerInfo?.button1 ?? false;
      const prevButton2 = this.controllerInfo?.button2 ?? false;
      this.controllerInfo = {};
      var rightHand = 1; // 0=left,1=right
      this.controllerInfo.trigger = VRControllersInfo.IndexTrigger && VRControllersInfo.IndexTrigger[rightHand] != 0;
      this.controllerInfo.button1Pressed = ((VRControllersInfo.Buttons & 0x2) != 0) && !prevButton1;
      this.controllerInfo.button2Pressed = ((VRControllersInfo.Buttons & 0x1) != 0) && !prevButton2;
      this.controllerInfo.button1 = (VRControllersInfo.Buttons & 0x2) != 0;
      this.controllerInfo.button2 = (VRControllersInfo.Buttons & 0x1) != 0;
      if (VRControllersInfo.HavePosition != undefined && VRControllersInfo.HavePosition[rightHand]) {
        this.controllerInfo.wandPosition = SGWorld.Navigate.GetPosition(3); // Naive way to create gPosRightHandPos
        this.controllerInfo.wandPosition.Distance = 100000;
        this.controllerInfo.wandPosition.X = VRControllersInfo.Position[rightHand][0];
        this.controllerInfo.wandPosition.Y = VRControllersInfo.Position[rightHand][2];
        this.controllerInfo.wandPosition.Altitude = VRControllersInfo.Position[rightHand][1];
        if (VRControllersInfo.HaveOrientation != undefined && VRControllersInfo.HaveOrientation[rightHand]) {
          this.controllerInfo.wandPosition.Yaw = VRControllersInfo.Yaw[rightHand];
          this.controllerInfo.wandPosition.Pitch = VRControllersInfo.Pitch[rightHand];
          this.controllerInfo.wandPosition.Roll = VRControllersInfo.Roll[rightHand];
          this.controllerInfo.headPosition = SGWorld.Navigate.GetPosition(3);
          var tmpHeadsetpos = SGWorld.GetParam(8601) as IPosition;
          this.controllerInfo.headPosition.X = tmpHeadsetpos.X;
          this.controllerInfo.headPosition.Y = tmpHeadsetpos.Y;
          this.controllerInfo.headPosition.Altitude = tmpHeadsetpos.Altitude;
          this.controllerInfo.headPosition.Yaw = tmpHeadsetpos.Yaw;
          this.controllerInfo.headPosition.Pitch = tmpHeadsetpos.Pitch;
          this.controllerInfo.headPosition.Roll = tmpHeadsetpos.Roll;
        }
      }
      this.controllerInfo.scaleFactor = VRControllersInfo.ScaleFactor;
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

class Button {
  ID?: string;
  constructor(name: string, public roomPosition: IPosition, public textureName: string, 
    public groupID: string, 
    public callback: () => void) {
    const newButton = document.createElement("button");
    const buttonIcon = document.createElement("img");
    buttonIcon.src = textureName;
    buttonIcon.width = 40;
    newButton.appendChild(buttonIcon);
    newButton.addEventListener("click", () => {
      console.log(`simulating click on ${name}`);
      OneFrame = callback;
    });
    document.getElementById("buttons")?.appendChild(newButton);
  }

  Update(button1Pressed: boolean, selectedID?: string) {
    if (this.ID !== undefined && this.ID === selectedID && button1Pressed) {
      this.callback();
      return false;
    }
    return button1Pressed;
  }

  // buttonPressed is whether the button was down this frame but not last frame
  Draw() {
    const pos = roomToWorldCoord(this.roomPosition);
    if (this.ID === undefined) {
      // const obj = SGWorld.Creator.CreateBox(pos, 1, 1, 0.1, 0xFF000000, 0xFF000000, "", "button");
     const obj = SGWorld.Creator.CreateModel(pos, basePath + `/ui/Button_AddLine_Blue_42_Clear.obj`, 1, 0, this.groupID, "test model");
    //  const obj = SGWorld.Creator.CreateModel(pos, basePath + `/model/Ambush.xpl2`, 1, 0, this.groupID, "test model");
      this.ID = obj.ID;
      // obj.FillStyle.Texture.FileName = this.textureName;
      return;
    }
    // Move the button to be in the right spot
    const boxSize = (ControllerReader.controllerInfo?.scaleFactor ?? 1) / 12;
    let obj: ITerrainModel = SGWorld.Creator.GetObject(this.ID) as ITerrainModel;
    obj.Position = pos;
    obj.ScaleFactor = boxSize
  
  }
}

class Ray {
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
      var RightRay = SGWorld.Creator.CreatePolylineFromArray(verticesArray, pickRayInfo.isNothing ? 0xFF0000FF : 0xFFFFFFFF, 3, SGWorld.ProjectTree.NotInTreeID, "ray");
      RightRay.SetParam(200, 0x200);  // Make sure that the ray object itself will not be pickable
      this.ID = RightRay.ID;
    } else {
      var obj = SGWorld.Creator.GetObject(this.ID) as ITerrainPolyline;
      obj.Geometry = SGWorld.Creator.GeometryCreator.CreateLineStringGeometry(verticesArray);
      obj.LineStyle.Color.abgrColor = (pickRayInfo.objectID !== undefined) ? 0xFF0000FF : 0xFFFF0000;
    }
  }
}

class Sphere {
  ID?: string;
  Draw(pickRayInfo: any) {
    var rayLengthScaleFactor = pickRayInfo.rayLength * 0.004;
    var sphereRadius = Math.max(0.01, rayLengthScaleFactor);
    var spherePivot = pickRayInfo.hitPoint.Copy();
    spherePivot.Altitude -= sphereRadius / 2;
    var tip;
    if (this.ID == undefined) {
      tip = SGWorld.Creator.CreateSphere(pickRayInfo.hitPoint.Copy(), sphereRadius, 0, 0x5000FF00, 0x5000FF00, 10, SGWorld.ProjectTree.NotInTreeID, "rayTip");
      tip.SetParam(200, 0x200);
      this.ID = tip.ID;
    } else {
      var obj = SGWorld.Creator.GetObject(this.ID) as ITerrainSphere;
      obj.Position = pickRayInfo.hitPoint.Copy();
      obj.Position.Altitude -= sphereRadius / 2;
      obj.SetParam(200, 0x200); // not pickable
      obj.Radius = sphereRadius;
      obj.LineStyle.Color.FromARGBColor(pickRayInfo.objectID == undefined ? 0x50FFFFFF : 0x5000FF00);
    }
  }
}

class Laser {
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

function roomToWorldCoordEx(position: IPosition) {
  let pos = SGWorld.SetParamEx(9014, position) as IPosition;
  // bug? got a object mismatch using this position when se on an object
  pos = SGWorld.Creator.CreatePosition(pos.X, pos.Y, pos.Altitude, 3, pos.Yaw, pos.Pitch, pos.Roll, pos.Distance);
  return pos;
}
function worldToRoomCoordEx(position: IPosition) {
  return SGWorld.SetParamEx(9013, position) as IPosition;
}

function roomToWorldCoordD(position: IPosition) {
  let ret = SGWorld.Navigate.GetPosition(3);
  ret.X += position.X / 40000;
  ret.Y += (position.Altitude + 2) / 40000;
  ret.Altitude += position.Y - 3;
  //const posQuat = YPRToQuat(position.Yaw, position.Pitch, position.Pitch);
  //const worldQuat = YPRToQuat(ret.Yaw, ret.Pitch, ret.Pitch);
  //const retQuat = QuatMul(posQuat, worldQuat);
  ret.Yaw = position.Yaw;//GetYaw(retQuat);
  ret.Pitch = position.Pitch;//GetPitch(retQuat);
  ret.Roll = position.Roll;
  return ret;
}
function worldToRoomCoordD(position: IPosition) {
  let ret = SGWorld.Navigate.GetPosition(3);
  ret.Cartesian = true;
  ret.X = 40000 * position.X - ret.X;
  ret.Y = 40000 * position.Altitude - ret.Y;
  ret.Y -= 2;
  ret.Altitude = position.Y - ret.Altitude;
  ret.Altitude += 3;
  //const posQuat = YPRToQuat(position.Yaw, position.Pitch, position.Pitch);
  //const worldQuat = YPRToQuat(ret.Yaw, ret.Pitch, ret.Pitch);
  //const retQuat = QuatMul(QuatConjugate(worldQuat), posQuat);
  ret.Yaw = position.Yaw;//GetYaw(retQuat);
  ret.Pitch = position.Pitch;//GetPitch(retQuat);
  ret.Roll = position.Roll;
  return ret;
}

let roomToWorldCoordF = roomToWorldCoordEx;
let worldToRoomCoordF = worldToRoomCoordEx;

function roomToWorldCoord(position: IPosition) {
  var temp = position.Y;
  position.Y = position.Altitude;
  position.Altitude = temp;
  var ret = roomToWorldCoordF(position);
  position.Altitude = position.Y;
  position.Y = temp;
  return ret;
}
function worldToRoomCoord(position: IPosition) {
  var ret = worldToRoomCoordF(position);
  var temp = ret.Y;
  ret.Y = ret.Altitude;
  ret.Altitude = temp;
  return ret;
}

function setComClientForcedInputMode() {
  SGWorld.SetParam(8166, 1); // Force COM input mode (Meaning your code here is in control)
}
function unsetComClientForcedInputMode() {
  SGWorld.SetParam(8166, 0); // UNForce COM input mode (Meaning your code here is NOT in control)
}
function getVRControllersInfo() {
  var VRCstr = SGWorld.GetParam(8600) as string; // get the VR controls status
  var VRC = JSON.parse(VRCstr);
  return VRC;
}
function getRoomExtent() {
  var extent = SGWorld.SetParamEx(9015) as string; // get the VR controls status
  var roomExtent = JSON.parse(extent);
  return roomExtent;
}

class DebugBox {
  ID?: string;
  constructor(public roomCoords: IPosition) { }
  Draw(rayHit: boolean) {
    var roomCenterInWorldCoordinates = roomToWorldCoord(this.roomCoords);
    var boxSize = (ControllerReader.controllerInfo?.scaleFactor ?? 1) / 20.0;
    if (this.ID == undefined) {
      var box = SGWorld.Creator.CreateBox(roomCenterInWorldCoordinates, boxSize, boxSize, boxSize * 1.5, 0xFFFFFFFF, 0xFFFFFFFF, SGWorld.ProjectTree.NotInTreeID, "Box");
      box.SetParam(200, 0x2);  // Makes the object without z write so no other object can obfuscate it.
      this.ID = box.ID;
    }
    else {
      var rayHitBox = rayHit;
      var obj = SGWorld.Creator.GetObject(this.ID) as ITerrain3DRectBase;
      var yaw = rayHitBox ? obj.Position.Yaw + 5 : roomCenterInWorldCoordinates.Yaw;
      obj.Position = roomCenterInWorldCoordinates;
      obj.Position.Yaw = yaw;
      obj.Width = boxSize;
      obj.Depth = boxSize;
      obj.Height = boxSize * 1.5;
      obj.FillStyle.Color.FromARGBColor(rayHitBox ? 0xFFFF0000 : 0x90FFFFFF);
    }
  }
}

function OnFrame() { }
var OneFrame = function () { }

// If trigger is pressed: move in the direction of the ray
function wandMode(laser: Laser) {
  if (ControllerReader.controllerInfo?.trigger && laser.collision) {
    var posCurrent = SGWorld.Navigate.GetPosition(3);
    var posDest = laser.collision.hitPoint.Copy();
    posDest.Altitude = laser.collision.originPoint.Altitude;
    var dir = laser.collision.originPoint.AimTo(posDest);
    let newPos = posCurrent.Move(posDest.Altitude * 0.05, dir.Yaw, 0);
    newPos.Yaw = posCurrent.Yaw;
    newPos.Pitch = posCurrent.Pitch;
    SGWorld.Navigate.SetPosition(newPos);
  }
  // go up
  if (ControllerReader.controllerInfo?.button1) {
    let newPos = SGWorld.Navigate.GetPosition(3);
    newPos.Altitude *= 1.1;
    SGWorld.Navigate.SetPosition(newPos);
  }
  // go down
  if (ControllerReader.controllerInfo?.button2) {
    let newPos = SGWorld.Navigate.GetPosition(3);
    newPos.Altitude *= 0.9;
    SGWorld.Navigate.SetPosition(newPos);
  }
}

const wallMode = wandMode;

function WorldGetPosition() {

  var pos = worldToRoomCoord(SGWorld.Navigate.GetPosition(3));
  var ret = [pos.X, pos.Y, pos.Altitude];

  return ret;
}

function WorldSetPosition(v: any) {

  var newPos = worldToRoomCoord(SGWorld.Navigate.GetPosition(3));
  newPos.X = v[0];
  newPos.Y = v[1];
  SGWorld.Navigate.SetPosition(roomToWorldCoord(newPos));

}

function WorldIncreasePosition(v: any) {

  WorldSetPosition(vecAdd(v, WorldGetPosition()));

}

function WorldGetScale() {

  var ret = SGWorld.Navigate.GetPosition(3).Altitude;

  return ret;
}

function WorldGetOri() {

  var pos = worldToRoomCoord(SGWorld.Navigate.GetPosition(3));
  var ret = YPRToQuat(pos.Yaw, pos.Pitch, pos.Roll);

  return ret;
}

function deviceHeightOffset() {
  var ret = 0.615;
  return ret;
}

function MaxZoom() {

  // arbitrary limit to max zoom
  var ret = 99999999999;

  return ret;
}

// sets the selection whenever the user presses a button on the on a valid model or collision object
function selectMode(laser: Laser, button1pressed: boolean ) {
  // if laser has collided with something and the button is pressed set the selection to the objectID
  if ((laser.collision != undefined) && button1pressed){
    var objectIDOfSelectedModel:string;
    if (laser.collision.objectID === undefined){
      objectIDOfSelectedModel = "none";
    } else {
      objectIDOfSelectedModel = laser.collision.objectID;
    }
    console.log("selecting model: " + objectIDOfSelectedModel);
    programManager.currentlySelected = objectIDOfSelectedModel;
    programManager.userModeManager.toggleMoveModelMode(objectIDOfSelectedModel);
  // if the laser is not colliding with something and the button is pressed update the selection to undefined
  }
}

function tableMode() {
  const table = tableMode;
  if (table.isDragging && !ControllerReader.controllerInfo?.trigger) {
    table.isDragging = false;
    console.log("trigger released");
  }

  const wandIPos = worldToRoomCoord(ControllerReader.controllerInfo!.wandPosition!);
  const wandOri = YPRToQuat(-wandIPos.Yaw / 180 * Math.PI, wandIPos.Pitch / 180 * Math.PI, wandIPos.Roll / 180 * Math.PI);
  const wandPos = [wandIPos.X, wandIPos.Y, wandIPos.Altitude];
  const wandDir = QuatYAxis(wandOri, 1);


  if (table.isDragging) {
    var planeNormal = [0, 0, 1];
    var planeCollisionPoint = intersectRayOnPlane(planeNormal, wandPos, wandDir, [0, 0, deviceHeightOffset()]);

    var newIntersect = planeCollisionPoint;
    var deadzone = 1;
    console.log(table.firstIntersect);
    console.log(newIntersect);
    var pan = vecSub(table.firstIntersect, newIntersect);
    if (newIntersect !== null && newIntersect[0] > -0.6 - deadzone && newIntersect[0] < 0.6 + deadzone && newIntersect[1] < 0 + deadzone && newIntersect[1] > -1.2 - deadzone) {
      // Scale
      var wandPosDiff = vecSub(wandPos, table.wandPosLastFrame);

      var degs = radsToDegs(Math.acos(Math.abs(dot(normalize(wandPosDiff), normalize(table.wandDirLastFrame)))));
      var thresholdLower = 25;
      var thresholdUpper = 40;
      var thresholdRange = thresholdUpper - thresholdLower;
      var scalingRatio = 1 - Math.min(Math.max(degs, thresholdLower) - thresholdLower, thresholdRange) / thresholdRange;

      var magDifference = mag(wandPosDiff);
      if (magDifference > 0 && magDifference < 1) {
        var forwardOrBack = dot(wandPosDiff, table.wandDirLastFrame);
        forwardOrBack = forwardOrBack >= 0 ? 1 : -1;
        var scaleRatio = 5;
        var power = forwardOrBack * scalingRatio * magDifference * 4;
        var factor = Math.pow(scaleRatio, power);
        var newScale = table.prevWorldScale * factor;

        var appliedScale = Math.min(newScale, MaxZoom());

        var prevPos = SGWorld.Navigate.GetPosition(3);
        prevPos.Altitude = appliedScale;
        SGWorld.Navigate.SetPosition(prevPos);

        pan = vecAdd(pan, vecMul(vecAdd(newIntersect, [0, 0.6, 0]), 1 - factor));

        table.prevWorldScale = newScale;
      }

      // Pan
      WorldIncreasePosition(pan);
      table.firstIntersect = newIntersect;
    }
  }

  if (ControllerReader.controllerInfo?.trigger && !table.isDragging) {
    console.log("trigger pressed");
    var worldScale = WorldGetScale();
    var maxZoom = MaxZoom();
    if (worldScale > maxZoom) {
      worldScale = maxZoom;
      var prevPos = SGWorld.Navigate.GetPosition(3);
      prevPos.Altitude = maxZoom;
      SGWorld.Navigate.SetPosition(prevPos);
    }
    table.prevWorldScale = worldScale;

    var planeNormal = [0, 0, 1];
    var collPoint = intersectRayOnPlane(planeNormal, wandPos, wandDir, [0, 0, deviceHeightOffset()]);
    if (collPoint !== null) {
      table.isDragging = true;

      table.firstIntersect = collPoint;
    }
  }

  table.wandPosLastFrame = wandPos;
  table.wandDirLastFrame = wandDir;

}
tableMode.isDragging = false;
tableMode.wandPosLastFrame = [0, 0, 0];
tableMode.wandDirLastFrame = [1, 0, 0];
tableMode.prevWorldScale = 1;
tableMode.firstIntersect = [0, 0, 0];
tableMode.lastIntersect = [0, 0, 0];

function entityMovement() {
  // TODO allow dragging entities

  // if we're holding the trigger without an entity selected (id == null)
  //   try to select a new entity (id = ?)
  // if we're not holding the trigger with an entity selected (id != null)
  //   deselect the entity (id = null)
  // if we're moving an entity (id != null)
  //   set its position to raycasted collision point (SetPosition(id, collisionPoint))
}
//entityMovement.entityId = null;

const enum ProgramMode {
  Unknown,
  Desktop,
  Table
}

class DesktopInput {
  leftButton = false;
  rightButton = false;
  middleButton = false;
  shift = false;
  control = false;
}

class DesktopInputManager {
  private static state = new DesktopInput();
  private static pressed = new DesktopInput();

  static Update() {
    this.pressed.leftButton = this.getLeftButton() && !this.getLeftButtonPressed();
    this.pressed.rightButton = this.getRightButton() && !this.getRightButton();
    this.pressed.middleButton = this.getMiddleButton() && !this.getMiddleButton();
    this.pressed.shift = this.getShift() && !this.getShift();
    this.pressed.control = this.getControl() && !this.getControl();

    this.state.leftButton = this.getLeftButton();
    this.state.rightButton = this.getRightButton();
    this.state.middleButton = this.getMiddleButton();
    this.state.shift = this.getShift();
    this.state.control = this.getControl();
  }

  static getLeftButton() { return this.state.leftButton; }
  static getRightButton() { return this.state.rightButton; }
  static getMiddleButton() { return this.state.middleButton; }
  static getShift() { return this.state.shift; }
  static getControl() { return this.state.control; }

  static getLeftButtonPressed() { return this.pressed.leftButton; }
  static getRightButtonPressed() { return this.pressed.rightButton; }
  static getMiddleButtonPressed() { return this.pressed.middleButton; }
  static getShiftPressed() { return this.pressed.shift; }
  static getControlPressed() { return this.pressed.control; }

  static setLeftButtonPressed(pressed: boolean) { this.pressed.leftButton = pressed; }

  static getCursor() {
    const pX = SGWorld.Window.GetMouseInfo().X;
    const pY = SGWorld.Window.GetMouseInfo().Y;
    return SGWorld.Window.PixelToWorld(pX, pY, 4)
  }

  static getCursorPosition() {
    return this.getCursor().Position;
  }
}

class ProgramManager {
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

  laser: Laser;
  userModeManager: UserModeManager;
  buttons: Button[] = [];
  //debugBox: DebugBox;

  constructor() {
    this.laser = new Laser();
    this.userModeManager = new UserModeManager(this.laser);

    const groupId = this.getButtonsGroup();

    // the table has an origin at the top centre of the table. minX = 0.6 maxX = 1.2. minY = 0 maxY = -1.2
    this.buttons.push(new Button("Sydney", SGWorld.Creator.CreatePosition(-0.4, -1.1, 0.7, 3), basePath + "img/sydney.png", groupId, () => this.userModeManager.jumpToSydney()));
    this.buttons.push(new Button("Measurement", SGWorld.Creator.CreatePosition(-0.24, -1.1, 0.7, 3), basePath +"img/measurement.png", groupId, () => this.userModeManager.toggleMeasurementMode()));
    this.buttons.push(new Button("RangeRing", SGWorld.Creator.CreatePosition(-0.08, -1.1, 0.7, 3), basePath +"img/rangefinder.png", groupId, () => this.userModeManager.toggleRangeRingMode()));
    this.buttons.push(new Button("Whyalla", SGWorld.Creator.CreatePosition(0.08, -1.1, 0.7, 3), basePath +"img/whyalla.png",  groupId,() => this.userModeManager.jumpToWhyalla()));
    this.buttons.push(new Button("Artillery", SGWorld.Creator.CreatePosition(0.24, -1.1, 0.7, 3), basePath +"img/placeArtillery.png", groupId, () => this.userModeManager.toggleModelMode("Support by Fire")));
    this.buttons.push(new Button("ArtilleryRange", SGWorld.Creator.CreatePosition(0.4, -1.1, 0.7, 3), basePath +"img/placeArtilleryRange.png",  groupId,() => this.userModeManager.toggleModelMode("HowitzerWithRangeIndicator")));
    
    // scale models
    this.buttons.push(new Button("ScaleModelUp", SGWorld.Creator.CreatePosition(0.4, -1.2, 0.7, 3), basePath +"img/placeArtilleryRange.png",  groupId,() => this.userModeManager.scaleModel(+1)));
    this.buttons.push(new Button("ScaleModelDown", SGWorld.Creator.CreatePosition(0.24, -1.2, 0.7, 3), basePath +"img/placeArtilleryRange.png",  groupId,() => this.userModeManager.scaleModel(-1)));
    
    // delete selected model
    this.buttons.push(new Button("DeleteSelected", SGWorld.Creator.CreatePosition(0.08, -1.2, 0.7, 3), basePath +"img/placeArtilleryRange.png",  groupId,() => this.userModeManager.deleteModel()));
    

    // undo
    this.buttons.push(new Button("Undo", SGWorld.Creator.CreatePosition(-0.08, -1.2, 0.7, 3), basePath +"img/placeArtilleryRange.png",  groupId,() => this.userModeManager.undo()));
    
    
    //this.debugBox = new DebugBox(SGWorld.Creator.CreatePosition(0.0, -0.6, 0.7, 3));
  }

  getButtonsGroup(){
    let groupId = "";
    groupId = SGWorld.ProjectTree.FindItem("buttons");
    if (groupId) {
      SGWorld.ProjectTree.DeleteItem(groupId);
    }
    groupId = SGWorld.ProjectTree.CreateGroup("buttons");
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
        this.laser.UpdateTable(this.getCursorPosition()!);
        for (let button of this.buttons) {
          if( this.userModeManager.userMode == UserMode.Standard) { // don't let user press if in place/measure mode
            this.setButton1Pressed(button.Update(this.getButton1Pressed(), this.laser.collision!.objectID));
          }
        }
        this.userModeManager.Update(this.getButton1Pressed());
        break;
      case ProgramMode.Desktop:
        this.laser.UpdateDesktop();
        for (let button of this.buttons)
          this.setButton1Pressed(button.Update(this.getButton1Pressed(), this.laser.collision!.objectID));
        break;
    }
  }

  Draw() {
    switch (this.mode) {
      case ProgramMode.Table:
        this.laser.Draw();
        for (let button of this.buttons)
          button.Draw();
        //this.debugBox.Draw(this.laser.collision!.objectID === this.debugBox.ID);
        break;
      case ProgramMode.Desktop:
        this.laser.Draw();
        for (let button of this.buttons)
          button.Draw();
        break;
    }
  }
}


(() => {
  let recentProblems: number = 0;

  function getProgramManager() {
    if (programManager === undefined)
      programManager = new ProgramManager();
    return programManager;
  }

  function Init() {
    try { 
      console.log("init:: " + new Date(Date.now()).toISOString()); 
      document.getElementById("consoleRun")?.addEventListener("click", runConsole);
      SGWorld.AttachEvent("OnFrame", () => {
        var prev = OneFrame;
        OneFrame = () => { };
        getProgramManager().setMode(ProgramMode.Desktop);
        if (getProgramManager().getMode() == ProgramMode.Desktop) {
          roomToWorldCoordF = roomToWorldCoordD;
          worldToRoomCoordF = worldToRoomCoordD;
          prev();
          OnFrame();
          Update();
          Draw();
          roomToWorldCoordF = roomToWorldCoordEx;
          worldToRoomCoordF = worldToRoomCoordEx;
        }
      }); // Sent from TE AFTER rendering of a frame
      SGWorld.AttachEvent("OnSGWorld", (eventID, eventParam) => {
        if (eventID == 14) {
          // This is the place were you need to read wand information and respond to it.
          getProgramManager().setMode(ProgramMode.Table);
          if (getProgramManager().getMode() == ProgramMode.Table) {
            Update();
            Draw();
            debugHandleRefreshGesture();
          }
        }
      });

      SGWorld.AttachEvent("OnCommandExecuted", (CommandID: string, parameters: any) => {
        console.log(CommandID + " " + JSON.stringify(parameters))
      });
      setComClientForcedInputMode();
    } catch (e) {
      console.log("init error");
      console.log(e);
    }
  }

  function Update() {
    if (recentProblems > 0) {
      try {
        getProgramManager().Update();
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
      getProgramManager().Update();
      --recentProblems;
    }
  }

  function Draw() {
    if (recentProblems > 0) {
      try {
        getProgramManager().Draw();
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
      getProgramManager().Draw();
      --recentProblems;
    }
  }

  window.addEventListener("load", Init);
 
})();
