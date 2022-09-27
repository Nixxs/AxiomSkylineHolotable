import { sgWorld } from "./Axiom";

export function CreatePosition(X: number, Y: number, Altitude: number, AltitudeType: AltitudeTypeCode, Yaw?: number, Pitch?: number, Roll?: number, Distance?: number) {
  return sgWorld.Creator.CreatePosition(X, Y, Altitude, AltitudeType, Yaw, Pitch, Roll, Distance);
}
