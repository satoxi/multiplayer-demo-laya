namespace Muse {
  export interface IAnimFrame {
    t: number;
    value: number;
  }

  export class AnimCurve {
    public get points(): IAnimFrame[] {
      return this._points;
    }

    public constructor(points: IAnimFrame[]) {
      if (points.length < 2) {
        throw new Error('curve length must be >= 2');
      }
      points.sort((a: IAnimFrame, b: IAnimFrame) => {
        return a.t - b.t;
      });
      if (points[0].t !== 0) {
        throw new Error('curve must start with 0');
      }
      if (points[points.length - 1].t !== 1) {
        throw new Error('curve must end with 1');
      }
      this._points = points;
    }

    public lerp(t: number): number {
      for (let i = 1; i < this._points.length; i++) {
        if (t <= this._points[i].t) {
          const m = MathUtils.map01(
            t,
            this._points[i - 1].t,
            this._points[i].t
          );
          return MathUtils.lerp(
            this._points[i - 1].value,
            this._points[i].value,
            m
          );
        }
      }
      throw new Error('should never be here');
    }

    public _points: IAnimFrame[];
  }

  export class MathUtils {
    public static readonly deg2Rad: number = Math.PI / 180;
    public static readonly epsilon: number = 0.00001;
    public static readonly rad2Deg: number = 180 / Math.PI;

    public static lerp(a: number, b: number, t: number): number {
      t = MathUtils.clamp(t, 0, 1);
      return a + t * (b - a);
    }

    public static betterLerp(
      a: number,
      b: number,
      t: number,
      epsilon: number
    ): number {
      return Math.abs(a - b) < epsilon ? b : MathUtils.lerp(a, b, t);
    }

    // Loops the value t,
    // so that it is never larger than length and never smaller than 0.
    public static repeat(t: number, length: number): number {
      if (length === 0) {
        return 0;
      }
      return this.clamp(t - Math.floor(t / length) * length, 0.0, length);
    }

    // PingPongs the value t, so that it is never larger than length and never smaller than 0.
    public static pingPong(t: number, length: number): number {
      if (length === 0) {
        return 0;
      }
      t = this.repeat(t, length * 2);
      return length - Math.abs(t - length);
    }

    // Unity Mathf.SmoothDamp function
    public static smoothDamp(
      current: number,
      target: number,
      currentVelocity: number,
      smoothTime: number,
      maxSpeed: number,
      deltaTime: number
    ): { value: number; currentVelocity: number } {
      smoothTime = Math.max(0.0001, smoothTime);
      const num: number = 2 / smoothTime;
      const num2: number = num * deltaTime;
      const num3: number =
        1 /
        (1 + (num2 + (0.48 * (num2 * num2) + 0.235 * (num2 * (num2 * num2)))));
      let num4: number = current - target;
      const num5: number = target;
      const num6: number = maxSpeed * smoothTime;
      num4 = this.clamp(num4, num6 * -1, num6);
      target = current - num4;
      const num7: number = (currentVelocity + num * num4) * deltaTime;
      currentVelocity = (currentVelocity - num * num7) * num3;
      let num8: number = target + (num4 + num7) * num3;
      if (num5 - current > 0 === num8 > num5) {
        num8 = num5;
        currentVelocity = (num8 - num5) / deltaTime;
      }
      return { value: num8, currentVelocity };
    }

    public static smoothDampVector(
      current: Vector,
      target: Vector,
      currentVelocity: Vector,
      smoothTime: number,
      maxSpeed: number,
      deltaTime: number
    ): Vector {
      const v = Vector.zero;

      const resX = this.smoothDamp(
        current.x,
        target.x,
        currentVelocity.x,
        smoothTime,
        maxSpeed,
        deltaTime
      );
      v.x = resX.value;
      currentVelocity.x = resX.currentVelocity;

      const resY = this.smoothDamp(
        current.y,
        target.y,
        currentVelocity.y,
        smoothTime,
        maxSpeed,
        deltaTime
      );
      v.y = resY.value;
      currentVelocity.y = resY.currentVelocity;

      return v;
    }

    public static map01(value: number, min: number, max: number): number {
      return ((MathUtils.clamp(value, min, max) - min) * 1) / (max - min);
    }

    // <summary>
    // mapps value (which is in the range leftMin - leftMax)
    // to a value in the range rightMin - rightMax
    // </summary>
    // <param name="value">Value.</param>
    // <param name="leftMin">Left minimum.</param>
    // <param name="leftMax">Left max.</param>
    // <param name="rightMin">Right minimum.</param>
    // <param name="rightMax">Right max.</param>
    public static mapMinMax(
      value: number,
      leftMin: number,
      leftMax: number,
      rightMin: number,
      rightMax
    ): number {
      return (
        rightMin +
        ((MathUtils.clamp(value, leftMin, leftMax) - leftMin) *
          (rightMax - rightMin)) /
          (leftMax - leftMin)
      );
    }

    public static approximately(src: number, dest: number): boolean {
      return Math.abs(src - dest) < 0.0001;
    }

    public static roundToFixed(value: number, decimalNum: number): number {
      const n = Math.pow(10, decimalNum);
      return Math.round(value * n) / n;
    }

    public static clamp(value: number, min: number, max: number) {
      if (value < min) {
        value = min;
      }
      if (value > max) {
        value = max;
      }
      return value;
    }

    public static compareVersion(src: string, des: string) {
      const srcArray = src.split('.');
      const desArray = des.split('.');
      const len = Math.min(srcArray.length, desArray.length);
      for (let i = 0; i < len; i++) {
        if (Number(srcArray[i]) === Number(desArray[i])) {
          continue;
        }
        return Number(srcArray[i]) > Number(desArray[i]) ? true : false;
      }

      return srcArray.length >= desArray.length;
    }

    public static isVersionLowerOrEqual(src: string, des: string) {
      const srcArray = src.split('.');
      const desArray = des.split('.');
      const len = Math.min(srcArray.length, desArray.length);
      for (let i = 0; i < len; i++) {
        if (Number(srcArray[i]) === Number(desArray[i])) {
          continue;
        }
        return Number(srcArray[i]) < Number(desArray[i]) ? true : false;
      }

      return srcArray.length <= desArray.length;
    }

    public static arrayAdd(a: number[], b: number[]): number[] {
      const result = [];
      if (a.length !== b.length) {
        return result;
      }

      for (let i = 0; i < a.length; i++) {
        result.push(a[i] + b[i]);
      }

      return result;
    }

    public static getTimeStr(seconds: number) {
      const minute = ~~(seconds / 60);
      const second = seconds % 60;
      return second ? `${minute}分${second}秒` : `${minute}分钟`;
    }

    /// <summary>
    /// gets a point on the circumference of the circle given its center,
    /// radius and angle. 0 degrees is 3 o'clock.
    /// </summary>
    /// <returns>The on circle.</returns>
    /// <param name="circleCenter">Circle center.</param>
    /// <param name="radius">Radius.</param>
    /// <param name="angleInDegrees">Angle in degrees.</param>
    public static pointOnCircle(
      circleCenter: Vector,
      radius: number,
      angleInDegrees: number
    ): Vector {
      const radians = angleInDegrees * MathUtils.deg2Rad;
      return new Vector(
        Math.cos(radians) * radius + circleCenter.x,
        Math.sin(radians) * radius + circleCenter.y
      );
    }
  }
}
