declare var SGWorld: ISGWorld;
const enum ControlMode {
  Wand,
  Table,
  Wall
}

var programManager: ProgramManager;

const basePath = "\\\\192.168.1.19/d/C-ARMSAS/axiom/";
// unc path of model

const gControlMode: ControlMode = ControlMode.Table;

const enum UserMode {
  Standard, // this can include FlyTo, but also just standard navigation; we don't distinguish them for now
  Measurement,
  DropRangeRing,
  PlaceModel,
  MoveModel,
  DrawLine
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

  private drawLineID: string | null = null;
  private drawLineFirstPoint: IPosition | null = null;
  private drawLineWidth = 5;
  private drawLineColor: IColor;
  private switchColourCD = 0;

  constructor(private laser: Laser) {
    this.measurementLineColor = SGWorld.Creator.CreateColor(255, 255, 0, 255);
    this.measurementLabelStyle = SGWorld.Creator.CreateLabelStyle(0);
    this.measurementLabelStyle.PivotAlignment = "Top";
    this.measurementLabelStyle.MultilineJustification = "Left";

    this.drawLineColor = SGWorld.Creator.CreateColor(0, 0, 0, 0); //black
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
      const modelPath = basePath + `model/${modelName}.xpl2`;
      var pos = SGWorld.Window.CenterPixelToWorld(0).Position.Copy()
      pos.Pitch = 0;
      console.log("creating model:: " + modelPath);
      this.currentId = SGWorld.Creator.CreateModel(pos, modelPath, 1, 0, "", modelName).ID;
      this.modelIds.push(this.currentId)
      programManager.currentlySelected = this.currentId;
      this.userMode = UserMode.PlaceModel;
    }
  }

  toggleMoveModelMode(modelID: string) {
    if (this.userMode == UserMode.MoveModel) {
      console.log("end move model mode");
      this.userMode = UserMode.Standard;
    } else {
      if (modelID != "none") {
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
    if (!this.hasSelected()) return;
    const model = SGWorld.Creator.GetObject(programManager.currentlySelected) as ITerrainModel;
    model.ScaleFactor = model.ScaleFactor += scaleVector;
  }

  deleteModel(): void {
    if (!this.hasSelected()) return;
    const model = SGWorld.Creator.GetObject(programManager.currentlySelected) as ITerrainModel;
    SGWorld.Creator.DeleteObject(programManager.currentlySelected)
  }

  undo(): void {
    console.log("undo")
    SGWorld.Command.Execute(2345)
  }

  private hasSelected(): boolean {
    if (!programManager.currentlySelected) {
      console.log("scaleModel:: no model selected.");
      return false;
    };
    return true;
  }

  toggleDrawLine(): void {
    if (this.userMode == UserMode.DrawLine) {
      if (this.drawLineID !== null) {
        SGWorld.Creator.DeleteObject(this.drawLineID);
      }
      this.userMode = UserMode.Standard;
    } else {
      this.userMode = UserMode.DrawLine;
    }
    this.drawLineID = null;
    this.drawLineFirstPoint = null;
  }

  Update(button1pressed: boolean) {
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

      case UserMode.DrawLine:
        if (this.drawLineFirstPoint !== null && this.drawLineID !== null) {

          // Move the line end position to the cursor
          const teEndPos = this.laser.collision!.hitPoint.Copy();
          const dLine = SGWorld.Creator.GetObject(this.drawLineID) as ITerrainPolyline;
          const Geometry = dLine.Geometry as ILineString;
          // start the edit session to enable modification of the geometry
          Geometry.StartEdit();
          if (ControllerReader.controllerInfo?.button1Pressed) {
            // if button 1 is pressed add a new point to the geometry
            Geometry.Points.AddPoint(teEndPos.X, teEndPos.Y, teEndPos.Altitude);
          } else {
            // if button hasn't been pressed just move the last point to the current
            // position of the laser so the user what the new line will look like
            var drawPointIndex = Geometry.Points.Count - 1;
            Geometry.Points.Item(drawPointIndex).X = teEndPos.X;
            Geometry.Points.Item(drawPointIndex).Y = teEndPos.Y;
          }
          Geometry.EndEdit();

          // this is a cool down for the trigger press since it can trigger twice while the user
          // is clicking the button on the controller
          this.switchColourCD -= 1;
          if (this.switchColourCD < 0) {
            this.switchColourCD = 0;
          }
          // if user is currently drawing a line and the trigger is pressed, change the colour of the line
          if (ControllerReader.controllerInfo?.trigger && this.switchColourCD <= 0) {
            this.switchColourCD = 5;// switching colours has a 5 frame cool down
            const dLine = SGWorld.Creator.GetObject(this.drawLineID) as ITerrainPolyline;
            if (dLine.LineStyle.Color.ToHTMLColor() === "#000000") {
              console.log("Draw Line: swap colour to red");
              dLine.LineStyle.Color.FromHTMLColor("#ff1000");
            } else {
              console.log("Draw Line: swap colour to black");
              dLine.LineStyle.Color.FromHTMLColor("#000000");
            }
          }

          // Exit mode when button 2 is pressed
          if (ControllerReader.controllerInfo?.button2Pressed) {
            console.log("finished line");
            const dLine = SGWorld.Creator.GetObject(this.drawLineID) as ITerrainPolyline;
            const Geometry = dLine.Geometry as ILineString;
            // delete the last point as this will not have been placed by the user just drawn for planning
            Geometry.StartEdit();
            Geometry.Points.DeletePoint(Geometry.Points.Count - 1);
            Geometry.EndEdit();

            this.setStandardMode();
            // consume the button press
            ControllerReader.controllerInfo.button2Pressed = false;
            this.drawLineID = null;
            this.drawLineFirstPoint = null;
          }

        } else if (ControllerReader.controllerInfo?.button1Pressed) {
          // Create the line
          console.log("new line");

          this.drawLineFirstPoint = this.laser.collision!.hitPoint.Copy();

          const teStartPos = this.drawLineFirstPoint.Copy();
          const teEndPos = teStartPos.Copy();

          const strLineWKT = "LineString( " + teStartPos.X + " " + teStartPos.Y + ", " + teEndPos.X + " " + teEndPos.Y + " )";
          const drawLineGeom = SGWorld.Creator.GeometryCreator.CreateLineStringGeometry(strLineWKT);
          const dLine = SGWorld.Creator.CreatePolyline(drawLineGeom, this.drawLineColor, 2, "", "__line");
          dLine.LineStyle.Width = this.drawLineWidth;
          this.drawLineID = dLine.ID;

          // consume the button press
          ControllerReader.controllerInfo.button1Pressed = false;
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
  triggerPressed: boolean;
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
      this.controllerInfo = {};
      const rightHand = 1; // 0=left,1=right

      const prevTrigger = this.controllerInfo?.trigger ?? false;
      const prevButton1 = this.controllerInfo?.button1 ?? false;
      const prevButton2 = this.controllerInfo?.button2 ?? false;

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
  callback: () => void = () => { };
  constructor(public name: string, public roomPosition: IPosition, public modelPath: string,
    public groupID: string = "",
    callback?: () => void) {
    const newButton = document.createElement("button");
    newButton.textContent = name;
    if (callback) {
      this.callback = callback;
    }
    newButton.addEventListener("click", () => {
      console.log(`simulating click on ${name}`);
      if (callback) {
        OneFrame = callback;
      }

    });
    document.getElementById("buttons")?.appendChild(newButton);
  }

  // buttonPressed is whether the button was down this frame but not last frame
  Update(button1Pressed: boolean, selectedID?: string) {
    if (this.ID !== undefined && this.ID === selectedID && button1Pressed) {
      this.callback();
      return false;
    }
    return button1Pressed;
  }

  Draw() {
    const pos = roomToWorldCoord(this.roomPosition);
    const scaleFactor = (ControllerReader.controllerInfo?.scaleFactor ?? 1) / 12;
    if (this.ID === undefined) {
      const obj = SGWorld.Creator.CreateModel(pos, this.modelPath, scaleFactor, 0, this.groupID, this.name);
      this.ID = obj.ID;
    } else {
      // Move the button to be in the right spot
      const obj: ITerrainModel = SGWorld.Creator.GetObject(this.ID) as ITerrainModel;
      obj.Position = pos;
      obj.ScaleFactor = scaleFactor
    }
  }

  setPosition(pos: IPosition) {
    console.log("setPosition:: " + this.ID);
    if (this.ID) {
      const boxSize = (ControllerReader.controllerInfo?.scaleFactor ?? 1) / 12;
      this.roomPosition = pos;
      let obj: ITerrainModel = SGWorld.Creator.GetObject(this.ID) as ITerrainModel;
      obj.Position = pos;
      obj.ScaleFactor = boxSize
    } else {
      this.roomPosition = pos;
      this.Draw();
    }
  }

  show(value: boolean) {
    if (!this.ID) this.Draw();
    if (!this.ID) return;
    let obj: ITerrainModel = SGWorld.Creator.GetObject(this.ID) as ITerrainModel;
    obj.Visibility.Show = value;
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
function selectMode(laser: Laser, button1pressed: boolean) {
  // if laser has collided with something and the button is pressed set the selection to the objectID
  if ((laser.collision != undefined) && button1pressed) {
    var objectIDOfSelectedModel: string;
    if (laser.collision.objectID === undefined) {
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
    console.log("ProgramManager:: constructor")
    this.laser = new Laser();
    this.userModeManager = new UserModeManager(this.laser);

    const groupId = this.getButtonsGroup("buttons");

    // the table has an origin at the top centre of the table. minX = -0.6 maxX = 0.6. minY = 0 maxY = -1.2
    const yLine1 = -1.05
    this.buttons.push(new Button("Sydney", SGWorld.Creator.CreatePosition(-0.4, yLine1, 0.7, 3), basePath + "ui/blank.xpl2", groupId, () => this.userModeManager.jumpToSydney()));
    this.buttons.push(new Button("Measurement", SGWorld.Creator.CreatePosition(-0.24, yLine1, 0.7, 3), basePath + "ui/blank.xpl2", groupId, () => this.userModeManager.toggleMeasurementMode()));
    this.buttons.push(new Button("RangeRing", SGWorld.Creator.CreatePosition(-0.08, yLine1, 0.7, 3), basePath + "ui/blank.xpl2", groupId, () => this.userModeManager.toggleRangeRingMode()));
    this.buttons.push(new Button("Whyalla", SGWorld.Creator.CreatePosition(0.08, yLine1, 0.7, 3), basePath + "ui/blank.xpl2", groupId, () => this.userModeManager.jumpToWhyalla()));
    this.buttons.push(new Button("Artillery", SGWorld.Creator.CreatePosition(0.24, yLine1, 0.7, 3), basePath + "ui/blank.xpl2", groupId, () => this.userModeManager.toggleModelMode("Support by Fire")));
    this.buttons.push(new Button("ArtilleryRange", SGWorld.Creator.CreatePosition(0.4, yLine1, 0.7, 3), basePath + "ui/blank.xpl2", groupId, () => this.userModeManager.toggleModelMode("HowitzerWithRangeIndicator")));

    // scale models
    const yLine2 = -1.15
    this.buttons.push(new Button("ScaleModelUp", SGWorld.Creator.CreatePosition(0.4, yLine2, 0.7, 3), basePath + "ui/plus.xpl2", groupId, () => this.userModeManager.scaleModel(+1)));
    this.buttons.push(new Button("ScaleModelDown", SGWorld.Creator.CreatePosition(0.24, yLine2, 0.7, 3), basePath + "ui/minus.xpl2", groupId, () => this.userModeManager.scaleModel(-1)));

    // delete selected model
    this.buttons.push(new Button("DeleteSelected", SGWorld.Creator.CreatePosition(0.08, yLine2, 0.7, 3), basePath + "ui/delete.xpl2", groupId, () => this.userModeManager.deleteModel()));

    // undo
    this.buttons.push(new Button("Undo", SGWorld.Creator.CreatePosition(-0.08, yLine2, 0.7, 3), basePath + "ui/undo.xpl2", groupId, () => this.userModeManager.undo()));

    // add line
    this.buttons.push(new Button("DrawLine", SGWorld.Creator.CreatePosition(-0.24, yLine2, 0.7, 3), basePath + "ui/blank.xpl2", groupId, () => this.userModeManager.toggleDrawLine()));

    try {
      const groupIdPager = this.getButtonsGroup("pager");
      console.log("ProgramManager:: ButtonPagingControl")
      let pos = SGWorld.Creator.CreatePosition(0, 0, -1000, 3);
      const pagerButtons = [];
      for (let index = 0; index < 16; index++) {
        const b = new Button("new" + index, pos, basePath + "img/placeArtilleryRange.png", groupIdPager);
        b.show(false);
        this.buttons.push(b);
        pagerButtons.push(b);
      }

      const pager = new ButtonPagingControl(pagerButtons);
      // I know these really should be part of the paging control, but at the moment buttons have to 
      // exist in the buttons array for them to be clicked so creating them here
      // create the page left and right buttons
      pos = SGWorld.Creator.CreatePosition(-0.4, -0.6, 0.7, 3);
      const pageLeft = new Button("pageLeft", pos, "", groupIdPager, () => { pager.pageLeft() });
      pageLeft.show(false);
      pos = SGWorld.Creator.CreatePosition(0.4, -0.6, 0.7, 3);
      const pageRight = new Button("pageRight", pos, "", groupIdPager, () => { pager.pageRight(); });
      pageRight.show(false);
      this.buttons.push(pageLeft);
      this.buttons.push(pageRight);
      pager.pagers = [pageLeft, pageRight];

      // Select model
      this.buttons.push(new Button("Model Selector", SGWorld.Creator.CreatePosition(-0.4, yLine2, 0.7, 3), basePath + "ui/blank.xpl2", groupId, () => {
        pager.show(!pager.isShown)
      }));

    } catch (error) {
      console.log("Error creating paging control" + error);
    }
  }

  getButtonsGroup(groupName: string) {
    let groupId = "";
    groupId = SGWorld.ProjectTree.FindItem(groupName);
    if (groupId) {
      SGWorld.ProjectTree.DeleteItem(groupId);
    }
    groupId = SGWorld.ProjectTree.CreateGroup(groupName);
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

  getButton3Pressed() {
    switch (this.mode) {
      case ProgramMode.Table:
        return ControllerReader.controllerInfo?.triggerPressed ?? false;
      case ProgramMode.Desktop:
        return DesktopInputManager.getMiddleButtonPressed();
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
          if (this.userModeManager.userMode == UserMode.Standard) { // don't let user press if in place/measure mode
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

class ButtonPagingControl {
  private layout: number = 9; //square layout 9x9 at moment
  private buttons: Button[];
  private pageNumber: number = 0;
  private totalPages: number = 0;
  private spacePerButton: number = 0.2;
  public pagers: Button[] = [];
  public isShown: boolean = false;

  constructor(buttons: Button[]) {
    console.log("ButtonPagingControl:: constructor")
    // takes an array of buttons and lays them out
    this.buttons = buttons;
    this.totalPages = Math.ceil(this.buttons.length / this.layout);
    this.initUI();
    this.show(false);
  }

  private initUI() {
    this.layoutUI();
  }

  private layoutUI() {
    // to do
    // the table is 1.2 x 1.2
    console.log("ButtonPagingControl::layoutUI");

    let counter = 0;
    if (this.pageNumber > 0) {
      counter += this.layout * this.pageNumber
    }

    // hide the buttons. Todo add a hide on the button class
    this.buttons.forEach(btn => btn.show(false));

    const rowColCount = Math.sqrt(this.layout);
    const spacePerButton = this.spacePerButton

    for (let indexY = rowColCount - 1; indexY >= 0; indexY--) {
      // shift the whole thing to the centre of the table
      let yPos = (spacePerButton * indexY);
      yPos = -0.6 + yPos - spacePerButton;
      for (let indexX = 0; indexX < rowColCount; indexX++) {
        let xPos = (spacePerButton * indexX);
        // shift the whole thing to the centre of the table
        xPos = xPos - spacePerButton
        if (this.buttons.length > counter) {
          // console.log(`${this.buttons[counter].name} xPos ${xPos} yPos ${yPos}`);
          const pos = SGWorld.Creator.CreatePosition(xPos, yPos, 0.7, 3);
          this.buttons[counter].roomPosition = pos;
          this.buttons[counter].show(true);
          counter += 1;
        }
      }
    }

  }

  public pageRight() {
    this.pageNumber += 1;
    if (this.pageNumber >= this.totalPages) {
      this.pageNumber = 0;
    }
    this.layoutUI();
  }

  public pageLeft() {
    this.pageNumber += -1;
    if (this.pageNumber < 0) {
      this.pageNumber = this.totalPages - 1;
    }
    this.layoutUI();
  }

  public show(value: boolean) {
    this.buttons.forEach(btn => btn.show(value));
    this.pagers.forEach(btn => btn.show(value));
    this.isShown = value;
  }

  private destroy() {
    // break it down when a user clicks a button
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
