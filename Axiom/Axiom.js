"use strict";
;
;
//test commit
var modelPath;
var modelObject;
var UserModeManager = /** @class */ (function () {
    function UserModeManager(laser) {
        this.laser = laser;
        this.spacing = 5000;
        this.numRings = 5;
        this.measurementModeFirstPoint = null;
        this.measurementModeLineID = null;
        this.measurementTextLabelID = null;
        this.measurementLineWidth = 3;
        this.decimalPlaces = 3;
        this.labelStyle = SGWorld.Creator.CreateLabelStyle(0);
        this.measurementLineColor = SGWorld.Creator.CreateColor(255, 255, 0, 255);
        this.measurementLabelStyle = SGWorld.Creator.CreateLabelStyle(0);
        this.measurementLabelStyle.PivotAlignment = "Top";
        this.measurementLabelStyle.MultilineJustification = "Left";
    }
    UserModeManager.prototype.toggleMeasurementMode = function () {
        if (userMode == 1 /* Measurement */) {
            if (this.measurementModeLineID !== null) {
                SGWorld.Creator.DeleteObject(this.measurementModeLineID);
                SGWorld.Creator.DeleteObject(this.measurementTextLabelID);
            }
            userMode = 0 /* Standard */;
        }
        else {
            userMode = 1 /* Measurement */;
        }
        this.measurementModeLineID = null;
        this.measurementTextLabelID = null;
        this.measurementModeFirstPoint = null;
    };
    
    UserModeManager.prototype.toggleModelModeArtRange = function () {
        if (userMode == 3 /* Place Model */) {
            console.log("end model mode");
            userMode = 0 /* Standard */;
        }
        else {
            modelPath = "\\\\adf01\\LCSP\\Models\\Models_XPL\\HotwitzerRange.xpl2";
            var pos = SGWorld.Window.CenterPixelToWorld(0).Position.Copy()
            pos.Pitch = 0;
            console.log("creating model");
            modelObject = SGWorld.Creator.CreateModel(pos, modelPath, 1, 0, "", "HotwitzerRange model");

            userMode = 3 /* Measurement */;
        }
    };
    UserModeManager.prototype.toggleModelModeArtillary = function () {
        if (userMode == 3 /* Place Model */) {
            console.log("end model mode");
            userMode = 0 /* Standard */;
        }
        else {
            modelPath = "\\\\adf01\\LCSP\\Models\\Models_XPL\\Hotwitzer.xpl2";
            var pos = SGWorld.Window.CenterPixelToWorld(0).Position.Copy()
            pos.Pitch = 0;
            console.log("creating model");
            modelObject = SGWorld.Creator.CreateModel(pos, modelPath, 1, 0, "", "Hotwitzer model");

            userMode = 3 /* Measurement */;
        }
    };
    UserModeManager.prototype.setStandardMode = function () {
        userMode = 0 /* Standard */;
    };
    UserModeManager.prototype.toggleRangeRingMode = function () {
        if (userMode == 2 /* DropRangeRing */)
            userMode = 0 /* Standard */;
        else
            userMode = 2 /* DropRangeRing */;
    };
    UserModeManager.prototype.dropRangeRing = function () {
        console.log("dropRangeRing");
        var linecolor = SGWorld.Creator.CreateColor(0, 0, 0, 255); //red for customer requirements
        var fillcolor = SGWorld.Creator.CreateColor(0, 0, 0, 0); //"0x00000000";
        var pos = this.laser.collision.hitPoint.Copy();
        var objNamePrefix = pos.X + "long" + pos.Y + "lat" + pos.Altitude + "mAlt_";

        //create centre circle
        var centerFillColour = SGWorld.Creator.CreateColor(0, 0, 0, 255); 
        SGWorld.Creator.CreateCircle(pos, 500, linecolor, centerFillColour, "", "Centre Range Ring");

        for (var i = 1; i <= this.numRings; i++) {
            var radius = this.spacing * i;
            var itemName = objNamePrefix + "RangeRing" + radius + "m";
            if (radius >= 25000) {
                linecolor = SGWorld.Creator.CreateColor(255, 0, 0, 255);
            } else {
                linecolor = SGWorld.Creator.CreateColor(0, 0, 0, 255);
            }
            var circle = SGWorld.Creator.CreateCircle(pos, radius, linecolor, fillcolor, "", itemName);
            circle.NumberOfSegments = 50;
            var newPos = pos.Move(radius, 270, 0);
            SGWorld.Creator.CreateTextLabel(newPos, radius + "m", this.labelStyle, "", itemName);
        }
    };

    UserModeManager.prototype.Update = function () {
        var _a, _b, _c;
        switch (userMode) {
            case 0 /* Standard */:
                switch (controlMode) {
                    case 1 /* Table */:
                        tableMode();
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
                    var mLine = SGWorld.Creator.GetObject(this.measurementModeLineID);
                    var Geometry = mLine.Geometry;
                    Geometry.StartEdit();
                    Geometry.Points.Item(1).X = teEndPos.X;
                    Geometry.Points.Item(1).Y = teEndPos.Y;
                    Geometry.EndEdit();
                    // Update the label
                    var direction = teStartPos.Yaw.toFixed(this.decimalPlaces);
                    var distance = teStartPos.DistanceTo(teEndPos).toFixed(this.decimalPlaces);
                    var strLabelText = direction + " " + String.fromCharCode(176) + " / " + distance + "m";
                    var teHalfPos = teStartPos.Move(teStartPos.DistanceTo(teEndPos) / 2, teStartPos.Yaw, 0);
                    var mLabel = SGWorld.Creator.GetObject(this.measurementTextLabelID);
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
                    var lineGeom = SGWorld.Creator.GeometryCreator.CreateLineStringGeometry(strLineWKT);
                    var mLine = SGWorld.Creator.CreatePolyline(lineGeom, this.measurementLineColor, 2, "", "__line");
                    mLine.LineStyle.Width = this.measurementLineWidth;
                    this.measurementModeLineID = mLine.ID;
                    this.measurementTextLabelID = SGWorld.Creator.CreateTextLabel(teStartPos, "0m", this.measurementLabelStyle, "", "___label").ID;
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
            case 3 /* Model Mode */:
                if ((_c = ControllerReader.controllerInfo) === null || _c === void 0 ? void 0 : _c.button1Pressed) {
                    this.setStandardMode();
                    // consume the button press
                    ControllerReader.controllerInfo.button1Pressed = false;
                } else {
                    try {
                        var newModelPosition = this.laser.collision.hitPoint.Copy();
                        newModelPosition.Pitch = 0;
                        newModelPosition.Yaw = newModelPosition.Roll * 2;
                        newModelPosition.Roll = 0;
                        modelObject.Position = newModelPosition;
                    } catch (error) {
                        console.log("no position");
                    }
                }
                break;
        }
    };
    return UserModeManager;
}());
var userMode = 0 /* Standard */;
var controlMode = 1 /* Table */;
var ControllerReader = /** @class */ (function () {
    function ControllerReader() {
    }
    ControllerReader.Update = function () {
        var _a, _b, _c, _d;
        var VRControllersInfo = getVRControllersInfo();
        if (VRControllersInfo != undefined) {
            var prevButton1 = (_b = (_a = this.controllerInfo) === null || _a === void 0 ? void 0 : _a.button1) !== null && _b !== void 0 ? _b : false;
            var prevButton2 = (_d = (_c = this.controllerInfo) === null || _c === void 0 ? void 0 : _c.button2) !== null && _d !== void 0 ? _d : false;
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
                    var tmpHeadsetpos = SGWorld.GetParam(8601);
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
    function Button(roomPosition, textureName, callback) {
        this.roomPosition = roomPosition;
        this.textureName = textureName;
        this.callback = callback;
    }
    Button.prototype.Update = function (selectedID) {
        var _a;
        if (this.ID !== undefined && this.ID === selectedID && ((_a = ControllerReader.controllerInfo) === null || _a === void 0 ? void 0 : _a.button1Pressed)) {
            this.callback();
            // consume the button press
            ControllerReader.controllerInfo.button1Pressed = false;
        }
    };
    // buttonPressed is whether the button was down this frame but not last frame
    Button.prototype.Draw = function () {
        var _a, _b;
        var customScaler = 2;
        var pos = roomToWorldCoord(this.roomPosition);
        if (this.ID === undefined) {
            var obj_1 = SGWorld.Creator.CreateBox(pos, 1, 1, 0.001, 0xFF000000, 0xFF000000, "", "button");
            this.ID = obj_1.ID;
            obj_1.FillStyle.Texture.FileName = this.textureName;
            return;
        }
        // Move the button to be in the right spot
        var boxSize = ((_b = (_a = ControllerReader.controllerInfo) === null || _a === void 0 ? void 0 : _a.scaleFactor) !== null && _b !== void 0 ? _b : 1) / 20.0;
        var obj = SGWorld.Creator.GetObject(this.ID);
        obj.Position = pos;
        obj.Width = boxSize * customScaler;
        obj.Height = boxSize * 0.001;
        obj.Depth = boxSize * customScaler;
    };
    return Button;
}());
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
            var RightRay = SGWorld.Creator.CreatePolylineFromArray(verticesArray, pickRayInfo.isNothing ? 0xFF0000FF : 0xFFFFFFFF, 3, SGWorld.ProjectTree.NotInTreeID, "ray");
            RightRay.SetParam(200, 0x200); // Make sure that the ray object itself will not be pickable
            this.ID = RightRay.ID;
        }
        else {
            var obj = SGWorld.Creator.GetObject(this.ID);
            obj.Geometry = SGWorld.Creator.GeometryCreator.CreateLineStringGeometry(verticesArray);
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
            tip = SGWorld.Creator.CreateSphere(pickRayInfo.hitPoint.Copy(), sphereRadius, 0, 0x5000FF00, 0x5000FF00, 10, SGWorld.ProjectTree.NotInTreeID, "rayTip");
            tip.SetParam(200, 0x200);
            this.ID = tip.ID;
        }
        else {
            var obj = SGWorld.Creator.GetObject(this.ID);
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
    Laser.prototype.Update = function (position) {
        var _a, _b, _c, _d, _e, _f, _g;
        SGWorld.SetParam(8300, position); // Pick ray
        var hitObjectID = SGWorld.GetParam(8310);
        var distToHitPoint = SGWorld.GetParam(8312); // Get distance to hit point
        var isNothing = false;
        if (distToHitPoint == 0) {
            distToHitPoint = SGWorld.Navigate.GetPosition(3).Altitude / 2;
            isNothing = true;
        }
        if (isNothing !== ((_a = this.collision) === null || _a === void 0 ? void 0 : _a.isNothing)) {
            console.log(isNothing ? "Nothing" : "Something");
        }
        var hitPosition = position.Copy().Move(distToHitPoint, (_d = (_c = (_b = ControllerReader.controllerInfo) === null || _b === void 0 ? void 0 : _b.wandPosition) === null || _c === void 0 ? void 0 : _c.Yaw) !== null && _d !== void 0 ? _d : 0, (_g = (_f = (_e = ControllerReader.controllerInfo) === null || _e === void 0 ? void 0 : _e.wandPosition) === null || _f === void 0 ? void 0 : _f.Pitch) !== null && _g !== void 0 ? _g : 0);
        hitPosition.Cartesian = true;
        this.collision = {
            originPoint: position,
            hitPoint: hitPosition,
            rayLength: distToHitPoint,
            objectID: hitObjectID,
            isNothing: isNothing
        };
    };
    Laser.prototype.Draw = function () {
        this.ray.Draw(this.collision);
        this.tip.Draw(this.collision);
    };
    return Laser;
}());
function roomToWorldCoord(position) {
    var temp = position.Y;
    position.Y = position.Altitude;
    position.Altitude = temp;
    var ret = SGWorld.SetParamEx(9014, position);
    position.Altitude = position.Y;
    position.Y = temp;
    return ret;
}
function worldToRoomCoord(position) {
    var ret = SGWorld.SetParamEx(9013, position);
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
    var VRCstr = SGWorld.GetParam(8600); // get the VR controls status
    var VRC = JSON.parse(VRCstr);
    return VRC;
}
function getRoomExtent() {
    var extent = SGWorld.SetParamEx(9015); // get the VR controls status
    var roomExtent = JSON.parse(extent);
    return roomExtent;
}
function jumpToSydney() {
    console.log("sydney");
    SGWorld.Navigate.FlyTo(SGWorld.Creator.CreatePosition(151.2067675, -33.8667266, 5000, 3, 0, -80, 0, 5000));
    userMode = 0 /* Standard */;
}
function jumpToWhyalla() {
    console.log("whyalla");
    SGWorld.Navigate.FlyTo(SGWorld.Creator.CreatePosition(137.5576346, -33.0357364, 5000, 3, 0, -80, 0, 5000));
    userMode = 0 /* Standard */;
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
            var box = SGWorld.Creator.CreateBox(roomCenterInWorldCoordinates, boxSize, boxSize, boxSize * 1.5, 0xFFFFFFFF, 0xFFFFFFFF, SGWorld.ProjectTree.NotInTreeID, "Box");
            box.SetParam(200, 0x2); // Makes the objectwithout z write so no other object can obfuscate it.
            this.ID = box.ID;
        }
        else {
            var rayHitBox = rayHit;
            var obj = SGWorld.Creator.GetObject(this.ID);
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
        var posCurrent = SGWorld.Navigate.GetPosition(3);
        var posDest = laser.collision.hitPoint.Copy();
        posDest.Altitude = laser.collision.originPoint.Altitude;
        var dir = laser.collision.originPoint.AimTo(posDest);
        var newPos = posCurrent.Move(posDest.Altitude * 0.05, dir.Yaw, 0);
        newPos.Yaw = posCurrent.Yaw;
        newPos.Pitch = posCurrent.Pitch;
        SGWorld.Navigate.SetPosition(newPos);
    }
    // go up
    if ((_b = ControllerReader.controllerInfo) === null || _b === void 0 ? void 0 : _b.button1) {
        var newPos = SGWorld.Navigate.GetPosition(3);
        newPos.Altitude *= 1.1;
        SGWorld.Navigate.SetPosition(newPos);
    }
    // go down
    if ((_c = ControllerReader.controllerInfo) === null || _c === void 0 ? void 0 : _c.button2) {
        var newPos = SGWorld.Navigate.GetPosition(3);
        newPos.Altitude *= 0.9;
        SGWorld.Navigate.SetPosition(newPos);
    }
}
var wallMode = wandMode;
function WorldGetPosition() {
    var pos = worldToRoomCoord(SGWorld.Navigate.GetPosition(3));
    var ret = [pos.X, pos.Y, pos.Altitude];
    return ret;
}
function WorldSetPosition(v) {
    var newPos = worldToRoomCoord(SGWorld.Navigate.GetPosition(3));
    newPos.X = v[0];
    newPos.Y = v[1];
    SGWorld.Navigate.SetPosition(roomToWorldCoord(newPos));
}
function WorldIncreasePosition(v) {
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
    if (((_b = ControllerReader.controllerInfo) === null || _b === void 0 ? void 0 : _b.trigger) && !table.isDragging) {
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
var ProgramManager = /** @class */ (function () {
    function ProgramManager() {
        this.buttons = [];
        this.laser = new Laser();
        this.userModeManager = new UserModeManager(this.laser);
        this.buttons.push(new Button(SGWorld.Creator.CreatePosition(-0.45, -1.1, 0.7, 3), "\\\\adf01\\LCSP\\Axiom\\sydney.png", jumpToSydney));
        this.buttons.push(new Button(SGWorld.Creator.CreatePosition(-0.30, -1.1, 0.7, 3), "\\\\adf01\\LCSP\\Axiom\\whyalla.png", jumpToWhyalla));
        this.buttons.push(new Button(SGWorld.Creator.CreatePosition(-0.10, -1.1, 0.7, 3), "\\\\adf01\\LCSP\\Axiom\\measurement.png", this.userModeManager.toggleMeasurementMode));
        this.buttons.push(new Button(SGWorld.Creator.CreatePosition(0.05, -1.1, 0.7, 3), "\\\\adf01\\LCSP\\Axiom\\rangefinder.png", this.userModeManager.toggleRangeRingMode));
        this.buttons.push(new Button(SGWorld.Creator.CreatePosition(0.30, -1.1, 0.7, 3), "\\\\adf01\\LCSP\\Axiom\\placeartillery.png", this.userModeManager.toggleModelModeArtillary));
        this.buttons.push(new Button(SGWorld.Creator.CreatePosition(0.45, -1.1, 0.7, 3), "\\\\adf01\\LCSP\\Axiom\\placeartilleryrange.png", this.userModeManager.toggleModelModeArtRange));
		//this.debugBox = new DebugBox(SGWorld.Creator.CreatePosition(0.0, -0.6, 0.7, 3));
    }
    ProgramManager.prototype.Update = function () {
        ControllerReader.Update(); // Read controllers info
        this.laser.Update(ControllerReader.controllerInfo.wandPosition);
        for (var _i = 0, _a = this.buttons; _i < _a.length; _i++) {
            var button = _a[_i];
            button.Update(this.laser.collision.objectID);
        }
        this.userModeManager.Update();
    };
    ProgramManager.prototype.Draw = function () {
        this.laser.Draw();
        for (var _i = 0, _a = this.buttons; _i < _a.length; _i++) {
            var button = _a[_i];
            button.Draw();
        }
        //this.debugBox.Draw(this.laser.collision.objectID === this.debugBox.ID);
    };
    return ProgramManager;
}());
(function () {
    function Init() {
        var _a;
        try {
            console.log("init");
            (_a = document.getElementById("consoleRun")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", runConsole);
            SGWorld.AttachEvent("OnFrame", function () {
                var prev = OneFrame;
                OneFrame = function () { };
                prev();
                OnFrame();
            }); // Sent from TE AFTER rendering of a frame
            SGWorld.AttachEvent("OnSGWorld", function (eventID, eventParam) {
                if (eventID == 14) {
                    // This is the place were you need to read wand information and respond to it.
                    Update();
                    Draw();
                    debugHandleRefreshGestur();
                }
            });
            setComClientForcedInputMode();
        }
        catch (e) {
            console.log("init error");
            console.log(e);
        }
    }
    var programManager;
    var recentProblems = 0;
    function U() {
        if (programManager === undefined)
            programManager = new ProgramManager();
        programManager.Update();
    }
    function Update() {
        if (recentProblems > 0) {
            try {
                U();
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
            U();
            --recentProblems;
        }
    }
    function D() {
        if (programManager === undefined)
            alert("Program manager not defined");
        else
            programManager.Draw();
    }
    function Draw() {
        if (recentProblems > 0) {
            try {
                D();
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
            D();
            --recentProblems;
        }
    }
    window.addEventListener("load", Init);
})();
