namespace Muse {
  export enum TKSwipeDirection {
    Left = 1 << 0,
    Right = 1 << 1,
    Up = 1 << 2,
    Down = 1 << 3,

    Horizontal = Left | Right,
    Vertical = Up | Down,
    All = Horizontal | Vertical,
  }

  export class TKSwipeRecognizer extends TKAbstractGestureRecognizer {
    ///  <summary>
    ///  The event that fires when a swipe is recognized.
    ///  </summary>
    public onSwipe: ObservableT<TKSwipeRecognizer> = new ObservableT();

    ///  <summary>
    ///  The maximum amount of time for the motion to be considered a swipe.
    ///  Setting to 0f will disable the time restriction completely.
    ///  </summary>
    public timeToSwipe: number = 500;

    ///  <summary>
    ///  The velocity of the swipe, in centimeters based on the screen resolution
    ///  and pixel density, if available.
    ///  </summary>
    public get swipeVelocity(): number {
      return this._swipeVelocity;
    }

    ///  <summary>
    ///  The direction that the swipe was made in. Possibilities include the four
    ///  cardinal directions and the four diagonal directions.
    ///  </summary>
    public get completedSwipeDirection(): TKSwipeDirection {
      return this._completedSwipeDirection;
    }

    ///  <summary>
    ///  The minimum number of simultaneous touches (fingers) on the screen to trigger
    ///  this swipe recognizer. Default is 1.
    ///  </summary>
    public minimumNumberOfTouches: number = 1;

    ///  <summary>
    ///  The maximum number of simultaneous touches (fingers) on the screen to trigger
    ///  this swipe recognizer. Default is 2.
    ///  </summary>
    public maximumNumberOfTouches: number = 2;

    ///  <summary>
    ///  If true, will trigger on the frame that the criteria for a swipe are first met.
    ///  If false, will only trigger on completion of the motion, when the touch is lifted.
    ///  </summary>
    public triggerWhenCriteriaMet: boolean = true;

    ///  <summary>
    ///  The first touch point in the gesture.
    ///  </summary>
    public get startPoint(): Vector {
      return this._points.length > 0 ? this._points[0] : Vector.zero;
    }

    ///  <summary>
    ///  The last touch point in the gesture.
    ///  </summary>
    public get endPoint(): Vector {
      return this._points.length > 0
        ? this._points[this._points.length - 1]
        : Vector.zero;
    }

    public constructor(
      minimumDistanceCm: number = 10,
      maximumDistanceCm: number = 200
    ) {
      super();
      this._minimumDistance = minimumDistanceCm;
      this._maximumDistance = maximumDistanceCm;
    }

    private checkForSwipeCompletion(touch: TKTouch): boolean {
      //  if we have a time stipulation and we exceeded it stop listening for swipes, fail
      if (
        this.timeToSwipe > 0 &&
        Laya.timer.currTimer - this._startTime > this.timeToSwipe
      ) {
        return false;
      }

      //  if we don't have at least two points to test yet, then fail
      if (this._points.length < 2) {
        return false;
      }

      //  the ideal distance in pixels from the start to the finish
      const idealDistance: number = Vector.distance(
        this.startPoint,
        this.endPoint
      );
      //  the ideal distance in centimeters, based on the screen pixel density
      const idealDistanceCM: number =
        idealDistance / TouchConfig.screenPixelsPerCm;
      //  if the distance moved in cm was less than the minimum,
      if (
        idealDistanceCM < this._minimumDistance ||
        idealDistanceCM > this._maximumDistance
      ) {
        return false;
      }

      //  add up distances between all points sampled during the gesture to
      //  get the real distance
      let realDistance: number = 0;
      for (let i: number = 1; i < this._points.length; i++) {
        realDistance =
          realDistance + Vector.distance(this._points[i], this._points[i - 1]);
      }

      //  if the real distance is 10% greater than the ideal distance, then fail
      //  this weeds out really irregular "lines" and
      //  curves from being considered swipes
      if (realDistance > idealDistance * 1.1) {
        return false;
      }

      //  the speed in cm/s of the swipe
      this._swipeVelocity =
        idealDistanceCM / (Laya.timer.currTimer - this._startTime);
      //  turn the slope of the ideal swipe line into an angle in degrees
      const v2: Vector = this.endPoint.sub(this.startPoint).normalize();
      let swipeAngle: number = Math.atan2(v2.y, v2.x) * MathUtils.rad2Deg;
      if (swipeAngle < 0) {
        swipeAngle = 360 + swipeAngle;
      }

      swipeAngle = 360 - swipeAngle;
      //  depending on the angle of the line, give a logical swipe direction
      if (swipeAngle >= 225 && swipeAngle <= 315) {
        this._completedSwipeDirection = TKSwipeDirection.Down;
      } else if (swipeAngle >= 135 && swipeAngle <= 225) {
        this._completedSwipeDirection = TKSwipeDirection.Left;
      } else if (swipeAngle >= 45 && swipeAngle <= 135) {
        this._completedSwipeDirection = TKSwipeDirection.Up;
      } else {
        this._completedSwipeDirection = TKSwipeDirection.Right;
      }

      return true;
    }

    protected fireRecognizedEvent() {
      this.onSwipe.notify(this);
    }

    protected touchesBegan(touches: TKTouch[]): boolean {
      if (this.state === TKGestureRecognizerState.Possible) {
        //  add any touches on screen
        for (let i: number = 0; i < touches.length; i++) {
          this._trackingTouches.push(touches[i]);
        }

        //  if the number of touches is within our constraints, begin tracking
        if (
          this._trackingTouches.length >= this.minimumNumberOfTouches &&
          this._trackingTouches.length <= this.maximumNumberOfTouches
        ) {
          //  reset everything
          this._points = [];
          this._points.push(touches[0].position.clone());
          this._startTime = Laya.timer.currTimer;
          this.state = TKGestureRecognizerState.Began;
        }
      }

      return false;
    }

    protected touchesMoved(touches: TKTouch[]) {
      //  only bother doing anything if we haven't recognized or failed yet
      if (this.state === TKGestureRecognizerState.Began) {
        this._points.push(touches[0].position.clone());
        //  if we're triggering when the criteria is met, then check for completion every frame
        if (
          this.triggerWhenCriteriaMet &&
          this.checkForSwipeCompletion(touches[0])
        ) {
          this.state = TKGestureRecognizerState.Recognized;
        }
      }
    }

    protected touchesEnded(touches: TKTouch[]) {
      //  if we haven't recognized or failed yet
      if (this.state === TKGestureRecognizerState.Began) {
        this._points.push(touches[0].position.clone());
        //  last frame, one last check- recognized or fail
        this.state = this.checkForSwipeCompletion(touches[0])
          ? TKGestureRecognizerState.Recognized
          : TKGestureRecognizerState.FailedOrEnded;
      }
    }

    public toString(): string {
      return `${super.toString()},
        swipe direction: ${this.completedSwipeDirection},
        swipe velocity: ${this.swipeVelocity},
        start point: ${this.startPoint},
        end point: ${this.endPoint}`;
    }

    private _swipeVelocity: number;
    private _completedSwipeDirection: TKSwipeDirection;

    ///  <summary>
    ///  The minimum distance in centimeters that the gesture has to make to be considered
    ///  a proper swipe, based on resolution and pixel density. Default is 2cm.
    ///  </summary>
    private _minimumDistance: number = 2;

    ///  <summary>
    ///  The maximum distance in centimeters that the gesture has to make to be considered
    ///  a proper swipe.
    ///  </summary>
    private _maximumDistance: number = 10;

    ///  <summary>
    ///  The individual points that make up the gesture, recorded every frame from when a
    ///  finger is first pressed to the screen until it's lifted. Only tracks the first touch
    ///  on the screen, in the case of multiple touches.
    ///  </summary>
    private _points: Vector[] = [];

    ///  <summary>
    ///  The time that the gesture started. Is used to determine if the time limit has been
    ///  passed, and whether to ignore further checks.
    ///  </summary>
    private _startTime: number;
  }
}
