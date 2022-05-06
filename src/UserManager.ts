import { basePath, SGWorld, } from "./Axiom";
import { ControllerReader } from "./ControllerReader";
import { Laser } from "./Laser";
import { dot, intersectRayOnPlane, mag, normalize, QuatYAxis, radsToDegs, vecAdd, vecMul, vecSub, vecType, YPRToQuat } from "./Mathematics";
import { deviceHeightOffset, MaxZoom, ProgramManager, ProgramMode, WorldGetScale, WorldIncreasePosition, worldToRoomCoord } from "./ProgramManager";

const enum ControlMode {
  Wand,
  Table,
  Wall
}

const gControlMode: ControlMode = ControlMode.Table;

function tableMode() {
  const table = tableMode;
  if (table.isDragging && !ControllerReader.controllerInfo?.trigger) {
    table.isDragging = false;
    console.log("trigger released");
  }

  const wandIPos = worldToRoomCoord(ControllerReader.controllerInfo!.wandPosition!);
  const wandOri = YPRToQuat(-wandIPos.Yaw / 180 * Math.PI, wandIPos.Pitch / 180 * Math.PI, wandIPos.Roll / 180 * Math.PI);
  const wandPos: vecType = [wandIPos.X, wandIPos.Y, wandIPos.Altitude];
  const wandDir = QuatYAxis(wandOri, 1);

  if (table.isDragging) {
    let planeNormal: vecType = [0, 0, 1];
    let planeCollisionPoint = intersectRayOnPlane(planeNormal, wandPos, wandDir, [0, 0, deviceHeightOffset()]);
    if (planeCollisionPoint !== null) {

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

          let prevPos = SGWorld.Navigate.GetPosition(3);
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
  }

  if (ControllerReader.controllerInfo?.trigger && !table.isDragging) {
    console.log("trigger pressed");
    var worldScale = WorldGetScale();
    var maxZoom = MaxZoom();
    if (worldScale > maxZoom) {
      worldScale = maxZoom;
      let prevPos = SGWorld.Navigate.GetPosition(3);
      prevPos.Altitude = maxZoom;
      SGWorld.Navigate.SetPosition(prevPos);
    }
    table.prevWorldScale = worldScale;

    let planeNormal: vecType = [0, 0, 1];
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

export const enum UserMode {
  Standard, // this can include FlyTo, but also just standard navigation; we don't distinguish them for now
  Measurement,
  DropRangeRing,
  PlaceModel,
  MoveModel,
  DrawLine
}

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
    ProgramManager.getInstance().currentlySelected = objectIDOfSelectedModel;
    ProgramManager.getInstance().userModeManager.toggleMoveModelMode(objectIDOfSelectedModel);
    // if the laser is not colliding with something and the button is pressed update the selection to undefined
  }
}

const wallMode = wandMode;

export class UserModeManager {
  public userMode = UserMode.Standard;
  public modelIds: string[] = [];

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

  private drawLineID: string | null = null;
  private drawLineFirstPoint: IPosition | null = null;
  private drawLineWidth = 5;
  private drawLineColor: IColor;
  private switchColourCD = 0;

  private lineObjects: Array<string> = [];
  private laser?: Laser;

  constructor() {
    this.measurementLineColor = SGWorld.Creator.CreateColor(255, 255, 0, 255);
    this.measurementLabelStyle = SGWorld.Creator.CreateLabelStyle(0);
    this.measurementLabelStyle.PivotAlignment = "Top";
    this.measurementLabelStyle.MultilineJustification = "Left";
    this.drawLineColor = SGWorld.Creator.CreateColor(0, 0, 0, 0); //black
  }

  getCollisionID() {
    return this.laser?.collision?.objectID;
  }

  Init() {
    this.laser = new Laser();
  }

  Draw() {
    this.laser?.Draw();
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
      ProgramManager.getInstance().currentlySelected = this.currentId;

      // add the new model to the lineobjects array so it can be delted via the undo button
      this.lineObjects.push(this.currentId);
      console.log(this.lineObjects.toString());

      this.userMode = UserMode.PlaceModel;
    }
  }

  toggleMoveModelMode(modelID: string) {
    if (this.userMode == UserMode.MoveModel) {
      console.log("end move model mode");
      const modelObject = SGWorld.Creator.GetObject(modelID) as ITerrainModel;
      // this is for making the model collide-able again but skyline have to tell us what 
      // code to use for this
      //modelObject.SetParam(200, 2049);
      this.userMode = UserMode.Standard;
    } else {
      if (modelID != "none") {
        this.currentId = modelID;
        const modelObject = SGWorld.Creator.GetObject(modelID) as ITerrainModel;
        // this will make the model not pickable which is what you want but we are waiting for 
        // skyline to get back to us on what the correct code is for making it collide-able again
        //modelObject.SetParam(200, 0x200);
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
    let lineColor; //red for customer requirements
    const fillColor = SGWorld.Creator.CreateColor(0, 0, 0, 0); //"0x00000000";
    const pos = this.laser!.collision!.hitPoint.Copy();
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
    const model = SGWorld.Creator.GetObject(ProgramManager.getInstance().currentlySelected) as ITerrainModel;
    model.ScaleFactor = model.ScaleFactor += scaleVector;
  }

  deleteModel(): void {
    if (!this.hasSelected()) return;

    if (ProgramManager.getInstance().currentlySelected != "none") {
      const model = SGWorld.Creator.GetObject(ProgramManager.getInstance().currentlySelected) as ITerrainModel;
      SGWorld.Creator.DeleteObject(ProgramManager.getInstance().currentlySelected)

      // delete the model from the lineObjects array so it doesn't cuase issues with the delete button
      var indexOfDeleteObject = this.lineObjects.indexOf(ProgramManager.getInstance().currentlySelected);
      this.lineObjects.splice(indexOfDeleteObject, 1);
    } else {
      console.log("nothing to delete, please select a model first");
    }

  }

  // deletes the most recent item that was added to the lineObjects array
  // if there is nothing in the array doesn't do anything
  undo(): void {
    console.log("undo")
    var objectToDelete = this.lineObjects.pop();
    if (objectToDelete != undefined) {
      console.log("deleting: " + objectToDelete);
      SGWorld.Creator.DeleteObject(objectToDelete);

      // if the user selects a model then hits the undo button to delete the model then 
      // we have to update the currently selected value to none so it doesn't cause errors
      if (objectToDelete === ProgramManager.getInstance().currentlySelected) {
        ProgramManager.getInstance().currentlySelected = "none";
      }
    } else {
      console.log("nothing to delete");
    }
  }

  private hasSelected(): boolean {
    if (!ProgramManager.getInstance().currentlySelected) {
      console.log("scaleModel:: no model selected.");
      return false;
    };
    return true;
  }

  toggleDrawLine(): void {
    this.userMode = UserMode.DrawLine;
    this.drawLineID = null;
    this.drawLineFirstPoint = null;
  }

  Update() {
    const button1pressed = ProgramManager.getInstance().getButton1Pressed();
    switch (ProgramManager.getInstance().getMode()) {
      case ProgramMode.Desktop: this.laser?.UpdateDesktop(); break;
      case ProgramMode.Table: this.laser?.UpdateTable(ProgramManager.getInstance().getCursorPosition()!); break;
    }
    switch (this.userMode) {
      case UserMode.Standard:
        switch (gControlMode) {
          case ControlMode.Table:
            tableMode();
            selectMode(this.laser!, button1pressed);
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
          const teEndPos = this.laser!.collision!.hitPoint.Copy();
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

          this.measurementModeFirstPoint = this.laser!.collision!.hitPoint.Copy();

          const teStartPos = this.measurementModeFirstPoint.Copy();
          const teEndPos = teStartPos.Copy();

          const strLineWKT = "LineString( " + teStartPos.X + " " + teStartPos.Y + ", " + teEndPos.X + " " + teEndPos.Y + " )";
          const lineGeom = SGWorld.Creator.GeometryCreator.CreateLineStringGeometry(strLineWKT);
          const mLine = SGWorld.Creator.CreatePolyline(lineGeom, this.measurementLineColor, 2, "", "__line");
          mLine.LineStyle.Width = this.measurementLineWidth;
          this.measurementModeLineID = mLine.ID;

          this.measurementTextLabelID = SGWorld.Creator.CreateTextLabel(teStartPos, "0m", this.measurementLabelStyle, "", "___label").ID;

          // add the label and the line to the line objects array so it can be deleted in sequence vai the undo button
          // if you add any other object types into the lineObjects array make sure you handle them in the undo function
          this.lineObjects.push(this.measurementModeLineID);
          this.lineObjects.push(this.measurementTextLabelID);
          console.log(this.lineObjects.toString());

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
          if (this.laser!.collision !== undefined) {
            var newModelPosition = this.laser!.collision.hitPoint.Copy();
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
          if (this.laser!.collision !== undefined) {
            var newModelPosition = this.laser!.collision.hitPoint.Copy();
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
          const teEndPos = this.laser!.collision!.hitPoint.Copy();
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

          this.drawLineFirstPoint = this.laser!.collision!.hitPoint.Copy();

          const teStartPos = this.drawLineFirstPoint.Copy();
          const teEndPos = teStartPos.Copy();

          const strLineWKT = "LineString( " + teStartPos.X + " " + teStartPos.Y + ", " + teEndPos.X + " " + teEndPos.Y + " )";
          const drawLineGeom = SGWorld.Creator.GeometryCreator.CreateLineStringGeometry(strLineWKT);
          const dLine = SGWorld.Creator.CreatePolyline(drawLineGeom, this.drawLineColor, 2, "", "__line");
          dLine.LineStyle.Width = this.drawLineWidth;
          this.drawLineID = dLine.ID;

          // add the new item to the array so it can be deleted in sequence via the undo button
          // if you add any other object types into the lineObjects array make sure you handle them in the undo function
          this.lineObjects.push(this.drawLineID);
          console.log(this.lineObjects.toString());

          // consume the button press
          ControllerReader.controllerInfo.button1Pressed = false;
        }
        break;
    }
  }
}
