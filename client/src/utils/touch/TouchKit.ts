namespace Muse {
  export class TouchConfig {
    public static readonly inchesToCentimeters: number = 2.54;

    ///  <summary>
    ///  lets TouchKit know if it should scale all rects and distances
    ///   based on the designTimeResolution
    ///  </summary>
    public static autoScaleRectsAndDistances: boolean = false;
    public static maxTouchesToProcess: number = 2;

    //  16:9 is a decent starting point for aspect ratio
    ///  <summary>
    ///  all TKRect sizes should be based on this screen size.
    ///  They will be adjusted at runtime if autoUpdateRects is true
    ///  </summary>
    public static get designTimeResolution(): Vector {
      return this._designTimeResolution;
    }
    public static set designTimeResolution(value: Vector) {
      this._designTimeResolution = value;
      this.setupRuntimeScale();
    }

    ///  <summary>
    ///  used at runtime to scale any TKRects as they are made
    ///  for the current screen size
    ///  </summary>
    public static get runtimeScaleModifier(): Vector {
      return this._runtimeScaleModifier;
    }
    public static set runtimeScaleModifier(value: Vector) {
      this._runtimeScaleModifier = value;
    }

    ///  <summary>
    ///  used at runtime to modify distances
    ///  </summary>
    public static get runtimeDistanceModifier(): number {
      return this._runtimeDistanceModifier;
    }
    public static set runtimeDistanceModifier(value: number) {
      this._runtimeDistanceModifier = value;
    }

    public static get screenPixelsPerCm(): number {
      /*
      let fallbackDpi: number = 72;
      if (Laya.Browser.onAndroid) {
        fallbackDpi = 160;
      } else if (Laya.Browser.onWP) {
        //  Windows phone is harder to track down
        //  http://www.windowscentral.com/higher-resolution-support-windows-phone-7-dpi-262
        fallbackDpi = 92;
      } else if (Laya.Browser.onIOS) {
        fallbackDpi = 326;
      }
			return fallbackDpi / inchesToCentimeters;
      */
      return 1;
    }

    protected static setupRuntimeScale() {
      TouchConfig.runtimeScaleModifier = new Vector(
        Laya.stage.width / TouchConfig.designTimeResolution.x,
        Laya.stage.height / TouchConfig.designTimeResolution.y
      );
      TouchConfig.runtimeDistanceModifier =
        (TouchConfig.runtimeScaleModifier.x +
          TouchConfig.runtimeScaleModifier.y) /
        2;
      if (!TouchConfig.autoScaleRectsAndDistances) {
        TouchConfig.runtimeScaleModifier = Vector.one;
        TouchConfig.runtimeDistanceModifier = 1;
      }
    }

    private static _designTimeResolution: Vector = new Vector(320, 180);
    private static _runtimeScaleModifier: Vector = Vector.one;
    private static _runtimeDistanceModifier: number = 1;
  }

  export class TouchKit {
    public onInputStart: Observable = new Observable();
    public onInputEnd: Observable = new Observable();
    public onTouchesUpdate: Observable = new Observable();

    public get touches(): TKTouch[] {
      return this._liveTouches;
    }

    public constructor(target: Laya.Sprite) {
      this._target = target;
      this._validTouches = {};
      this._onSystemTouchStart = this.handleTouchStart.bind(this);
      this._onSystemTouchMove = this.handleTouchMove.bind(this);
      this._onSystemTouchCancel = this.handleTouchCancel.bind(this);
      this._onSystemTouchEnd = this.handleTouchEnd.bind(this);
    }

    public clear() {
      this._liveTouches = [];
      this._validTouches = {};
      this._gestureRecognizers.forEach(r => {
        r.reset();
      });
    }

    public addGestureRecognizer(recognizer: TKAbstractGestureRecognizer) {
      //  add, then sort so the higher zIndex items will be on top
      this._gestureRecognizers.push(recognizer);
      if (recognizer.zIndex > 0) {
        this._gestureRecognizers.sort((r1, r2) => r2.zIndex - r1.zIndex);
      }
    }

    public removeGestureRecognizer(recognizer: TKAbstractGestureRecognizer) {
      const index = this._gestureRecognizers.indexOf(recognizer);
      if (index === -1) {
        console.error(
          'Trying to remove gesture recognizer that has not been added: ' +
            recognizer
        );
        return;
      }

      recognizer.reset();
      this._gestureRecognizers.splice(index, 1);
    }

    public removeAllGestureRecognizers() {
      this._gestureRecognizers = [];
    }

    public enable() {
      if (this._target) {
        this._target.on(Laya.Event.MOUSE_DOWN, this, this.handler);
        this._target.on(Laya.Event.MOUSE_MOVE, this, this.handler);
        this._target.on(Laya.Event.MOUSE_UP, this, this.handler);
        this._target.on(Laya.Event.MOUSE_OUT, this, this.handler);
      } else {
        wx.onTouchStart(this._onSystemTouchStart);
        wx.onTouchMove(this._onSystemTouchMove);
        wx.onTouchCancel(this._onSystemTouchCancel);
        wx.onTouchEnd(this._onSystemTouchEnd);
      }
    }

    public disable() {
      if (this._target) {
        this._target.off(Laya.Event.MOUSE_DOWN, this, this.handler);
        this._target.off(Laya.Event.MOUSE_MOVE, this, this.handler);
        this._target.off(Laya.Event.MOUSE_UP, this, this.handler);
        this._target.off(Laya.Event.MOUSE_OUT, this, this.handler);
      } else {
        wx.offTouchStart(this._onSystemTouchStart);
        wx.offTouchMove(this._onSystemTouchMove);
        wx.offTouchCancel(this._onSystemTouchCancel);
        wx.offTouchEnd(this._onSystemTouchEnd);
      }
      this.clear();
    }

    private handler(ev: Laya.Event) {
      const phase = this.LayaTouchPhaseMap[ev.type];
      this.internalUpdateTouches(ev.nativeEvent.changedTouches, phase);
    }

    private handleTouchStart(ret) {
      this.internalUpdateTouches(ret.changedTouches, TouchPhase.Began);
    }
    private handleTouchMove(ret) {
      this.internalUpdateTouches(ret.changedTouches, TouchPhase.Moved);
    }
    private handleTouchCancel(ret) {
      this.internalUpdateTouches(ret.changedTouches, TouchPhase.Canceled);
    }
    private handleTouchEnd(ret) {
      this.internalUpdateTouches(ret.changedTouches, TouchPhase.Ended);
    }

    private internalUpdateTouches(changedTouches: any[], phase: TouchPhase) {
      const updatedTouches = [];
      this._liveTouches = [];

      // console.log(TouchPhase[phase], changedTouches);
      if (changedTouches) {
        for (let i = 0; i < changedTouches.length; i++) {
          changedTouches[i].phase = phase;
          changedTouches[i].id = changedTouches[i].identifier.toString();
        }
        switch (phase) {
          case TouchPhase.Began:
            for (let i = 0; i < changedTouches.length; i++) {
              if (
                Object.keys(this._validTouches).length >=
                TouchConfig.maxTouchesToProcess
              ) {
                // console.warn(`already have enough fingers, ignore others`);
                continue;
              }
              const touch = changedTouches[i];
              if (!this._validTouches.hasOwnProperty(touch.id)) {
                if (Object.keys(this._validTouches).length === 0) {
                  this.onInputStart.notify();
                }
                this._validTouches[touch.id] = Laya.Pool.getItemByClass(
                  'touch',
                  TKTouch
                );
                this._validTouches[touch.id].populateWithTouch(touch);
                updatedTouches.push(touch.id);
              }
            }
            break;
          case TouchPhase.Moved:
          case TouchPhase.Ended:
          case TouchPhase.Canceled:
            for (let i = 0; i < changedTouches.length; i++) {
              const touch = changedTouches[i];
              if (this._validTouches.hasOwnProperty(touch.id)) {
                this._validTouches[touch.id].populateWithTouch(touch);
                updatedTouches.push(touch.id);
              }
            }
            break;
        }

        const keys = Object.keys(this._validTouches);
        for (let i = 0; i < keys.length; i++) {
          const touch = this._validTouches[keys[i]];
          if (updatedTouches.indexOf(touch.id) === -1) {
            touch.phase = TouchPhase.Stationary;
          }
          // console.log('[' + TouchPhase[touch.phase] + ']' + touch.id);
          this._liveTouches.push(touch);
        }
      } else {
        console.warn('changed touches is null');
        const keys = Object.keys(this._validTouches);
        for (let i = 0; i < keys.length; i++) {
          const touch = this._validTouches[keys[i]];
          touch.phase = TouchPhase.Ended;
          this._liveTouches.push(touch);
        }
      }

      // pass on the touches to all the recognizers
      if (this._liveTouches.length > 0) {
        // this.outputTouches(this._liveTouches);
        for (let i = 0; i < this._gestureRecognizers.length; i++) {
          this._gestureRecognizers[i].recognizeTouches(this._liveTouches);
        }

        for (let i = 0; i < this._liveTouches.length; i++) {
          const touch = this._liveTouches[i];
          if (
            touch.phase === TouchPhase.Ended ||
            touch.phase === TouchPhase.Canceled
          ) {
            Laya.Pool.recover('touch', touch);
            delete this._validTouches[touch.id];
            if (Object.keys(this._validTouches).length === 0) {
              // console.log('input ends');
              this.onInputEnd.notify();
            }
          }
        }
      }
      this.onTouchesUpdate.notify(this._liveTouches);

      for (let i = this._liveTouches.length - 1; i >= 0; i--) {
        if (
          this._liveTouches[i].phase === TouchPhase.Canceled ||
          this._liveTouches[i].phase === TouchPhase.Ended
        ) {
          this._liveTouches.splice(i, 1);
        }
      }
    }

    public outputTouches(touches: TKTouch[]) {
      let str = `live touches(${touches.length})\n`;
      touches.forEach(touch => {
        str += touch.toString() + '\n';
      });
      console.log(str);
    }

    private _target: Laya.Sprite;
    private _onSystemTouchStart: Function;
    private _onSystemTouchMove: Function;
    private _onSystemTouchEnd: Function;
    private _onSystemTouchCancel: Function;

    private _validTouches: { [id: string]: TKTouch };
    private _liveTouches: TKTouch[] = [];
    private _gestureRecognizers: TKAbstractGestureRecognizer[] = [];

    private readonly LayaTouchPhaseMap = {
      mousedown: TouchPhase.Began,
      mousemove: TouchPhase.Moved,
      mouseup: TouchPhase.Ended,
      mouseout: TouchPhase.Canceled,
    };
  }
}
