namespace Muse {
  export interface ITriggerListener {
    /// <summary>
    /// called when a collider intersects a trigger collider.
    /// This is called on the trigger collider and the collider that touched
    /// the trigger. Movement must be handled by the Mover/ProjectileMover
    ///  methods for this to function automatically.
    /// </summary>
    /// <param name="remote">Remote.</param>
    /// <param name="local">Local.</param>
    onTriggerEnter(other: Collider, local: Collider): void;

    /// <summary>
    /// called when another collider leaves a trigger collider.
    /// </summary>
    /// <param name="remote">Remote.</param>
    /// <param name="local">Local.</param>
    onTriggerExit(other: Collider, local: Collider): void;
  }
}
