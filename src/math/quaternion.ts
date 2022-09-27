import { FixedSizeArray } from "./fixedSizeArray.js";
import { Vector } from "./vector.js";

export class Quaternion {
  data: FixedSizeArray<number, 4>;

  /**
   * Takes ownership of the provided QuaternionArray
   * @param data QuaternionArray to use internally
   */
  constructor(data: FixedSizeArray<number, 4>) {
    this.data = data;
  }

  static FromYPR(yRad: number, pRad: number, rRad: number): Quaternion {
    const r: Quaternion = new Quaternion([0, 0, 0, 1]);

    const cy = Math.cos(yRad / 2.0); // cos(Yaw)
    const sy = Math.sin(yRad / 2.0); // sin(Yaw)
    const cp = Math.cos(pRad / 2.0); // cos(Pitch)
    const sp = Math.sin(pRad / 2.0); // sin(Pitch)
    const cr = Math.cos(rRad / 2.0); // cos(Roll)
    const sr = Math.sin(rRad / 2.0); // sin(Roll)

    r.data[0] = cy * sp * cr - sy * cp * sr;
    r.data[1] = cy * cp * sr + sy * sp * cr;
    r.data[2] = cy * sp * sr + sy * cp * cr;
    r.data[3] = cy * cp * cr - sy * sp * sr;

    return r;
  }

  Copy(): Quaternion {
    return new Quaternion([...this.data]);
  }

  // set zero roll on this quaternion
  ZeroRoll(): Quaternion {
    let pitch = this.GetPitch();
    let yaw = this.GetYaw();
    [...this.data] = [0, 0, 0, 1];
    this.PostApplyXAxis(pitch).PreApplyZAxis(yaw);
    this.Normalise();
    return this;
  }

  GetYPR(): FixedSizeArray<number, 3> {
    const x = this.data[0];
    const y = this.data[1];
    const z = this.data[2];
    const w = this.data[3];

    const sinpitch = 2.0 * (z * y + w * x);
    if (Math.abs(sinpitch - 1) < 1e-5)
      return [
        2 * Math.atan2(y, w),
        Math.PI / 2,
        0
      ];
    if (Math.abs(sinpitch + 1) < 1e-5)
      return [
        - 2 * Math.atan2(y, w),
        -Math.PI / 2,
        0
      ];
    return [
      Math.atan2(2.0 * (w * z - x * y), 1 - 2 * (x * x + z * z)),
      Math.asin(sinpitch),
      Math.atan2(2.0 * (w * y - x * z), 1 - 2 * (x * x + y * y))
    ];
  }

  GetRoll() {
    return Math.atan2(2 * (this.data[3] * this.data[1] - this.data[0] * this.data[2]), 1 - 2 * (this.data[0] * this.data[0] + this.data[1] * this.data[1]))
  }

  GetPitch() {
    let forward = this.GetYAxis(1);
    let ret = Math.asin(forward.data[2]);
    if (isNaN(ret)) {
      return Math.PI / 2 * Math.sign(forward.data[2]);
    }
    return ret;
  }

  GetYaw() {
    // We use right because up may be zero in xy
    let right = this.GetXAxis(1);
    return Math.atan2(right.data[1], right.data[0]);
  }

  Conjugate(): Quaternion {
    [...this.data] = [-this.data[0], -this.data[1], -this.data[2], this.data[3]];
    return this;
  }

  // find the new axis * v
  GetXAxis(v: number): Vector<3> {
    return new Vector<3>([
      v * (this.data[3] * this.data[3] + this.data[0] * this.data[0] - this.data[1] * this.data[1] - this.data[2] * this.data[2]),
      v * (2 * (this.data[0] * this.data[1] + this.data[2] * this.data[3])),
      v * (2 * (this.data[0] * this.data[2] - this.data[1] * this.data[3]))
    ]);
  }

  GetYAxis(v: number): Vector<3> {
    return new Vector<3>([
      v * (2 * (this.data[1] * this.data[0] - this.data[2] * this.data[3])),
      v * (this.data[3] * this.data[3] - this.data[0] * this.data[0] + this.data[1] * this.data[1] - this.data[2] * this.data[2]),
      v * (2 * (this.data[1] * this.data[2] + this.data[0] * this.data[3]))
    ]);
  }

  GetZAxis(v: number): Vector<3> {
    return new Vector<3>([
      v * (2 * (this.data[2] * this.data[0] + this.data[1] * this.data[3])),
      v * (2 * (this.data[2] * this.data[1] - this.data[0] * this.data[3])),
      v * (this.data[3] * this.data[3] - this.data[0] * this.data[0] - this.data[1] * this.data[1] + this.data[2] * this.data[2]),
    ]);
  }

  // rotate around the new axis by v radians
  PostApplyXAxis(v: number): Quaternion {
    let s = Math.sin(v / 2);
    let c = Math.cos(v / 2);
    [...this.data] = [
      this.data[0] * c + this.data[3] * s,
      this.data[1] * c + this.data[2] * s,
      this.data[2] * c - this.data[1] * s,
      this.data[3] * c - this.data[0] * s
    ];
    return this;
  }

  PostApplyYAxis(v: number): Quaternion {
    let s = Math.sin(v / 2);
    let c = Math.cos(v / 2);
    [...this.data] = [
      this.data[0] * c - this.data[2] * s,
      this.data[1] * c + this.data[3] * s,
      this.data[2] * c + this.data[0] * s,
      this.data[3] * c - this.data[1] * s
    ];
    return this;
  }

  PostApplyZAxis(v: number): Quaternion {
    let s = Math.sin(v / 2);
    let c = Math.cos(v / 2);
    [...this.data] = [
      this.data[0] * c + this.data[1] * s,
      this.data[1] * c - this.data[0] * s,
      this.data[2] * c + this.data[3] * s,
      this.data[3] * c - this.data[2] * s
    ];
    return this;
  }

  // rotate around the original axis by v radians
  PreApplyXAxis(v: number): Quaternion {
    let s = Math.sin(v / 2);
    let c = Math.cos(v / 2);
    [...this.data] = [
      this.data[0] * c + this.data[3] * s,
      this.data[1] * c - this.data[2] * s,
      this.data[2] * c + this.data[1] * s,
      this.data[3] * c - this.data[0] * s
    ];
    return this;
  }

  PreApplyYAxis(v: number): Quaternion {
    let s = Math.sin(v / 2);
    let c = Math.cos(v / 2);
    [...this.data] = [
      this.data[0] * c + this.data[2] * s,
      this.data[1] * c + this.data[3] * s,
      this.data[2] * c - this.data[0] * s,
      this.data[3] * c - this.data[1] * s
    ];
    return this;
  }

  PreApplyZAxis(v: number): Quaternion {
    let s = Math.sin(v / 2);
    let c = Math.cos(v / 2);
    [...this.data] = [
      this.data[0] * c - this.data[1] * s,
      this.data[1] * c + this.data[0] * s,
      this.data[2] * c + this.data[3] * s,
      this.data[3] * c - this.data[2] * s
    ];
    return this;
  }

  Apply(v: Vector<3>) {
    const u = new Vector<3>([this.data[0], this.data[1], this.data[2]]);
    const crossUV = u.Cross(v);
    return v.Copy().Add(crossUV.Copy().Mul(this.data[3]).Add(u.Cross(crossUV)).Mul(2));
  }

  Mul(q: Quaternion) {
    [...this.data] = [
      this.data[3] * q.data[0] + q.data[3] * this.data[0] + this.data[1] * q.data[2] - this.data[2] * q.data[1],
      this.data[3] * q.data[1] + q.data[3] * this.data[1] + this.data[2] * q.data[0] - this.data[0] * q.data[2],
      this.data[3] * q.data[2] + q.data[3] * this.data[2] + this.data[0] * q.data[1] - this.data[1] * q.data[0],
      this.data[3] * q.data[3] - this.data[0] * q.data[0] - this.data[1] * q.data[1] - this.data[2] * q.data[2]
    ];
    return this;
  }

  Equals(b: Quaternion): boolean {
    return this.data.every((value, index) => value == b.data[index])
  }

  Mag(): number {
    return Math.sqrt(this.data.reduce((previous, value) => previous + value * value, 0));
  }

  Normalise(): Quaternion {
    let mag = this.Mag();
    if (mag == 0 && this.data.length > 0) {
      this.data[0] = 1;
      return this;
    }
    this.data.forEach((value, index, array) => array[index] = value / mag);
    return this;
  }
}
