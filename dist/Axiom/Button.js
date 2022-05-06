define(["require", "exports", "./Axiom", "./ControllerReader", "./ProgramManager"], function (require, exports, Axiom_1, ControllerReader_1, ProgramManager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Button = void 0;
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
                    ProgramManager_1.ProgramManager.DoOneFrame(callback);
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
            var pos = (0, ProgramManager_1.roomToWorldCoord)(this.roomPosition);
            var scaleFactor = ((_b = (_a = ControllerReader_1.ControllerReader.controllerInfo) === null || _a === void 0 ? void 0 : _a.scaleFactor) !== null && _b !== void 0 ? _b : 1) / 12;
            if (this.ID === undefined) {
                var obj = Axiom_1.SGWorld.Creator.CreateModel(pos, this.modelPath, scaleFactor, 0, this.groupID, this.name);
                this.ID = obj.ID;
            }
            else {
                // Move the button to be in the right spot
                var obj = Axiom_1.SGWorld.Creator.GetObject(this.ID);
                obj.Position = pos;
                obj.ScaleFactor = scaleFactor;
            }
        };
        Button.prototype.setPosition = function (pos) {
            var _a, _b;
            console.log("setPosition:: " + this.ID);
            if (this.ID) {
                var boxSize = ((_b = (_a = ControllerReader_1.ControllerReader.controllerInfo) === null || _a === void 0 ? void 0 : _a.scaleFactor) !== null && _b !== void 0 ? _b : 1) / 12;
                this.roomPosition = pos;
                var obj = Axiom_1.SGWorld.Creator.GetObject(this.ID);
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
            var obj = Axiom_1.SGWorld.Creator.GetObject(this.ID);
            obj.Visibility.Show = value;
        };
        return Button;
    }());
    exports.Button = Button;
});
