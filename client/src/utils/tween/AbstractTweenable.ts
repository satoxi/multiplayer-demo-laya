namespace Muse {
  /// <summary>
  /// AbstractTweenable serves as a base for any custom classes
  /// you might want to make that can be ticked. These differ from
  /// ITweens in that they dont implement the ITweenT interface.
  /// What does that mean? It just says that an AbstractTweenable
  /// is not just moving a value from start to finish.
  /// It can do anything at all that requires a tick each frame.
  ///
  /// The TweenChain is one example of AbstractTweenable for reference.
  /// </summary>
  export abstract class AbstractTweenable implements ITweenable {
    public abstract tick(deltaTime: number): boolean;

    public getContext(): object {
      return this._context;
    }

    public setContext(context: object): AbstractTweenable {
      this._context = context;
      return this;
    }

    public recycleSelf(): void {
      this._context = null;
    }

    public isRunning(): boolean {
      return this._isCurrentlyManagedByTweenManager && !this._isPaused;
    }

    public start(): void {
      // dont add ourself twice!
      if (this._isCurrentlyManagedByTweenManager) {
        this._isPaused = false;
        return;
      }

      TweenMgr.addTween(this);
      this._isCurrentlyManagedByTweenManager = true;
      this._isPaused = false;
    }

    public pause(): void {
      this._isPaused = true;
    }

    public resume(): void {
      this._isPaused = false;
    }

    public stop(bringToCompletion: boolean): void {
      TweenMgr.removeTween(this);
      this._isCurrentlyManagedByTweenManager = false;
      this._isPaused = true;
    }

    /// <summary>
    /// AbstractTweenable are often kept around after they complete.
    /// This flag lets them know internally if they are currently
    /// being tweened by TweenManager so that they can re-add themselves if necessary.
    /// </summary>
    protected _isCurrentlyManagedByTweenManager: boolean;
    protected _context: object;
    protected _isPaused: boolean;
  }
}
