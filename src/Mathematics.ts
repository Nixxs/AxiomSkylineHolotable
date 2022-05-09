export type quatType = [number, number, number, number];
export type vecType = [number, number, number];

export function YPRToQuat(yRad: number, pRad: number, rRad: number): quatType {

  const r: quatType = [0, 0, 0, 1];

  const cy = Math.cos(yRad / 2.0); // cos(Yaw)
  const sy = Math.sin(yRad / 2.0); // sin(Yaw)
  const cp = Math.cos(pRad / 2.0); // cos(Pitch)
  const sp = Math.sin(pRad / 2.0); // sin(Pitch)
  const cr = Math.cos(rRad / 2.0); // cos(Roll)
  const sr = Math.sin(rRad / 2.0); // sin(Roll)

  r[0] = cy * sp * cr - sy * cp * sr;
  r[1] = cy * cp * sr + sy * sp * cr;
  r[2] = cy * sp * sr + sy * cp * cr;
  r[3] = cy * cp * cr - sy * sp * sr;


  return r;
}

export function QuatConjugate(q: quatType): quatType {
  return [-q[0], -q[1], -q[2], q[3]];
}

export function GetXAxis(q: quatType, v: number): vecType {
  return [
    v * (q[3] * q[3] + q[0] * q[0] - q[1] * q[1] - q[2] * q[2]),
    v * (2 * (q[0] * q[1] + q[2] * q[3])),
    v * (2 * (q[0] * q[2] - q[1] * q[3]))
  ]
}

export function GetYAxis(q: quatType, v: number): vecType {
  return [
    v * (2 * (q[1] * q[0] - q[2] * q[3])),
    v * (q[3] * q[3] - q[0] * q[0] + q[1] * q[1] - q[2] * q[2]),
    v * (2 * (q[1] * q[2] + q[0] * q[3]))
  ]
}

export function GetPitch(q: quatType) {
  let forward = GetYAxis(q, 1);
  let ret = Math.asin(forward[2]);
  if (isNaN(ret)) {
    return Math.PI / 2 * Math.sign(forward[2]);
  }
  return ret;
}

export function GetYaw(q: quatType) {
  // We use right because up may be zero in xy
  let right = GetXAxis(q, 1);
  return Math.atan2(right[1], right[0]);
}

export function QuatMul(a: quatType, b: quatType): quatType {
  return [
    a[3] * b[0] + b[3] * a[0] + a[1] * b[2] - a[2] * b[1],
    a[3] * b[1] + b[3] * a[0] + a[2] * b[3] - a[3] * b[2],
    a[3] * b[2] + b[3] * a[0] + a[3] * b[1] - a[1] * b[3],
    a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]
  ];
}

export function QuatYAxis(q: quatType, l: number): vecType {
  return [
    l * (2 * (q[1] * q[0] - q[2] * q[3])),
    l * (q[3] * q[3] - q[0] * q[0] + q[1] * q[1] - q[2] * q[2]),
    l * (2 * (q[1] * q[2] + q[0] * q[3]))
  ];
}

export function cross(a: vecType, b: vecType): vecType {
  return [
    a[1] * b[2] - b[1] * a[2],
    a[2] * b[0] - b[2] * a[0],
    a[0] * b[1] - b[0] * a[1]
  ];
}

export function vecAdd(a: number[], b: number[]) {
  const ret = [];
  for (let i = 0; i < a.length && i < b.length; ++i) {
    ret.push(a[i] + b[i]);
  }
  return ret;
}

export function vecSub(a: number[], b: number[]) {
  const ret = [];
  for (let i = 0; i < a.length && i < b.length; ++i) {
    ret.push(a[i] - b[i]);
  }
  return ret;
}

export function vecMul(a: number[], s: number) {
  return a.map(function (e) { return e * s; });
}

export function QuatApply(q: quatType, v: vecType) {
  const u: vecType = [q[0], q[1], q[2]];
  const crossUV = cross(u, v);
  return vecAdd(v, vecMul((vecAdd(vecMul(crossUV, q[3]), cross(u, crossUV))), 2));
}

export function dot(a: number[], b: number[]) {
  let ret = 0;
  for (let i = 0; i < a.length && i < b.length; ++i)
    ret += a[i] * b[i];
  return ret;
}

export function mag(v: number[]) {
  return Math.sqrt(v.reduce(function (p, e) { return p + e * e; }, 0));
}

export function normalize(v: number[]) {
  const vMag = mag(v);
  return v.map(function (e) { return e / vMag; });
}

export function intersectRayOnPlane(planeNormal: vecType, laserStart: vecType, laserDirection: vecType, alignPoint: vecType): vecType | null {
  const denom = dot(laserDirection, planeNormal);
  if (denom == 0.0)
    return null;

  const t = (dot(vecSub(alignPoint, laserStart), planeNormal)) / denom;
  if (t < 0.0)
    return null;

  return vecAdd(laserStart, vecMul(laserDirection, t)) as vecType;
}

export function radsToDegs(rads: number) {
  return rads / Math.PI * 180;
}
