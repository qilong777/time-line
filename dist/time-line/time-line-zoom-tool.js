import { oneDayTime, oneHourTime, oneMinuteTime } from "./constant";
var TimeLineZoomTool = /** @class */ (function () {
    function TimeLineZoomTool() {
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
    TimeLineZoomTool.prototype.injectZoomCb = function (cb) {
        this.zoomCb.push(cb);
    };
    TimeLineZoomTool.prototype.callZoomCb = function () {
        var _this = this;
        this.zoomCb.forEach(function (cb) { return cb(_this.zoomUnit); });
    };
    TimeLineZoomTool.prototype.renderTimeLineZoomTool = function (parent) {
        parent.appendChild(this.timeLineZoomToolDom);
        var _a = this, show = _a.show, bottom = _a.bottom, right = _a.right, zoomUnit = _a.zoomUnit;
        this.timeLineZoomToolDom.style.display = show ? "block" : "none";
        this.timeLineZoomToolDom.innerHTML = "\n    <div class=\"time-line-zoom-in time-line-zoom disable\">-</div>\n    <div class=\"time-line-zoom-value\">0</div>\n    <div class=\"time-line-zoom-out time-line-zoom\">+</div>\n    ";
        this.zoomInDom =
            this.timeLineZoomToolDom.querySelector(".time-line-zoom-in");
        this.zoomOutDom = this.timeLineZoomToolDom.querySelector(".time-line-zoom-out");
        this.zoomValueDom = this.timeLineZoomToolDom.querySelector(".time-line-zoom-value");
        this.updateStatus();
    };
    TimeLineZoomTool.prototype.updateStatus = function () {
        var _a = this, zoomUnit = _a.zoomUnit, zoomUnitRange = _a.zoomUnitRange;
        var maxZoomUnit = zoomUnitRange[0];
        var minZoomUnit = zoomUnitRange[zoomUnitRange.length - 1];
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
    };
    TimeLineZoomTool.prototype.initListeners = function () {
        var _this = this;
        this.timeLineZoomToolDom.addEventListener("click", function (event) {
            var target = event.target;
            if (target instanceof HTMLElement) {
                var className = target.className;
                if (className.includes("time-line-zoom-in")) {
                    _this.zoomIn();
                }
                else if (className.includes("time-line-zoom-out")) {
                    _this.zoomOut();
                }
            }
        });
    };
    // 缩小
    TimeLineZoomTool.prototype.zoomIn = function () {
        var index = this.zoomUnitRange.indexOf(this.zoomUnit);
        if (index === 0) {
            return;
        }
        this.zoomUnit = this.zoomUnitRange[index - 1];
        this.updateStatus();
        this.callZoomCb();
    };
    // 放大
    TimeLineZoomTool.prototype.zoomOut = function () {
        var index = this.zoomUnitRange.indexOf(this.zoomUnit);
        if (index === this.zoomUnitRange.length - 1) {
            return;
        }
        this.zoomUnit = this.zoomUnitRange[index + 1];
        this.updateStatus();
        this.callZoomCb();
    };
    TimeLineZoomTool.prototype.getInfoFromZoomTool = function (nowTime) {
        var _a = this, oneUnitItemCount = _a.oneUnitItemCount, zoomUnit = _a.zoomUnit;
        var count = oneDayTime / zoomUnit;
        if (!Number.isInteger(count)) {
            throw new Error("zoomUnit 不能被一天的时间戳整除");
        }
        var index = Math.floor(nowTime / zoomUnit);
        var offset = nowTime % zoomUnit;
        return {
            index: index,
            offset: offset,
        };
    };
    TimeLineZoomTool.prototype.getGapTime = function () {
        var _a = this, oneUnitItemCount = _a.oneUnitItemCount, zoomUnit = _a.zoomUnit;
        var gapTime = zoomUnit / oneUnitItemCount;
        if (!Number.isInteger(gapTime)) {
            throw new Error("zoomUnit / oneUnitItemCount 必须是整数");
        }
        return gapTime;
    };
    TimeLineZoomTool.prototype.getZoomUnitText = function () {
        var zoomUnit = this.zoomUnit;
        if (zoomUnit / oneHourTime >= 1) {
            return "".concat(zoomUnit / oneHourTime, "h");
        }
        else {
            return "".concat(zoomUnit / oneMinuteTime, "m");
        }
    };
    return TimeLineZoomTool;
}());
export { TimeLineZoomTool };
