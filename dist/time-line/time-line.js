import { oneDayTime } from "./constant";
import { TimeLineZoomTool } from "./time-line-zoom-tool";
var defaultTheme = {
    backgroundColor: "#000",
    // 颜色
    color: "#fff",
    // 线条宽度
    lineWidth: 1,
    // 线条高度
    lineHeight: 20,
};
var defaultZoomTool = {
    // 是否展示
    show: true,
    bottom: 5,
    right: 5,
    // 缩放单位
    zoomUnit: oneDayTime,
    // 一个单位存在的时间戳个数
    oneUnitItemCount: 12,
};
var defaultAnimation = {
    // 是否有效
    enable: true,
    // 动画时长
    duration: 300,
    // 是否有阻尼效果
    damping: true,
};
function formatTime2Text(time) {
    time = time % oneDayTime;
    time = time < 0 ? oneDayTime + time : time;
    var hour = ("0" + Math.floor(time / 1000 / 60 / 60)).slice(-2);
    var minute = ("0" + (Math.floor(time / 1000 / 60) % 60)).slice(-2);
    return "".concat(hour, ":").concat(minute);
}
var TimeLineContainer = /** @class */ (function () {
    function TimeLineContainer(el, option) {
        this.nowTime = 0.0 * oneDayTime;
        this.timeTextFormat = formatTime2Text;
        this.gapWidth = 150;
        this.itemLineWidth = 1;
        this.theme = defaultTheme;
        this.zoomTool = new TimeLineZoomTool();
        this.animation = defaultAnimation;
        this.listeners = {};
        this.repeatCount = 3;
        this.initRootDom(el);
        this.initOption(option);
        this.render();
        this.zoomTool.injectZoomCb(this.zoomCb.bind(this));
        this.translateTimeLine();
        this.initEventListeners();
    }
    TimeLineContainer.prototype.initEventListeners = function () {
        this.initMouseWheelListener();
        this.initMouseDragListener();
    };
    TimeLineContainer.prototype.initMouseWheelListener = function () {
        var _this = this;
        var timer = null;
        this.rootDom.addEventListener("wheel", function (event) {
            if (timer) {
                return;
            }
            timer = setTimeout(function () {
                if (event.deltaY > 0) {
                    _this.zoomTool.zoomIn();
                }
                else {
                    _this.zoomTool.zoomOut();
                }
                clearTimeout(timer);
                timer = null;
            }, 200);
        });
    };
    TimeLineContainer.prototype.initMouseDragListener = function () {
        var _this = this;
        this.rootDom.addEventListener("mousedown", function (event) {
            event.preventDefault();
            var couldMove = true;
            var gapTime = _this.zoomTool.getGapTime();
            var startX = event.clientX;
            var startTranslateX = parseInt(getComputedStyle(_this.timeLineDom).transform.split(",")[4]);
            var oneUnitItemCount = _this.zoomTool.oneUnitItemCount;
            var _a = _this, gapWidth = _a.gapWidth, startTime = _a.nowTime;
            var oneUnitWidth = gapWidth * oneUnitItemCount;
            var halfContainerWidth = parseInt(getComputedStyle(_this.rootDom).width) / 2;
            var mouseMove = function (event) {
                // if (!couldMove) {
                //   return;
                // }
                var endX = event.clientX;
                var diffX = endX - startX;
                var diffTime = (diffX / gapWidth) * gapTime;
                var translateX = startTranslateX + diffX;
                _this.nowTime = startTime - diffTime;
                if (_this.nowTime < 0) {
                    _this.nowTime = oneDayTime + _this.nowTime;
                    _this.listeners.prevDay && _this.listeners.prevDay();
                }
                if (_this.nowTime >= oneDayTime) {
                    _this.nowTime = _this.nowTime % oneDayTime;
                    _this.listeners.nextDay && _this.listeners.nextDay();
                }
                _this.listeners.sliding && _this.listeners.sliding(_this.nowTime);
                if (translateX > -(oneUnitWidth - halfContainerWidth)) {
                    _this.renderTimeLine();
                    _this.translateTimeLine();
                    startTranslateX = -(2 * oneUnitWidth - halfContainerWidth);
                    startX = endX;
                    startTime = oneDayTime;
                    couldMove = false;
                    return;
                }
                else if (translateX <= -(2 * oneUnitWidth - halfContainerWidth)) {
                    _this.renderTimeLine();
                    _this.translateTimeLine();
                    startTranslateX = -(oneUnitWidth - halfContainerWidth);
                    startX = endX;
                    startTime = 0;
                    couldMove = false;
                    return;
                }
                _this.timeLineDom.style.transform = "translateX(".concat(translateX, "px)");
            };
            var mouseUp = function (event) {
                window.removeEventListener("mousemove", mouseMove);
                window.removeEventListener("mouseup", mouseUp);
            };
            window.addEventListener("mousemove", mouseMove);
            window.addEventListener("mouseup", mouseUp);
        });
    };
    TimeLineContainer.prototype.zoomCb = function () {
        this.renderTimeLine();
        this.translateTimeLine();
    };
    TimeLineContainer.prototype.initOption = function (option) {
        Object.assign(this, option);
        Object.assign(this.theme, defaultAnimation, option.theme);
        Object.assign(this.zoomTool, defaultZoomTool, option.zoomTool);
        Object.assign(this.animation, defaultAnimation, option.animation);
    };
    TimeLineContainer.prototype.initRootDom = function (el) {
        var parent = typeof el === "string" ? document.querySelector(el) : el;
        if (!parent) {
            throw Error("".concat(el, " \u4E0D\u5B58\u5728"));
        }
        this.rootDom = document.createElement("div");
        this.rootDom.className = "time-line-container";
        this.rootDom.innerHTML = "\n      <div class=\"time-line-time-pick\"></div>\n      \n    ";
        parent.appendChild(this.rootDom);
    };
    TimeLineContainer.prototype.setDayTime = function (nowTime) {
        this.nowTime = nowTime;
        this.render();
    };
    TimeLineContainer.prototype.render = function () {
        this.renderTimeLine();
        this.zoomTool.renderTimeLineZoomTool(this.rootDom);
    };
    TimeLineContainer.prototype.renderTimeLine = function () {
        if (!this.timeLineDom) {
            this.timeLineDom = document.createElement("div");
            this.timeLineDom.className = "time-line";
            this.rootDom.appendChild(this.timeLineDom);
        }
        var _a = this, timeLineDom = _a.timeLineDom, gapWidth = _a.gapWidth, zoomTool = _a.zoomTool, nowTime = _a.nowTime, repeatCount = _a.repeatCount, itemLineWidth = _a.itemLineWidth;
        var oneUnitItemCount = zoomTool.oneUnitItemCount, zoomUnit = zoomTool.zoomUnit;
        var index = this.zoomTool.getInfoFromZoomTool(nowTime).index;
        var gapTime = this.zoomTool.getGapTime();
        timeLineDom.innerHTML = "";
        // 获取总宽度
        var itemCount = oneUnitItemCount * repeatCount;
        var width = gapWidth * (itemCount - 1) + itemLineWidth;
        timeLineDom.style.width = "".concat(width, "px");
        var frag = document.createDocumentFragment();
        for (var i = 0; i < itemCount; i++) {
            var time = (index - 1 + Math.floor(i / oneUnitItemCount)) * zoomUnit +
                (i % oneUnitItemCount) * gapTime;
            var div = this.renderTimeLineItem(time, i);
            if (i !== itemCount - 1) {
                div.style.marginRight = "".concat(gapWidth - itemLineWidth, "px");
            }
            frag.appendChild(div);
        }
        timeLineDom.appendChild(frag);
    };
    TimeLineContainer.prototype.renderTimeLineItem = function (time, count) {
        var div = document.createElement("div");
        div.className = "time-line-item";
        div.innerHTML = "\n      <div class=\"time-line-item-line\"></div>\n      <p class=\"time-line-item-time\">".concat(this.timeTextFormat(time), "</p>\n    ");
        return div;
    };
    TimeLineContainer.prototype.translateTimeLine = function () {
        var nowTime = this.nowTime;
        var _a = this.zoomTool.getInfoFromZoomTool(nowTime), index = _a.index, offset = _a.offset;
        var _b = this.zoomTool, oneUnitItemCount = _b.oneUnitItemCount, zoomUnit = _b.zoomUnit;
        var gapWidth = this.gapWidth;
        var translateX = (1 + offset / zoomUnit) * oneUnitItemCount * gapWidth;
        var halfContainerWidth = parseInt(getComputedStyle(this.rootDom).width) / 2;
        translateX = translateX - halfContainerWidth;
        this.timeLineDom.style.transform = "translateX(-".concat(translateX, "px)");
    };
    return TimeLineContainer;
}());
export { TimeLineContainer };
