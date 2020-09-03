// tslint:disable-next-line:class-name
declare class conch {
  public static config: config;
}

declare class config {
  getOS(): string;
  getDeviceInfo();
}
