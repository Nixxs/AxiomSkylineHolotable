import { Vector } from "./math/vector";

export function intersectRayOnPlane(planeNormal: Vector<3>, laserStart: Vector<3>, laserDirection: Vector<3>, alignPoint: Vector<3>): Vector<3> | null {
  const denom = laserDirection.Dot(planeNormal);
  if (denom == 0.0)
    return null;

  const t = alignPoint.Copy().Sub(laserStart).Dot(planeNormal) / denom;
  if (t < 0.0)
    return null;

  return laserStart.Copy().Add(laserDirection.Copy().Mul(t));
}

export function radsToDegs(rads: number) {
  return rads / Math.PI * 180;
}

export function degsToRads(degs: number) {
  return degs * Math.PI / 180;
}
