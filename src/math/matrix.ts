import { FixedSizeArray } from "./fixedSizeArray.js";
import { Quaternion } from "./quaternion.js";
import { Vector } from "./vector.js";

export class Matrix4x4 {
  data: FixedSizeArray<number, 16>;

  constructor(data: FixedSizeArray<number, 16>) {
    this.data = data;
  }

  Copy(): Matrix4x4 {
    return new Matrix4x4([...this.data]);
  }

  Add(b: Matrix4x4): Matrix4x4 {
    this.data.forEach((value, index, array) => array[index] = value + b.data[index]);
    return this;
  }

  Sub(b: Matrix4x4): Matrix4x4 {
    this.data.forEach((value, index, array) => array[index] = value - b.data[index]);
    return this;
  }

  Mul(other: Matrix4x4 | number): Matrix4x4 {
    if (typeof (other) == "number") {
      this.data.forEach((value, index, array) => array[index] = other * value);
      return this;
    }
    const a = this.data;
    const b = other.data;
    this.data = [
      a[0 + 0 * 4] * b[0 + 0 * 4] + a[0 + 1 * 4] * b[1 + 0 * 4] + a[0 + 2 * 4] * b[2 + 0 * 4] + a[0 + 3 * 4] * b[3 + 0 * 4],
      a[1 + 0 * 4] * b[0 + 0 * 4] + a[1 + 1 * 4] * b[1 + 0 * 4] + a[1 + 2 * 4] * b[2 + 0 * 4] + a[1 + 3 * 4] * b[3 + 0 * 4],
      a[2 + 0 * 4] * b[0 + 0 * 4] + a[2 + 1 * 4] * b[1 + 0 * 4] + a[2 + 2 * 4] * b[2 + 0 * 4] + a[2 + 3 * 4] * b[3 + 0 * 4],
      a[3 + 0 * 4] * b[0 + 0 * 4] + a[3 + 1 * 4] * b[1 + 0 * 4] + a[3 + 2 * 4] * b[2 + 0 * 4] + a[3 + 3 * 4] * b[3 + 0 * 4],
      a[0 + 0 * 4] * b[0 + 1 * 4] + a[0 + 1 * 4] * b[1 + 1 * 4] + a[0 + 2 * 4] * b[2 + 1 * 4] + a[0 + 3 * 4] * b[3 + 1 * 4],
      a[1 + 0 * 4] * b[0 + 1 * 4] + a[1 + 1 * 4] * b[1 + 1 * 4] + a[1 + 2 * 4] * b[2 + 1 * 4] + a[1 + 3 * 4] * b[3 + 1 * 4],
      a[2 + 0 * 4] * b[0 + 1 * 4] + a[2 + 1 * 4] * b[1 + 1 * 4] + a[2 + 2 * 4] * b[2 + 1 * 4] + a[2 + 3 * 4] * b[3 + 1 * 4],
      a[3 + 0 * 4] * b[0 + 1 * 4] + a[3 + 1 * 4] * b[1 + 1 * 4] + a[3 + 2 * 4] * b[2 + 1 * 4] + a[3 + 3 * 4] * b[3 + 1 * 4],
      a[0 + 0 * 4] * b[0 + 2 * 4] + a[0 + 1 * 4] * b[1 + 2 * 4] + a[0 + 2 * 4] * b[2 + 2 * 4] + a[0 + 3 * 4] * b[3 + 2 * 4],
      a[1 + 0 * 4] * b[0 + 2 * 4] + a[1 + 1 * 4] * b[1 + 2 * 4] + a[1 + 2 * 4] * b[2 + 2 * 4] + a[1 + 3 * 4] * b[3 + 2 * 4],
      a[2 + 0 * 4] * b[0 + 2 * 4] + a[2 + 1 * 4] * b[1 + 2 * 4] + a[2 + 2 * 4] * b[2 + 2 * 4] + a[2 + 3 * 4] * b[3 + 2 * 4],
      a[3 + 0 * 4] * b[0 + 2 * 4] + a[3 + 1 * 4] * b[1 + 2 * 4] + a[3 + 2 * 4] * b[2 + 2 * 4] + a[3 + 3 * 4] * b[3 + 2 * 4],
      a[0 + 0 * 4] * b[0 + 3 * 4] + a[0 + 1 * 4] * b[1 + 3 * 4] + a[0 + 2 * 4] * b[2 + 3 * 4] + a[0 + 3 * 4] * b[3 + 3 * 4],
      a[1 + 0 * 4] * b[0 + 3 * 4] + a[1 + 1 * 4] * b[1 + 3 * 4] + a[1 + 2 * 4] * b[2 + 3 * 4] + a[1 + 3 * 4] * b[3 + 3 * 4],
      a[2 + 0 * 4] * b[0 + 3 * 4] + a[2 + 1 * 4] * b[1 + 3 * 4] + a[2 + 2 * 4] * b[2 + 3 * 4] + a[2 + 3 * 4] * b[3 + 3 * 4],
      a[3 + 0 * 4] * b[0 + 3 * 4] + a[3 + 1 * 4] * b[1 + 3 * 4] + a[3 + 2 * 4] * b[2 + 3 * 4] + a[3 + 3 * 4] * b[3 + 3 * 4],
    ];
    return this;
  }

  Equals(b: Matrix4x4): boolean {
    return this.data.every((value, index) => value == b.data[index])
  }

  static QuatRotation(quat: Quaternion, translation?: Vector<3>): Matrix4x4 {
    const q = quat.data;
    const t = translation?.data ?? [0, 0, 0];
    return new Matrix4x4([
      1 - 2 * (q[1] * q[1] + q[2] * q[2]), 0 + 2 * (q[1] * q[0] + q[2] * q[3]), 0 + 2 * (q[2] * q[0] - q[1] * q[3]), 0,
      0 + 2 * (q[0] * q[1] - q[2] * q[3]), 1 - 2 * (q[0] * q[0] + q[2] * q[2]), 0 + 2 * (q[2] * q[1] + q[0] * q[3]), 0,
      0 + 2 * (q[0] * q[2] + q[1] * q[3]), 0 + 2 * (q[1] * q[2] - q[0] * q[3]), 1 - 2 * (q[0] * q[0] + q[1] * q[1]), 0,
      t[0], t[1], t[2], 1
    ]);
  }

  static Scale(s: number, translation?: Vector<3>): Matrix4x4 {
    const t = translation?.data ?? [0, 0, 0];
    return new Matrix4x4([
      s, 0, 0, 0,
      0, s, 0, 0,
      0, 0, s, 0,
      t[0], t[1], t[2], 1
    ]);
  }
}
