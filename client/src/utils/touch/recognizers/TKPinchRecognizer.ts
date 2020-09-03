namespace Muse {
  export class TKPinchRecognizer extends TKAbstractGestureRecognizer {
    public onPinchStart: Observable = new Observable();
    public onPinch: Observable = new Observable();
    public onPinchEnd: Observable = new Observable();

    ///  <summary>
    ///  the minimum amount of distance the two fingers must move apart
    ///  before the gesture is recognized
    ///  </summary>
    public minimumScaleDistanceToRecognize: number = 0;

    ///  <summary>
    ///  calculated, read-only property.
    ///  Represents the scale accumulated since the gesture was initially recognized
    ///  </summary>
    ///  <value>The accumulated scale.</value>
    public get scale(): number {
      return this._scale;
    }

    public get deltaScale(): number {
      return this._deltaScale;
    }

    public get center(): Vector {
      return this._center;
    }

    private distanceBetweenTrackedTouches(): number {
      //  prevent NaN when the distance between the touches is zero --
      /// only happens in editor
      const distance = Vector.distance(
        this._trackingTouches[0].position,
        this._trackingTouches[1].position
      );
      return Math.max(0.0001, distance) / TouchConfig.screenPixelsPerCm;
    }

    protected fireRecognizedEvent() {
      this.onPinch.notify(this);
    }

    protected touchesBegan(touches: TKTouch[]): boolean {
      if (this.state === TKGestureRecognizerState.Possible) {
        //  we need to have two touches to work with
        //  so we dont set this.state to Begin until then
        //  latch the touches
        for (let i = 0; i < touches.length; i++) {
          //  only add touches in the Began phase
          if (touches[i].phase === TouchPhase.Began) {
            this._trackingTouches.push(touches[i]);
            if (this._trackingTouches.length === 2) {
              break;
            }
          }
        }

        //  end for
        if (this._trackingTouches.length === 2) {
          // gesture cannot be recognized until the two touches
          // exceed the minimum scale threshold
          this._firstDistance = this.distanceBetweenTrackedTouches();
        }
      }

      return false;
    }

    protected touchesMoved(touches: TKTouch[]) {
      // if the two fingers move far apart to exceed the minimum threshold,
      // begin officially recognizing the gesture
      if (this._trackingTouches.length === 2) {
        if (this.state === TKGestureRecognizerState.Possible) {
          if (
            Math.abs(
              this.distanceBetweenTrackedTouches() - this._firstDistance
            ) >= this.minimumScaleDistanceToRecognize
          ) {
            this._deltaScale = 0;
            this._scale = 1;
            this._intialDistance = this.distanceBetweenTrackedTouches();
            this._previousDistance = this._intialDistance;
            this.updateCenter(this._trackingTouches);
            this.state = TKGestureRecognizerState.Began;
            this.onPinchStart.notify(this);
          }
        } else if (
          this.state ===
            TKGestureRecognizerState.RecognizedAndStillRecognizing ||
          this.state === TKGestureRecognizerState.Began
        ) {
          const currentDistance = this.distanceBetweenTrackedTouches();
          this._deltaScale =
            (currentDistance - this._previousDistance) / this._intialDistance;
          this._scale = currentDistance / this._intialDistance;
          this._previousDistance = currentDistance;
          this.updateCenter(this._trackingTouches);
          this.state = TKGestureRecognizerState.RecognizedAndStillRecognizing;
        }
      }
    }

    protected touchesEnded(touches: TKTouch[]) {
      //  remove any completed touches
      for (let i = 0; i < touches.length; i++) {
        if (touches[i].phase === TouchPhase.Ended) {
          const index = this._trackingTouches.indexOf(touches[i]);
          if (index > -1) {
            this._trackingTouches.splice(index, 1);
          }
        }
      }

      //  if we had previously been recognizing fire our complete event
      if (
        this.state === TKGestureRecognizerState.Began ||
        this.state === TKGestureRecognizerState.RecognizedAndStillRecognizing
      ) {
        this.onPinchEnd.notify(this);
      }

      // if we still have a touch left continue to wait for another.
      // no touches means its time to reset
      if (this._trackingTouches.length === 1) {
        this.state = TKGestureRecognizerState.Possible;
        this._deltaScale = 0;
        //  I don't know why this would be 1 instead of 0
      } else {
        this.state = TKGestureRecognizerState.FailedOrEnded;
      }
    }

    public toString(): string {
      return `[${this.constructor.name}] state: ${this.state}, deltaScale: ${
        this._deltaScale
      }`;
    }

    public updateCenter(touches: TKTouch[]) {
      this._center = this.touchLocation();
    }

    private _center: Vector = new Vector(0, 0);
    private _deltaScale: number = 0;
    private _scale: number = 0;
    private _intialDistance: number = 0;
    // represents the distance between two fingers
    // when gesture was first officially recognized
    private _firstDistance: number = 0;
    // first ever distance when two fingers
    // hit the screen (not yet recognized)
    private _previousDistance: number = 0;
  }
}
