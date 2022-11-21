import { oneDayTime, oneHourTime, oneMinuteTime } from "./constant";
export class TimeLineZoomTool {
    constructor() {
        // 是否展示
        this.show = true;
        this.bottom = 5;
        this.right = 5;
        this.zoomUnitRange = [
            oneDayTime,
            oneDayTime / 2,
            oneDayTime / 4,
            oneDayTime / 12,
            oneDayTime / 24,
            oneDayTime / 24 / 5,
        ];
        // 缩放单位
        this.zoomUnit = oneDayTime;
        // 一个单位存在的时间戳个数
        this.oneUnitItemCount = 12;
        this.zoomCb = [];
        this.timeLineZoomToolDom = document.createElement("div");
        this.timeLineZoomToolDom.className = "time-line-zoom-tool";
        this.initListeners();
    }
    injectZoomCb(cb) {
        this.zoomCb.push(cb);
    }
    callZoomCb() {
        this.zoomCb.forEach((cb) => cb(this.zoomUnit));
    }
    renderTimeLineZoomTool(parent) {
        parent.appendChild(this.timeLineZoomToolDom);
        const { show, bottom, right, zoomUnit } = this;
        this.timeLineZoomToolDom.style.display = show ? "block" : "none";
        this.timeLineZoomToolDom.innerHTML = `
    <div class="time-line-zoom-in time-line-zoom disable">-</div>
    <div class="time-line-zoom-value">0</div>
    <div class="time-line-zoom-out time-line-zoom">+</div>
    `;
        this.zoomInDom =
            this.timeLineZoomToolDom.querySelector(".time-line-zoom-in");
        this.zoomOutDom = this.timeLineZoomToolDom.querySelector(".time-line-zoom-out");
        this.zoomValueDom = this.timeLineZoomToolDom.querySelector(".time-line-zoom-value");
        this.updateStatus();
    }
    updateStatus() {
        const { zoomUnit, zoomUnitRange } = this;
        const maxZoomUnit = zoomUnitRange[0];
        const minZoomUnit = zoomUnitRange[zoomUnitRange.length - 1];
        if (zoomUnit === maxZoomUnit) {
            this.zoomInDom.classList.add("disable");
        }
        else {
            this.zoomInDom.classList.remove("disable");
        }
        if (zoomUnit === minZoomUnit) {
            this.zoomOutDom.classList.add("disable");
        }
        else {
            this.zoomOutDom.classList.remove("disable");
        }
        this.zoomValueDom.innerText = this.getZoomUnitText();
    }
    initListeners() {
        this.timeLineZoomToolDom.addEventListener("click", (event) => {
            const target = event.target;
            if (target instanceof HTMLElement) {
                const className = target.className;
                if (className.includes("time-line-zoom-in")) {
                    this.zoomIn();
                }
                else if (className.includes("time-line-zoom-out")) {
                    this.zoomOut();
                }
            }
        });
    }
    // 缩小
    zoomIn() {
        const index = this.zoomUnitRange.indexOf(this.zoomUnit);
        if (index === 0) {
            return;
        }
        this.zoomUnit = this.zoomUnitRange[index - 1];
        this.updateStatus();
        this.callZoomCb();
    }
    // 放大
    zoomOut() {
        const index = this.zoomUnitRange.indexOf(this.zoomUnit);
        if (index === this.zoomUnitRange.length - 1) {
            return;
        }
        this.zoomUnit = this.zoomUnitRange[index + 1];
        this.updateStatus();
        this.callZoomCb();
    }
    getInfoFromZoomTool(nowTime) {
        const { oneUnitItemCount, zoomUnit } = this;
        const count = oneDayTime / zoomUnit;
        if (!Number.isInteger(count)) {
            throw new Error("zoomUnit 不能被一天的时间戳整除");
        }
        // 获取当前时间在zoomUnit下的索引，如果 zoomUnit = 1h，那么索引就是 0-23
        const index = Math.floor(nowTime / zoomUnit);
        const offset = nowTime % zoomUnit;
        return {
            index,
            offset,
        };
    }
    getGapTime() {
        const { oneUnitItemCount, zoomUnit } = this;
        const gapTime = zoomUnit / oneUnitItemCount;
        if (!Number.isInteger(gapTime)) {
            throw new Error("zoomUnit / oneUnitItemCount 必须是整数");
        }
        return gapTime;
    }
    getZoomUnitText() {
        const { zoomUnit } = this;
        if (zoomUnit / oneHourTime >= 1) {
            return `${zoomUnit / oneHourTime}h`;
        }
        else {
            return `${zoomUnit / oneMinuteTime}m`;
        }
    }
}
