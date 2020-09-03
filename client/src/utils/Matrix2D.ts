namespace Muse {
  ///  <summary>
  ///  Represents the right-handed 3x3 floating point matrix,
  ///  which can store translation, scale and rotation information.
  ///  </summary>
  export class Matrix2D {
    public M11: number;

    //  x scale
    public M12: number;

    public M21: number;

    public M22: number;

    //  y scale
    public M31: number;

    //  x translation
    public M32: number;

    public static get identity(): Matrix2D {
      return new Matrix2D().setIdentity();
    }

    ///  <summary>
    ///  Position stored in this matrix.
    ///  </summary>
    public get translation(): Vector {
      return new Vector(this.M31, this.M32);
    }
    public set translation(value: Vector) {
      this.M31 = value.x;
      this.M32 = value.y;
    }

    ///  <summary>
    ///  rotation in radians stored in this matrix
    ///  </summary>
    ///  <value>The rotation.</value>
    public get rotation(): number {
      return Math.atan2(this.M21, this.M11);
    }
    public set rotation(value: number) {
      const val1 = Math.cos(value);
      const val2 = Math.sin(value);
      this.M11 = val1;
      this.M12 = val2;
      this.M21 = val2 * -1;
      this.M22 = val1;
    }

    ///  <summary>
    ///  rotation in degrees stored in this matrix
    ///  </summary>
    ///  <value>The rotation degrees.</value>
    public get rotationDegrees(): number {
      return this.rotation * MathUtils.rad2Deg;
    }
    public set rotationDegrees(value: number) {
      this.rotation = value * MathUtils.deg2Rad;
    }

    ///  <summary>
    ///  Scale stored in this matrix.
    ///  </summary>
    public get scale(): Vector {
      return new Vector(this.M11, this.M22);
    }
    public set scale(value: Vector) {
      this.M11 = value.x;
      this.M22 = value.y;
    }

    private static _identity: Matrix2D = new Matrix2D().setValues(
      1,
      0,
      0,
      1,
      0,
      0
    );

    public setValues(
      m11: number,
      m12: number,
      m21: number,
      m22: number,
      m31: number,
      m32: number
    ): Matrix2D {
      this.M11 = m11;
      this.M12 = m12;
      this.M21 = m21;
      this.M22 = m22;
      this.M31 = m31;
      this.M32 = m32;
      return this;
    }

    public setIdentity(): Matrix2D {
      return this.setValues(1, 0, 0, 1, 0, 0);
    }

    ///  <summary>
    ///  Creates a new <see cref="Matrix2D"/> which contains sum of two matrixes.
    ///  </summary>
    ///  <param name="matrix1">The first matrix to add.</param>
    ///  <param name="matrix2">The second matrix to add.</param>
    ///  <param name="result">The result of the matrix addition as an output parameter.</param>
    public static add(matrix1: Matrix2D, matrix2: Matrix2D, result: Matrix2D) {
      result.M11 = matrix1.M11 + matrix2.M11;
      result.M12 = matrix1.M12 + matrix2.M12;
      result.M21 = matrix1.M21 + matrix2.M21;
      result.M22 = matrix1.M22 + matrix2.M22;
      result.M31 = matrix1.M31 + matrix2.M31;
      result.M32 = matrix1.M32 + matrix2.M32;
    }

    ///  <summary>
    ///  Creates a new rotation <see cref="Matrix2D"/> around Z axis.
    ///  </summary>
    ///  <param name="radians">Angle in radians.</param>
    ///  <param name="result">The rotation <see cref="Matrix2D"/> around Z axis as an output parameter.</param>
    public static createRotation(radians: number, result: Matrix2D) {
      result.setIdentity();
      const val1 = Math.cos(radians);
      const val2 = Math.sin(radians);
      result.M11 = val1;
      result.M12 = val2;
      result.M21 = val2 * -1;
      result.M22 = val1;
    }

    ///  <summary>
    ///  Creates a new scaling <see cref="Matrix2D"/>.
    ///  </summary>
    ///  <param name="xScale">Scale value for X axis.</param>
    ///  <param name="yScale">Scale value for Y axis.</param>
    ///  <param name="result">The scaling <see cref="Matrix2D"/> as an output parameter.</param>
    public static createScale(
      xScale: number,
      yScale: number,
      result: Matrix2D
    ) {
      result.M11 = xScale;
      result.M12 = 0;
      result.M21 = 0;
      result.M22 = yScale;
      result.M31 = 0;
      result.M32 = 0;
    }

    ///  <summary>
    ///  Creates a new translation <see cref="Matrix2D"/>.
    ///  </summary>
    ///  <param name="xPosition">X coordinate of translation.</param>
    ///  <param name="yPosition">Y coordinate of translation.</param>
    ///  <param name="result">The translation <see cref="Matrix2D"/> as an output parameter.</param>
    public static createTranslation(
      xPosition: number,
      yPosition: number,
      result: Matrix2D
    ) {
      result.M11 = 1;
      result.M12 = 0;
      result.M21 = 0;
      result.M22 = 1;
      result.M31 = xPosition;
      result.M32 = yPosition;
    }

    public determinant(): number {
      return this.M11 * this.M22 - this.M12 * this.M21;
    }

    public static invert(matrix: Matrix2D, result: Matrix2D) {
      const det = 1 / matrix.determinant();
      result.M11 = matrix.M22 * det;
      result.M12 = matrix.M12 * det * -1;
      result.M21 = matrix.M21 * det * -1;
      result.M22 = matrix.M11 * det;
      result.M31 = (matrix.M32 * matrix.M21 - matrix.M31 * matrix.M22) * det;
      result.M32 =
        (matrix.M32 * matrix.M11 - matrix.M31 * matrix.M12) * det * -1;
    }

    ///  <summary>
    ///  Divides the elements of a <see cref="Matrix2D"/> by the elements of another matrix.
    ///  </summary>
    ///  <param name="matrix1">Source <see cref="Matrix2D"/>.</param>
    ///  <param name="matrix2">Divisor <see cref="Matrix2D"/>.</param>
    ///  <param name="result">The result of dividing the matrix as an output parameter.</param>
    public static divide(
      matrix1: Matrix2D,
      matrix2: Matrix2D,
      result: Matrix2D
    ) {
      result.M11 = matrix1.M11 / matrix2.M11;
      result.M12 = matrix1.M12 / matrix2.M12;
      result.M21 = matrix1.M21 / matrix2.M21;
      result.M22 = matrix1.M22 / matrix2.M22;
      result.M31 = matrix1.M31 / matrix2.M31;
      result.M32 = matrix1.M32 / matrix2.M32;
    }

    ///  <summary>
    ///  Divides the elements of a <see cref="Matrix2D"/> by a scalar.
    ///  </summary>
    ///  <param name="matrix1">Source <see cref="Matrix2D"/>.</param>
    ///  <param name="divider">Divisor scalar.</param>
    ///  <param name="result">The result of dividing a matrix by a scalar as an output parameter.</param>
    public static divideByScalar(
      matrix1: Matrix2D,
      divider: number,
      result: Matrix2D
    ) {
      const num: number = 1 / divider;
      result.M11 = matrix1.M11 * num;
      result.M12 = matrix1.M12 * num;
      result.M21 = matrix1.M21 * num;
      result.M22 = matrix1.M22 * num;
      result.M31 = matrix1.M31 * num;
      result.M32 = matrix1.M32 * num;
    }

    ///  <summary>
    ///  Creates a new <see cref="Matrix2D"/> that
    ///  contains linear interpolation of the values in specified matrixes.
    ///  </summary>
    ///  <param name="matrix1">The first <see cref="Matrix2D"/>.</param>
    ///  <param name="matrix2">The second <see cref="Vector"/>.</param>
    ///  <param name="amount">Weighting value(between 0.0 and 1.0).</param>
    ///  <param name="result">The result of linear interpolation of
    ///  the specified matrixes as an output parameter.</param>
    public static lerp(
      matrix1: Matrix2D,
      matrix2: Matrix2D,
      amount: number,
      result: Matrix2D
    ) {
      result.M11 = matrix1.M11 + (matrix2.M11 - matrix1.M11) * amount;
      result.M12 = matrix1.M12 + (matrix2.M12 - matrix1.M12) * amount;
      result.M21 = matrix1.M21 + (matrix2.M21 - matrix1.M21) * amount;
      result.M22 = matrix1.M22 + (matrix2.M22 - matrix1.M22) * amount;
      result.M31 = matrix1.M31 + (matrix2.M31 - matrix1.M31) * amount;
      result.M32 = matrix1.M32 + (matrix2.M32 - matrix1.M32) * amount;
    }

    ///  <summary>
    ///  Creates a new <see cref="Matrix2D"/> that contains a multiplication of two matrix.
    ///  </summary>
    ///  <param name="matrix1">Source <see cref="Matrix2D"/>.</param>
    ///  <param name="matrix2">Source <see cref="Matrix2D"/>.</param>
    ///  <param name="result">Result of the matrix multiplication as an output parameter.</param>
    public static multiply(
      matrix1: Matrix2D,
      matrix2: Matrix2D,
      result: Matrix2D
    ) {
      const m11 = matrix1.M11 * matrix2.M11 + matrix1.M12 * matrix2.M21;
      const m12 = matrix1.M11 * matrix2.M12 + matrix1.M12 * matrix2.M22;
      const m21 = matrix1.M21 * matrix2.M11 + matrix1.M22 * matrix2.M21;
      const m22 = matrix1.M21 * matrix2.M12 + matrix1.M22 * matrix2.M22;
      const m31 =
        matrix1.M31 * matrix2.M11 + (matrix1.M32 * matrix2.M21 + matrix2.M31);
      const m32 =
        matrix1.M31 * matrix2.M12 + (matrix1.M32 * matrix2.M22 + matrix2.M32);
      result.M11 = m11;
      result.M12 = m12;
      result.M21 = m21;
      result.M22 = m22;
      result.M31 = m31;
      result.M32 = m32;
    }

    ///  <summary>
    ///  Creates a new <see cref="Matrix2D"/>
    ///  that contains a multiplication of <see cref="Matrix2D"/> and a scalar.
    ///  </summary>
    ///  <param name="matrix1">Source <see cref="Matrix2D"/>.</param>
    ///  <param name="scaleFactor">Scalar value.</param>
    ///  <param name="result">Result of the matrix multiplication with a scalar as an output parameter.</param>
    public static multiplyByScalar(
      matrix1: Matrix2D,
      scaleFactor: number,
      result: Matrix2D
    ) {
      result.M11 = matrix1.M11 * scaleFactor;
      result.M12 = matrix1.M12 * scaleFactor;
      result.M21 = matrix1.M21 * scaleFactor;
      result.M22 = matrix1.M22 * scaleFactor;
      result.M31 = matrix1.M31 * scaleFactor;
      result.M32 = matrix1.M32 * scaleFactor;
    }

    ///  <summary>
    ///  Compares whether two <see cref="Matrix2D"/> instances are equal without any tolerance.
    ///  </summary>
    ///  <param name="matrix1">Source <see cref="Matrix2D"/> on the left of the equal sign.</param>
    ///  <param name="matrix2">Source <see cref="Matrix2D"/> on the right of the equal sign.</param>
    ///  <returns><c>true</c> if the instances are equal; <c>false</c> otherwise.</returns>
    public static equals(matrix1: Matrix2D, matrix2: Matrix2D): boolean {
      return (
        matrix1.M11 === matrix2.M11 &&
        (matrix1.M12 === matrix2.M12 &&
          (matrix1.M21 === matrix2.M21 &&
            (matrix1.M22 === matrix2.M22 &&
              (matrix1.M31 === matrix2.M31 && matrix1.M32 === matrix2.M32))))
      );
    }

    ///  <summary>
    ///  Creates a new <see cref="Matrix2D"/> that contains subtraction of one matrix from another.
    ///  </summary>
    ///  <param name="matrix1">The first <see cref="Matrix2D"/>.</param>
    ///  <param name="matrix2">The second <see cref="Matrix2D"/>.</param>
    ///  <param name="result">The result of the matrix subtraction as an output parameter.</param>
    public static subtract(
      matrix1: Matrix2D,
      matrix2: Matrix2D,
      result: Matrix2D
    ) {
      result.M11 = matrix1.M11 - matrix2.M11;
      result.M12 = matrix1.M12 - matrix2.M12;
      result.M21 = matrix1.M21 - matrix2.M21;
      result.M22 = matrix1.M22 - matrix2.M22;
      result.M31 = matrix1.M31 - matrix2.M31;
      result.M32 = matrix1.M32 - matrix2.M32;
    }

    ///  <summary>
    ///  Swap the matrix rows and columns.
    ///  </summary>
    ///  <param name="matrix">The matrix for transposing operation.</param>
    ///  <param name="result">The new <see cref="Matrix2D"/>
    ///  which contains the transposing result as an output parameter.</param>
    public static transpose(matrix: Matrix2D, result: Matrix2D) {
      result.M11 = matrix.M11;
      result.M12 = matrix.M21;
      result.M21 = matrix.M12;
      result.M22 = matrix.M22;
      result.M31 = 0;
      result.M32 = 0;
    }

    public multiplyScale(x: number, y: number) {
      Matrix2D.createScale(x, y, Matrix2D._tmpMatrix);
      Matrix2D.multiply(this, Matrix2D._tmpMatrix, this);
    }

    public multiplyTranslation(x: number, y: number) {
      Matrix2D.createTranslation(x, y, Matrix2D._tmpMatrix);
      Matrix2D.multiply(this, Matrix2D._tmpMatrix, this);
    }

    public multiplyRotation(radians: number) {
      Matrix2D.createRotation(radians, Matrix2D._tmpMatrix);
      Matrix2D.multiply(this, Matrix2D._tmpMatrix, this);
    }

    public clone(): Matrix2D {
      return new Matrix2D().setValues(
        this.M11,
        this.M12,
        this.M21,
        this.M22,
        this.M31,
        this.M32
      );
    }

    public copyFrom(m: Matrix2D) {
      this.M11 = m.M11;
      this.M12 = m.M12;
      this.M21 = m.M21;
      this.M22 = m.M22;
      this.M31 = m.M31;
      this.M32 = m.M32;
    }

    private static _tmpMatrix: Matrix2D = new Matrix2D();
  }
}
