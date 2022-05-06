define(["require", "exports", "./Axiom", "./ControllerReader", "./Mathematics", "./ProgramManager"], function (require, exports, Axiom_1, ControllerReader_1, Mathematics_1, ProgramManager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserModeManager = void 0;
    var gControlMode = 1 /* Table */;
    function tableMode() {
        var _a, _b;
        var table = tableMode;
        if (table.isDragging && !((_a = ControllerReader_1.ControllerReader.controllerInfo) === null || _a === void 0 ? void 0 : _a.trigger)) {
            table.isDragging = false;
            console.log("trigger released");
        }
        var wandIPos = (0, ProgramManager_1.worldToRoomCoord)(ControllerReader_1.ControllerReader.controllerInfo.wandPosition);
        var wandOri = (0, Mathematics_1.YPRToQuat)(-wandIPos.Yaw / 180 * Math.PI, wandIPos.Pitch / 180 * Math.PI, wandIPos.Roll / 180 * Math.PI);
        var wandPos = [wandIPos.X, wandIPos.Y, wandIPos.Altitude];
        var wandDir = (0, Mathematics_1.QuatYAxis)(wandOri, 1);
        if (table.isDragging) {
            var planeNormal = [0, 0, 1];
            var planeCollisionPoint = (0, Mathematics_1.intersectRayOnPlane)(planeNormal, wandPos, wandDir, [0, 0, (0, ProgramManager_1.deviceHeightOffset)()]);
            if (planeCollisionPoint !== null) {
                var newIntersect = planeCollisionPoint;
                var deadzone = 1;
                console.log(table.firstIntersect);
                console.log(newIntersect);
                var pan = (0, Mathematics_1.vecSub)(table.firstIntersect, newIntersect);
                if (newIntersect !== null && newIntersect[0] > -0.6 - deadzone && newIntersect[0] < 0.6 + deadzone && newIntersect[1] < 0 + deadzone && newIntersect[1] > -1.2 - deadzone) {
                    // Scale
                    var wandPosDiff = (0, Mathematics_1.vecSub)(wandPos, table.wandPosLastFrame);
                    var degs = (0, Mathematics_1.radsToDegs)(Math.acos(Math.abs((0, Mathematics_1.dot)((0, Mathematics_1.normalize)(wandPosDiff), (0, Mathematics_1.normalize)(table.wandDirLastFrame)))));
                    var thresholdLower = 25;
                    var thresholdUpper = 40;
                    var thresholdRange = thresholdUpper - thresholdLower;
                    var scalingRatio = 1 - Math.min(Math.max(degs, thresholdLower) - thresholdLower, thresholdRange) / thresholdRange;
                    var magDifference = (0, Mathematics_1.mag)(wandPosDiff);
                    if (magDifference > 0 && magDifference < 1) {
                        var forwardOrBack = (0, Mathematics_1.dot)(wandPosDiff, table.wandDirLastFrame);
                        forwardOrBack = forwardOrBack >= 0 ? 1 : -1;
                        var scaleRatio = 5;
                        var power = forwardOrBack * scalingRatio * magDifference * 4;
                        var factor = Math.pow(scaleRatio, power);
                        var newScale = table.prevWorldScale * factor;
                        var appliedScale = Math.min(newScale, (0, ProgramManager_1.MaxZoom)());
                        var prevPos = Axiom_1.SGWorld.Navigate.GetPosition(3);
                        prevPos.Altitude = appliedScale;
                        Axiom_1.SGWorld.Navigate.SetPosition(prevPos);
                        pan = (0, Mathematics_1.vecAdd)(pan, (0, Mathematics_1.vecMul)((0, Mathematics_1.vecAdd)(newIntersect, [0, 0.6, 0]), 1 - factor));
                        table.prevWorldScale = newScale;
                    }
                    // Pan
                    (0, ProgramManager_1.WorldIncreasePosition)(pan);
                    table.firstIntersect = newIntersect;
                }
            }
        }
        if (((_b = ControllerReader_1.ControllerReader.controllerInfo) === null || _b === void 0 ? void 0 : _b.trigger) && !table.isDragging) {
            console.log("trigger pressed");
            var worldScale = (0, ProgramManager_1.WorldGetScale)();
            var maxZoom = (0, ProgramManager_1.MaxZoom)();
            if (worldScale > maxZoom) {
                worldScale = maxZoom;
                var prevPos = Axiom_1.SGWorld.Navigate.GetPosition(3);
                prevPos.Altitude = maxZoom;
                Axiom_1.SGWorld.Navigate.SetPosition(prevPos);
            }
            table.prevWorldScale = worldScale;
            var planeNormal = [0, 0, 1];
            var collPoint = (0, Mathematics_1.intersectRayOnPlane)(planeNormal, wandPos, wandDir, [0, 0, (0, ProgramManager_1.deviceHeightOffset)()]);
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
    // If trigger is pressed: move in the direction of the ray
    function wandMode(laser) {
        var _a, _b, _c;
        if (((_a = ControllerReader_1.ControllerReader.controllerInfo) === null || _a === void 0 ? void 0 : _a.trigger) && laser.collision) {
            var posCurrent = Axiom_1.SGWorld.Navigate.GetPosition(3);
            var posDest = laser.collision.hitPoint.Copy();
            posDest.Altitude = laser.collision.originPoint.Altitude;
            var dir = laser.collision.originPoint.AimTo(posDest);
            var newPos = posCurrent.Move(posDest.Altitude * 0.05, dir.Yaw, 0);
            newPos.Yaw = posCurrent.Yaw;
            newPos.Pitch = posCurrent.Pitch;
            Axiom_1.SGWorld.Navigate.SetPosition(newPos);
        }
        // go up
        if ((_b = ControllerReader_1.ControllerReader.controllerInfo) === null || _b === void 0 ? void 0 : _b.button1) {
            var newPos = Axiom_1.SGWorld.Navigate.GetPosition(3);
            newPos.Altitude *= 1.1;
            Axiom_1.SGWorld.Navigate.SetPosition(newPos);
        }
        // go down
        if ((_c = ControllerReader_1.ControllerReader.controllerInfo) === null || _c === void 0 ? void 0 : _c.button2) {
            var newPos = Axiom_1.SGWorld.Navigate.GetPosition(3);
            newPos.Altitude *= 0.9;
            Axiom_1.SGWorld.Navigate.SetPosition(newPos);
        }
    }
    // sets the selection whenever the user presses a button on the on a valid model or collision object
    function selectMode(laser, button1pressed) {
        // if laser has collided with something and the button is pressed set the selection to the objectID
        if ((laser.collision != undefined) && button1pressed) {
            var objectIDOfSelectedModel;
            if (laser.collision.objectID === undefined) {
                objectIDOfSelectedModel = "none";
            }
            else {
                objectIDOfSelectedModel = laser.collision.objectID;
            }
            console.log("selecting model: " + objectIDOfSelectedModel);
            ProgramManager_1.programManager.currentlySelected = objectIDOfSelectedModel;
            ProgramManager_1.programManager.userModeManager.toggleMoveModelMode(objectIDOfSelectedModel);
            // if the laser is not colliding with something and the button is pressed update the selection to undefined
        }
    }
    var wallMode = wandMode;
    var UserModeManager = /** @class */ (function () {
        function UserModeManager() {
            this.userMode = 0 /* Standard */;
            this.modelIds = [];
            this.spacing = 5000;
            this.numRings = 5;
            this.measurementModeFirstPoint = null;
            this.measurementModeLineID = null;
            this.measurementTextLabelID = null;
            this.currentId = null;
            this.measurementLineWidth = 3;
            this.decimalPlaces = 3;
            this.labelStyle = Axiom_1.SGWorld.Creator.CreateLabelStyle(0);
            this.drawLineID = null;
            this.drawLineFirstPoint = null;
            this.drawLineWidth = 5;
            this.switchColourCD = 0;
            this.lineObjects = [];
            this.measurementLineColor = Axiom_1.SGWorld.Creator.CreateColor(255, 255, 0, 255);
            this.measurementLabelStyle = Axiom_1.SGWorld.Creator.CreateLabelStyle(0);
            this.measurementLabelStyle.PivotAlignment = "Top";
            this.measurementLabelStyle.MultilineJustification = "Left";
            this.drawLineColor = Axiom_1.SGWorld.Creator.CreateColor(0, 0, 0, 0); //black
        }
        UserModeManager.prototype.Init = function () { };
        UserModeManager.prototype.Draw = function () { };
        UserModeManager.prototype.jumpToSydney = function () {
            console.log("sydney");
            Axiom_1.SGWorld.Navigate.FlyTo(Axiom_1.SGWorld.Creator.CreatePosition(151.2067675, -33.8667266, 5000, 3, 0, -80, 0, 5000));
            this.userMode = 0 /* Standard */;
        };
        UserModeManager.prototype.jumpToWhyalla = function () {
            console.log("whyalla");
            Axiom_1.SGWorld.Navigate.FlyTo(Axiom_1.SGWorld.Creator.CreatePosition(137.5576346, -33.0357364, 5000, 3, 0, -80, 0, 5000));
            this.userMode = 0 /* Standard */;
        };
        UserModeManager.prototype.toggleMeasurementMode = function () {
            if (this.userMode == 1 /* Measurement */) {
                if (this.measurementModeLineID !== null) {
                    Axiom_1.SGWorld.Creator.DeleteObject(this.measurementModeLineID);
                    Axiom_1.SGWorld.Creator.DeleteObject(this.measurementTextLabelID);
                }
                this.userMode = 0 /* Standard */;
            }
            else {
                this.userMode = 1 /* Measurement */;
            }
            this.measurementModeLineID = null;
            this.measurementTextLabelID = null;
            this.measurementModeFirstPoint = null;
        };
        UserModeManager.prototype.toggleModelMode = function (modelName) {
            if (this.userMode == 3 /* PlaceModel */) {
                console.log("end model mode");
                this.userMode = 0 /* Standard */;
            }
            else {
                var modelPath = Axiom_1.basePath + "model/".concat(modelName, ".xpl2");
                var pos = Axiom_1.SGWorld.Window.CenterPixelToWorld(0).Position.Copy();
                pos.Pitch = 0;
                console.log("creating model:: " + modelPath);
                this.currentId = Axiom_1.SGWorld.Creator.CreateModel(pos, modelPath, 1, 0, "", modelName).ID;
                this.modelIds.push(this.currentId);
                ProgramManager_1.programManager.currentlySelected = this.currentId;
                // add the new model to the lineobjects array so it can be delted via the undo button
                this.lineObjects.push(this.currentId);
                console.log(this.lineObjects.toString());
                this.userMode = 3 /* PlaceModel */;
            }
        };
        UserModeManager.prototype.toggleMoveModelMode = function (modelID) {
            if (this.userMode == 4 /* MoveModel */) {
                console.log("end move model mode");
                var modelObject = Axiom_1.SGWorld.Creator.GetObject(modelID);
                // this is for making the model collide-able again but skyline have to tell us what 
                // code to use for this
                //modelObject.SetParam(200, 2049);
                this.userMode = 0 /* Standard */;
            }
            else {
                if (modelID != "none") {
                    this.currentId = modelID;
                    var modelObject = Axiom_1.SGWorld.Creator.GetObject(modelID);
                    // this will make the model not pickable which is what you want but we are waiting for 
                    // skyline to get back to us on what the correct code is for making it collide-able again
                    //modelObject.SetParam(200, 0x200);
                    this.userMode = 4 /* MoveModel */;
                }
                else {
                    this.userMode = 0 /* Standard */;
                }
            }
        };
        UserModeManager.prototype.setStandardMode = function () {
            this.userMode = 0 /* Standard */;
        };
        UserModeManager.prototype.toggleRangeRingMode = function () {
            if (this.userMode == 2 /* DropRangeRing */)
                this.userMode = 0 /* Standard */;
            else
                this.userMode = 2 /* DropRangeRing */;
        };
        UserModeManager.prototype.dropRangeRing = function () {
            console.log("dropRangeRing");
            var lineColor; //red for customer requirements
            var fillColor = Axiom_1.SGWorld.Creator.CreateColor(0, 0, 0, 0); //"0x00000000";
            var pos = this.laser.collision.hitPoint.Copy();
            var objNamePrefix = pos.X + "long" + pos.Y + "lat" + pos.Altitude + "mAlt_";
            //create centre circle
            var centerFillColour = Axiom_1.SGWorld.Creator.CreateColor(0, 0, 0, 255);
            Axiom_1.SGWorld.Creator.CreateCircle(pos, 500, fillColor, centerFillColour, "", "Centre Range Ring");
            for (var i = 1; i <= this.numRings; i++) {
                var radius = this.spacing * i;
                var itemName = objNamePrefix + "RangeRing" + radius + "m";
                if (radius >= 25000) {
                    lineColor = Axiom_1.SGWorld.Creator.CreateColor(255, 0, 0, 255);
                }
                else {
                    lineColor = Axiom_1.SGWorld.Creator.CreateColor(0, 0, 0, 255);
                }
                var circle = Axiom_1.SGWorld.Creator.CreateCircle(pos, radius, lineColor, fillColor, "", itemName);
                circle.NumberOfSegments = 50;
                var newPos = pos.Move(radius, 270, 0);
                Axiom_1.SGWorld.Creator.CreateTextLabel(newPos, radius + "m", this.labelStyle, "", itemName);
            }
        };
        UserModeManager.prototype.scaleModel = function (scaleVector) {
            if (!this.hasSelected())
                return;
            var model = Axiom_1.SGWorld.Creator.GetObject(ProgramManager_1.programManager.currentlySelected);
            model.ScaleFactor = model.ScaleFactor += scaleVector;
        };
        UserModeManager.prototype.deleteModel = function () {
            if (!this.hasSelected())
                return;
            if (ProgramManager_1.programManager.currentlySelected != "none") {
                var model = Axiom_1.SGWorld.Creator.GetObject(ProgramManager_1.programManager.currentlySelected);
                Axiom_1.SGWorld.Creator.DeleteObject(ProgramManager_1.programManager.currentlySelected);
                // delete the model from the lineObjects array so it doesn't cuase issues with the delete button
                var indexOfDeleteObject = this.lineObjects.indexOf(ProgramManager_1.programManager.currentlySelected);
                this.lineObjects.splice(indexOfDeleteObject, 1);
            }
            else {
                console.log("nothing to delete, please select a model first");
            }
        };
        // deletes the most recent item that was added to the lineObjects array
        // if there is nothing in the array doesn't do anything
        UserModeManager.prototype.undo = function () {
            console.log("undo");
            var objectToDelete = this.lineObjects.pop();
            if (objectToDelete != undefined) {
                console.log("deleting: " + objectToDelete);
                Axiom_1.SGWorld.Creator.DeleteObject(objectToDelete);
                // if the user selects a model then hits the undo button to delete the model then 
                // we have to update the currently selected value to none so it doesn't cause errors
                if (objectToDelete === ProgramManager_1.programManager.currentlySelected) {
                    ProgramManager_1.programManager.currentlySelected = "none";
                }
            }
            else {
                console.log("nothing to delete");
            }
        };
        UserModeManager.prototype.hasSelected = function () {
            if (!ProgramManager_1.programManager.currentlySelected) {
                console.log("scaleModel:: no model selected.");
                return false;
            }
            ;
            return true;
        };
        UserModeManager.prototype.toggleDrawLine = function () {
            this.userMode = 5 /* DrawLine */;
            this.drawLineID = null;
            this.drawLineFirstPoint = null;
        };
        UserModeManager.prototype.Update = function () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            var button1pressed = ProgramManager_1.programManager.getButton1Pressed();
            switch (this.userMode) {
                case 0 /* Standard */:
                    switch (gControlMode) {
                        case 1 /* Table */:
                            tableMode();
                            selectMode(this.laser, button1pressed);
                            break;
                        case 2 /* Wall */:
                            wallMode(this.laser);
                            break;
                        case 0 /* Wand */:
                            wandMode(this.laser);
                            break;
                    }
                    break;
                case 1 /* Measurement */:
                    if (this.measurementModeFirstPoint !== null && this.measurementTextLabelID !== null && this.measurementModeLineID !== null) {
                        // Move the line end position to the cursor
                        var teEndPos = this.laser.collision.hitPoint.Copy();
                        var teStartPos = this.measurementModeFirstPoint.Copy().AimTo(teEndPos);
                        var mLine = Axiom_1.SGWorld.Creator.GetObject(this.measurementModeLineID);
                        var Geometry = mLine.Geometry;
                        Geometry.StartEdit();
                        Geometry.Points.Item(1).X = teEndPos.X;
                        Geometry.Points.Item(1).Y = teEndPos.Y;
                        Geometry.EndEdit();
                        // Update the label
                        var direction = teStartPos.Yaw.toFixed(this.decimalPlaces);
                        var distance = teStartPos.DistanceTo(teEndPos).toFixed(this.decimalPlaces);
                        var strLabelText = "".concat(direction, " ").concat(String.fromCharCode(176), " / ").concat(distance, "m");
                        var teHalfPos = teStartPos.Move(teStartPos.DistanceTo(teEndPos) / 2, teStartPos.Yaw, 0);
                        var mLabel = Axiom_1.SGWorld.Creator.GetObject(this.measurementTextLabelID);
                        mLabel.Text = strLabelText;
                        mLabel.Position = teHalfPos;
                        // Exit mode when pressed again
                        if ((_a = ControllerReader_1.ControllerReader.controllerInfo) === null || _a === void 0 ? void 0 : _a.button1Pressed) {
                            console.log("finished line");
                            this.setStandardMode();
                            // consume the button press
                            ControllerReader_1.ControllerReader.controllerInfo.button1Pressed = false;
                            this.measurementModeLineID = null;
                            this.measurementTextLabelID = null;
                            this.measurementModeFirstPoint = null;
                        }
                    }
                    else if ((_b = ControllerReader_1.ControllerReader.controllerInfo) === null || _b === void 0 ? void 0 : _b.button1Pressed) {
                        // Create the line and label
                        console.log("new line");
                        this.measurementModeFirstPoint = this.laser.collision.hitPoint.Copy();
                        var teStartPos = this.measurementModeFirstPoint.Copy();
                        var teEndPos = teStartPos.Copy();
                        var strLineWKT = "LineString( " + teStartPos.X + " " + teStartPos.Y + ", " + teEndPos.X + " " + teEndPos.Y + " )";
                        var lineGeom = Axiom_1.SGWorld.Creator.GeometryCreator.CreateLineStringGeometry(strLineWKT);
                        var mLine = Axiom_1.SGWorld.Creator.CreatePolyline(lineGeom, this.measurementLineColor, 2, "", "__line");
                        mLine.LineStyle.Width = this.measurementLineWidth;
                        this.measurementModeLineID = mLine.ID;
                        this.measurementTextLabelID = Axiom_1.SGWorld.Creator.CreateTextLabel(teStartPos, "0m", this.measurementLabelStyle, "", "___label").ID;
                        // add the label and the line to the line objects array so it can be deleted in sequence vai the undo button
                        // if you add any other object types into the lineObjects array make sure you handle them in the undo function
                        this.lineObjects.push(this.measurementModeLineID);
                        this.lineObjects.push(this.measurementTextLabelID);
                        console.log(this.lineObjects.toString());
                        // consume the button press
                        ControllerReader_1.ControllerReader.controllerInfo.button1Pressed = false;
                    }
                    break;
                case 2 /* DropRangeRing */:
                    if ((_c = ControllerReader_1.ControllerReader.controllerInfo) === null || _c === void 0 ? void 0 : _c.button1Pressed) {
                        this.dropRangeRing();
                        this.setStandardMode();
                        // consume the button press
                        ControllerReader_1.ControllerReader.controllerInfo.button1Pressed = false;
                    }
                    break;
                case 3 /* PlaceModel */:
                    if ((_d = ControllerReader_1.ControllerReader.controllerInfo) === null || _d === void 0 ? void 0 : _d.button1Pressed) {
                        this.setStandardMode();
                        // consume the button press
                        ControllerReader_1.ControllerReader.controllerInfo.button1Pressed = false;
                    }
                    else {
                        if (this.laser.collision !== undefined) {
                            var newModelPosition = this.laser.collision.hitPoint.Copy();
                            newModelPosition.Pitch = 0;
                            newModelPosition.Yaw = newModelPosition.Roll * 2;
                            newModelPosition.Roll = 0;
                            var modelObject = Axiom_1.SGWorld.Creator.GetObject(this.currentId);
                            modelObject.Position = newModelPosition;
                        }
                    }
                    break;
                case 4 /* MoveModel */:
                    if ((_e = ControllerReader_1.ControllerReader.controllerInfo) === null || _e === void 0 ? void 0 : _e.button1Pressed) {
                        this.setStandardMode();
                        // consume the button press
                        ControllerReader_1.ControllerReader.controllerInfo.button1Pressed = false;
                    }
                    else {
                        if (this.laser.collision !== undefined) {
                            var newModelPosition = this.laser.collision.hitPoint.Copy();
                            newModelPosition.Pitch = 0;
                            newModelPosition.Yaw = newModelPosition.Roll * 2;
                            newModelPosition.Roll = 0;
                            var modelObject = Axiom_1.SGWorld.Creator.GetObject(this.currentId);
                            modelObject.Position = newModelPosition;
                        }
                    }
                    break;
                case 5 /* DrawLine */:
                    if (this.drawLineFirstPoint !== null && this.drawLineID !== null) {
                        // Move the line end position to the cursor
                        var teEndPos = this.laser.collision.hitPoint.Copy();
                        var dLine = Axiom_1.SGWorld.Creator.GetObject(this.drawLineID);
                        var Geometry = dLine.Geometry;
                        // start the edit session to enable modification of the geometry
                        Geometry.StartEdit();
                        if ((_f = ControllerReader_1.ControllerReader.controllerInfo) === null || _f === void 0 ? void 0 : _f.button1Pressed) {
                            // if button 1 is pressed add a new point to the geometry
                            Geometry.Points.AddPoint(teEndPos.X, teEndPos.Y, teEndPos.Altitude);
                        }
                        else {
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
                        if (((_g = ControllerReader_1.ControllerReader.controllerInfo) === null || _g === void 0 ? void 0 : _g.trigger) && this.switchColourCD <= 0) {
                            this.switchColourCD = 5; // switching colours has a 5 frame cool down
                            var dLine_1 = Axiom_1.SGWorld.Creator.GetObject(this.drawLineID);
                            if (dLine_1.LineStyle.Color.ToHTMLColor() === "#000000") {
                                console.log("Draw Line: swap colour to red");
                                dLine_1.LineStyle.Color.FromHTMLColor("#ff1000");
                            }
                            else {
                                console.log("Draw Line: swap colour to black");
                                dLine_1.LineStyle.Color.FromHTMLColor("#000000");
                            }
                        }
                        // Exit mode when button 2 is pressed
                        if ((_h = ControllerReader_1.ControllerReader.controllerInfo) === null || _h === void 0 ? void 0 : _h.button2Pressed) {
                            console.log("finished line");
                            var dLine_2 = Axiom_1.SGWorld.Creator.GetObject(this.drawLineID);
                            var Geometry_1 = dLine_2.Geometry;
                            // delete the last point as this will not have been placed by the user just drawn for planning
                            Geometry_1.StartEdit();
                            Geometry_1.Points.DeletePoint(Geometry_1.Points.Count - 1);
                            Geometry_1.EndEdit();
                            this.setStandardMode();
                            // consume the button press
                            ControllerReader_1.ControllerReader.controllerInfo.button2Pressed = false;
                            this.drawLineID = null;
                            this.drawLineFirstPoint = null;
                        }
                    }
                    else if ((_j = ControllerReader_1.ControllerReader.controllerInfo) === null || _j === void 0 ? void 0 : _j.button1Pressed) {
                        // Create the line
                        console.log("new line");
                        this.drawLineFirstPoint = this.laser.collision.hitPoint.Copy();
                        var teStartPos = this.drawLineFirstPoint.Copy();
                        var teEndPos = teStartPos.Copy();
                        var strLineWKT = "LineString( " + teStartPos.X + " " + teStartPos.Y + ", " + teEndPos.X + " " + teEndPos.Y + " )";
                        var drawLineGeom = Axiom_1.SGWorld.Creator.GeometryCreator.CreateLineStringGeometry(strLineWKT);
                        var dLine = Axiom_1.SGWorld.Creator.CreatePolyline(drawLineGeom, this.drawLineColor, 2, "", "__line");
                        dLine.LineStyle.Width = this.drawLineWidth;
                        this.drawLineID = dLine.ID;
                        // add the new item to the array so it can be deleted in sequence via the undo button
                        // if you add any other object types into the lineObjects array make sure you handle them in the undo function
                        this.lineObjects.push(this.drawLineID);
                        console.log(this.lineObjects.toString());
                        // consume the button press
                        ControllerReader_1.ControllerReader.controllerInfo.button1Pressed = false;
                    }
                    break;
            }
        };
        return UserModeManager;
    }());
    exports.UserModeManager = UserModeManager;
});
