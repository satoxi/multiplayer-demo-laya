namespace Muse {
  /// <summary>
  /// utility class to assist with dealing with bitmasks.
  /// All methods except isFlagSet expect the flag parameter to be a non-shifted flag.
  /// This lets you use plain old ints (0, 1, 2, 3, etc) to set/unset your flags.
  /// </summary>
  export class Flags {
    /// <summary>
    /// checks to see if the bit flag is set in the int. This check expects flag to be shifted already!
    /// </summary>
    /// <returns><c>true</c>, if flag set was ised, <c>false</c> otherwise.</returns>
    /// <param name="self">Self.</param>
    /// <param name="flag">Flag.</param>
    public static isFlagSet(self: number, flag: number): boolean {
      return (self & flag) !== 0;
    }

    /// <summary>
    /// checks to see if the bit flag is set in the int
    /// </summary>
    /// <returns><c>true</c>, if flag set was ised, <c>false</c> otherwise.</returns>
    /// <param name="self">Self.</param>
    /// <param name="flag">Flag.</param>
    public static isUnshiftedFlagSet(self: number, flag: number): boolean {
      flag = 1 << flag;
      return (self & flag) !== 0;
    }

    /// <summary>
    /// sets the flag bit of the int removing any already set flags
    /// </summary>
    /// <param name="self">Self.</param>
    /// <param name="flag">Flag.</param>
    public static setFlagExclusive(self: number, flag: number) {
      self = 1 << flag;
    }

    /// <summary>
    /// sets the flag bit of the int
    /// </summary>
    /// <param name="self">Self.</param>
    /// <param name="flag">Flag.</param>
    public static setFlag(self: number, flag: number) {
      self = self | (1 << flag);
    }

    /// <summary>
    /// unsets the flag bit of the int
    /// </summary>
    /// <param name="self">Self.</param>
    /// <param name="flag">Flag.</param>
    public static unsetFlag(self: number, flag: number) {
      flag = 1 << flag;
      self = self & ~flag;
    }

    /// <summary>
    /// inverts the set bits of the int
    /// </summary>
    /// <param name="self">Self.</param>
    public static invertFlags(self: number) {
      self = ~self;
    }

    /// <summary>
    /// prints the binary representation of the int. Handy for debugging int flag overlaps visually.
    /// </summary>
    /// <returns>The string representation.</returns>
    /// <param name="self">Self.</param>
    /// <param name="leftPadWidth">Left pad width.</param>
    public static binaryStringRepresentation(
      self: number,
      leftPadWidth: number = 10
    ): string {
      let str = self.toString(2);
      while (str.length < (leftPadWidth || 2)) {
        str = '0' + str;
      }
      return str;
    }
  }
}
