import { Animation, ListenersOption, MountedEl, TimeLineOption, TimeLineTheme } from "./interface";
import { TimeLineZoomTool } from "./time-line-zoom-tool";
declare function formatTime2Text(time: number): string;
export declare class TimeLineContainer implements TimeLineOption {
    nowTime: number;
    timeTextFormat: typeof formatTime2Text;
    gapWidth: number;
    itemLineWidth: number;
    theme: TimeLineTheme;
    zoomTool: TimeLineZoomTool;
    animation: Animation;
    rootDom: HTMLElement;
    timeLineDom: HTMLElement;
    listeners: ListenersOption;
    private readonly repeatCount;
    constructor(el: MountedEl, option: TimeLineOption);
    private initEventListeners;
    private initMouseWheelListener;
    private initMouseDragListener;
    zoomCb(): void;
    initOption(option: TimeLineOption): void;
    initRootDom(el: MountedEl): void;
    setDayTime(nowTime: number): void;
    render(): void;
    renderTimeLine(): void;
    renderTimeLineItem(time: number, count: number): HTMLDivElement;
    translateTimeLine(): void;
}
export {};
