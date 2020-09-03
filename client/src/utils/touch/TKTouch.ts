namespace Muse {
  /// <summary>
  ///   <para>Describes phase of a finger touch.</para>
  /// </summary>
  export enum TouchPhase {
    /// <summary>
    ///   <para>A finger touched the screen.</para>
    /// </summary>
    Began,
    /// <summary>
    ///   <para>A finger moved on the screen.</para>
    /// </summary>
    Moved,
    /// <summary>
    ///   <para>A finger is touching the screen but hasn't moved.</para>
    /// </summary>
    Stationary,
    /// <summary>
    ///   <para>A finger was lifted from the screen. This is the final phase of a touch.</para>
    /// </summary>
    Ended,
    /// <summary>
    ///   <para>The system cancelled tracking for the touch.</para>
    /// </summary>
    Canceled,
  }

  export class TKTouch {
    public id: string;
    public position: Vector;
    public startPosition: Vector;
    public phase: TouchPhase = TouchPhase.Ended;

    public constructor() {
      this.position = new Vector(0, 0);
      this.startPosition = new Vector(0, 0);
    }

    public populateWithTouch(touch: any): TKTouch {
      this.id = touch.id;
      const stagePos = this.canvasPosToLaya(touch.clientX, touch.clientY);
      this.position.x = stagePos.x;
      this.position.y = stagePos.y;
      if (touch.phase === TouchPhase.Began) {
        this.startPosition.setTo(this.position.x, this.position.y);
      }

      //  canceled and ended are the same to us
      this.phase =
        touch.phase === TouchPhase.Canceled ? TouchPhase.Ended : touch.phase;
      return this;
    }

    public toString(): string {
      return `[TKTouch] fingerId: ${this.id}, phase: ${
        TouchPhase[this.phase]
      }, position: ${this.position}`;
    }

    private canvasPosToLaya(x: number, y: number): { x: number; y: number } {
      const width = window.innerWidth > 0 ? window.innerWidth : screen.width;
      const height =
        window.innerHeight > 0 ? window.innerHeight : screen.height;
      return {
        x: (x / width) * Laya.stage.width,
        y: (y / height) * Laya.stage.height,
      };
    }
  }
}
