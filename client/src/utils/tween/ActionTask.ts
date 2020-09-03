/// <reference path='./AbstractTweenable.ts' />

namespace Muse {
  ///  <summary>
  ///  ActionTasks let you pass in an Action that will be called at different intervals
  ///  depending on how you set it up.
  ///  Note that all ActionTask static constructor methods will automatically
  ///  cache the ActionTasks for easy reuse.
  ///  Also note that the real trick to this class is to pass
  ///  in a context object that you use in the Action when it is called.
  ///  That is how you avoid allocations when using anonymous Actions.
  ///
  ///  All of the ITweenable methods apply here so you can pause/resume/stop the ActionTask at any time.
  ///  </summary>
  export class ActionTask extends AbstractTweenable {
    ///  <summary>
    ///  provides the elapsed time not included the initial delay that this task has been running
    ///  </summary>
    ///  <value>The elapsed time.</value>
    public get elapsedTime(): number {
      return this._unfilteredElapsedTime;
    }

    public static readonly id: string = 'ActionTask';

    public static create(context: object, action: Function): ActionTask {
      const task = Laya.Pool.getItemByClass(
        ActionTask.id,
        ActionTask
      ) as ActionTask;
      task.resetData();
      return task.setContext(context).setAction(action);
    }

    public constructor() {
      super();
      this.resetData();
    }

    ///  <summary>
    ///  calls the Action every repeatsDelay seconds. The ActionTask is automatically started for you.
    ///  </summary>
    ///  <param name="initialDelay">Initial delay.</param>
    ///  <param name="repeatDelay">Repeat delay.</param>
    ///  <param name="context">Context.</param>
    ///  <param name="action">Action.</param>
    public static every(
      context: object,
      action: Function,
      repeatDelay: number,
      initialDelay: number = 0
    ): ActionTask {
      const task = ActionTask.create(context, action)
        .setRepeats(repeatDelay)
        .setDelay(initialDelay);
      task.start();
      return task;
    }

    ///  <summary>
    ///  calls the action after an initial delay. The ActionTask is automatically started for you.
    ///  </summary>
    ///  <param name="initialDelay">Initial delay.</param>
    ///  <param name="context">Context.</param>
    ///  <param name="action">Action.</param>
    public static afterDelay(
      context: object,
      action: Function,
      initialDelay: number
    ): ActionTask {
      initialDelay = Math.max(1, initialDelay);
      const task = ActionTask.create(context, action).setDelay(initialDelay);
      task.start();
      return task;
    }

    public tick(deltaTime: number): boolean {
      //  if we have a waitForTask we dont do anything until it completes
      if (this._waitForTask) {
        if (this._waitForTask.isRunning()) {
          return false;
        }

        this._waitForTask = null;
      }

      if (this._isPaused) {
        return false;
      }

      //  handle our initial delay first
      if (this._initialDelay > 0) {
        this._initialDelay = this._initialDelay - deltaTime;
        //  catch the overflow if we have any.
        // if we end up less than 0 while decrementing our initial delay we make that our elapsedTime
        //  so that the Action gets called and so that we keep time accurately.
        if (this._initialDelay <= 0) {
          this._elapsedTime = this._initialDelay * -1;
          this.execAction();
          //  if we repeat continue on. if not, then we end things here
          if (this._repeats) {
            return false;
          } else {
            //  all done. run the continueWith if we have one
            if (this._continueWithTask) {
              this._continueWithTask.start();
            }

            //  if stop was called on this ActionTask we need to be careful
            //  that we don't return true which will tell ZestKit
            //  to remove the task while it is iterating it's list of tweens causing bad things to happen.
            if (this._isCurrentlyManagedByTweenManager) {
              this._isCurrentlyManagedByTweenManager = false;
              return true;
            } else {
              return false;
            }
          }
        } else {
          return false;
        }
      }

      this._unfilteredElapsedTime = this._unfilteredElapsedTime + deltaTime;
      this._elapsedTime = this._elapsedTime + deltaTime;

      //  done with initial delay. now we either tick the Action every frame
      /// or use the repeatDelay to delay calls to the Action
      if (this._repeatDelay > 0) {
        if (this._elapsedTime >= this._repeatDelay) {
          this._elapsedTime = this._elapsedTime - this._repeatDelay;

          this.execAction();
        }
      } else {
        this.execAction();
      }

      return false;
    }

    ///  <summary>
    ///  stops the task optionally running the continueWith task if it is present
    ///  </summary>
    ///  <param name="runContinueWithTaskIfPresent">If set to <c>true</c> run continue with task if present.</param>
    public stop(
      runContinueWithTaskIfPresent: boolean = true,
      bringToCompletionImmediately: boolean = false
    ) {
      if (runContinueWithTaskIfPresent && this._continueWithTask) {
        this._continueWithTask.start();
      }

      //  call base AFTER we do our thing since it will recycle us
      super.stop(bringToCompletionImmediately);
    }

    public recycleSelf() {
      this.resetData();
      Laya.Pool.recover(ActionTask.id, this);
    }

    public setAction(action: Function): ActionTask {
      this._action = action;
      return this;
    }

    ///  <summary>
    ///  Sets the delay before the Action is called
    ///  </summary>
    ///  <returns>The delay.</returns>
    ///  <param name="delay">Delay.</param>
    public setDelay(delay: number): ActionTask {
      this._initialDelay = delay;
      return this;
    }

    ///  <summary>
    ///  tells this action to repeat. It will repeat every frame unless a repeatDelay is provided
    ///  </summary>
    ///  <returns>The repeats.</returns>
    ///  <param name="repeatDelay">Repeat delay.</param>
    public setRepeats(repeatDelay: number = 0): ActionTask {
      this._repeats = true;
      this._repeatDelay = repeatDelay;
      return this;
    }

    ///  <summary>
    ///  allows you to set any object reference retrievable via tween.context. This is handy for avoiding
    ///  closure allocations for completion handler Actions. You can also search ZestKit for all tweens with a specific
    ///  context.
    ///  </summary>
    ///  <returns>The context.</returns>
    ///  <param name="context">Context.</param>
    public setContext(context: Object): ActionTask {
      this._context = context;
      return this;
    }

    public continueWith(actionTask: ActionTask): ActionTask {
      if (actionTask.isRunning()) {
        console.error(
          'Attempted to continueWith an ActionTask that is already running. ' +
            'You can only continueWith tasks that have not started yet'
        );
      } else {
        this._continueWithTask = actionTask;
      }

      return this;
    }

    ///  <summary>
    ///  the current task will halt execution until the ActionTask passed into waitFor completes.
    ///  Note that it must be an already running task!
    ///  </summary>
    ///  <returns>The for.</returns>
    ///  <param name="actionTask">Action task.</param>
    public waitFor(actionTask: ActionTask): ActionTask {
      if (!actionTask.isRunning()) {
        console.error(
          'Attempted to waitFor an ActionTask that is not running. ' +
            'You can only waitFor tasks that are already running.'
        );
      } else {
        this._waitForTask = actionTask;
      }

      return this;
    }

    private execAction() {
      if (this._action) {
        if (this._context) {
          this._action.call(this._context);
        } else {
          this._action();
        }
      }
    }

    private resetData() {
      this._repeatDelay = 0;
      this._initialDelay = 0;
      this._elapsedTime = 0;
      this._unfilteredElapsedTime = 0;
      this._repeats = false;
      this._isCurrentlyManagedByTweenManager = false;
      this._isPaused = false;
      this._context = null;
      this._action = null;
      this._waitForTask = null;
      this._continueWithTask = null;
    }

    private _action: Function;
    private _unfilteredElapsedTime: number;
    private _elapsedTime: number;
    private _initialDelay: number = 0;
    private _repeatDelay: number = 0;
    private _repeats: boolean = false;
    private _continueWithTask: ActionTask;
    private _waitForTask: ActionTask;
  }
}
