var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
define(["require", "exports", "./Axiom", "./ControllerReader", "./Debug", "./DesktopInputManager", "./Mathematics", "./UIManager", "./UserManager"], function (require, exports, Axiom_1, ControllerReader_1, Debug_1, DesktopInputManager_1, Mathematics_1, UIManager_1, UserManager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MaxZoom = exports.deviceHeightOffset = exports.WorldGetOri = exports.WorldGetScale = exports.WorldIncreasePosition = exports.programManager = exports.ProgramManager = exports.worldToRoomCoord = exports.roomToWorldCoord = exports.getRoomExtent = exports.getVRControllersInfo = exports.unsetComClientForcedInputMode = exports.setComClientForcedInputMode = void 0;
    function setComClientForcedInputMode() {
        Axiom_1.SGWorld.SetParam(8166, 1); // Force COM input mode (Meaning your code here is in control)
    }
    exports.setComClientForcedInputMode = setComClientForcedInputMode;
    function unsetComClientForcedInputMode() {
        Axiom_1.SGWorld.SetParam(8166, 0); // UNForce COM input mode (Meaning your code here is NOT in control)
    }
    exports.unsetComClientForcedInputMode = unsetComClientForcedInputMode;
    function getVRControllersInfo() {
        var VRCstr = Axiom_1.SGWorld.GetParam(8600); // get the VR controls status
        var VRC = JSON.parse(VRCstr);
        return VRC;
    }
    exports.getVRControllersInfo = getVRControllersInfo;
    function getRoomExtent() {
        var extent = Axiom_1.SGWorld.SetParamEx(9015); // get the VR controls status
        var roomExtent = JSON.parse(extent);
        return roomExtent;
    }
    exports.getRoomExtent = getRoomExtent;
    function roomToWorldCoordEx(position) {
        var pos = Axiom_1.SGWorld.SetParamEx(9014, position);
        // bug? got a object mismatch using this position when se on an object
        pos = Axiom_1.SGWorld.Creator.CreatePosition(pos.X, pos.Y, pos.Altitude, 3, pos.Yaw, pos.Pitch, pos.Roll, pos.Distance);
        return pos;
    }
    function worldToRoomCoordEx(position) {
        return Axiom_1.SGWorld.SetParamEx(9013, position);
    }
    function roomToWorldCoordD(position) {
        var ret = Axiom_1.SGWorld.Navigate.GetPosition(3);
        ret.X += position.X / 40000;
        ret.Y += (position.Altitude + 2) / 40000;
        ret.Altitude += position.Y - 3;
        ret.Yaw = position.Yaw;
        ret.Pitch = position.Pitch;
        ret.Roll = position.Roll;
        return ret;
    }
    function worldToRoomCoordD(position) {
        var ret = Axiom_1.SGWorld.Navigate.GetPosition(3);
        ret.Cartesian = true;
        ret.X = 40000 * position.X - ret.X;
        ret.Y = 40000 * position.Altitude - ret.Y;
        ret.Y -= 2;
        ret.Altitude = position.Y - ret.Altitude;
        ret.Altitude += 3;
        ret.Yaw = position.Yaw;
        ret.Pitch = position.Pitch;
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
    exports.roomToWorldCoord = roomToWorldCoord;
    function worldToRoomCoord(position) {
        var ret = worldToRoomCoordF(position);
        var temp = ret.Y;
        ret.Y = ret.Altitude;
        ret.Altitude = temp;
        return ret;
    }
    exports.worldToRoomCoord = worldToRoomCoord;
    /**
     * Handles running the script in any program mode
     */
    var ProgramManager = /** @class */ (function () {
        function ProgramManager() {
            this.mode = 0 /* Unknown */;
            this.modeTimer = 0;
            this.currentlySelected = "";
            this.userModeManager = new UserManager_1.UserModeManager();
            this.uiManager = new UIManager_1.UIManager();
            this.buttons = [];
            console.log("ProgramManager:: constructor");
        }
        ProgramManager.OnFrame = function () { };
        ProgramManager.DoOneFrame = function (f) { ProgramManager.OneFrame = f; };
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
            groupId = Axiom_1.SGWorld.ProjectTree.FindItem(groupName);
            if (groupId) {
                Axiom_1.SGWorld.ProjectTree.DeleteItem(groupId);
            }
            groupId = Axiom_1.SGWorld.ProjectTree.CreateGroup(groupName);
            return groupId;
        };
        ProgramManager.prototype.getButton1Pressed = function () {
            var _a, _b;
            switch (this.mode) {
                case 2 /* Table */:
                    return (_b = (_a = ControllerReader_1.ControllerReader.controllerInfo) === null || _a === void 0 ? void 0 : _a.button1Pressed) !== null && _b !== void 0 ? _b : false;
                case 1 /* Desktop */:
                    return DesktopInputManager_1.DesktopInputManager.getLeftButtonPressed();
            }
            return false;
        };
        ProgramManager.prototype.setButton1Pressed = function (pressed) {
            switch (this.mode) {
                case 2 /* Table */:
                    ControllerReader_1.ControllerReader.controllerInfo.button1Pressed = pressed;
                case 1 /* Desktop */:
                    DesktopInputManager_1.DesktopInputManager.setLeftButtonPressed(pressed);
            }
        };
        ProgramManager.prototype.getButton2Pressed = function () {
            var _a, _b;
            switch (this.mode) {
                case 2 /* Table */:
                    return (_b = (_a = ControllerReader_1.ControllerReader.controllerInfo) === null || _a === void 0 ? void 0 : _a.button2Pressed) !== null && _b !== void 0 ? _b : false;
                case 1 /* Desktop */:
                    return DesktopInputManager_1.DesktopInputManager.getRightButtonPressed();
            }
            return false;
        };
        ProgramManager.prototype.getButton3 = function () {
            var _a, _b;
            switch (this.mode) {
                case 2 /* Table */:
                    return (_b = (_a = ControllerReader_1.ControllerReader.controllerInfo) === null || _a === void 0 ? void 0 : _a.trigger) !== null && _b !== void 0 ? _b : false;
                case 1 /* Desktop */:
                    return DesktopInputManager_1.DesktopInputManager.getMiddleButton();
            }
            return false;
        };
        ProgramManager.prototype.getButton3Pressed = function () {
            var _a, _b;
            switch (this.mode) {
                case 2 /* Table */:
                    return (_b = (_a = ControllerReader_1.ControllerReader.controllerInfo) === null || _a === void 0 ? void 0 : _a.triggerPressed) !== null && _b !== void 0 ? _b : false;
                case 1 /* Desktop */:
                    return DesktopInputManager_1.DesktopInputManager.getMiddleButtonPressed();
            }
            return false;
        };
        ProgramManager.prototype.getCursorPosition = function () {
            switch (this.mode) {
                case 2 /* Table */:
                    return ControllerReader_1.ControllerReader.controllerInfo.wandPosition;
                case 1 /* Desktop */:
                    return DesktopInputManager_1.DesktopInputManager.getCursorPosition();
            }
        };
        ProgramManager.prototype.Update = function () {
            switch (this.mode) {
                case 2 /* Table */:
                    ControllerReader_1.ControllerReader.Update(); // Read controllers info
                    break;
                case 1 /* Desktop */:
                    DesktopInputManager_1.DesktopInputManager.Update();
                    break;
            }
            this.userModeManager.Update();
            this.uiManager.Update();
        };
        ProgramManager.prototype.Draw = function () {
            this.userModeManager.Draw();
            this.uiManager.Draw();
        };
        ProgramManager.prototype.Init = function () {
            return __awaiter(this, void 0, void 0, function () {
                var e_1;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            console.log("init:: " + new Date(Date.now()).toISOString());
                            setComClientForcedInputMode();
                            // Wait for managers to initialise on first frame
                            return [4 /*yield*/, new Promise(function (go) {
                                    var firstTableFrame = function (eventID, _eventParam) {
                                        if (eventID == 14) {
                                            _this.userModeManager.Init();
                                            _this.uiManager.Init();
                                            Axiom_1.SGWorld.DetachEvent("OnFrame", firstDesktopFrame);
                                            Axiom_1.SGWorld.DetachEvent("OnSGWorld", firstTableFrame);
                                            go();
                                        }
                                    };
                                    var firstDesktopFrame = function () {
                                        _this.userModeManager.Init();
                                        _this.uiManager.Init();
                                        Axiom_1.SGWorld.DetachEvent("OnFrame", firstDesktopFrame);
                                        Axiom_1.SGWorld.DetachEvent("OnSGWorld", firstTableFrame);
                                        go();
                                    };
                                    Axiom_1.SGWorld.AttachEvent("OnSGWorld", firstTableFrame);
                                    Axiom_1.SGWorld.AttachEvent("OnFrame", firstDesktopFrame);
                                })];
                        case 1:
                            // Wait for managers to initialise on first frame
                            _a.sent();
                            Axiom_1.SGWorld.AttachEvent("OnFrame", function () {
                                var prev = ProgramManager.OneFrame;
                                ProgramManager.OneFrame = function () { };
                                exports.programManager.setMode(1 /* Desktop */);
                                if (exports.programManager.getMode() == 1 /* Desktop */) {
                                    roomToWorldCoordF = roomToWorldCoordD;
                                    worldToRoomCoordF = worldToRoomCoordD;
                                    prev();
                                    ProgramManager.OnFrame();
                                    Update();
                                    Draw();
                                    roomToWorldCoordF = roomToWorldCoordEx;
                                    worldToRoomCoordF = worldToRoomCoordEx;
                                }
                            });
                            Axiom_1.SGWorld.AttachEvent("OnSGWorld", function (eventID, _eventParam) {
                                if (eventID == 14) {
                                    // This is the place were you need to read wand information and respond to it.
                                    exports.programManager.setMode(2 /* Table */);
                                    if (exports.programManager.getMode() == 2 /* Table */) {
                                        Update();
                                        Draw();
                                        (0, Debug_1.debugHandleRefreshGesture)();
                                    }
                                }
                            });
                            Axiom_1.SGWorld.AttachEvent("OnCommandExecuted", function (CommandID, parameters) {
                                console.log(CommandID + " " + JSON.stringify(parameters));
                            });
                            return [3 /*break*/, 3];
                        case 2:
                            e_1 = _a.sent();
                            console.log("init error");
                            console.log(e_1);
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        ProgramManager.OneFrame = function () { };
        return ProgramManager;
    }());
    exports.ProgramManager = ProgramManager;
    exports.programManager = new ProgramManager();
    var recentProblems = 0;
    function Update() {
        if (recentProblems == 0) {
            try {
                exports.programManager.Update();
            }
            catch (e) {
                ++recentProblems;
                console.log("Update error");
                console.log(e);
                console.log("CallStack:\n" + Debug_1.debug.stacktrace(Debug_1.debug.info));
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
            exports.programManager.Update();
            --recentProblems;
        }
    }
    function Draw() {
        if (recentProblems == 0) {
            try {
                exports.programManager.Draw();
            }
            catch (e) {
                ++recentProblems;
                console.log("Draw error");
                console.log(e);
                console.log("CallStack:\n" + Debug_1.debug.stacktrace(Debug_1.debug.info));
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
            exports.programManager.Draw();
            --recentProblems;
        }
    }
    function WorldGetPosition() {
        var pos = worldToRoomCoordF(Axiom_1.SGWorld.Navigate.GetPosition(3));
        return [pos.X, pos.Y, pos.Altitude];
    }
    function WorldSetPosition(v) {
        var newPos = worldToRoomCoordF(Axiom_1.SGWorld.Navigate.GetPosition(3));
        newPos.X = v[0];
        newPos.Y = v[1];
        Axiom_1.SGWorld.Navigate.SetPosition(roomToWorldCoordF(newPos));
    }
    function WorldIncreasePosition(v) {
        WorldSetPosition((0, Mathematics_1.vecAdd)(v, WorldGetPosition()));
    }
    exports.WorldIncreasePosition = WorldIncreasePosition;
    function WorldGetScale() {
        return Axiom_1.SGWorld.Navigate.GetPosition(3).Altitude;
    }
    exports.WorldGetScale = WorldGetScale;
    function WorldGetOri() {
        var pos = worldToRoomCoordF(Axiom_1.SGWorld.Navigate.GetPosition(3));
        return (0, Mathematics_1.YPRToQuat)(pos.Yaw, pos.Pitch, pos.Roll);
    }
    exports.WorldGetOri = WorldGetOri;
    function deviceHeightOffset() {
        return 0.615;
    }
    exports.deviceHeightOffset = deviceHeightOffset;
    function MaxZoom() {
        // arbitrary limit to max zoom
        return 99999999999;
    }
    exports.MaxZoom = MaxZoom;
});
