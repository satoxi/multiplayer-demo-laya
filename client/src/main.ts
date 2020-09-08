function main() {
  console.log('laya version: ' + Laya.version);
  Laya.MiniAdpter.init();

  initPortraitStage();
  Muse.init();
  Muse.Physics.spatialHashCellSize = 50;
  Muse.Physics.reset();

  changeBgColorToUI();

  Laya.stage.frameRate = Laya.Stage.FRAME_FAST;
  console.log(
    'set stage width=',
    Laya.stage.width,
    'height=',
    Laya.stage.height
  );

  Laya.stage.scaleMode = Laya.Stage.SCALE_FIXED_WIDTH;
  Laya.stage.alignH = Laya.Stage.ALIGN_CENTER;
  Laya.stage.alignV = Laya.Stage.ALIGN_MIDDLE;

  Laya.ResourceVersion.enable(
    'version.json',
    Laya.Handler.create(null, load),
    Laya.ResourceVersion.FILENAME_VERSION
  );
}

function initPortraitStage() {
  let stageWidth = 750;
  let stageHeight = 1334;
  const targetRatio = stageWidth / stageHeight;
  const height = Laya.Browser.clientHeight;
  const ratio = Laya.Browser.clientWidth / height;
  if (ratio > targetRatio) {
    stageWidth = ratio * stageHeight;
  } else {
    stageHeight = stageWidth / ratio;
  }
  Laya.init(stageWidth, stageHeight, Laya.WebGL);
  Laya.stage.screenMode = Laya.Stage.SCREEN_VERTICAL;
}

function initLandscapeStage() {
  let stageWidth = 1334;
  let stageHeight = 750;
  const targetRatio = stageWidth / stageHeight;
  const height = Laya.Browser.clientHeight;
  const ratio = Laya.Browser.clientWidth / height;
  if (ratio > targetRatio) {
    stageWidth = ratio * stageHeight;
  } else {
    stageHeight = stageWidth / ratio;
  }
  Laya.init(stageWidth, stageHeight, Laya.WebGL);
  Laya.stage.screenMode = Laya.Stage.SCREEN_HORIZONTAL;
}

function load() {
  Demo.instance.start();
}

function changeBgColorToUI() {
  Laya.stage.bgColor = '#ffffff';
}

main();
