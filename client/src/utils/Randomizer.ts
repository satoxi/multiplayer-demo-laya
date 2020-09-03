namespace Muse {
  export class Randomizer<T> {
    public constructor(elements: T[], probabilities: number[]) {
      this.resetElements(elements, probabilities);
    }

    public resetElementsEven(elements: T[]) {
      this._elements = [];
      this._probabilityBounds = [];
      this._isEven = true;
      this._elements = elements;
    }

    public resetElements(elements: T[], probabilities: number[]) {
      if (elements.length !== probabilities.length) {
        console.error(
          'Count of probabilities should be equal to count of elements'
        );
        return;
      }

      let sum = 0;
      probabilities.forEach(p => {
        sum += p;
      });

      this._elements = elements;
      this._probabilityBounds = [];
      this._isEven = false;

      for (let i = 0; i < elements.length; i++) {
        const probability = probabilities[i] / sum;
        this._probabilityBounds.push(
          i === 0
            ? probability
            : i === elements.length - 1
              ? 1
              : this._probabilityBounds[i - 1] + probability
        );
      }
    }

    public Get(): T {
      if (this._elements.length === 0) {
        return null;
      }

      if (this._elements.length === 1) {
        return this._elements[0];
      }

      if (this._isEven) {
        return random.pickOne(this._elements);
      } else {
        const number = Math.random();
        if (number < this._probabilityBounds[0]) {
          // console.log("random number [" + number + "] is in range [0," +
          //         _probabilityBounds[0] + "], return[" + _elements[0] + "]");
          return this._elements[0];
        } else {
          for (let i = 1; i < this._probabilityBounds.length; i++) {
            if (
              number > this._probabilityBounds[i - 1] &&
              number <= this._probabilityBounds[i]
            ) {
              return this._elements[i];
            }
          }
          console.error('Code should never run here');
        }
      }
    }

    private _probabilityBounds: number[];
    private _elements: T[];
    private _isEven: boolean;
  }
}
