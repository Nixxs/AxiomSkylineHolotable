import { basePath, sgWorld, } from "./Axiom";
import { ControllerReader } from "./ControllerReader";
import { Laser } from "./Laser";
import { Quaternion } from "./math/quaternion";
import { Vector } from "./math/vector";
import { intersectRayOnPlane, radsToDegs } from "./Mathematics";
import { deviceHeightOffset, MaxZoom, ProgramManager, ProgramMode, WorldGetScale, WorldIncreasePosition, worldToRoomCoord } from "./ProgramManager";

const enum ControlMode {
  Wand,
  Table,
  Wall
}

const gControlMode: ControlMode = ControlMode.Table;

function tableMode() {
  if (ProgramManager.getInstance().getMode() !== ProgramMode.Device)
    return;
  const table = tableMode;
  if (ControllerReader.controllerInfos[1] === undefined) {
    console.log("No controller info");
    return;
  }
  if (table.isDragging && !ControllerReader.controllerInfos[1].trigger) {
    table.isDragging = false;
    console.log("trigger released");
  }

  if (ControllerReader.controllerInfos[1].wandPosition === undefined) {
    console.log("No wand position info");
    return;
  }

  const wandIPos = worldToRoomCoord(ControllerReader.controllerInfos[1].wandPosition);
  const wandOri = Quaternion.FromYPR(-wandIPos.Yaw / 180 * Math.PI, wandIPos.Pitch / 180 * Math.PI, wandIPos.Roll / 180 * Math.PI);
  const wandPos = new Vector<3>([wandIPos.X, wandIPos.Y, wandIPos.Altitude]);
  const wandDir = wandOri.GetYAxis(1);

  if (table.isDragging) {
    let planeNormal = new Vector<3>([0, 0, 1]);
    let planeCollisionPoint = intersectRayOnPlane(planeNormal, wandPos, wandDir, new Vector<3>([0, 0, deviceHeightOffset()]));
    if (planeCollisionPoint !== null) {

      const newIntersect = planeCollisionPoint;
      const deadzone = 1;
      console.log(`first intersect ${table.firstIntersect.data}`);
      console.log(`new intersect ${newIntersect.data}`);
      let pan = table.firstIntersect.Copy().Sub(newIntersect);
      if (newIntersect !== null && newIntersect.data[0] > -0.6 - deadzone && newIntersect.data[0] < 0.6 + deadzone && newIntersect.data[1] < 0 + deadzone && newIntersect.data[1] > -1.2 - deadzone) {
        // Scale
        const wandPosDiff = wandPos.Copy().Sub(table.wandPosLastFrame);

        const degs = radsToDegs(Math.acos(Math.abs(wandPosDiff.Copy().Normalise().Dot(table.wandDirLastFrame.Copy().Normalise()))));
        const thresholdLower = 25;
        const thresholdUpper = 40;
        const thresholdRange = thresholdUpper - thresholdLower;
        const scalingRatio = 1 - Math.min(Math.max(degs, thresholdLower) - thresholdLower, thresholdRange) / thresholdRange;

        const magDifference = wandPosDiff.Mag();
        if (magDifference > 0 && magDifference < 1) {
          let forwardOrBack = wandPosDiff.Dot(table.wandDirLastFrame);
          forwardOrBack = forwardOrBack >= 0 ? 1 : -1;
          const scaleRatio = 5;
          const power = forwardOrBack * scalingRatio * magDifference * 4;
          const factor = Math.pow(scaleRatio, power);
          const newScale = table.prevWorldScale * factor;

          const appliedScale = Math.min(newScale, MaxZoom());

          let prevPos = sgWorld.Navigate.GetPosition(3);
          prevPos.Altitude = appliedScale;
          sgWorld.Navigate.SetPosition(prevPos);

          pan = pan.Add(newIntersect.Copy().Add(new Vector<3>([0, 0.6, 0])).Mul(1 - factor));

          table.prevWorldScale = newScale;
        }

        // Pan
        console.log(`pan ${pan.data}`);
        WorldIncreasePosition(pan);
        table.firstIntersect = newIntersect;
      }
    }
  }

  if (ControllerReader.controllerInfos[1]?.trigger && !table.isDragging) {
    console.log("trigger pressed");
    let worldScale = WorldGetScale();
    const maxZoom = MaxZoom();
    if (worldScale > maxZoom) {
      worldScale = maxZoom;
      let prevPos = sgWorld.Navigate.GetPosition(3);
      prevPos.Altitude = maxZoom;
      sgWorld.Navigate.SetPosition(prevPos);
    }
    table.prevWorldScale = worldScale;

    let planeNormal = new Vector<3>([0, 0, 1]);
    const collPoint = intersectRayOnPlane(planeNormal, wandPos, wandDir, new Vector<3>([0, 0, deviceHeightOffset()]));
    if (collPoint !== null) {
      table.isDragging = true;

      table.firstIntersect = collPoint;
    }
  }

  table.wandPosLastFrame = wandPos;
  table.wandDirLastFrame = wandDir;

}

tableMode.isDragging = false;
tableMode.wandPosLastFrame = new Vector<3>([0, 0, 0]);
tableMode.wandDirLastFrame = new Vector<3>([1, 0, 0]);
tableMode.prevWorldScale = 1;
tableMode.firstIntersect = new Vector<3>([0, 0, 0]);
tableMode.lastIntersect = new Vector<3>([0, 0, 0]);

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
  if (ProgramManager.getInstance().getButton3(1) && laser.collision) {
    const posCurrent = sgWorld.Navigate.GetPosition(3);
    const posDest = laser.collision.hitPoint.Copy();
    posDest.Altitude = laser.collision.originPoint.Altitude;
    const dir = laser.collision.originPoint.AimTo(posDest);
    let newPos = posCurrent.Move(posDest.Altitude * 0.05, dir.Yaw, 0);
    newPos.Yaw = posCurrent.Yaw;
    newPos.Pitch = posCurrent.Pitch;
    sgWorld.Navigate.SetPosition(newPos);
  }
  // go up
  if (ProgramManager.getInstance().getButton1(1)) {
    let newPos = sgWorld.Navigate.GetPosition(3);
    newPos.Altitude *= 1.1;
    sgWorld.Navigate.SetPosition(newPos);
  }
  // go down
  if (ProgramManager.getInstance().getButton2(1)) {
    let newPos = sgWorld.Navigate.GetPosition(3);
    newPos.Altitude *= 0.9;
    sgWorld.Navigate.SetPosition(newPos);
  }
}

// sets the selection whenever the user presses a button on the on a valid model or collision object
function setSelection(laser: Laser, button1pressed: boolean) {
  // if laser has collided with something and the button is pressed set the selection to the objectID
  if ((laser.collision != undefined) && button1pressed) {
    const objectIDOfSelectedModel = laser.collision.objectID;
    if (objectIDOfSelectedModel === undefined) {
      console.log("not selecting model");
    } else {
      console.log(`selecting model: ${objectIDOfSelectedModel}`);
    }
    // if the laser is not colliding with something and the button is pressed update the selection to undefined
    ProgramManager.getInstance().userModeManager?.toggleMoveModelMode(objectIDOfSelectedModel);
  }
}


let lastHighlight: string | undefined;
function highlightIntersected(laser: Laser) {
  highlightById(false, lastHighlight);
  if (laser.collision != undefined) {
    const oid = laser.collision.objectID;
    highlightById(true, oid);
    lastHighlight = oid;
  }
}

function highlightById(highlight: boolean, oid?: string): void {
  if (oid !== undefined && oid != "") {
    const object = sgWorld.Creator.GetObject(oid);
    if (object && object.ObjectType === ObjectType.OT_MODEL) {
      const model: ITerrainModel = object as ITerrainModel;
      if (highlight) {
        // highlight adds a slight tint to the item. Currently this is yellow
        model.Terrain.Tint = sgWorld.Creator.CreateColor(255, 255, 0, 50)
      } else {
        model.Terrain.Tint = sgWorld.Creator.CreateColor(0, 0, 0, 0)
      }
    }
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
  private currentlySelectedId?: string;
  private measurementLineWidth = 3;
  private measurementLineColor: IColor;
  private decimalPlaces = 3;
  private measurementLabelStyle: ILabelStyle;
  private labelStyle = sgWorld.Creator.CreateLabelStyle(0);

  private drawLineID: string | null = null;
  private drawLineFirstPoint: IPosition | null = null;
  private drawLineWidth = 5;
  private drawLineColor: IColor;
  private drawButtonId: string | undefined;

  private lineObjects: Array<string> = [];
  private laser1?: Laser;
  private laser2?: Laser;


  constructor() {
    this.measurementLineColor = sgWorld.Creator.CreateColor(255, 255, 0, 255);
    this.measurementLabelStyle = sgWorld.Creator.CreateLabelStyle(0);
    this.measurementLabelStyle.PivotAlignment = "Top";
    this.measurementLabelStyle.MultilineJustification = "Left";
    this.drawLineColor = sgWorld.Creator.CreateColor(0, 0, 0, 0); //black
  }

  getCollisionID(userIndex: number) {
    switch (userIndex) {
      case 0: return this.laser2?.collision?.objectID;
      case 1: return this.laser1?.collision?.objectID;
    }
  }

  getCollisionPosition(userIndex: number) {
    switch (userIndex) {
      case 0: return this.laser2?.collision?.hitPoint;
      case 1: return this.laser1?.collision?.hitPoint;
    }
  }

  Init() {
    ProgramManager.getInstance().deleteGroup("Laser");
    this.laser1 = new Laser(ProgramManager.getInstance().getGroupID("Laser"));
    this.laser2 = new Laser(ProgramManager.getInstance().getGroupID("Laser"));
  }

  Draw() {
    this.laser1?.Draw();
    this.laser2?.Draw();
  }

  toggleMeasurementMode(buttonId?: string) {
    if (this.userMode == UserMode.Measurement) {
      highlightById(true, buttonId);
      if (this.measurementModeLineID !== null) {
        sgWorld.Creator.DeleteObject(this.measurementModeLineID);
        sgWorld.Creator.DeleteObject(this.measurementTextLabelID!);
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
      const pos = sgWorld.Window.CenterPixelToWorld(0).Position.Copy()
      pos.Pitch = 0;
      console.log("creating model:: " + modelPath);
      const model = sgWorld.Creator.CreateModel(pos, modelPath, 1, 0, "", modelName);
      this.currentlySelectedId = model.ID;
      this.modelIds.push(this.currentlySelectedId)
      ProgramManager.getInstance().currentlySelected = this.currentlySelectedId;

      // add the new model to the line objects array so it can be deleted via the undo button
      this.lineObjects.push(this.currentlySelectedId);
      console.log(this.lineObjects.toString());

      this.userMode = UserMode.PlaceModel;
    }
  }

  toggleMoveModelMode(modelID?: string) {
    const previouslySelected = this.currentlySelectedId;
    this.currentlySelectedId = modelID;
    if (this.userMode == UserMode.MoveModel) {
      console.log("end move model mode");
      if (previouslySelected !== undefined) {
        const modelObject = sgWorld.Creator.GetObject(previouslySelected) as ITerrainModel;
        // this is for making the model collide-able again but skyline have to tell us what 
        // code to use for this
        //modelObject.SetParam(200, 2049);
      }
      this.userMode = UserMode.Standard;
    } else {
      // We have just selected the model
      if (modelID !== undefined) {
        console.log(`modelID = ${modelID}, typeof = ${typeof modelID}`);
        const modelObject = sgWorld.Creator.GetObject(modelID) as ITerrainModel;
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
    const fillColor = sgWorld.Creator.CreateColor(0, 0, 0, 0); //"0x00000000";
    const pos = this.laser1!.collision!.hitPoint.Copy();
    const objNamePrefix = pos.X + "long" + pos.Y + "lat" + pos.Altitude + "mAlt_";

    //create centre circle
    const centerFillColour = sgWorld.Creator.CreateColor(0, 0, 0, 255);
    sgWorld.Creator.CreateCircle(pos, 500, fillColor, centerFillColour, "", "Centre Range Ring");

    for (let i = 1; i <= this.numRings; i++) {
      const radius = this.spacing * i
      const itemName = objNamePrefix + "RangeRing" + radius + "m";
      if (radius >= 25000) {
        lineColor = sgWorld.Creator.CreateColor(255, 0, 0, 255);
      } else {
        lineColor = sgWorld.Creator.CreateColor(0, 0, 0, 255);
      }
      const circle = sgWorld.Creator.CreateCircle(pos, radius, lineColor, fillColor, "", itemName);
      circle.NumberOfSegments = 50;

      const newPos = pos.Move(radius, 270, 0);
      sgWorld.Creator.CreateTextLabel(
        newPos,
        radius + "m",
        this.labelStyle,
        "",
        itemName);
    }
  }

  scaleModel(scaleVector: number): void {
    if (this.currentlySelectedId === undefined) {
      console.log("Nothing selected to scale");
      return;
    }
    const model = sgWorld.Creator.GetObject(this.currentlySelectedId) as ITerrainModel;
    model.ScaleFactor *= Math.pow(1.2, scaleVector); // 20% larger/smaller increments
  }

  deleteModel(): void {
    if (this.currentlySelectedId === undefined) {
      console.log("Nothing selected to delete");
      return;
    }

    const model = sgWorld.Creator.GetObject(this.currentlySelectedId) as ITerrainModel;
    sgWorld.Creator.DeleteObject(this.currentlySelectedId)

    // delete the model from the lineObjects array so it doesn't cause issues with the delete button
    const indexOfDeleteObject = this.lineObjects.indexOf(this.currentlySelectedId);
    this.lineObjects.splice(indexOfDeleteObject, 1);
  }

  // deletes the most recent item that was added to the lineObjects array
  // if there is nothing in the array doesn't do anything
  undo(): void {
    console.log("undo")
    const objectToDelete = this.lineObjects.pop();
    if (objectToDelete != undefined) {
      console.log("deleting: " + objectToDelete);
      sgWorld.Creator.DeleteObject(objectToDelete);

      // if the user selects a model then hits the undo button to delete the model then 
      // we have to update the currently selected value to none so it doesn't cause errors
      if (objectToDelete === ProgramManager.getInstance().currentlySelected) {
        ProgramManager.getInstance().currentlySelected = "none";
      }
    } else {
      console.log("nothing to delete");
    }
  }

  toggleDrawLine(buttonId?: string): void {
    this.userMode = UserMode.DrawLine;
    this.drawLineID = null;
    this.drawLineFirstPoint = null;
    this.drawButtonId = buttonId;
    highlightById(true, this.drawButtonId);
  }

  Update() {
    const button1pressed = ProgramManager.getInstance().getButton1Pressed(1);
    switch (ProgramManager.getInstance().getMode()) {
      case ProgramMode.Desktop: this.laser1?.UpdateDesktop(); break;
      case ProgramMode.Device:
        this.laser1?.UpdateTable(1);
        this.laser2?.UpdateTable(0);
        break;
    }
    switch (gControlMode) {
      case ControlMode.Table:
        tableMode();
        break;
      case ControlMode.Wall:
        wallMode(this.laser1!);
        break;
      case ControlMode.Wand:
        wandMode(this.laser1!);
        break;
    }
    switch (this.userMode) {
      case UserMode.Standard:
        setSelection(this.laser1!, button1pressed);
        highlightIntersected(this.laser1!);

        break;
      case UserMode.Measurement:
        if (this.measurementModeFirstPoint !== null && this.measurementTextLabelID !== null && this.measurementModeLineID !== null) {
          // Move the line end position to the cursor
          const teEndPos = this.laser1!.collision!.hitPoint.Copy();
          const teStartPos = this.measurementModeFirstPoint.Copy().AimTo(teEndPos);
          const mLine = sgWorld.Creator.GetObject(this.measurementModeLineID) as ITerrainPolyline;
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
          const mLabel = sgWorld.Creator.GetObject(this.measurementTextLabelID) as ITerrainLabel;
          mLabel.Text = strLabelText;
          mLabel.Position = teHalfPos;

          // Exit mode when pressed again
          if (ProgramManager.getInstance().getButton1Pressed(1)) {
            console.log("finished line");
            highlightById(false, this.drawButtonId);
            this.setStandardMode();
            // consume the button press
            ControllerReader.controllerInfos[1].button1Pressed = false;
            this.measurementModeLineID = null;
            this.measurementTextLabelID = null;
            this.measurementModeFirstPoint = null;
          }
        } else if (ProgramManager.getInstance().getButton1Pressed(1)) {
          // Create the line and label
          console.log("new line");

          this.measurementModeFirstPoint = this.laser1!.collision!.hitPoint.Copy();

          const teStartPos = this.measurementModeFirstPoint.Copy();
          const teEndPos = teStartPos.Copy();

          const strLineWKT = "LineString( " + teStartPos.X + " " + teStartPos.Y + ", " + teEndPos.X + " " + teEndPos.Y + " )";
          const lineGeom = sgWorld.Creator.GeometryCreator.CreateLineStringGeometry(strLineWKT);
          const mLine = sgWorld.Creator.CreatePolyline(lineGeom, this.measurementLineColor, 2, "", "__line");
          mLine.LineStyle.Width = this.measurementLineWidth;
          this.measurementModeLineID = mLine.ID;

          this.measurementTextLabelID = sgWorld.Creator.CreateTextLabel(teStartPos, "0m", this.measurementLabelStyle, "", "___label").ID;

          // add the label and the line to the line objects array so it can be deleted in sequence vai the undo button
          // if you add any other object types into the lineObjects array make sure you handle them in the undo function
          this.lineObjects.push(this.measurementModeLineID);
          this.lineObjects.push(this.measurementTextLabelID);
          console.log(this.lineObjects.toString());

          // consume the button press
          ControllerReader.controllerInfos[1].button1Pressed = false;
        }
        break;
      case UserMode.DropRangeRing:
        if (ProgramManager.getInstance().getButton1Pressed(1)) {
          this.dropRangeRing();
          this.setStandardMode();
          // consume the button press
          ControllerReader.controllerInfos[1].button1Pressed = false;
        }
        break;
      case UserMode.PlaceModel: // Fall-through because currently these two modes do the exact same thing
      case UserMode.MoveModel:
        if (ProgramManager.getInstance().getButton1Pressed(1)) {
          this.setStandardMode();
          // consume the button press
          ProgramManager.getInstance().setButton1Pressed(1, false);
        } else {
          const newModelPosition = ProgramManager.getInstance().getCursorPosition(1)?.Copy();
          if (newModelPosition !== undefined) {
            newModelPosition.Pitch = 0;
            newModelPosition.Yaw = newModelPosition.Roll * 2;
            newModelPosition.Roll = 0;
            const modelObject = sgWorld.Creator.GetObject(this.currentlySelectedId!) as ITerrainModel;
            modelObject.Position = newModelPosition;
          }
        }
        break;
      case UserMode.DrawLine:
        if (this.drawLineFirstPoint !== null && this.drawLineID !== null) {

          // Move the line end position to the cursor
          const dLine = sgWorld.Creator.GetObject(this.drawLineID) as ITerrainPolyline;
          const Geometry = dLine.Geometry as ILineString;

          const teEndPos = ProgramManager.getInstance().getCursorPosition(1)?.Copy();
          if (teEndPos !== undefined) {
            // start the edit session to enable modification of the geometry
            Geometry.StartEdit();
            if (ProgramManager.getInstance().getButton1Pressed(1)) {
              // if button 1 is pressed add a new point to the geometry
              Geometry.Points.AddPoint(teEndPos.X, teEndPos.Y, teEndPos.Altitude);
            } else {
              // if button hasn't been pressed just move the last point to the current
              // position of the laser so the user what the new line will look like
              const drawPointIndex = Geometry.Points.Count - 1;
              Geometry.Points.Item(drawPointIndex).X = teEndPos.X;
              Geometry.Points.Item(drawPointIndex).Y = teEndPos.Y;
            }
            Geometry.EndEdit();
          }

          // if user is currently drawing a line and the trigger is pressed, change the colour of the line
          if (ProgramManager.getInstance().getButton3Pressed(1)) {
            if (dLine.LineStyle.Color.ToHTMLColor() === "#000000") {
              console.log("Draw Line: swap colour to red");
              dLine.LineStyle.Color.FromHTMLColor("#ff1000");
            } else {
              console.log("Draw Line: swap colour to black");
              dLine.LineStyle.Color.FromHTMLColor("#000000");
            }
          }

          // Exit mode when button 2 is pressed
          if (ProgramManager.getInstance().getButton2Pressed(1)) {
            console.log("finished line");
            // delete the last point as this will not have been placed by the user just drawn for planning
            Geometry.StartEdit();
            Geometry.Points.DeletePoint(Geometry.Points.Count - 1);
            Geometry.EndEdit();

            this.setStandardMode();
            // consume the button press
            ControllerReader.controllerInfos[1].button2Pressed = false;
            this.drawLineID = null;
            this.drawLineFirstPoint = null;
          }
        } else if (ProgramManager.getInstance().getButton1Pressed(1)) {
          // Create the line
          console.log("new line");

          this.drawLineFirstPoint = this.laser1!.collision!.hitPoint.Copy();

          const teStartPos = this.drawLineFirstPoint.Copy();
          const teEndPos = teStartPos.Copy();

          const strLineWKT = "LineString( " + teStartPos.X + " " + teStartPos.Y + ", " + teEndPos.X + " " + teEndPos.Y + " )";
          const drawLineGeom = sgWorld.Creator.GeometryCreator.CreateLineStringGeometry(strLineWKT);
          const dLine = sgWorld.Creator.CreatePolyline(drawLineGeom, this.drawLineColor, 2, "", "__line");
          dLine.LineStyle.Width = this.drawLineWidth;
          this.drawLineID = dLine.ID;

          // add the new item to the array so it can be deleted in sequence via the undo button
          // if you add any other object types into the lineObjects array make sure you handle them in the undo function
          this.lineObjects.push(this.drawLineID);
          console.log(this.lineObjects.toString());

          // consume the button press
          ControllerReader.controllerInfos[1].button1Pressed = false;
        }
        break;
    }
  }
}
