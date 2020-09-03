/// <reference path='./Tween.ts' />
/// <reference path='./AbstractTweenable.ts' />
/// <reference path='../spline/SplineSolver.ts' />

namespace Muse {
  export class FloatTween extends Tween<number> {
    public static readonly id = 'FloatTween';

    public static create(): FloatTween {
      return Laya.Pool.getItemByClass(FloatTween.id, FloatTween);
    }

    public setIsRelative(): ITween<number> {
      this._isRelative = true;
      this._toValue += this._fromValue;
      return this;
    }

    protected updateValue(): void {
      this._target.setTweenedValue(
        this._easeType(
          this._elapsedTime,
          this._fromValue,
          this._toValue - this._fromValue,
          this._duration
        )
      );
    }

    public recycleSelf(): void {
      super.recycleSelf();
      if (this._shouldRecycleTween) {
        Laya.Pool.recover(FloatTween.id, this);
      }
    }
  }

  export class ColorTween extends Tween<Color> {
    public static readonly id = 'ColorTween';

    public static create(): ColorTween {
      return Laya.Pool.getItemByClass(ColorTween.id, ColorTween);
    }

    public constructor() {
      super();
      this._color = new Color(1, 1, 1);
      this._fromValue = new Color(1, 1, 1);
      this._toValue = new Color(1, 1, 1);
    }

    public setIsRelative(): ITween<Color> {
      this._isRelative = true;
      this._toValue.r += this._fromValue.r;
      this._toValue.g += this._fromValue.g;
      this._toValue.b += this._fromValue.b;
      return this;
    }

    public setHexFrom(from: string): ITween<Color> {
      this._isFromValueOverridden = true;
      this._fromValue.fromHex(from);
      return this;
    }

    public setHexTo(to: string): ITween<Color> {
      this._toValue.fromHex(to);
      return this;
    }

    protected updateValue(): void {
      this._color.r = Math.round(
        this._easeType(
          this._elapsedTime,
          this._fromValue.r,
          this._toValue.r - this._fromValue.r,
          this._duration
        )
      );
      this._color.g = Math.round(
        this._easeType(
          this._elapsedTime,
          this._fromValue.g,
          this._toValue.g - this._fromValue.g,
          this._duration
        )
      );
      this._color.b = Math.round(
        this._easeType(
          this._elapsedTime,
          this._fromValue.b,
          this._toValue.b - this._fromValue.b,
          this._duration
        )
      );
      this._target.setTweenedValue(this._color);
    }

    public recycleSelf(): void {
      super.recycleSelf();
      if (this._shouldRecycleTween) {
        Laya.Pool.recover(ColorTween.id, this);
      }
    }

    private _color: Color;
  }

  export interface IMultiProperty {
    [propertyName: string]: number;
  }

  export class MultiPropertyTween extends Tween<IMultiProperty> {
    public static readonly id = 'MultiProperty';

    public static create(): MultiPropertyTween {
      return Laya.Pool.getItemByClass(
        MultiPropertyTween.id,
        MultiPropertyTween
      );
    }

    public setIsRelative(): ITween<IMultiProperty> {
      this._isRelative = true;
      Object.keys(this._toValue).forEach(name => {
        this._toValue[name] += this._fromValue[name];
      });
      return this;
    }

    protected updateValue(): void {
      const newValues = {};
      Object.keys(this._toValue).forEach(name => {
        newValues[name] = this._easeType(
          this._elapsedTime,
          this._fromValue[name],
          this._toValue[name] - this._fromValue[name],
          this._duration
        );
      });
      this._target.setTweenedValue(newValues);
    }

    public recycleSelf(): void {
      super.recycleSelf();
      if (this._shouldRecycleTween) {
        Laya.Pool.recover(MultiPropertyTween.id, this);
      }
    }
  }

  export class PropertyTarget implements ITweenTarget<number> {
    public static readonly id = 'PropertyTarget';

    public static create(target: object, propertyName: string): PropertyTarget {
      const pt = Laya.Pool.getItemByClass(PropertyTarget.id, PropertyTarget);
      pt._target = target;
      pt._propertyName = propertyName;
      return pt;
    }

    public getTargetObject(): object {
      return this._target;
    }

    public setTweenedValue(value: number): void {
      try {
        this._target[this._propertyName] = value;
      } catch (e) {
        console.error(
          PropertyTarget.id,
          'set tween property',
          this._target,
          this._propertyName,
          'error',
          e
        );
      }
    }

    public getTweenedValue(): number {
      return this._target[this._propertyName];
    }

    public recycleSelf(): void {
      this._target = null;
      Laya.Pool.recover(PropertyTarget.id, this);
    }

    protected _target: object;
    protected _propertyName: string;
  }

  export class ColorTarget implements ITweenTarget<Color> {
    public static readonly id = 'ColorTarget';

    public static create(target: object, propertyName: string): ColorTarget {
      const pt = Laya.Pool.getItemByClass(ColorTarget.id, ColorTarget);
      pt._target = target;
      pt._propertyName = propertyName;
      return pt;
    }

    public getTargetObject(): object {
      return this._target;
    }

    public setTweenedValue(value: Color): void {
      this._target[this._propertyName] = value.toHex();
    }

    public getTweenedValue(): Color {
      return Color.createFromHex(this._target[this._propertyName]);
    }

    public recycleSelf(): void {
      this._target = null;
      Laya.Pool.recover(ColorTarget.id, this);
    }

    protected _target: object;
    protected _propertyName: string;
  }

  export class MultiPropertyTarget implements ITweenTarget<IMultiProperty> {
    public static readonly id = 'MultiPropertyTarget';

    public static create(
      target: object,
      propertyNames: string[]
    ): MultiPropertyTarget {
      const mpt = Laya.Pool.getItemByClass(
        MultiPropertyTarget.id,
        MultiPropertyTarget
      );
      mpt._target = target;
      mpt._propertyNames = propertyNames;
      return mpt;
    }

    public getTargetObject(): object {
      return this._target;
    }

    public setTweenedValue(properties: IMultiProperty): void {
      Object.keys(properties).forEach(propertyName => {
        try {
          this._target[propertyName] = properties[propertyName];
        } catch (e) {
          console.error(
            MultiPropertyTarget.id,
            'set tween property',
            propertyName,
            'error',
            this._target,
            e
          );
        }
      });
    }

    public getTweenedValue(): IMultiProperty {
      const values = {};
      this._propertyNames.forEach(propertyName => {
        values[propertyName] = this._target[propertyName];
      });
      return values;
    }

    public recycleSelf(): void {
      this._target = null;
      Laya.Pool.recover(MultiPropertyTarget.id, this);
    }

    protected _target: object;
    protected _propertyNames: string[];
  }

  export class ShakeTween extends AbstractTweenable {
    public static readonly id = 'ShakeTween';

    public static create(): ShakeTween {
      return Laya.Pool.getItemByClass(ShakeTween.id, ShakeTween);
    }

    /// <summary>
    /// if the shake is already running this will overwrite the current values
    /// only if shakeIntensity > the current shakeIntensity.
    /// if the shake is not currently active it will be started.
    /// </summary>
    public shake(
      sprite: Laya.Sprite,
      shakeIntensity: number = 10,
      shakeDegredation: number = 0.95,
      shakeDirectionX: number = 0,
      shakeDirectionY: number = 1
    ): ShakeTween {
      this._sprite = sprite;
      // guard against adding a weaker shake to an already running shake
      if (
        !this._isCurrentlyManagedByTweenManager ||
        this._shakeIntensity < shakeIntensity
      ) {
        this._shakeDirection = new Laya.Point(shakeDirectionX, shakeDirectionY);
        this._shakeDirection.normalize();
        this._shakeIntensity = shakeIntensity;
        if (shakeDegredation < 0 || shakeDegredation >= 1) {
          shakeDegredation = 0.98;
        }
        this._shakeDegredation = shakeDegredation;
      }
      if (!this._isCurrentlyManagedByTweenManager) {
        this.start();
      }
      return this;
    }

    public setCompletionHandler(completionHandler: Function): ShakeTween {
      this._completionHandler = completionHandler;
      return this;
    }

    public tick(): boolean {
      if (this._isPaused) {
        return false;
      }

      if (Math.abs(this._shakeIntensity) > 0) {
        this._shakeOffset = this._shakeDirection;
        if (this._shakeOffset.x !== 0 && this._shakeOffset.y !== 0) {
          this._shakeOffset.normalize();
        } else {
          this._shakeOffset.x += Math.random() - 0.5;
          this._shakeOffset.y += Math.random() - 0.5;
        }

        this._shakeOffset.x *= this._shakeIntensity;
        this._shakeOffset.y *= this._shakeIntensity;
        this._shakeIntensity *= -this._shakeDegredation;
        if (Math.abs(this._shakeIntensity) <= 0.01) {
          this._shakeIntensity = 0;
        }

        this._sprite.x += this._shakeOffset.x;
        this._sprite.y += this._shakeOffset.y;

        return false;
      }

      this._isCurrentlyManagedByTweenManager = false;
      if (this._completionHandler) {
        this._completionHandler(this);
      }
      return true;
    }

    public recycleSelf(): void {
      super.recycleSelf();
      this._sprite = null;
      this._completionHandler = null;
      Laya.Pool.recover(ShakeTween.id, this);
    }

    private _sprite: Laya.Sprite;
    private _shakeDirection: Laya.Point;
    private _shakeOffset: Laya.Point;
    private _shakeIntensity: number = 0.3;
    private _shakeDegredation: number = 0.95;
    private _completionHandler: Function;
  }

  export class AnimCurveTween extends Tween<number> {
    public static readonly id = 'AnimCurveTween';

    public static create(curve): AnimCurveTween {
      const theTween = Laya.Pool.getItemByClass(
        AnimCurveTween.id,
        AnimCurveTween
      );
      return theTween.setAnimCurve(curve);
    }

    public setAnimCurve(curve: AnimCurve): AnimCurveTween {
      this._animCurve = curve;
      return this;
    }

    public setEaseType(easeType: Function): ITween<number> {
      // force to linear
      return super.setEaseType(Laya.Ease.linearNone);
    }

    public setIsRelative(): ITween<number> {
      throw new Error('not allowed to called on this class');
    }

    protected updateValue(): void {
      const t = this._elapsedTime / this._duration;
      this._target.setTweenedValue(this._animCurve.lerp(t));
    }

    public recycleSelf(): void {
      super.recycleSelf();
      if (this._shouldRecycleTween) {
        this._animCurve = null;
        Laya.Pool.recover(AnimCurveTween.id, this);
      }
    }

    private _animCurve: AnimCurve;
  }

  export class CubicBezierEase {
    public constructor(x1: number, y1: number, x2: number, y2: number) {
      const nodes: Vector[] = [];
      nodes.push(new Vector(0, 0));
      nodes.push(new Vector(x1, y1));
      nodes.push(new Vector(x2, y2));
      nodes.push(new Vector(1, 1));
      this._sovler = new CubicBezierSplineSolver(nodes);
    }

    public ease(
      elapsedTime: number,
      begin: number,
      delta: number,
      duration: number
    ): number {
      const t = elapsedTime / duration;
      return begin + this._sovler.getPoint(t).y * delta;
    }

    private _sovler: CubicBezierSplineSolver;
  }

  const standardEase = new CubicBezierEase(0.4, 0.0, 0.2, 1);
  const decelerateEase = new CubicBezierEase(0.0, 0.0, 0.2, 1);
  const accelerateEase = new CubicBezierEase(0.4, 0.0, 1, 1);
  const bounceInEase = new CubicBezierEase(0.57, 0.02, 0.7, 1.69);
  const bounceOutEase = new CubicBezierEase(0.39, -0.72, 0.25, 1);

  export const Ease = {
    standard: standardEase.ease.bind(standardEase),
    decelerate: decelerateEase.ease.bind(decelerateEase),
    accelerate: accelerateEase.ease.bind(accelerateEase),
    bounceIn: bounceInEase.ease.bind(bounceInEase),
    bounceOut: bounceOutEase.ease.bind(bounceOutEase),
    randomBounce: (bounceCoef: number = 1) => {
      const x1 = Math.random() * 0.5;
      const y1 = Math.random() * bounceCoef - bounceCoef;
      const x2 = Math.random() * 0.5 + 0.5;
      const y2 = bounceCoef - Math.random() * bounceCoef;
      const randomBounceEase = new CubicBezierEase(x1, y1, x2, y2);
      return randomBounceEase.ease.bind(randomBounceEase);
    },
  };

  export function tween(
    self: object,
    propertyName: string,
    to: number,
    duration: number = 300
  ): ITween<number> {
    const tweenTarget = PropertyTarget.create(self, propertyName);
    const t = FloatTween.create();
    t.initialize(tweenTarget, to, duration);
    return t;
  }

  export function tweenProps(
    self: object,
    to: IMultiProperty,
    duration: number = 300
  ): ITween<IMultiProperty> {
    const tweenTarget = MultiPropertyTarget.create(self, Object.keys(to));
    const t = MultiPropertyTween.create();
    t.initialize(tweenTarget, to, duration);
    return t;
  }

  export function tweenColor(
    self: object,
    propertyName: string,
    to: string,
    duration: number = 300
  ): ITween<Color> {
    const tweenTarget = ColorTarget.create(self, propertyName);
    const t = ColorTween.create();
    t.initialize(tweenTarget, t.toValue, duration);
    t.setHexFrom(self[propertyName]);
    t.setHexTo(to);
    return t;
  }

  export function curveTween(
    self: object,
    propertyName: string,
    curve: AnimCurve,
    duration: number
  ): AnimCurveTween {
    const tweenTarget = PropertyTarget.create(self, propertyName);
    const t = AnimCurveTween.create(curve);
    t.initialize(tweenTarget, 0, duration);
    return t;
  }
}
