enum Target {
  clientLocal,
  server,
  clientNetwork,
}

class Demo {
  public gravity: number = 400;
  public horizontalSpeed: number = 150;
  public jumpSpeed: number = 300;
  public tickRate: number = 60;
  public enableLocalPrediction: boolean = true;
  public enableServerReconciliation: boolean = true;
  public enableNetworkInterpolation: boolean = false;
  public latencyMilliseconds: number = 100;
  public interpolationDelayTime: number = 100;
  public maxExtrapolationTime: number = 500;
  public tolerantDistance: number = 5;

  public get frameTime(): number {
    return (1 / this.tickRate) * 1000;
  }

  public call(target: Target, methodName: string, value?: any) {
    if (this.latencyMilliseconds > 0) {
      Muse.ActionTask.afterDelay(
        this,
        () => {
          this.sendMessageToTarget(target, methodName, value);
        },
        this.latencyMilliseconds
      );
    } else {
      this.sendMessageToTarget(target, methodName, value);
    }
  }

  public start() {
    Muse.timer.add(this, this.update);
    Muse.timer.addFixedUpdate(this, this.fixedUpdate);
  }

  constructor() {
    this._clientLocal = new ClientLocal();
    this._server = new Server();
    this._clientNetwork = new ClientNetwork();
  }

  private sendMessageToTarget(target: Target, methodName: string, value: any) {
    switch (target) {
      case Target.clientLocal:
        if (this._clientLocal) {
          if (methodName === 'syncSnapshot') {
            this._clientLocal.syncSnapshot(value);
          }
        }
        break;
      case Target.server:
        if (this._server) {
          if (methodName === 'syncInput') {
            this._server.syncInput(value);
          } else if (methodName === 'jump') {
            this._server.jump();
          }
        }
        break;
      case Target.clientNetwork:
        if (this._clientNetwork) {
          if (methodName === 'syncSnapshot') {
            this._clientNetwork.syncSnapShot(value);
          }
        }
        break;
    }
  }

  private update() {
    if (this.enableServerReconciliation) {
      this.enableLocalPrediction = true;
    }

    if (Laya.KeyBoardManager.hasKeyDown(Laya.Keyboard.LEFT)) {
    } else {
    }
  }

  private fixedUpdate() {
    if (this._clientLocal) {
      this._clientLocal.fixedUpdate();
    }
    if (this._server) {
      this._server.fixedUpdate();
    }
    if (this._clientNetwork) {
      this._clientNetwork.fixedUpdate();
    }
  }

  private _clientLocal: ClientLocal;
  private _server: Server;
  private _clientNetwork: ClientNetwork;

  public static get instance(): Demo {
    if (!Demo._instance) {
      Demo._instance = new Demo();
    }
    return Demo._instance;
  }
  private static _instance: Demo;
}
