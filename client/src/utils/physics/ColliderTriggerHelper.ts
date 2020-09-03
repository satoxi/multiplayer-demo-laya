namespace Muse {
  class Pair<T> {
    public first: T;
    public second: T;

    public constructor(first: T, second: T) {
      this.first = first;
      this.second = second;
    }

    public clear(): void {
      this.first = this.second = null;
    }

    public equals(other: Pair<T>): boolean {
      // these two ways should be functionaly equivalent
      return this.first === other.first && this.second === other.second;
    }
  }

  class PairSet<T> {
    public get all(): Array<Pair<T>> {
      return this._all;
    }

    public has(pair: Pair<T>) {
      const index = this._all.findIndex(p => p.equals(pair));
      return index > -1;
    }

    public add(pair: Pair<T>) {
      if (!this.has(pair)) {
        this._all.push(pair);
      }
    }

    public remove(pair: Pair<T>) {
      const index = this._all.findIndex(p => p.equals(pair));
      if (index > -1) {
        const temp = this._all[index];
        this._all[index] = this._all[this._all.length - 1];
        this._all[this._all.length - 1] = temp;
        this._all = this._all.slice(0, this._all.length - 1);
      }
    }

    public clear() {
      this._all = [];
    }

    public union(other: PairSet<T>) {
      const otherAll = other.all;
      for (const elem of otherAll) {
        this.add(elem);
      }
    }

    public except(other: PairSet<T>) {
      const otherAll = other.all;
      for (const elem of otherAll) {
        this.remove(elem);
      }
    }

    private _all: Array<Pair<T>> = new Array<Pair<T>>();
  }

  ///  <summary>
  ///  helper class used by the Movers to manage trigger colliders interactions and calling ITriggerListeners.
  ///  </summary>
  export class ColliderTriggerHelper {
    ///  <summary>
    ///  update should be called AFTER Entity is moved.
    ///  It will take care of any ITriggerListeners that the Collider overlaps.
    ///  </summary>
    public update(colliders: Collider[]) {
      const lateColliders = [];
      for (let i = 0; i < colliders.length; i++) {
        const collider = colliders[i];
        //  fetch anything that we might collide with us at our new position
        const neighbors = Physics.boxcastBroadphaseExcludingSelf(
          collider,
          collider.bounds,
          collider.collidesWithLayers
        );
        for (let j = 0; j < neighbors.length; j++) {
          const neighbor = neighbors[j];
          if (!neighbor.isTrigger) {
            continue;
          }

          if (collider.overlaps(neighbor)) {
            const pair = new Pair<Collider>(collider, neighbor);
            // if we already have this pair in one of our sets
            // (the previous or current trigger intersections)
            // dont call the enter event
            const shouldReportTriggerEvent =
              !this._activeTriggerIntersections.has(pair) &&
              !this._previousTriggerIntersections.has(pair);
            if (shouldReportTriggerEvent) {
              if (neighbor.castSortOrder >= Collider.lateSortOrder) {
                lateColliders.push(pair);
              } else {
                this.notifyTriggerListeners(pair, true);
              }
            }

            this._activeTriggerIntersections.add(pair);
          }
        }
      }

      for (const pair of lateColliders) {
        this.notifyTriggerListeners(pair, true);
      }

      this.checkForExitedColliders();
    }

    private checkForExitedColliders() {
      // remove all the triggers that we did interact with this frame
      // leaving us with the ones we exited
      this._previousTriggerIntersections.except(
        this._activeTriggerIntersections
      );
      const all = this._previousTriggerIntersections.all;
      all.forEach(pair => {
        this.notifyTriggerListeners(pair, false);
      });

      //  clear out the previous set cause we are done with it for now
      this._previousTriggerIntersections.clear();
      //  add in all the currently active triggers
      this._previousTriggerIntersections.union(
        this._activeTriggerIntersections
      );
      //  clear out the active set in preparation for the next frame
      this._activeTriggerIntersections.clear();
    }

    private notifyTriggerListeners(
      collisionPair: Pair<Collider>,
      isEntering: boolean
    ) {
      //  call the onTriggerEnter method for any relevant components
      this._tempTriggerList = collisionPair.first.entity.triggerListeners;
      for (let i = 0; i < this._tempTriggerList.length; i++) {
        if (isEntering) {
          this._tempTriggerList[i].onTriggerEnter(
            collisionPair.second,
            collisionPair.first
          );
        } else {
          this._tempTriggerList[i].onTriggerExit(
            collisionPair.second,
            collisionPair.first
          );
        }
      }

      this._tempTriggerList = [];
      //  also call it for the collider we moved onto if it wasn't destroyed by the first
      if (collisionPair.second.entity) {
        this._tempTriggerList = collisionPair.second.entity.triggerListeners;
        for (let i = 0; i < this._tempTriggerList.length; i++) {
          if (isEntering) {
            this._tempTriggerList[i].onTriggerEnter(
              collisionPair.first,
              collisionPair.second
            );
          } else {
            this._tempTriggerList[i].onTriggerExit(
              collisionPair.first,
              collisionPair.second
            );
          }
        }

        this._tempTriggerList = [];
      }
    }

    ///  <summary>
    ///  stores all the active intersection pairs that occured in the current frame
    ///  </summary>
    private _activeTriggerIntersections: PairSet<Collider> = new PairSet<
      Collider
    >();

    ///  <summary>
    ///  stores the previous frames intersection pairs so that we can detect exits after moving this frame
    ///  </summary>
    private _previousTriggerIntersections: PairSet<Collider> = new PairSet<
      Collider
    >();

    private _tempTriggerList: ITriggerListener[] = [];
  }
}
