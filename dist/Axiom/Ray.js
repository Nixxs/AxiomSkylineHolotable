define(["require", "exports", "./Axiom"], function (require, exports, Axiom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Ray = void 0;
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
                var RightRay = Axiom_1.SGWorld.Creator.CreatePolylineFromArray(verticesArray, pickRayInfo.isNothing ? 0xFF0000FF : 0xFFFFFFFF, 3, "", "ray");
                RightRay.SetParam(200, 0x200); // Make sure that the ray object itself will not be pickable
                this.ID = RightRay.ID;
            }
            else {
                var obj = Axiom_1.SGWorld.Creator.GetObject(this.ID);
                obj.Geometry = Axiom_1.SGWorld.Creator.GeometryCreator.CreateLineStringGeometry(verticesArray);
                obj.LineStyle.Color.abgrColor = (pickRayInfo.objectID !== undefined) ? 0xFF0000FF : 0xFFFF0000;
            }
        };
        return Ray;
    }());
    exports.Ray = Ray;
});
