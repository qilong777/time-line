export type MountedEl = HTMLElement | string;
export interface TimeLineTheme {
    backgroundColor?: string;
    color?: string;
    lineWidth?: number;
    lineHeight?: number;
}
export interface TimePickStyle {
}
export interface ZoomTool {
    show?: boolean;
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
    zoomUnitRange?: number[];
    zoomUnit?: number;
    oneUnitItemCount?: number;
    zoomIcon?: {
        zoomIn?: string;
        zoomOut?: string;
    };
}
export interface Animation {
    enable?: boolean;
    duration?: number;
    damping?: boolean;
}
export interface ListenersOption {
    dateChanging?(dayTime: number): void;
    dateChangeStart?(time: number): void;
    dateChangeEnd?(time: number): void;
    nextDay?(): void;
    prevDay?(): void;
}
export interface TimeLineOption {
    nowTimeDate?: Date;
    heightLightAreas?: number[][];
    timeTextFormat?: (time: number) => string;
    gapWidth?: number;
    theme?: TimeLineTheme;
    timePickStyle?: TimePickStyle;
    zoomTool?: ZoomTool;
    animation?: Animation;
    listeners?: ListenersOption;
}
