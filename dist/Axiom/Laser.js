define(["require", "exports", "./Axiom", "./DesktopInputManager", "./Ray", "./Sphere"], function (require, exports, Axiom_1, DesktopInputManager_1, Ray_1, Sphere_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Laser = void 0;
    var Laser = /** @class */ (function () {
        function Laser() {
            this.ray = new Ray_1.Ray();
            this.tip = new Sphere_1.Sphere();
        }
        Laser.prototype.UpdateTable = function (position) {
            var _a;
            Axiom_1.SGWorld.SetParam(8300, position); // Pick ray
            var hitObjectID = Axiom_1.SGWorld.GetParam(8310);
            var distToHitPoint = Axiom_1.SGWorld.GetParam(8312); // Get distance to hit point
            var isNothing = false;
            if (distToHitPoint == 0) {
                distToHitPoint = Axiom_1.SGWorld.Navigate.GetPosition(3).Altitude / 2;
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
            if (((_a = this.collision) === null || _a === void 0 ? void 0 : _a.isNothing) && DesktopInputManager_1.DesktopInputManager.getCursor().ObjectID !== '') {
                console.log("hitting ".concat(DesktopInputManager_1.DesktopInputManager.getCursor().ObjectID));
            }
            else if (!((_b = this.collision) === null || _b === void 0 ? void 0 : _b.isNothing) && DesktopInputManager_1.DesktopInputManager.getCursor().ObjectID === '') {
                console.log('Not hitting');
            }
            this.collision = {
                originPoint: Axiom_1.SGWorld.Navigate.GetPosition(3),
                hitPoint: DesktopInputManager_1.DesktopInputManager.getCursorPosition(),
                rayLength: Axiom_1.SGWorld.Navigate.GetPosition(3).DistanceTo(DesktopInputManager_1.DesktopInputManager.getCursorPosition()),
                objectID: DesktopInputManager_1.DesktopInputManager.getCursor().ObjectID,
                isNothing: DesktopInputManager_1.DesktopInputManager.getCursor().ObjectID === ''
            };
        };
        Laser.prototype.Draw = function () {
            this.ray.Draw(this.collision);
            this.tip.Draw(this.collision);
        };
        return Laser;
    }());
    exports.Laser = Laser;
});
