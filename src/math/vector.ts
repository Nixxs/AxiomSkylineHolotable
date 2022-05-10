import { FixedSizeArray } from "./fixedSizeArray.js";

export class Vector<N extends number> {
  data: FixedSizeArray<number, N>;

  /**
   * Takes ownership of the provided NumberTuple
   * @param data NumberTuple to use internally
   */
  constructor(data: FixedSizeArray<number, N>) {
    this.data = data;
  }

  Copy(): Vector<N> {
    return new Vector<N>([...this.data]);
  }

  Add(b: Vector<N>): Vector<N> {
    this.data.forEach((value, index, array) => array[index] = value + b.data[index]);
    return this;
  }

  Sub(b: Vector<N>): Vector<N> {
    this.data.forEach((value, index, array) => array[index] = value - b.data[index]);
    return this;
  }

  Mul(v: number): Vector<N> {
    this.data.forEach((value, index, array) => array[index] = v * value);
    return this;
  }

  Dot(b: Vector<N>): number {
    return this.data.reduce((previous, value, index) => previous + value * b.data[index], 0);
  }

  Cross(b: Vector<3>): Vector<3> {
    if (this.data.length + 0 !== 3)
      throw new TypeError("Cross product only available for vectors of length 3");
    const data = <FixedSizeArray<number, 3>>this.data;
    return new Vector([
      data[1] * b.data[2] - b.data[1] * data[2],
      data[2] * b.data[0] - b.data[2] * data[0],
      data[0] * b.data[1] - b.data[0] * data[1]
    ]);
  }

  Equals(b: Vector<N>): boolean {
    return this.data.every((value, index) => value == b.data[index])
  }

  Mag(): number {
    return Math.sqrt(this.data.reduce((previous, value) => previous + value * value, 0));
  }

  Normalise(): Vector<N> {
    let mag = this.Mag();
    if (mag == 0 && this.data.length > 0) {
      this.data[0] = 1;
      return this;
    }
    this.data.forEach((value, index, array) => array[index] = value / mag);
    return this;
  }
}
