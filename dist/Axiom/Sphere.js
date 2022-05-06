define(["require", "exports", "./Axiom"], function (require, exports, Axiom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Sphere = void 0;
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
                tip = Axiom_1.SGWorld.Creator.CreateSphere(pickRayInfo.hitPoint.Copy(), sphereRadius, 0, 0x5000FF00, 0x5000FF00, 10, "", "rayTip");
                tip.SetParam(200, 0x200);
                this.ID = tip.ID;
            }
            else {
                var obj = Axiom_1.SGWorld.Creator.GetObject(this.ID);
                obj.Position = pickRayInfo.hitPoint.Copy();
                obj.Position.Altitude -= sphereRadius / 2;
                obj.SetParam(200, 0x200); // not pickable
                obj.Radius = sphereRadius;
                obj.LineStyle.Color.FromARGBColor(pickRayInfo.objectID == undefined ? 0x50FFFFFF : 0x5000FF00);
            }
        };
        return Sphere;
    }());
    exports.Sphere = Sphere;
});
