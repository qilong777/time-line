export type MountedEl = HTMLElement | string;

export interface TimeLineTheme {
  // 背景色
  backgroundColor?: string;
  // 线条颜色
  color?: string;
  // 线条宽度
  lineWidth?: number;
  // 线条高度
  lineHeight?: number;
}

export interface TimePickStyle {}

export interface ZoomTool {
  // 是否展示
  show?: boolean;

  // 定位，优先使用top和left
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;

  zoomUnitRange?: number[];
  // 缩放单位
  zoomUnit?: number;

  // 一个缩放单位的时间戳个数
  oneUnitItemCount?: number;

  zoomIcon?: {
    // 放大图标
    zoomIn?: string;
    // 缩小图标
    zoomOut?: string;
  };
}

export interface Animation {
  // 是否有效
  enable?: boolean;
  // 动画时长
  duration?: number;

  // 是否有阻尼效果
  damping?: boolean;
}

export interface ListenersOption {
  // 滑动监听
  dateChanging?(dayTime: number): void;

  //
  dateChangeStart?(time: number): void;

  dateChangeEnd?(time: number): void;

  // 过了一天
  nextDay?(): void;

  // 前一天
  prevDay?(): void;
}

export interface TimeLineOption {
  // 宽度
  // width: number;
  // 高度
  // height: number;

  // 初始化时间
  // 一天的毫秒数
  nowTime?: number;

  // [[startTime,endTime],[startTime,endTime]]
  heightLightAreas?: number[][];

  timeTextFormat?: (time: number) => string;

  // 间隙宽度
  gapWidth?: number;

  // 主题
  theme?: TimeLineTheme;

  timePickStyle?: TimePickStyle;

  // 缩放工具
  zoomTool?: ZoomTool;

  animation?: Animation;

  listeners?: ListenersOption;
}
