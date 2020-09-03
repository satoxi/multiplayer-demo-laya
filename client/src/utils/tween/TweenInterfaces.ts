namespace Muse {
  export enum LoopType {
    None,
    RestartFromBeginning,
    PingPong,
  }

  export interface ITweenable {
    getContext(): object;
    setContext(context: object): void;

    /// <summary>
    /// called by TweenManager each frame like an internal Update
    /// </summary>
    tick(deltaTime: number): boolean;

    /// <summary>
    /// called by TweenManager when a tween is removed. Subclasses can optionally recycle themself. Subclasses
    /// should first check the _shouldRecycleTween bool in their implementation!
    /// </summary>
    recycleSelf(): void;

    /// <summary>
    /// checks to see if a tween is running
    /// </summary>
    /// <returns><c>true</c>, if running was ised, <c>false</c> otherwise.</returns>
    isRunning(): boolean;

    /// <summary>
    /// starts the tween
    /// </summary>
    start(): void;

    /// <summary>
    /// pauses the tween
    /// </summary>
    pause(): void;

    /// <summary>
    /// resumes the tween after a pause
    /// </summary>
    resume(): void;

    /// <summary>
    /// stops the tween optionally bringing it to completion
    /// </summary>
    /// <param name="bringToCompletion">If set to <c>true</c> bring to completion.</param>
    stop(bringToCompletion: boolean): void;
  }

  /// <summary>
  /// more specific tween playback controls here.
  /// </summary>
  export interface ITweenControl extends ITweenable {
    /// <summary>
    /// warps the tween to elapsedTime clamping it between 0 and duration. this will immediately update the tweened
    /// object whether it is paused, completed or running.
    /// </summary>
    /// <param name="elapsedTime">Elapsed time.</param>
    jumpToElapsedTime(elapsedTime: number): void;

    /// <summary>
    /// when called from StartCoroutine it will yield until the tween is complete
    /// </summary>
    /// <returns>The for completion.</returns>
    // IEnumerator waitForCompletion();

    /// <summary>
    /// gets the target of the tween or null for TweenTargets that arent necessarily all about a single object.
    /// its only real use is for TweenManager to find a list of tweens by target.
    /// </summary>
    /// <returns>The target object.</returns>
    getTargetObject(): object;
  }

  /// <summary>
  /// any object that wants to be tweened needs to implement this. TweenManager internally likes to make a simple object
  /// that implements this interface and stores a reference to the object being tweened. That makes for tiny, simple,
  /// lightweight implementations that can be handed off to any TweenT
  /// </summary>
  export interface ITweenTarget<T> {
    /// <summary>
    /// sets the final, tweened value on the object of your choosing.
    /// </summary>
    /// <param name="value">Value.</param>
    setTweenedValue(value: T): void;

    getTweenedValue(): T;

    /// <summary>
    /// gets the target of the tween or null for TweenTargets that arent necessarily all about a single object.
    /// its only real use is for TweenManager to find a list of tweens by target.
    /// </summary>
    /// <returns>The target object.</returns>
    getTargetObject(): object;

    recycleSelf(): void;
  }

  /// <summary>
  /// a series of strongly typed, chainable methods to setup various tween properties
  /// </summary>
  export interface ITween<T> extends ITweenControl {
    /// <summary>
    /// sets the ease type used for this tween
    /// </summary>
    /// <returns>The ease type.</returns>
    /// <param name="easeType">Ease type.</param>
    setEaseType(easeType: Laya.Ease): ITween<T>;

    /// <summary>
    /// sets the delay before starting the tween
    /// </summary>
    /// <returns>The delay.</returns>
    /// <param name="delay">Delay.</param>
    setDelay(delay: number): ITween<T>;

    /// <summary>
    /// sets the tween duration
    /// </summary>
    /// <returns>The duration.</returns>
    /// <param name="duration">Duration.</param>
    setDuration(duration: number): ITween<T>;

    /// <summary>
    /// sets the timeScale used for this tween.
    /// The timeScale will be multiplied with Time.deltaTime/Time.unscaledDeltaTime
    /// to get the actual delta time used for the tween.
    /// </summary>
    /// <returns>The time scale.</returns>
    /// <param name="timeScale">Time scale.</param>
    setTimeScale(timeScale: number): ITween<T>;

    /// <summary>
    /// sets the tween to use Time.unscaledDeltaTime instead of Time.deltaTime
    /// </summary>
    /// <returns>The is time scale independant.</returns>
    setIsTimeScaleIndependent(): ITween<T>;

    /// <summary>
    /// chainable. sets the action that should be called when the tween is complete.
    /// </summary>
    setCompletionHandler(completionHandler: Function): ITween<T>;

    /// <summary>
    /// chainable. sets the action that should be called when the tween is updated.
    /// </summary>
    setUpdateHandler(updateHandler: Function): ITween<T>;

    /// <summary>
    /// chainable. set the loop type for the tween. a single pingpong loop means going from start-finish-start.
    /// </summary>
    setLoops(
      loopType: LoopType,
      loops: number,
      delayBetweenLoops: number
    ): ITween<T>;

    /// <summary>
    /// chainable. sets the action that should be called when a loop is complete.
    /// A loop is either when the first part of
    /// a ping-pong animation completes or when starting over
    /// when using a restart-from-beginning loop type. Note that ping-pong
    /// loops (which are really two part tweens) will not
    /// fire the loop completion handler on the last iteration.
    /// The normal tween completion handler will fire though
    /// </summary>
    setLoopCompletionHandler(loopCompleteHandler: Function): ITween<T>;

    /// <summary>
    /// sets the start position for the tween
    /// </summary>
    /// <returns>The from.</returns>
    /// <param name="from">From.</param>
    setFrom(from: T): ITween<T>;

    /// <summary>
    /// prepares a tween for reuse by resetting its from/to values and duration
    /// </summary>
    /// <returns>The for reuse.</returns>
    /// <param name="from">From.</param>
    /// <param name="to">To.</param>
    /// <param name="duration">Duration.</param>
    prepareForReuse(from: T, to: T, duration: number): ITween<T>;

    /// <summary>
    /// if true (the default) the tween will be recycled after use.
    /// All Tween<T> subclasses have their own associated automatic
    /// caching if configured in the TweenManager class.
    /// </summary>
    /// <returns>The recycle tween.</returns>
    /// <param name="shouldRecycleTween">If set to <c>true</c> should recycle tween.</param>
    setRecycleTween(shouldRecycleTween: boolean): ITween<T>;

    /// <summary>
    /// helper that just sets the to value of the tween to be to + from making the tween relative
    /// to its current value.
    /// </summary>
    /// <returns>The is relative tween.</returns>
    setIsRelative(): ITween<T>;

    /// <summary>
    /// allows you to set any object reference retrievable via tween.context. This is handy for avoiding
    /// closure allocations for completion handler Actions.
    /// You can also search TweenManager for all tweens with a specific
    /// context.
    /// </summary>
    /// <returns>The context.</returns>
    /// <param name="context">Context.</param>
    setContext(context: object): ITween<T>;

    /// <summary>
    /// allows you to add a tween that will get run after this tween completes.
    /// Note that nextTween must be an ITweenable!
    /// Also note that all ITweenTs are ITweenable.
    /// </summary>
    /// <returns>The next tween.</returns>
    /// <param name="nextTween">Next tween.</param>
    setNextTween(nextTween: ITweenable): ITween<T>;
  }
}
