"use strict";
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
