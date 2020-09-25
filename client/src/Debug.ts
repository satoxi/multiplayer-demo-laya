enum DebugMode {
  none,
  warn,
  log,
}

class Debug {
  public static debugMode: DebugMode = DebugMode.none;

  public static warn(message: any, ...optionalParams: any[]) {
    if (this.debugMode >= DebugMode.warn) {
      console.warn(message, optionalParams);
    }
  }

  public static log(message: any, ...optionalParams: any[]) {
    if (this.debugMode >= DebugMode.log) {
      console.log(message, optionalParams);
    }
  }
}
