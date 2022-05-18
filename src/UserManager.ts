import { basePath, sgWorld, } from "./Axiom";
import { ControllerReader } from "./ControllerReader";
import { Laser } from "./Laser";
import { Quaternion } from "./math/quaternion";
import { Vector } from "./math/vector";
import { degsToRads, radsToDegs } from "./Mathematics";
import { DeviceType, GetDeviceType, MaxZoom, ProgramManager, ProgramMode, worldToRoomCoord } from "./ProgramManager";

const enum ControlMode {
  Wand,
  Table,
  Wall
}

const gControlMode: ControlMode = ControlMode.Table;

function dragMode() {
  const trigger = ProgramManager.getInstance().getButton3(1);
  const newIntersect = ProgramManager.getInstance().userModeManager!.getCollisionPosition(1);
  const wandWorldIPos = ProgramManager.getInstance().userModeManager?.getWandPosition(1);

  if (wandWorldIPos === undefined)
    throw new Error("Unable to find wand position");
  const wandRoomIPos = worldToRoomCoord(wandWorldIPos);

  const wandOri1 = Quaternion.FromYPR(-degsToRads(wandRoomIPos.Yaw), degsToRads(wandRoomIPos.Pitch), degsToRads(wandRoomIPos.Roll));
  // orientation is wrong on the wall. Pitch down
  const wandOri = wandOri1;
  const wandRoomDir = wandOri.GetYAxis(1);
  const wandRoomPos = new Vector<3>([wandRoomIPos.X, wandRoomIPos.Y, wandRoomIPos.Altitude]);

  if (newIntersect === undefined) {
    return;
  }
  const worldIntersect = worldToRoomCoord(newIntersect);
  const worldX = worldIntersect.X;
  const worldY = GetDeviceType() == DeviceType.Table ? worldIntersect.Y : worldIntersect.Altitude;
  if (ControllerReader.roomExtent !== undefined) {
    const minX = ControllerReader.roomExtent.min.data[0];
    const maxX = ControllerReader.roomExtent.max.data[0];
    const minY = ControllerReader.roomExtent.min.data[GetDeviceType() == DeviceType.Table ? 1 : 2];
    const maxY = ControllerReader.roomExtent.max.data[GetDeviceType() == DeviceType.Table ? 1 : 2];
    const deadzone = 1;
    if (worldX < minX - deadzone || worldX > maxX + deadzone || worldY < minY - deadzone || worldY > maxY + deadzone)
      return;
  }
  if (dragMode.startInfo !== null) {
    if (!trigger) {
      dragMode.startInfo = null;
      return;
    }
    // dragged!
    const worldPos = sgWorld.Navigate.GetPosition(3).Copy();

    worldPos.X += dragMode.startInfo.intersect.X - newIntersect.X;
    worldPos.Y += dragMode.startInfo.intersect.Y - newIntersect.Y;

    // zoom
    const wandPosDiff = wandRoomPos.Copy().Sub(dragMode.startInfo.prevWandRoomPos);
    const magDifference = wandPosDiff.Mag();
    if (magDifference > 0 && magDifference < 1) {
      let forwardOrBack = wandPosDiff.Dot(dragMode.startInfo.prevWandRoomDir);
      forwardOrBack = forwardOrBack >= 0 ? 1 : -1;
      const scaleRatio = 5;

      const degs = radsToDegs(Math.acos(Math.abs(wandPosDiff.Copy().Normalise().Dot(dragMode.startInfo.prevWandRoomDir.Copy().Normalise()))));
      const thresholdLower = 25;
      const thresholdUpper = 40;
      const thresholdRange = thresholdUpper - thresholdLower;
      const scalingRatio = 1 - Math.min(Math.max(degs, thresholdLower) - thresholdLower, thresholdRange) / thresholdRange;

      const power = forwardOrBack * scalingRatio * magDifference * 4;
      const factor = Math.pow(scaleRatio, power);
      worldPos.Altitude *= factor;

      // TODO: also offset position due to zoom. Otherwise one frame of jitter whenever zooming

      if (worldPos.Altitude > 1000000) {
        worldPos.Altitude = 1000000;
      }
    }

    dragMode.startInfo.prevWandRoomPos = wandRoomPos;
    dragMode.startInfo.prevWandRoomDir = wandRoomDir;

    sgWorld.Navigate.SetPosition(worldPos);
  } else if (trigger) {
    dragMode.startInfo = {
      intersect: newIntersect,
      prevWandRoomPos: wandRoomPos,
      prevWandRoomDir: wandRoomDir
    }
  }
}
dragMode.startInfo = <{
  intersect: IPosition;
  prevWandRoomPos: Vector<3>;
  prevWandRoomDir: Vector<3>;
} | null>null;

export const enum UserMode {
  Standard, // this can include FlyTo, but also just standard navigation; we don't distinguish them for now
  Measurement,
  DropRangeRing,
  PlaceModel,
  MoveModel,
  DrawLine,
  PlaceLabel // when placing a label it will attach to another object
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
  const model = getItemById(oid)
  if (model) {
    if (highlight) {
      // highlight adds a slight tint to the item. Currently this is yellow
      model.Terrain.Tint = sgWorld.Creator.CreateColor(255, 255, 0, 50)
    } else {
      model.Terrain.Tint = sgWorld.Creator.CreateColor(0, 0, 0, 0)
    }
  }
}

/**
 * Returns models by their ID
 * Optionally supply a model type for other items such as labels
 * @param {string} [oid]
 * @param {*} [objectType=ObjectType.OT_MODEL]
 * @return {*}  {(ITerrainModel | null)}
 */
function getItemById(oid?: string, objectType = ObjectType.OT_MODEL): ITerrainModel | null {
  if (oid !== undefined && oid != "") {
    const object = sgWorld.Creator.GetObject(oid);
    if (object && object.ObjectType === objectType) {
      const model: ITerrainModel = object as ITerrainModel;
      return model
    }
  }
  return null;
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

  getWandPosition(userIndex: number) {
    switch (userIndex) {
      case 0: return this.laser2?.collision?.originPoint;
      case 1: return this.laser1?.collision?.originPoint;
    }
  }

  Init() {
    ProgramManager.getInstance().deleteGroup("Laser");
    this.laser1 = new Laser(ProgramManager.getInstance().getGroupID("Laser"));
    this.laser2 = new Laser(ProgramManager.getInstance().getGroupID("Laser"));
  }

  Draw() {
    this.laser1?.Draw();
    if (GetDeviceType() === DeviceType.Table)
      this.laser2?.Draw(); // On the Wall, the second laser shouldn't be rendered
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

  toggleLabel(sLabel: string) {
    if (this.userMode == UserMode.PlaceModel) {
      console.log("end model mode");
      this.userMode = UserMode.Standard;
    } else {

      const pos = sgWorld.Window.CenterPixelToWorld(0).Position.Copy()
      const labelStyle = sgWorld.Creator.CreateLabelStyle(0);
      const label = sgWorld.Creator.CreateTextLabel(pos, sLabel, labelStyle, "", "label-" + sLabel);
      pos.Pitch = 0;
      console.log("creating label:: " + sLabel + " " +  label.ObjectType);
      this.currentlySelectedId = label.ID;
      // this.modelIds.push(label.ID)
      // ProgramManager.getInstance().currentlySelected = label.ID;

      // // add the new model to the line objects array so it can be deleted via the undo button
      // this.lineObjects.push(label.ID);
      // console.log(this.lineObjects.toString());
      this.userMode = UserMode.PlaceLabel;
    }
  }

  toggleMoveModelMode(modelID?: string) {
    const previouslySelected = this.currentlySelectedId;
    this.currentlySelectedId = modelID;
    if (this.userMode == UserMode.MoveModel) {
      console.log("end move model mode");
      if (previouslySelected !== undefined) {
        const modelObject = sgWorld.Creator.GetObject(previouslySelected) as ITerrainModel;
        // this is for making the model collide-able again
        modelObject.SetParam(200, modelObject.GetParam(200) | 512);
      }
      this.userMode = UserMode.Standard;
    } else {
      // We have just selected the model
      if (modelID !== undefined) {
        console.log(`modelID = ${modelID}, typeof = ${typeof modelID}`);
        const modelObject = sgWorld.Creator.GetObject(modelID) as ITerrainModel;
        // this will make the model not pickable which is what you want
        modelObject.SetParam(200, modelObject.GetParam(200) & ~512);
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
        dragMode();
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
      case UserMode.PlaceLabel:
        try {
          // we will only let the label be placed on another object
          if (ProgramManager.getInstance().getButton1Pressed(1)) {
            const intersectedItemId = ProgramManager.getInstance().userModeManager?.getCollisionID(1);
            if (intersectedItemId) {
              console.log("BUTTON PRESSED AND INTERSECTING ITEM " + intersectedItemId + " label id " + this.currentlySelectedId);
              const model = getItemById(intersectedItemId);
              const label = getItemById(this.currentlySelectedId, ObjectType.OT_LABEL);
              if(!model) {
                console.log("model not found")
              }
              if(!label) {
                console.log("label not found")
              }
              console.log(model?.Terrain.BBox.MinX)
              console.log(model?.Terrain.BBox.MaxX);
              console.log(model?.Terrain.BBox.MinY);
              console.log(model?.Terrain.BBox.MaxY);
              const bBox = model?.Terrain.BBox;
              if(bBox){
                const deltaX = bBox.MaxX -bBox.MinX;
                console.log(deltaX)
              
                if (model && label) {
                  console.log("About TO ATTACH LABEL TO MODEL");
                  //label.Attachment.AttachTo(console, 1, 0, 0, 0);
                  console.log("LABEL ATTACHED TO MODEL");
                  this.setStandardMode();
                  // consume the button press
                  ProgramManager.getInstance().setButton1Pressed(1, false);
                }
              }
              
            };
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
        } catch (error) {
          console.log(JSON.stringify(error));
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
