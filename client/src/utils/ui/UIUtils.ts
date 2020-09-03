namespace Muse {
  export class UIUtils {
    public static drawEllipse(sprite: Laya.Sprite, color: string) {
      const radius = 0.5 * sprite.height;
      const path = [
        ['moveTo', radius, 0],
        ['arcTo', sprite.width, 0, sprite.width, radius, radius],
        [
          'arcTo',
          sprite.width,
          2 * radius,
          sprite.width - radius,
          2 * radius,
          radius,
        ],
        ['arcTo', 0, 2 * radius, 0, radius, radius],
        ['arcTo', 0, 0, radius, 0, radius],
      ];
      sprite.graphics.drawPath(0, 0, path, {
        fillStyle: color,
      });
    }

    public static drawRoundRect(
      sprite: Laya.Sprite,
      color: string,
      radius: number
    ) {
      const path = [
        ['moveTo', radius, 0],
        ['arcTo', sprite.width, 0, sprite.width, radius, radius],
        [
          'arcTo',
          sprite.width,
          sprite.height,
          sprite.width - radius,
          sprite.height,
          radius,
        ],
        ['arcTo', 0, sprite.height, 0, sprite.height - radius, radius],
        ['arcTo', 0, 0, radius, 0, radius],
      ];
      sprite.graphics.drawPath(0, 0, path, {
        fillStyle: color,
      });
    }

    public static formatTime(timeInMilliSec: number): string {
      const totalSeconds = Math.floor(timeInMilliSec / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const minutesStr = minutes < 10 ? '0' + minutes : minutes.toString();
      const sec = totalSeconds - minutes * 60;
      const secStr = sec < 10 ? '0' + sec : sec.toString();
      return `${minutesStr}分${secStr}秒`;
    }

    public static formatRaceTime(
      timeInMilliSec: number,
      isChinese: boolean = false
    ): string {
      const totalSeconds = Math.floor(timeInMilliSec / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const minutesStr = minutes < 10 ? '0' + minutes : minutes.toString();
      const sec = totalSeconds - minutes * 60;
      const milliSec = Math.floor(timeInMilliSec % 1000);
      const secStr = sec < 10 ? '0' + sec : sec.toString();
      const milliSecStr =
        milliSec < 100
          ? milliSec < 10
            ? '00' + milliSec
            : '0' + milliSec
          : milliSec.toString();
      if (isChinese) {
        return `${minutesStr}分${secStr}秒${milliSecStr}`;
      }
      return `${minutesStr}:${secStr}.${milliSecStr}`;
    }

    public static canvasPosToLaya(
      x: number,
      y: number
    ): { x: number; y: number } {
      const width = window.innerWidth > 0 ? window.innerWidth : screen.width;
      const height =
        window.innerHeight > 0 ? window.innerHeight : screen.height;
      return {
        x: (x / width) * Laya.stage.width,
        y: (y / height) * Laya.stage.height,
      };
    }

    public static getArrayPos(
      centerX: number,
      centerY: number,
      gridWidth: number,
      gap: number,
      tilesPerRow: number,
      tilesPerColumn: number,
      index: number,
      vAlign: string = 'center'
    ): { x: number; y: number } {
      const row = Math.floor(index / tilesPerRow);
      const column = index % tilesPerRow;
      const offset = (tilesPerRow - 1) / 2;
      let rowOffset = 0;
      switch (vAlign) {
        case 'center':
          rowOffset = row - (tilesPerColumn - 1) / 2;
          break;
        case 'top':
          rowOffset = row + 0.5;
          break;
        case 'bottom':
          rowOffset = -(tilesPerColumn - row) + 0.5;
          break;
        default:
          break;
      }
      const xOffset = centerX + (column - offset) * (gridWidth + gap);
      const yOffset = centerY + rowOffset * (gridWidth + gap);
      return { x: xOffset, y: yOffset };
    }

    public static getTextLength(text: string): number {
      if (!text) {
        return 0;
      }

      const charSegment = new Laya.CharSegment();
      charSegment.textToSpit(text);

      const length = charSegment.length();
      let currentCount = 0;
      for (let i = 0; i < length; i++) {
        if ((charSegment.getCharCode(i) & 0xff00) !== 0) {
          currentCount++;
        }
        currentCount++;
      }
      return currentCount;
    }

    public static getLimitCountText(text: string, maxCount: number): string {
      if (!text) {
        return '';
      }

      const charSegment = new Laya.CharSegment();
      charSegment.textToSpit(text);

      maxCount -= 1;
      const result = [];
      const length = charSegment.length();
      let currentCount = 0;
      for (let i = 0; i < length; i++) {
        if ((charSegment.getCharCode(i) & 0xff00) !== 0) {
          currentCount++;
        }
        currentCount++;
        if (currentCount <= maxCount) {
          result.push(charSegment.getChar(i));
        } else {
          result.push('.', '.', '.');
          break;
        }
      }
      return result.join('');
    }

    public static bigNumberStr(number: number): string {
      if (number < 10000) {
        return number.toString();
      }

      const count = Math.floor(number / 10000);
      const remainder = Math.floor((number % 10000) / 1000);
      return remainder < 1 ? `${count}w` : `${count}.${remainder}w`;
    }

    public static horizonalLayout(parent: Laya.Sprite, space: number) {
      const childs: Laya.Sprite[] = [];
      for (let i = 0; i < parent._childs.length; i++) {
        const child = parent._childs[i];
        if (child.visible) {
          childs.push(child);
        }
      }

      if (childs.length === 0) {
        return;
      }

      let x = 0;
      for (let i = 0; i < childs.length; i++) {
        const child = childs[i];
        child.x = x;
        x += child.width + space;
      }
    }

    public static verticalLayout(
      parent: Laya.Sprite,
      space: number,
      height: number = 0
    ) {
      const childs: Laya.Sprite[] = [];
      for (let i = 0; i < parent._childs.length; i++) {
        const child = parent._childs[i];
        if (child.visible) {
          childs.push(child);
          if (height > 0) {
            child.height = height;
          }
        }
      }

      if (childs.length === 0) {
        return;
      }

      let y = 0;
      for (let i = 0; i < childs.length; i++) {
        const child = childs[i];
        child.y = y;
        y += child.height + space;
      }
    }

    public static gridLayout(
      parent: Laya.Sprite,
      spaceX: number,
      spaceY: number,
      repeatX: number,
      align?: string
    ) {
      const childs: Laya.Sprite[] = [];
      for (let i = 0; i < parent._childs.length; i++) {
        const child = parent._childs[i];
        if (child.visible) {
          childs.push(child);
        }
      }

      if (childs.length === 0) {
        return;
      }

      repeatX = repeatX ? repeatX : 1;
      const childWidth = childs[0].width;
      const childHeight = childs[0].height;
      const row = Math.ceil(childs.length / repeatX);
      parent.width = repeatX * childWidth + (repeatX - 1) * spaceX;
      parent.height = row * childHeight + (row - 1) * spaceY;

      for (let i = 0; i < childs.length; i++) {
        const child = childs[i];
        const x = i % repeatX;
        const y = Math.ceil((i + 1) / repeatX) - 1;
        child.y = y * (childHeight + spaceY);
        if (align === 'center') {
          const column = Math.min(childs.length - y * repeatX, repeatX);
          child.x =
            x * (childWidth + spaceX) +
            (parent.width - (column * childWidth + (column - 1) * spaceX)) / 2;
        } else {
          child.x = x * (childWidth + spaceX);
        }
      }
    }

    public static localToGlobal(sprite: Laya.Sprite): Laya.Point {
      const nodes = [];
      let node: Laya.Node = sprite;
      while (node && node !== Laya.stage) {
        nodes.push(node);
        node = node.parent;
      }

      const point = new Laya.Point(0, 0);
      let parentWidth = Laya.stage.width;
      let parentHeight = Laya.stage.height;
      for (let i = nodes.length - 1; i >= 0; i--) {
        let width = 0;
        let height = 0;
        if (nodes[i] instanceof Laya.Component) {
          const component = nodes[i] as Laya.Component;
          width = component.width ? component.width : 0;
          height = component.height ? component.height : 0;
          if (
            (component.left || component.left === 0) &&
            (component.right || component.right === 0)
          ) {
            width = parentWidth - component.left - component.right;
          }
          if (
            (component.top || component.top === 0) &&
            (component.bottom || component.bottom === 0)
          ) {
            height = parentHeight - component.top - component.bottom;
          }
          if (component.left || component.left === 0) {
            point.x += component.left;
          } else if (component.right || component.right === 0) {
            point.x += parentWidth - component.right - width;
          } else if (component.centerX || component.centerX === 0) {
            point.x += (parentWidth - width) / 2 + component.centerX;
          } else if (component.anchorX) {
            point.x += component.x - width * component.anchorX;
          } else {
            point.x += component.x;
          }
          if (component.top || component.top === 0) {
            point.y += component.top;
          } else if (component.bottom || component.bottom === 0) {
            point.y += parentHeight - component.bottom - height;
          } else if (component.centerY || component.centerY === 0) {
            point.y += (parentHeight - height) / 2 + component.centerY;
          } else if (component.anchorY) {
            point.y += component.y - height * component.anchorY;
          } else {
            point.y += component.y;
          }
        } else if (nodes[i] instanceof Laya.Sprite) {
          point.x += (nodes[i] as Laya.Sprite).x;
          point.y += (nodes[i] as Laya.Sprite).y;
        }
        parentWidth = width;
        parentHeight = height;
      }
      return point;
    }

    public static getRichText(
      parent: Laya.Label,
      content: string
    ): Laya.HTMLDivElement {
      const html = new Laya.HTMLDivElement();
      html.width = parent.width;
      html.style.align = parent.align;
      html.style.valign = parent.valign;
      html.style.lineHeight = parent.fontSize;
      html.style.color = '#ffffff';
      html.style.fontSize = parent.fontSize;
      html.style.bold = true;
      html.style.wordWrap = true;
      html.innerHTML = content;
      html.name = 'div';
      return html;
    }
  }
}

enum HorizonalLayoutType {
  left,
  right,
  center,
}

enum VerticalLayoutType {
  top,
  bottom,
  center,
}
