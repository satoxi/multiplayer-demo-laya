namespace Muse {
  export class QuickDebugUI {
    public static createText(
      text: string,
      fontSize: number = 20,
      color: string = '#333333'
    ): Laya.Text {
      const txt = new Laya.Text();
      Object.assign(txt, {
        color,
        fontSize,
        bold: false,
        text,
        align: 'center',
      });
      txt.pivot(txt.width / 2, txt.height / 2);
      return txt;
    }

    public static createButton(
      label: string,
      labelSize: number = 30,
      color: string = '#ffffff',
      bgColor: string = '#515151',
      width: number = 320,
      height: number = 100
    ): Laya.Button {
      const button = new Laya.Button();
      button.size(width, height);
      button.graphics.clear();
      button.graphics.drawRect(0, 0, width, height, bgColor);
      button.pivot(width / 2, height / 2);
      button.label = label;
      button.labelSize = labelSize;
      button.labelStroke = 0;
      button.labelPadding = '0,0,10,0';
      button.labelBold = true;
      button.labelColors = `${color},${color},${color}`;
      return button;
    }

    public static createInputField(): Laya.TextInput {
      const inputField = new Laya.TextInput();
      inputField.size(500, 100);
      inputField.graphics.drawRect(
        0,
        0,
        inputField.width,
        inputField.height,
        '#ffffff'
      );
      inputField.fontSize = 60;
      inputField.pivot(0, inputField.height / 2);
      return inputField;
    }
  }
}
