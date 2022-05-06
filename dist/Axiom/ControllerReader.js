define(["require", "exports", "./Axiom", "./ProgramManager"], function (require, exports, Axiom_1, ProgramManager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ControllerReader = void 0;
    var ControllerReader = /** @class */ (function () {
        function ControllerReader() {
        }
        ControllerReader.Update = function () {
            var _a, _b, _c, _d, _e, _f;
            var VRControllersInfo = (0, ProgramManager_1.getVRControllersInfo)();
            if (VRControllersInfo !== undefined) {
                var rightHand = 1; // 0=left,1=right
                var prevTrigger = (_b = (_a = this.controllerInfo) === null || _a === void 0 ? void 0 : _a.trigger) !== null && _b !== void 0 ? _b : false;
                var prevButton1 = (_d = (_c = this.controllerInfo) === null || _c === void 0 ? void 0 : _c.button1) !== null && _d !== void 0 ? _d : false;
                var prevButton2 = (_f = (_e = this.controllerInfo) === null || _e === void 0 ? void 0 : _e.button2) !== null && _f !== void 0 ? _f : false;
                this.controllerInfo = {};
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
                    this.controllerInfo.wandPosition = Axiom_1.SGWorld.Navigate.GetPosition(3); // Naive way to create gPosRightHandPos
                    this.controllerInfo.wandPosition.Distance = 100000;
                    this.controllerInfo.wandPosition.X = VRControllersInfo.Position[rightHand][0];
                    this.controllerInfo.wandPosition.Y = VRControllersInfo.Position[rightHand][2];
                    this.controllerInfo.wandPosition.Altitude = VRControllersInfo.Position[rightHand][1];
                    if (VRControllersInfo.HaveOrientation != undefined && VRControllersInfo.HaveOrientation[rightHand]) {
                        this.controllerInfo.wandPosition.Yaw = VRControllersInfo.Yaw[rightHand];
                        this.controllerInfo.wandPosition.Pitch = VRControllersInfo.Pitch[rightHand];
                        this.controllerInfo.wandPosition.Roll = VRControllersInfo.Roll[rightHand];
                        this.controllerInfo.headPosition = Axiom_1.SGWorld.Navigate.GetPosition(3);
                        var tmpHeadsetpos = Axiom_1.SGWorld.GetParam(8601);
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
            else {
                if (this.controllerInfo !== undefined) {
                    this.controllerInfo.triggerPressed = false;
                    this.controllerInfo.button1Pressed = false;
                    this.controllerInfo.button2Pressed = false;
                }
            }
            if (this.roomExtent === undefined) {
                var roomExtent = (0, ProgramManager_1.getRoomExtent)();
                this.roomExtent = {
                    min: [roomExtent.minX, roomExtent.minY, roomExtent.minZ],
                    max: [roomExtent.maxX, roomExtent.maxY, roomExtent.maxZ]
                };
            }
        };
        return ControllerReader;
    }());
    exports.ControllerReader = ControllerReader;
});
