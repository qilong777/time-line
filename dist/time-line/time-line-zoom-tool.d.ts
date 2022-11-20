import { ZoomTool } from "./interface";
type ZoomCB = (zoomUnit: number) => void;
export declare class TimeLineZoomTool implements ZoomTool {
    show: boolean;
    bottom: number;
    right: number;
    zoomUnitRange: number[];
    zoomUnit: number;
    oneUnitItemCount: number;
    timeLineZoomToolDom: HTMLDivElement;
    zoomInDom: HTMLElement;
    zoomOutDom: HTMLElement;
    zoomValueDom: HTMLElement;
    private zoomCb;
    constructor();
    injectZoomCb(cb: ZoomCB): void;
    callZoomCb(): void;
    renderTimeLineZoomTool(parent: HTMLElement): void;
    updateStatus(): void;
    initListeners(): void;
    zoomIn(): void;
    zoomOut(): void;
    getInfoFromZoomTool(nowTime: number): {
        index: number;
        offset: number;
    };
    getGapTime(): number;
    private getZoomUnitText;
}
export {};
