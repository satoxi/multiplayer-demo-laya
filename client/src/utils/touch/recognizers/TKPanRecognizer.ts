namespace Muse {
  export class TKPanRecognizer extends TKAbstractGestureRecognizer {
    public onPanStart: Observable = new Observable();
    public onPan: Observable = new Observable();
    public onPanEnd: Observable = new Observable();

    public get deltaTranslation(): Vector {
      return this._deltaTranslation;
    }

    public get startPoint(): Vector {
      return this._startPoint;
    }

    public get endPoint(): Vector {
      return this._endPoint;
    }

    public constructor(minPanDistanceCm: number = 2) {
      super();
      this.alwaysSendTouchesMoved = true;
      this._minDistanceToPanCm = minPanDistanceCm;
      this._previousLocation = new Vector(0, 0);
      this._startPoint = new Vector(0, 0);
      this._endPoint = new Vector(0, 0);
    }

    protected fireRecognizedEvent() {
      this.onPan.notify(this);
    }

    protected touchesBegan(touches: TKTouch[]): boolean {
      //  extra touches abort gesture
      if (this._trackingTouches.length >= 1) {
        if (
          this.state === TKGestureRecognizerState.RecognizedAndStillRecognizing
        ) {
          this.onPanEnd.notify(this);
        }
        this.state = TKGestureRecognizerState.FailedOrEnded;
        return false;
      }

      this.tryStartPan(touches);

      return false;
    }

    protected touchesMoved(touches: TKTouch[]) {
      // do not engage with touch events
      // if the number of touches is outside our desired constraints
      if (this._trackingTouches.length === 1) {
        const currentLocation = this.touchLocation();
        this._deltaTranslation = currentLocation.sub(this._previousLocation);
        this._deltaTranslationCm =
          this._deltaTranslation.magnitude() / TouchConfig.screenPixelsPerCm;
        this._previousLocation = currentLocation;
        if (this.state === TKGestureRecognizerState.Began) {
          this._totalDeltaMovementInCm =
            this._totalDeltaMovementInCm + this._deltaTranslationCm;
          if (
            Math.abs(this._totalDeltaMovementInCm) >= this._minDistanceToPanCm
          ) {
            this.onPanStart.notify(this);
            this.state = TKGestureRecognizerState.RecognizedAndStillRecognizing;
          }
        } else {
          this.state = TKGestureRecognizerState.RecognizedAndStillRecognizing;
        }
      }
    }

    protected touchesEnded(touches: TKTouch[]) {
      this._endPoint = this.touchLocation();
      //  remove any completed touches
      for (let i = 0; i < touches.length; i++) {
        if (touches[i].phase === TouchPhase.Ended) {
          const index = this._trackingTouches.indexOf(touches[i]);
          if (index > -1) {
            this._trackingTouches.splice(index, 1);
          }
        }
      }

      //  if we still have a touch left continue. no touches means its time to reset
      if (this._trackingTouches.length === 1) {
        this.tryStartPan(touches);
      } else {
        //  if we had previously been recognizing fire our complete event
        if (
          this.state === TKGestureRecognizerState.RecognizedAndStillRecognizing
        ) {
          this.onPanEnd.notify(this);
          this.state = TKGestureRecognizerState.FailedOrEnded;
        } else {
          this.tryStartPan(touches);
        }
      }
    }

    public toString(): string {
      return `[${this.constructor.name}] state: ${this.state}, location: ${
        this.touchLocation
      }, deltaTranslation: ${this._deltaTranslation}`;
    }

    private tryStartPan(touches: TKTouch[]) {
      // add new or additional touches to gesture
      // (allows for two or more touches to be added or removed
      // without ending the pan gesture)
      if (
        this.state === TKGestureRecognizerState.Possible ||
        ((this.state === TKGestureRecognizerState.Began ||
          this.state ===
            TKGestureRecognizerState.RecognizedAndStillRecognizing) &&
          this._trackingTouches.length === 0)
      ) {
        for (let i = 0; i < touches.length; i++) {
          //  only add touches in the Began phase
          if (
            touches[i].phase === TouchPhase.Began ||
            touches[i].phase === TouchPhase.Stationary ||
            touches[i].phase === TouchPhase.Moved
          ) {
            this._trackingTouches.push(touches[i]);
            this._startPoint = touches[i].position;
            break;
          }
        }

        //  end for
        if (this._trackingTouches.length === 1) {
          this._previousLocation = this.touchLocation();
          if (
            this.state !==
            TKGestureRecognizerState.RecognizedAndStillRecognizing
          ) {
            this._totalDeltaMovementInCm = 0;
            this.state = TKGestureRecognizerState.Began;
          }
        }
      }
    }

    private _deltaTranslation: Vector;
    private _deltaTranslationCm: number;
    private _totalDeltaMovementInCm: number = 0;
    private _previousLocation: Vector;
    private _minDistanceToPanCm: number;
    private _startPoint: Vector;
    private _endPoint: Vector;
  }
}
