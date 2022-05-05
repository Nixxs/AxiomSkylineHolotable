"use strict";
define("UIControls/ButtonPagingControl", ["require", "exports", "Axiom"], function (require, exports, Axiom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ButtonPagingControl = void 0;
    var ButtonPagingControl = /** @class */ (function () {
        function ButtonPagingControl(buttons) {
            this.layout = 9; //square layout 9x9 at moment
            this.pageNumber = 0;
            this.totalPages = 0;
            this.spacePerButton = 0.2;
            this.pagers = [];
            this.isShown = false;
            console.log("ButtonPagingControl:: constructor");
            // takes an array of buttons and lays them out
            this.buttons = buttons;
            this.totalPages = Math.ceil(this.buttons.length / this.layout);
            this.initUI();
            this.show(false);
        }
        ButtonPagingControl.prototype.initUI = function () {
            this.layoutUI();
        };
        ButtonPagingControl.prototype.layoutUI = function () {
            // to do
            // the table is 1.2 x 1.2
            console.log("ButtonPagingControl::layoutUI");
            var counter = 0;
            if (this.pageNumber > 0) {
                counter += this.layout * this.pageNumber;
            }
            // hide the buttons. Todo add a hide on the button class
            this.buttons.forEach(function (btn) { return btn.show(false); });
            var rowColCount = Math.sqrt(this.layout);
            var spacePerButton = this.spacePerButton;
            for (var indexY = rowColCount - 1; indexY >= 0; indexY--) {
                // shift the whole thing to the centre of the table
                var yPos = (spacePerButton * indexY);
                yPos = -0.6 + yPos - spacePerButton;
                for (var indexX = 0; indexX < rowColCount; indexX++) {
                    var xPos = (spacePerButton * indexX);
                    // shift the whole thing to the centre of the table
                    xPos = xPos - spacePerButton;
                    if (this.buttons.length > counter) {
                        // console.log(`${this.buttons[counter].name} xPos ${xPos} yPos ${yPos}`);
                        var pos = Axiom_1.SGWorld.Creator.CreatePosition(xPos, yPos, 0.7, 3);
                        this.buttons[counter].roomPosition = pos;
                        this.buttons[counter].show(true);
                        counter += 1;
                    }
                }
            }
        };
        ButtonPagingControl.prototype.pageRight = function () {
            this.pageNumber += 1;
            if (this.pageNumber >= this.totalPages) {
                this.pageNumber = 0;
            }
            this.layoutUI();
        };
        ButtonPagingControl.prototype.pageLeft = function () {
            this.pageNumber += -1;
            if (this.pageNumber < 0) {
                this.pageNumber = this.totalPages - 1;
            }
            this.layoutUI();
        };
        ButtonPagingControl.prototype.show = function (value) {
            this.buttons.forEach(function (btn) { return btn.show(value); });
            this.pagers.forEach(function (btn) { return btn.show(value); });
            this.isShown = value;
        };
        ButtonPagingControl.prototype.destroy = function () {
            // break it down when a user clicks a button
        };
        return ButtonPagingControl;
    }());
    exports.ButtonPagingControl = ButtonPagingControl;
});
define("config/models", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = {
        models: [
            {
                modelName: "Model1",
                modelType: "Model1",
                missionType: "Model1",
                modelPath: "Model1.xpl2"
            },
            {
                modelName: "Model2",
                modelType: "Model2",
                missionType: "Model2",
                modelPath: "Model2.xpl2"
            }
        ]
    };
});
define("Axiom", ["require", "exports", "UIControls/ButtonPagingControl", "config/models"], function (require, exports, ButtonPagingControl_1, models_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Button = void 0;
    var programManager;
    var basePath = "\\\\192.168.1.19/d/C-ARMSAS/axiom/";
    // unc path of model
    var gControlMode = 1 /* Table */;
    ;
    var UserModeManager = /** @class */ (function () {
        function UserModeManager(laser) {
            this.laser = laser;
            this.userMode = 0 /* Standard */;
            this.spacing = 5000;
            this.numRings = 5;
            this.measurementModeFirstPoint = null;
            this.measurementModeLineID = null;
            this.measurementTextLabelID = null;
            this.currentId = null;
            this.measurementLineWidth = 3;
            this.decimalPlaces = 3;
            this.labelStyle = exports.SGWorld.Creator.CreateLabelStyle(0);
            this.modelIds = [];
            this.drawLineID = null;
            this.drawLineFirstPoint = null;
            this.drawLineWidth = 5;
            this.switchColourCD = 0;
            this.measurementLineColor = exports.SGWorld.Creator.CreateColor(255, 255, 0, 255);
            this.measurementLabelStyle = exports.SGWorld.Creator.CreateLabelStyle(0);
            this.measurementLabelStyle.PivotAlignment = "Top";
            this.measurementLabelStyle.MultilineJustification = "Left";
            this.drawLineColor = exports.SGWorld.Creator.CreateColor(0, 0, 0, 0); //black
        }
        UserModeManager.prototype.jumpToSydney = function () {
            console.log("sydney");
            exports.SGWorld.Navigate.FlyTo(exports.SGWorld.Creator.CreatePosition(151.2067675, -33.8667266, 5000, 3, 0, -80, 0, 5000));
            this.userMode = 0 /* Standard */;
        };
        UserModeManager.prototype.jumpToWhyalla = function () {
            console.log("whyalla");
            exports.SGWorld.Navigate.FlyTo(exports.SGWorld.Creator.CreatePosition(137.5576346, -33.0357364, 5000, 3, 0, -80, 0, 5000));
            this.userMode = 0 /* Standard */;
        };
        UserModeManager.prototype.toggleMeasurementMode = function () {
            if (this.userMode == 1 /* Measurement */) {
                if (this.measurementModeLineID !== null) {
                    exports.SGWorld.Creator.DeleteObject(this.measurementModeLineID);
                    exports.SGWorld.Creator.DeleteObject(this.measurementTextLabelID);
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
                var modelPath = basePath + "model/".concat(modelName, ".xpl2");
                var pos = exports.SGWorld.Window.CenterPixelToWorld(0).Position.Copy();
                pos.Pitch = 0;
                console.log("creating model:: " + modelPath);
                this.currentId = exports.SGWorld.Creator.CreateModel(pos, modelPath, 1, 0, "", modelName).ID;
                this.modelIds.push(this.currentId);
                programManager.currentlySelected = this.currentId;
                this.userMode = 3 /* PlaceModel */;
            }
        };
        UserModeManager.prototype.toggleMoveModelMode = function (modelID) {
            if (this.userMode == 4 /* MoveModel */) {
                console.log("end move model mode");
                var modelObject = exports.SGWorld.Creator.GetObject(modelID);
                // this is for making the model collide-able again but skyline have to tell us what 
                // code to use for this
                //modelObject.SetParam(200, 2049);
                this.userMode = 0 /* Standard */;
            }
            else {
                if (modelID != "none") {
                    this.currentId = modelID;
                    var modelObject = exports.SGWorld.Creator.GetObject(modelID);
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
            var lineColor = exports.SGWorld.Creator.CreateColor(255, 0, 0, 255); //red for customer requirements
            var fillColor = exports.SGWorld.Creator.CreateColor(0, 0, 0, 0); //"0x00000000";
            var pos = this.laser.collision.hitPoint.Copy();
            var objNamePrefix = pos.X + "long" + pos.Y + "lat" + pos.Altitude + "mAlt_";
            //create centre circle
            var centerFillColour = exports.SGWorld.Creator.CreateColor(0, 0, 0, 255);
            exports.SGWorld.Creator.CreateCircle(pos, 500, fillColor, centerFillColour, "", "Centre Range Ring");
            for (var i = 1; i <= this.numRings; i++) {
                var radius = this.spacing * i;
                var itemName = objNamePrefix + "RangeRing" + radius + "m";
                if (radius >= 25000) {
                    lineColor = exports.SGWorld.Creator.CreateColor(255, 0, 0, 255);
                }
                else {
                    lineColor = exports.SGWorld.Creator.CreateColor(0, 0, 0, 255);
                }
                var circle = exports.SGWorld.Creator.CreateCircle(pos, radius, lineColor, fillColor, "", itemName);
                circle.NumberOfSegments = 50;
                var newPos = pos.Move(radius, 270, 0);
                exports.SGWorld.Creator.CreateTextLabel(newPos, radius + "m", this.labelStyle, "", itemName);
            }
        };
        UserModeManager.prototype.scaleModel = function (scaleVector) {
            if (!this.hasSelected())
                return;
            var model = exports.SGWorld.Creator.GetObject(programManager.currentlySelected);
            model.ScaleFactor = model.ScaleFactor += scaleVector;
        };
        UserModeManager.prototype.deleteModel = function () {
            if (!this.hasSelected())
                return;
            var model = exports.SGWorld.Creator.GetObject(programManager.currentlySelected);
            exports.SGWorld.Creator.DeleteObject(programManager.currentlySelected);
        };
        UserModeManager.prototype.undo = function () {
            console.log("undo");
            exports.SGWorld.Command.Execute(2345);
        };
        UserModeManager.prototype.hasSelected = function () {
            if (!programManager.currentlySelected) {
                console.log("scaleModel:: no model selected.");
                return false;
            }
            ;
            return true;
        };
        UserModeManager.prototype.toggleDrawLine = function () {
            if (this.userMode == 5 /* DrawLine */) {
                if (this.drawLineID !== null) {
                    exports.SGWorld.Creator.DeleteObject(this.drawLineID);
                }
                this.userMode = 0 /* Standard */;
            }
            else {
                this.userMode = 5 /* DrawLine */;
            }
            this.drawLineID = null;
            this.drawLineFirstPoint = null;
        };
        UserModeManager.prototype.Update = function (button1pressed) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
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
                        var mLine = exports.SGWorld.Creator.GetObject(this.measurementModeLineID);
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
                        var mLabel = exports.SGWorld.Creator.GetObject(this.measurementTextLabelID);
                        mLabel.Text = strLabelText;
                        mLabel.Position = teHalfPos;
                        // Exit mode when pressed again
                        if ((_a = ControllerReader.controllerInfo) === null || _a === void 0 ? void 0 : _a.button1Pressed) {
                            console.log("finished line");
                            this.setStandardMode();
                            // consume the button press
                            ControllerReader.controllerInfo.button1Pressed = false;
                            this.measurementModeLineID = null;
                            this.measurementTextLabelID = null;
                            this.measurementModeFirstPoint = null;
                        }
                    }
                    else if ((_b = ControllerReader.controllerInfo) === null || _b === void 0 ? void 0 : _b.button1Pressed) {
                        // Create the line and label
                        console.log("new line");
                        this.measurementModeFirstPoint = this.laser.collision.hitPoint.Copy();
                        var teStartPos = this.measurementModeFirstPoint.Copy();
                        var teEndPos = teStartPos.Copy();
                        var strLineWKT = "LineString( " + teStartPos.X + " " + teStartPos.Y + ", " + teEndPos.X + " " + teEndPos.Y + " )";
                        var lineGeom = exports.SGWorld.Creator.GeometryCreator.CreateLineStringGeometry(strLineWKT);
                        var mLine = exports.SGWorld.Creator.CreatePolyline(lineGeom, this.measurementLineColor, 2, "", "__line");
                        mLine.LineStyle.Width = this.measurementLineWidth;
                        this.measurementModeLineID = mLine.ID;
                        this.measurementTextLabelID = exports.SGWorld.Creator.CreateTextLabel(teStartPos, "0m", this.measurementLabelStyle, "", "___label").ID;
                        // consume the button press
                        ControllerReader.controllerInfo.button1Pressed = false;
                    }
                    break;
                case 2 /* DropRangeRing */:
                    if ((_c = ControllerReader.controllerInfo) === null || _c === void 0 ? void 0 : _c.button1Pressed) {
                        this.dropRangeRing();
                        this.setStandardMode();
                        // consume the button press
                        ControllerReader.controllerInfo.button1Pressed = false;
                    }
                    break;
                case 3 /* PlaceModel */:
                    if ((_d = ControllerReader.controllerInfo) === null || _d === void 0 ? void 0 : _d.button1Pressed) {
                        this.setStandardMode();
                        // consume the button press
                        ControllerReader.controllerInfo.button1Pressed = false;
                    }
                    else {
                        if (this.laser.collision !== undefined) {
                            var newModelPosition = this.laser.collision.hitPoint.Copy();
                            newModelPosition.Pitch = 0;
                            newModelPosition.Yaw = newModelPosition.Roll * 2;
                            newModelPosition.Roll = 0;
                            var modelObject = exports.SGWorld.Creator.GetObject(this.currentId);
                            modelObject.Position = newModelPosition;
                        }
                    }
                    break;
                case 4 /* MoveModel */:
                    if ((_e = ControllerReader.controllerInfo) === null || _e === void 0 ? void 0 : _e.button1Pressed) {
                        this.setStandardMode();
                        // consume the button press
                        ControllerReader.controllerInfo.button1Pressed = false;
                    }
                    else {
                        if (this.laser.collision !== undefined) {
                            var newModelPosition = this.laser.collision.hitPoint.Copy();
                            newModelPosition.Pitch = 0;
                            newModelPosition.Yaw = newModelPosition.Roll * 2;
                            newModelPosition.Roll = 0;
                            var modelObject = exports.SGWorld.Creator.GetObject(this.currentId);
                            modelObject.Position = newModelPosition;
                        }
                    }
                    break;
                case 5 /* DrawLine */:
                    if (this.drawLineFirstPoint !== null && this.drawLineID !== null) {
                        // Move the line end position to the cursor
                        var teEndPos = this.laser.collision.hitPoint.Copy();
                        var dLine = exports.SGWorld.Creator.GetObject(this.drawLineID);
                        var Geometry = dLine.Geometry;
                        // start the edit session to enable modification of the geometry
                        Geometry.StartEdit();
                        if ((_f = ControllerReader.controllerInfo) === null || _f === void 0 ? void 0 : _f.button1Pressed) {
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
                        if (((_g = ControllerReader.controllerInfo) === null || _g === void 0 ? void 0 : _g.trigger) && this.switchColourCD <= 0) {
                            this.switchColourCD = 5; // switching colours has a 5 frame cool down
                            var dLine_1 = exports.SGWorld.Creator.GetObject(this.drawLineID);
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
                        if ((_h = ControllerReader.controllerInfo) === null || _h === void 0 ? void 0 : _h.button2Pressed) {
                            console.log("finished line");
                            var dLine_2 = exports.SGWorld.Creator.GetObject(this.drawLineID);
                            var Geometry_1 = dLine_2.Geometry;
                            // delete the last point as this will not have been placed by the user just drawn for planning
                            Geometry_1.StartEdit();
                            Geometry_1.Points.DeletePoint(Geometry_1.Points.Count - 1);
                            Geometry_1.EndEdit();
                            this.setStandardMode();
                            // consume the button press
                            ControllerReader.controllerInfo.button2Pressed = false;
                            this.drawLineID = null;
                            this.drawLineFirstPoint = null;
                        }
                    }
                    else if ((_j = ControllerReader.controllerInfo) === null || _j === void 0 ? void 0 : _j.button1Pressed) {
                        // Create the line
                        console.log("new line");
                        this.drawLineFirstPoint = this.laser.collision.hitPoint.Copy();
                        var teStartPos = this.drawLineFirstPoint.Copy();
                        var teEndPos = teStartPos.Copy();
                        var strLineWKT = "LineString( " + teStartPos.X + " " + teStartPos.Y + ", " + teEndPos.X + " " + teEndPos.Y + " )";
                        var drawLineGeom = exports.SGWorld.Creator.GeometryCreator.CreateLineStringGeometry(strLineWKT);
                        var dLine = exports.SGWorld.Creator.CreatePolyline(drawLineGeom, this.drawLineColor, 2, "", "__line");
                        dLine.LineStyle.Width = this.drawLineWidth;
                        this.drawLineID = dLine.ID;
                        // consume the button press
                        ControllerReader.controllerInfo.button1Pressed = false;
                    }
                    break;
            }
        };
        return UserModeManager;
    }());
    var ControllerReader = /** @class */ (function () {
        function ControllerReader() {
        }
        ControllerReader.Update = function () {
            var _a, _b, _c, _d, _e, _f;
            var VRControllersInfo = getVRControllersInfo();
            if (VRControllersInfo !== undefined) {
                this.controllerInfo = {};
                var rightHand = 1; // 0=left,1=right
                var prevTrigger = (_b = (_a = this.controllerInfo) === null || _a === void 0 ? void 0 : _a.trigger) !== null && _b !== void 0 ? _b : false;
                var prevButton1 = (_d = (_c = this.controllerInfo) === null || _c === void 0 ? void 0 : _c.button1) !== null && _d !== void 0 ? _d : false;
                var prevButton2 = (_f = (_e = this.controllerInfo) === null || _e === void 0 ? void 0 : _e.button2) !== null && _f !== void 0 ? _f : false;
                var triggerOn = VRControllersInfo.IndexTrigger && VRControllersInfo.IndexTrigger[rightHand] != 0;
                var button1On = (VRControllersInfo.Buttons & 0x2) != 0;
                var button2On = (VRControllersInfo.Buttons & 0x1) != 0;
                this.controllerInfo.triggerPressed = triggerOn && !prevTrigger;
                this.controllerInfo.button1Pressed = button1On && !prevButton1;
                this.controllerInfo.button2Pressed = button2On && !prevButton2;
                this.controllerInfo.trigger = triggerOn;
                this.controllerInfo.button1 = button1On;
                this.controllerInfo.button2 = button2On;
                if (VRControllersInfo.HavePosition != undefined && VRControllersInfo.HavePosition[rightHand]) {
                    this.controllerInfo.wandPosition = exports.SGWorld.Navigate.GetPosition(3); // Naive way to create gPosRightHandPos
                    this.controllerInfo.wandPosition.Distance = 100000;
                    this.controllerInfo.wandPosition.X = VRControllersInfo.Position[rightHand][0];
                    this.controllerInfo.wandPosition.Y = VRControllersInfo.Position[rightHand][2];
                    this.controllerInfo.wandPosition.Altitude = VRControllersInfo.Position[rightHand][1];
                    if (VRControllersInfo.HaveOrientation != undefined && VRControllersInfo.HaveOrientation[rightHand]) {
                        this.controllerInfo.wandPosition.Yaw = VRControllersInfo.Yaw[rightHand];
                        this.controllerInfo.wandPosition.Pitch = VRControllersInfo.Pitch[rightHand];
                        this.controllerInfo.wandPosition.Roll = VRControllersInfo.Roll[rightHand];
                        this.controllerInfo.headPosition = exports.SGWorld.Navigate.GetPosition(3);
                        var tmpHeadsetpos = exports.SGWorld.GetParam(8601);
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
                var roomExtent = getRoomExtent();
                this.roomExtent = {
                    min: [roomExtent.minX, roomExtent.minY, roomExtent.minZ],
                    max: [roomExtent.maxX, roomExtent.maxY, roomExtent.maxZ]
                };
            }
        };
        return ControllerReader;
    }());
    var Button = /** @class */ (function () {
        function Button(name, roomPosition, modelPath, groupID, callback) {
            if (groupID === void 0) { groupID = ""; }
            var _a;
            this.name = name;
            this.roomPosition = roomPosition;
            this.modelPath = modelPath;
            this.groupID = groupID;
            this.callback = function () { };
            var newButton = document.createElement("button");
            newButton.textContent = name;
            if (callback) {
                this.callback = callback;
            }
            newButton.addEventListener("click", function () {
                console.log("simulating click on ".concat(name));
                if (callback) {
                    OneFrame = callback;
                }
            });
            (_a = document.getElementById("buttons")) === null || _a === void 0 ? void 0 : _a.appendChild(newButton);
        }
        // buttonPressed is whether the button was down this frame but not last frame
        Button.prototype.Update = function (button1Pressed, selectedID) {
            if (this.ID !== undefined && this.ID === selectedID && button1Pressed) {
                this.callback();
                return false;
            }
            return button1Pressed;
        };
        Button.prototype.Draw = function () {
            var _a, _b;
            var pos = roomToWorldCoord(this.roomPosition);
            var scaleFactor = ((_b = (_a = ControllerReader.controllerInfo) === null || _a === void 0 ? void 0 : _a.scaleFactor) !== null && _b !== void 0 ? _b : 1) / 12;
            if (this.ID === undefined) {
                var obj = exports.SGWorld.Creator.CreateModel(pos, this.modelPath, scaleFactor, 0, this.groupID, this.name);
                this.ID = obj.ID;
            }
            else {
                // Move the button to be in the right spot
                var obj = exports.SGWorld.Creator.GetObject(this.ID);
                obj.Position = pos;
                obj.ScaleFactor = scaleFactor;
            }
        };
        Button.prototype.setPosition = function (pos) {
            var _a, _b;
            console.log("setPosition:: " + this.ID);
            if (this.ID) {
                var boxSize = ((_b = (_a = ControllerReader.controllerInfo) === null || _a === void 0 ? void 0 : _a.scaleFactor) !== null && _b !== void 0 ? _b : 1) / 12;
                this.roomPosition = pos;
                var obj = exports.SGWorld.Creator.GetObject(this.ID);
                obj.Position = pos;
                obj.ScaleFactor = boxSize;
            }
            else {
                this.roomPosition = pos;
                this.Draw();
            }
        };
        Button.prototype.show = function (value) {
            if (!this.ID)
                this.Draw();
            if (!this.ID)
                return;
            var obj = exports.SGWorld.Creator.GetObject(this.ID);
            obj.Visibility.Show = value;
        };
        return Button;
    }());
    exports.Button = Button;
    var Ray = /** @class */ (function () {
        function Ray() {
        }
        Ray.prototype.Draw = function (pickRayInfo) {
            var verticesArray = new Array(6);
            verticesArray[0] = pickRayInfo.originPoint.X;
            verticesArray[1] = pickRayInfo.originPoint.Y;
            verticesArray[2] = pickRayInfo.originPoint.Altitude;
            verticesArray[3] = pickRayInfo.hitPoint.X;
            verticesArray[4] = pickRayInfo.hitPoint.Y;
            verticesArray[5] = pickRayInfo.hitPoint.Altitude;
            if (this.ID === undefined) {
                var RightRay = exports.SGWorld.Creator.CreatePolylineFromArray(verticesArray, pickRayInfo.isNothing ? 0xFF0000FF : 0xFFFFFFFF, 3, exports.SGWorld.ProjectTree.NotInTreeID, "ray");
                RightRay.SetParam(200, 0x200); // Make sure that the ray object itself will not be pickable
                this.ID = RightRay.ID;
            }
            else {
                var obj = exports.SGWorld.Creator.GetObject(this.ID);
                obj.Geometry = exports.SGWorld.Creator.GeometryCreator.CreateLineStringGeometry(verticesArray);
                obj.LineStyle.Color.abgrColor = (pickRayInfo.objectID !== undefined) ? 0xFF0000FF : 0xFFFF0000;
            }
        };
        return Ray;
    }());
    var Sphere = /** @class */ (function () {
        function Sphere() {
        }
        Sphere.prototype.Draw = function (pickRayInfo) {
            var rayLengthScaleFactor = pickRayInfo.rayLength * 0.004;
            var sphereRadius = Math.max(0.01, rayLengthScaleFactor);
            var spherePivot = pickRayInfo.hitPoint.Copy();
            spherePivot.Altitude -= sphereRadius / 2;
            var tip;
            if (this.ID == undefined) {
                tip = exports.SGWorld.Creator.CreateSphere(pickRayInfo.hitPoint.Copy(), sphereRadius, 0, 0x5000FF00, 0x5000FF00, 10, exports.SGWorld.ProjectTree.NotInTreeID, "rayTip");
                tip.SetParam(200, 0x200);
                this.ID = tip.ID;
            }
            else {
                var obj = exports.SGWorld.Creator.GetObject(this.ID);
                obj.Position = pickRayInfo.hitPoint.Copy();
                obj.Position.Altitude -= sphereRadius / 2;
                obj.SetParam(200, 0x200); // not pickable
                obj.Radius = sphereRadius;
                obj.LineStyle.Color.FromARGBColor(pickRayInfo.objectID == undefined ? 0x50FFFFFF : 0x5000FF00);
            }
        };
        return Sphere;
    }());
    var Laser = /** @class */ (function () {
        function Laser() {
            this.ray = new Ray();
            this.tip = new Sphere();
        }
        Laser.prototype.UpdateTable = function (position) {
            var _a;
            exports.SGWorld.SetParam(8300, position); // Pick ray
            var hitObjectID = exports.SGWorld.GetParam(8310);
            var distToHitPoint = exports.SGWorld.GetParam(8312); // Get distance to hit point
            var isNothing = false;
            if (distToHitPoint == 0) {
                distToHitPoint = exports.SGWorld.Navigate.GetPosition(3).Altitude / 2;
                isNothing = true;
            }
            if (isNothing !== ((_a = this.collision) === null || _a === void 0 ? void 0 : _a.isNothing)) {
                console.log(isNothing ? "Nothing" : "Something");
            }
            var hitPosition = position.Copy().Move(distToHitPoint, position.Yaw, position.Pitch);
            hitPosition.Cartesian = true;
            this.collision = {
                originPoint: position,
                hitPoint: hitPosition,
                rayLength: distToHitPoint,
                objectID: hitObjectID,
                isNothing: isNothing
            };
        };
        Laser.prototype.UpdateDesktop = function () {
            var _a, _b;
            if (((_a = this.collision) === null || _a === void 0 ? void 0 : _a.isNothing) && DesktopInputManager.getCursor().ObjectID !== '') {
                console.log("hitting ".concat(DesktopInputManager.getCursor().ObjectID));
            }
            else if (!((_b = this.collision) === null || _b === void 0 ? void 0 : _b.isNothing) && DesktopInputManager.getCursor().ObjectID === '') {
                console.log('Not hitting');
            }
            this.collision = {
                originPoint: exports.SGWorld.Navigate.GetPosition(3),
                hitPoint: DesktopInputManager.getCursorPosition(),
                rayLength: exports.SGWorld.Navigate.GetPosition(3).DistanceTo(DesktopInputManager.getCursorPosition()),
                objectID: DesktopInputManager.getCursor().ObjectID,
                isNothing: DesktopInputManager.getCursor().ObjectID === ''
            };
        };
        Laser.prototype.Draw = function () {
            this.ray.Draw(this.collision);
            this.tip.Draw(this.collision);
        };
        return Laser;
    }());
    function roomToWorldCoordEx(position) {
        var pos = exports.SGWorld.SetParamEx(9014, position);
        // bug? got a object mismatch using this position when se on an object
        pos = exports.SGWorld.Creator.CreatePosition(pos.X, pos.Y, pos.Altitude, 3, pos.Yaw, pos.Pitch, pos.Roll, pos.Distance);
        return pos;
    }
    function worldToRoomCoordEx(position) {
        return exports.SGWorld.SetParamEx(9013, position);
    }
    function roomToWorldCoordD(position) {
        var ret = exports.SGWorld.Navigate.GetPosition(3);
        ret.X += position.X / 40000;
        ret.Y += (position.Altitude + 2) / 40000;
        ret.Altitude += position.Y - 3;
        //const posQuat = YPRToQuat(position.Yaw, position.Pitch, position.Pitch);
        //const worldQuat = YPRToQuat(ret.Yaw, ret.Pitch, ret.Pitch);
        //const retQuat = QuatMul(posQuat, worldQuat);
        ret.Yaw = position.Yaw; //GetYaw(retQuat);
        ret.Pitch = position.Pitch; //GetPitch(retQuat);
        ret.Roll = position.Roll;
        return ret;
    }
    function worldToRoomCoordD(position) {
        var ret = exports.SGWorld.Navigate.GetPosition(3);
        ret.Cartesian = true;
        ret.X = 40000 * position.X - ret.X;
        ret.Y = 40000 * position.Altitude - ret.Y;
        ret.Y -= 2;
        ret.Altitude = position.Y - ret.Altitude;
        ret.Altitude += 3;
        //const posQuat = YPRToQuat(position.Yaw, position.Pitch, position.Pitch);
        //const worldQuat = YPRToQuat(ret.Yaw, ret.Pitch, ret.Pitch);
        //const retQuat = QuatMul(QuatConjugate(worldQuat), posQuat);
        ret.Yaw = position.Yaw; //GetYaw(retQuat);
        ret.Pitch = position.Pitch; //GetPitch(retQuat);
        ret.Roll = position.Roll;
        return ret;
    }
    var roomToWorldCoordF = roomToWorldCoordEx;
    var worldToRoomCoordF = worldToRoomCoordEx;
    function roomToWorldCoord(position) {
        var temp = position.Y;
        position.Y = position.Altitude;
        position.Altitude = temp;
        var ret = roomToWorldCoordF(position);
        position.Altitude = position.Y;
        position.Y = temp;
        return ret;
    }
    function worldToRoomCoord(position) {
        var ret = worldToRoomCoordF(position);
        var temp = ret.Y;
        ret.Y = ret.Altitude;
        ret.Altitude = temp;
        return ret;
    }
    function setComClientForcedInputMode() {
        exports.SGWorld.SetParam(8166, 1); // Force COM input mode (Meaning your code here is in control)
    }
    function unsetComClientForcedInputMode() {
        exports.SGWorld.SetParam(8166, 0); // UNForce COM input mode (Meaning your code here is NOT in control)
    }
    function getVRControllersInfo() {
        var VRCstr = exports.SGWorld.GetParam(8600); // get the VR controls status
        var VRC = JSON.parse(VRCstr);
        return VRC;
    }
    function getRoomExtent() {
        var extent = exports.SGWorld.SetParamEx(9015); // get the VR controls status
        var roomExtent = JSON.parse(extent);
        return roomExtent;
    }
    var DebugBox = /** @class */ (function () {
        function DebugBox(roomCoords) {
            this.roomCoords = roomCoords;
        }
        DebugBox.prototype.Draw = function (rayHit) {
            var _a, _b;
            var roomCenterInWorldCoordinates = roomToWorldCoord(this.roomCoords);
            var boxSize = ((_b = (_a = ControllerReader.controllerInfo) === null || _a === void 0 ? void 0 : _a.scaleFactor) !== null && _b !== void 0 ? _b : 1) / 20.0;
            if (this.ID == undefined) {
                var box = exports.SGWorld.Creator.CreateBox(roomCenterInWorldCoordinates, boxSize, boxSize, boxSize * 1.5, 0xFFFFFFFF, 0xFFFFFFFF, exports.SGWorld.ProjectTree.NotInTreeID, "Box");
                box.SetParam(200, 0x2); // Makes the object without z write so no other object can obfuscate it.
                this.ID = box.ID;
            }
            else {
                var rayHitBox = rayHit;
                var obj = exports.SGWorld.Creator.GetObject(this.ID);
                var yaw = rayHitBox ? obj.Position.Yaw + 5 : roomCenterInWorldCoordinates.Yaw;
                obj.Position = roomCenterInWorldCoordinates;
                obj.Position.Yaw = yaw;
                obj.Width = boxSize;
                obj.Depth = boxSize;
                obj.Height = boxSize * 1.5;
                obj.FillStyle.Color.FromARGBColor(rayHitBox ? 0xFFFF0000 : 0x90FFFFFF);
            }
        };
        return DebugBox;
    }());
    function OnFrame() { }
    var OneFrame = function () { };
    // If trigger is pressed: move in the direction of the ray
    function wandMode(laser) {
        var _a, _b, _c;
        if (((_a = ControllerReader.controllerInfo) === null || _a === void 0 ? void 0 : _a.trigger) && laser.collision) {
            var posCurrent = exports.SGWorld.Navigate.GetPosition(3);
            var posDest = laser.collision.hitPoint.Copy();
            posDest.Altitude = laser.collision.originPoint.Altitude;
            var dir = laser.collision.originPoint.AimTo(posDest);
            var newPos = posCurrent.Move(posDest.Altitude * 0.05, dir.Yaw, 0);
            newPos.Yaw = posCurrent.Yaw;
            newPos.Pitch = posCurrent.Pitch;
            exports.SGWorld.Navigate.SetPosition(newPos);
        }
        // go up
        if ((_b = ControllerReader.controllerInfo) === null || _b === void 0 ? void 0 : _b.button1) {
            var newPos = exports.SGWorld.Navigate.GetPosition(3);
            newPos.Altitude *= 1.1;
            exports.SGWorld.Navigate.SetPosition(newPos);
        }
        // go down
        if ((_c = ControllerReader.controllerInfo) === null || _c === void 0 ? void 0 : _c.button2) {
            var newPos = exports.SGWorld.Navigate.GetPosition(3);
            newPos.Altitude *= 0.9;
            exports.SGWorld.Navigate.SetPosition(newPos);
        }
    }
    var wallMode = wandMode;
    function WorldGetPosition() {
        var pos = worldToRoomCoord(exports.SGWorld.Navigate.GetPosition(3));
        var ret = [pos.X, pos.Y, pos.Altitude];
        return ret;
    }
    function WorldSetPosition(v) {
        var newPos = worldToRoomCoord(exports.SGWorld.Navigate.GetPosition(3));
        newPos.X = v[0];
        newPos.Y = v[1];
        exports.SGWorld.Navigate.SetPosition(roomToWorldCoord(newPos));
    }
    function WorldIncreasePosition(v) {
        WorldSetPosition(vecAdd(v, WorldGetPosition()));
    }
    function WorldGetScale() {
        var ret = exports.SGWorld.Navigate.GetPosition(3).Altitude;
        return ret;
    }
    function WorldGetOri() {
        var pos = worldToRoomCoord(exports.SGWorld.Navigate.GetPosition(3));
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
            programManager.currentlySelected = objectIDOfSelectedModel;
            programManager.userModeManager.toggleMoveModelMode(objectIDOfSelectedModel);
            // if the laser is not colliding with something and the button is pressed update the selection to undefined
        }
    }
    function tableMode() {
        var _a, _b;
        var table = tableMode;
        if (table.isDragging && !((_a = ControllerReader.controllerInfo) === null || _a === void 0 ? void 0 : _a.trigger)) {
            table.isDragging = false;
            console.log("trigger released");
        }
        var wandIPos = worldToRoomCoord(ControllerReader.controllerInfo.wandPosition);
        var wandOri = YPRToQuat(-wandIPos.Yaw / 180 * Math.PI, wandIPos.Pitch / 180 * Math.PI, wandIPos.Roll / 180 * Math.PI);
        var wandPos = [wandIPos.X, wandIPos.Y, wandIPos.Altitude];
        var wandDir = QuatYAxis(wandOri, 1);
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
                    var prevPos = exports.SGWorld.Navigate.GetPosition(3);
                    prevPos.Altitude = appliedScale;
                    exports.SGWorld.Navigate.SetPosition(prevPos);
                    pan = vecAdd(pan, vecMul(vecAdd(newIntersect, [0, 0.6, 0]), 1 - factor));
                    table.prevWorldScale = newScale;
                }
                // Pan
                WorldIncreasePosition(pan);
                table.firstIntersect = newIntersect;
            }
        }
        if (((_b = ControllerReader.controllerInfo) === null || _b === void 0 ? void 0 : _b.trigger) && !table.isDragging) {
            console.log("trigger pressed");
            var worldScale = WorldGetScale();
            var maxZoom = MaxZoom();
            if (worldScale > maxZoom) {
                worldScale = maxZoom;
                var prevPos = exports.SGWorld.Navigate.GetPosition(3);
                prevPos.Altitude = maxZoom;
                exports.SGWorld.Navigate.SetPosition(prevPos);
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
    var DesktopInput = /** @class */ (function () {
        function DesktopInput() {
            this.leftButton = false;
            this.rightButton = false;
            this.middleButton = false;
            this.shift = false;
            this.control = false;
        }
        return DesktopInput;
    }());
    var DesktopInputManager = /** @class */ (function () {
        function DesktopInputManager() {
        }
        DesktopInputManager.Update = function () {
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
        };
        DesktopInputManager.getLeftButton = function () { return this.state.leftButton; };
        DesktopInputManager.getRightButton = function () { return this.state.rightButton; };
        DesktopInputManager.getMiddleButton = function () { return this.state.middleButton; };
        DesktopInputManager.getShift = function () { return this.state.shift; };
        DesktopInputManager.getControl = function () { return this.state.control; };
        DesktopInputManager.getLeftButtonPressed = function () { return this.pressed.leftButton; };
        DesktopInputManager.getRightButtonPressed = function () { return this.pressed.rightButton; };
        DesktopInputManager.getMiddleButtonPressed = function () { return this.pressed.middleButton; };
        DesktopInputManager.getShiftPressed = function () { return this.pressed.shift; };
        DesktopInputManager.getControlPressed = function () { return this.pressed.control; };
        DesktopInputManager.setLeftButtonPressed = function (pressed) { this.pressed.leftButton = pressed; };
        DesktopInputManager.getCursor = function () {
            var pX = exports.SGWorld.Window.GetMouseInfo().X;
            var pY = exports.SGWorld.Window.GetMouseInfo().Y;
            return exports.SGWorld.Window.PixelToWorld(pX, pY, 4);
        };
        DesktopInputManager.getCursorPosition = function () {
            return this.getCursor().Position;
        };
        DesktopInputManager.state = new DesktopInput();
        DesktopInputManager.pressed = new DesktopInput();
        return DesktopInputManager;
    }());
    var ProgramManager = /** @class */ (function () {
        //debugBox: DebugBox;
        function ProgramManager() {
            var _this = this;
            this.mode = 0 /* Unknown */;
            this.modeTimer = 0;
            this.currentlySelected = "";
            this.buttons = [];
            console.log("ProgramManager:: constructor");
            this.laser = new Laser();
            this.userModeManager = new UserModeManager(this.laser);
            var groupId = this.getButtonsGroup("buttons");
            // the table has an origin at the top centre of the table. minX = -0.6 maxX = 0.6. minY = 0 maxY = -1.2
            var yLine1 = -1.05;
            this.buttons.push(new Button("Sydney", exports.SGWorld.Creator.CreatePosition(-0.4, yLine1, 0.7, 3), basePath + "ui/blank.xpl2", groupId, function () { return _this.userModeManager.jumpToSydney(); }));
            this.buttons.push(new Button("Measurement", exports.SGWorld.Creator.CreatePosition(-0.24, yLine1, 0.7, 3), basePath + "ui/blank.xpl2", groupId, function () { return _this.userModeManager.toggleMeasurementMode(); }));
            this.buttons.push(new Button("RangeRing", exports.SGWorld.Creator.CreatePosition(-0.08, yLine1, 0.7, 3), basePath + "ui/blank.xpl2", groupId, function () { return _this.userModeManager.toggleRangeRingMode(); }));
            this.buttons.push(new Button("Whyalla", exports.SGWorld.Creator.CreatePosition(0.08, yLine1, 0.7, 3), basePath + "ui/blank.xpl2", groupId, function () { return _this.userModeManager.jumpToWhyalla(); }));
            this.buttons.push(new Button("Artillery", exports.SGWorld.Creator.CreatePosition(0.24, yLine1, 0.7, 3), basePath + "ui/blank.xpl2", groupId, function () { return _this.userModeManager.toggleModelMode("Support by Fire"); }));
            this.buttons.push(new Button("ArtilleryRange", exports.SGWorld.Creator.CreatePosition(0.4, yLine1, 0.7, 3), basePath + "ui/blank.xpl2", groupId, function () { return _this.userModeManager.toggleModelMode("HowitzerWithRangeIndicator"); }));
            // scale models
            var yLine2 = -1.15;
            this.buttons.push(new Button("ScaleModelUp", exports.SGWorld.Creator.CreatePosition(0.4, yLine2, 0.7, 3), basePath + "ui/plus.xpl2", groupId, function () { return _this.userModeManager.scaleModel(+1); }));
            this.buttons.push(new Button("ScaleModelDown", exports.SGWorld.Creator.CreatePosition(0.24, yLine2, 0.7, 3), basePath + "ui/minus.xpl2", groupId, function () { return _this.userModeManager.scaleModel(-1); }));
            // delete selected model
            this.buttons.push(new Button("DeleteSelected", exports.SGWorld.Creator.CreatePosition(0.08, yLine2, 0.7, 3), basePath + "ui/delete.xpl2", groupId, function () { return _this.userModeManager.deleteModel(); }));
            // undo
            this.buttons.push(new Button("Undo", exports.SGWorld.Creator.CreatePosition(-0.08, yLine2, 0.7, 3), basePath + "ui/undo.xpl2", groupId, function () { return _this.userModeManager.undo(); }));
            // add line
            this.buttons.push(new Button("DrawLine", exports.SGWorld.Creator.CreatePosition(-0.24, yLine2, 0.7, 3), basePath + "ui/blank.xpl2", groupId, function () { return _this.userModeManager.toggleDrawLine(); }));
            try {
                var groupIdPager_1 = this.getButtonsGroup("pager");
                console.log("ProgramManager:: ButtonPagingControl");
                var pos_1 = exports.SGWorld.Creator.CreatePosition(0, 0, -1000, 3);
                var pagerButtons_1 = [];
                models_1.default.models.forEach(function (model) {
                    var b = new Button("new" + model.modelName, pos_1, basePath + "ui/blank.xpl2", groupIdPager_1);
                    b.show(false);
                    _this.buttons.push(b);
                    pagerButtons_1.push(b);
                });
                var pager_1 = new ButtonPagingControl_1.ButtonPagingControl(pagerButtons_1);
                // I know these really should be part of the paging control, but at the moment buttons have to 
                // exist in the buttons array for them to be clicked so creating them here
                // create the page left and right buttons
                pos_1 = exports.SGWorld.Creator.CreatePosition(-0.4, -0.6, 0.7, 3);
                var pageLeft = new Button("pageLeft", pos_1, basePath + "ui/blank.xpl2", groupIdPager_1, function () { pager_1.pageLeft(); });
                pageLeft.show(false);
                pos_1 = exports.SGWorld.Creator.CreatePosition(0.4, -0.6, 0.7, 3);
                var pageRight = new Button("pageRight", pos_1, basePath + "ui/blank.xpl2", groupIdPager_1, function () { pager_1.pageRight(); });
                pageRight.show(false);
                this.buttons.push(pageLeft);
                this.buttons.push(pageRight);
                pager_1.pagers = [pageLeft, pageRight];
                // Select model
                this.buttons.push(new Button("Model Selector", exports.SGWorld.Creator.CreatePosition(-0.4, yLine2, 0.7, 3), basePath + "ui/blank.xpl2", groupId, function () {
                    pager_1.show(!pager_1.isShown);
                }));
            }
            catch (error) {
                console.log("Error creating paging control" + error);
            }
        }
        ProgramManager.prototype.getMode = function () { return this.mode; };
        ProgramManager.prototype.setMode = function (newMode) {
            var _this = this;
            if (this.modeTimer != 0)
                // Don't revert back to unknown mode yet
                clearTimeout(this.modeTimer);
            this.modeTimer = setTimeout(function () {
                // revert back to unknown mode if no updates after some time
                _this.mode = 0 /* Unknown */;
            }, 2000);
            if (this.mode < newMode) {
                // upgrade mode
                this.mode = newMode;
                console.log("Entered ".concat(this.mode == 2 ? "Table" : this.mode == 1 ? "Desktop" : "Unknown", " mode"));
            }
        };
        ProgramManager.prototype.getButtonsGroup = function (groupName) {
            var groupId = "";
            groupId = exports.SGWorld.ProjectTree.FindItem(groupName);
            if (groupId) {
                exports.SGWorld.ProjectTree.DeleteItem(groupId);
            }
            groupId = exports.SGWorld.ProjectTree.CreateGroup(groupName);
            return groupId;
        };
        ProgramManager.prototype.getButton1Pressed = function () {
            var _a, _b;
            switch (this.mode) {
                case 2 /* Table */:
                    return (_b = (_a = ControllerReader.controllerInfo) === null || _a === void 0 ? void 0 : _a.button1Pressed) !== null && _b !== void 0 ? _b : false;
                case 1 /* Desktop */:
                    return DesktopInputManager.getLeftButtonPressed();
            }
            return false;
        };
        ProgramManager.prototype.setButton1Pressed = function (pressed) {
            switch (this.mode) {
                case 2 /* Table */:
                    ControllerReader.controllerInfo.button1Pressed = pressed;
                case 1 /* Desktop */:
                    DesktopInputManager.setLeftButtonPressed(pressed);
            }
        };
        ProgramManager.prototype.getButton2Pressed = function () {
            var _a, _b;
            switch (this.mode) {
                case 2 /* Table */:
                    return (_b = (_a = ControllerReader.controllerInfo) === null || _a === void 0 ? void 0 : _a.button2Pressed) !== null && _b !== void 0 ? _b : false;
                case 1 /* Desktop */:
                    return DesktopInputManager.getRightButtonPressed();
            }
            return false;
        };
        ProgramManager.prototype.getButton3 = function () {
            var _a, _b;
            switch (this.mode) {
                case 2 /* Table */:
                    return (_b = (_a = ControllerReader.controllerInfo) === null || _a === void 0 ? void 0 : _a.trigger) !== null && _b !== void 0 ? _b : false;
                case 1 /* Desktop */:
                    return DesktopInputManager.getMiddleButton();
            }
            return false;
        };
        ProgramManager.prototype.getButton3Pressed = function () {
            var _a, _b;
            switch (this.mode) {
                case 2 /* Table */:
                    return (_b = (_a = ControllerReader.controllerInfo) === null || _a === void 0 ? void 0 : _a.triggerPressed) !== null && _b !== void 0 ? _b : false;
                case 1 /* Desktop */:
                    return DesktopInputManager.getMiddleButtonPressed();
            }
            return false;
        };
        ProgramManager.prototype.getCursorPosition = function () {
            switch (this.mode) {
                case 2 /* Table */:
                    return ControllerReader.controllerInfo.wandPosition;
                case 1 /* Desktop */:
                    return DesktopInputManager.getCursorPosition();
            }
        };
        ProgramManager.prototype.Update = function () {
            switch (this.mode) {
                case 2 /* Table */:
                    ControllerReader.Update(); // Read controllers info
                    this.laser.UpdateTable(this.getCursorPosition());
                    for (var _i = 0, _a = this.buttons; _i < _a.length; _i++) {
                        var button = _a[_i];
                        if (this.userModeManager.userMode == 0 /* Standard */) { // don't let user press if in place/measure mode
                            this.setButton1Pressed(button.Update(this.getButton1Pressed(), this.laser.collision.objectID));
                        }
                    }
                    this.userModeManager.Update(this.getButton1Pressed());
                    break;
                case 1 /* Desktop */:
                    this.laser.UpdateDesktop();
                    for (var _b = 0, _c = this.buttons; _b < _c.length; _b++) {
                        var button = _c[_b];
                        this.setButton1Pressed(button.Update(this.getButton1Pressed(), this.laser.collision.objectID));
                    }
                    break;
            }
        };
        ProgramManager.prototype.Draw = function () {
            switch (this.mode) {
                case 2 /* Table */:
                    this.laser.Draw();
                    for (var _i = 0, _a = this.buttons; _i < _a.length; _i++) {
                        var button = _a[_i];
                        button.Draw();
                    }
                    //this.debugBox.Draw(this.laser.collision!.objectID === this.debugBox.ID);
                    break;
                case 1 /* Desktop */:
                    this.laser.Draw();
                    for (var _b = 0, _c = this.buttons; _b < _c.length; _b++) {
                        var button = _c[_b];
                        button.Draw();
                    }
                    break;
            }
        };
        return ProgramManager;
    }());
    (function () {
        var recentProblems = 0;
        function getProgramManager() {
            if (programManager === undefined)
                programManager = new ProgramManager();
            return programManager;
        }
        function Init(sgWorld) {
            var _a;
            try {
                exports.SGWorld = sgWorld;
                console.log("init:: " + new Date(Date.now()).toISOString());
                (_a = document.getElementById("consoleRun")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", runConsole);
                console.log("init:: SGWorld " + exports.SGWorld);
                exports.SGWorld.AttachEvent("OnFrame", function () {
                    var prev = OneFrame;
                    OneFrame = function () { };
                    getProgramManager().setMode(1 /* Desktop */);
                    if (getProgramManager().getMode() == 1 /* Desktop */) {
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
                exports.SGWorld.AttachEvent("OnSGWorld", function (eventID, eventParam) {
                    if (eventID == 14) {
                        // This is the place were you need to read wand information and respond to it.
                        getProgramManager().setMode(2 /* Table */);
                        if (getProgramManager().getMode() == 2 /* Table */) {
                            Update();
                            Draw();
                            debugHandleRefreshGesture();
                        }
                    }
                });
                exports.SGWorld.AttachEvent("OnCommandExecuted", function (CommandID, parameters) {
                    console.log(CommandID + " " + JSON.stringify(parameters));
                });
                setComClientForcedInputMode();
            }
            catch (e) {
                console.log("init error");
                console.log(e);
            }
        }
        function Update() {
            if (recentProblems > 0) {
                try {
                    getProgramManager().Update();
                }
                catch (e) {
                    ++recentProblems;
                    console.log("Update error");
                    console.log(e);
                    console.log("CallStack:\n" + debug.stacktrace(debug.info));
                    setTimeout(function () {
                        if (recentProblems > 0) {
                            console.log(String(recentProblems) + " other problems");
                            recentProblems = 0;
                        }
                    }, 5000);
                }
            }
            else {
                ++recentProblems;
                getProgramManager().Update();
                --recentProblems;
            }
        }
        function Draw() {
            if (recentProblems > 0) {
                try {
                    getProgramManager().Draw();
                }
                catch (e) {
                    ++recentProblems;
                    console.log("Draw error");
                    console.log(e);
                    console.log("CallStack:\n" + debug.stacktrace(debug.info));
                    setTimeout(function () {
                        if (recentProblems > 0) {
                            console.log(String(recentProblems) + " other problems");
                            recentProblems = 0;
                        }
                    }, 5000);
                }
            }
            else {
                ++recentProblems;
                getProgramManager().Draw();
                --recentProblems;
            }
        }
        // setTimeout(()=> Init(), 5000);
        // window.addEventListener("load", Init);
        var w = window;
        if (w.SGWorld) {
            Init(w.SGWorld);
        }
        else {
            // add a while here?
            setTimeout(function () { return Init(w.SGWorld); }, 1000);
        }
    })();
});
var debug = {
    info: undefined,
    stacktrace: function stacktrace(f) {
        var args = [];
        if (f) {
            if (f.arguments)
                for (var i = 0; i < f.arguments.length; i++) {
                    args.push(f.arguments[i]);
                }
            var function_name = f.toString().split('(')[0].substring(9);
            if (f == f.caller)
                return "[recursive] " + function_name + '(' + args.join(', ') + ')' + "\n";
            return debug.stacktrace(f.caller) + function_name + '(' + args.join(', ') + ')' + "\n";
        }
        else {
            return "";
        }
    },
    test: function test(i) {
        if (i <= 1)
            console.log(debug.stacktrace(arguments.callee));
        else
            debug.test(i - 1);
    }
};
function debugHandleRefreshGesture() {
    // Point the wand directly up for 2 sec to refresh page
    if (ControllerReader.controllerInfo && ControllerReader.controllerInfo.wandPosition && ControllerReader.controllerInfo.wandPosition.Pitch > 70 && debugHandleRefreshGesture.timer == undefined) {
        debugHandleRefreshGesture.timer = setTimeout(function () {
            window.location.reload();
        }, 2000);
    }
    else if (ControllerReader.controllerInfo && ControllerReader.controllerInfo.wandPosition && ControllerReader.controllerInfo.wandPosition.Pitch < 70 && debugHandleRefreshGesture.timer) {
        clearTimeout(debugHandleRefreshGesture.timer);
        debugHandleRefreshGesture.timer = undefined;
    }
}
debugHandleRefreshGesture.timer = undefined;
// interactive debug console
var console = {
    log: function (str) {
        var el = document.getElementById("consoleOutput");
        var wasNearBottom = el.scrollHeight - el.clientHeight <= el.scrollTop + el.clientHeight * 0.5;
        el.textContent += str + "\n";
        if (wasNearBottom)
            el.scrollTop = el.scrollHeight - el.clientHeight;
    }
};
function runConsole() {
    var input = document.getElementById("consoleInput").value;
    console.log("> " + input);
    try {
        console.log("= " + String(eval.call(window, input)));
    }
    catch (e) {
        console.log("! " + String(e));
    }
    document.getElementById("consoleInput").value = "";
}
function YPRToQuat(yRad, pRad, rRad) {
    var r = [0, 0, 0, 1];
    var cy = Math.cos(yRad / 2.0); // cos(Yaw)
    var sy = Math.sin(yRad / 2.0); // sin(Yaw)
    var cp = Math.cos(pRad / 2.0); // cos(Pitch)
    var sp = Math.sin(pRad / 2.0); // sin(Pitch)
    var cr = Math.cos(rRad / 2.0); // cos(Roll)
    var sr = Math.sin(rRad / 2.0); // sin(Roll)
    r[0] = cy * sp * cr - sy * cp * sr;
    r[1] = cy * cp * sr + sy * sp * cr;
    r[2] = cy * sp * sr + sy * cp * cr;
    r[3] = cy * cp * cr - sy * sp * sr;
    return r;
}
function QuatConjugate(q) {
    return [-q[0], -q[1], -q[2], q[3]];
}
function GetXAxis(q, v) {
    return [
        v * (q[3] * q[3] + q[0] * q[0] - q[1] * q[1] - q[2] * q[2]),
        v * (2 * (q[0] * q[1] + q[2] * q[3])),
        v * (2 * (q[0] * q[2] - q[1] * q[3]))
    ];
}
function GetYAxis(q, v) {
    return [
        v * (2 * (q[1] * q[0] - q[2] * q[3])),
        v * (q[3] * q[3] - q[0] * q[0] + q[1] * q[1] - q[2] * q[2]),
        v * (2 * (q[1] * q[2] + q[0] * q[3]))
    ];
}
function GetPitch(q) {
    var forward = GetYAxis(q, 1);
    var ret = Math.asin(forward[2]);
    if (isNaN(ret)) {
        return Math.PI / 2 * Math.sign(forward[2]);
    }
    return ret;
}
function GetYaw(q) {
    // We use right because up may be zero in xy
    var right = GetXAxis(q, 1);
    return Math.atan2(right[1], right[0]);
}
function QuatMul(a, b) {
    return [
        a[3] * b[0] + b[3] * a[0] + a[1] * b[2] - a[2] * b[1],
        a[3] * b[1] + b[3] * a[0] + a[2] * b[3] - a[3] * b[2],
        a[3] * b[2] + b[3] * a[0] + a[3] * b[1] - a[1] * b[3],
        a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]
    ];
}
function QuatYAxis(q, l) {
    return [
        l * (2 * (q[1] * q[0] - q[2] * q[3])),
        l * (q[3] * q[3] - q[0] * q[0] + q[1] * q[1] - q[2] * q[2]),
        l * (2 * (q[1] * q[2] + q[0] * q[3]))
    ];
}
function cross(a, b) {
    return [
        a[1] * b[2] - b[1] * a[2],
        a[2] * b[0] - b[2] * a[0],
        a[0] * b[1] - b[0] * a[1]
    ];
}
function vecAdd(a, b) {
    var ret = [];
    for (var i = 0; i < a.length && i < b.length; ++i) {
        ret.push(a[i] + b[i]);
    }
    return ret;
}
function vecSub(a, b) {
    var ret = [];
    for (var i = 0; i < a.length && i < b.length; ++i) {
        ret.push(a[i] - b[i]);
    }
    return ret;
}
function vecMul(a, s) {
    return a.map(function (e) { return e * s; });
}
function QuatApply(q, v) {
    var u = [q[0], q[1], q[2]];
    var crossUV = cross(u, v);
    var ret = vecAdd(v, vecMul((vecAdd(vecMul(crossUV, q[3]), cross(u, crossUV))), 2));
    return ret;
}
function dot(a, b) {
    var ret = 0;
    for (var i = 0; i < a.length && i < b.length; ++i)
        ret += a[i] * b[i];
    return ret;
}
function mag(v) {
    var ret = Math.sqrt(v.reduce(function (p, e) { return p + e * e; }, 0));
    return ret;
}
function normalize(v) {
    var vMag = mag(v);
    var ret = v.map(function (e) { return e / vMag; });
    return ret;
}
function intersectRayOnPlane(planeNormal, laserStart, laserDirection, alignPoint) {
    var denom = dot(laserDirection, planeNormal);
    if (denom == 0.0)
        return null;
    var t = (dot(vecSub(alignPoint, laserStart), planeNormal)) / denom;
    if (t < 0.0)
        return null;
    var ret = vecAdd(laserStart, vecMul(laserDirection, t));
    return ret;
}
function radsToDegs(rads) {
    var ret = rads / Math.PI * 180;
    return ret;
}
