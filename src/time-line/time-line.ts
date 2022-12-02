import { traverseAssignObj } from "./common";
import { oneDayTime, oneHourTime, oneMinuteTime } from "./constant";
import {
  Animation,
  ListenersOption,
  MountedEl,
  TimeLineOption,
  TimeLineTheme,
  ZoomTool,
} from "./interface";
import { TimeLineZoomTool } from "./time-line-zoom-tool";

const defaultTheme: TimeLineTheme = {
  backgroundColor: "#000",
  // 颜色
  color: "#fff",
  // 线条宽度
  lineWidth: 1,
  // 线条高度
  lineHeight: 20,
};

const defaultAnimation: Animation = {
  // 是否有效
  enable: true,
  // 动画时长
  duration: 300,

  // 是否有阻尼效果
  damping: true,
};

function formatTime2Text(time: number): string {
  time = time % oneDayTime;
  time = time < 0 ? oneDayTime + time : time;
  let hour = ("0" + Math.floor(time / 1000 / 60 / 60)).slice(-2);
  let minute = ("0" + (Math.floor(time / 1000 / 60) % 60)).slice(-2);

  return `${hour}:${minute}`;
}

export class TimeLineContainer implements TimeLineOption {
  // 当前时间戳
  nowTimeDate = new Date();
  // 当前的时间戳取余一天的时间戳
  // private nowDayTime = 0.0 * oneDayTime;

  // 高亮的区域
  heightLightAreas = [];

  // 时间文本的格式化函数，返回字符串
  dayTimeTextFormat = formatTime2Text;

  // 2个大段时间之间的间隔宽度
  gapWidth = 90;
  // 线的宽度
  itemLineWidth = 1;

  // 主题
  theme = defaultTheme;

  // 缩放工具
  zoomTool = new TimeLineZoomTool();

  // 动画配置
  animation = defaultAnimation;

  // 根节点
  private rootDom!: HTMLElement;

  // 时间线包裹节点，宽度固定
  private timeLineWrapDom!: HTMLElement;
  // 时间线内容的节点，宽度根据配置项决定
  private timeLineDom!: HTMLElement;

  // 高亮区域的父节点
  private timeHeightLightAreaWrapDom!: HTMLElement;

  // 监听回调
  listeners: ListenersOption = {};

  // 重复次数，一般不会改变
  // 1[234]56
  // 括号中是展示的时间
  private readonly repeatCount = 3;

  // 记录监听的window事件，用于销毁
  private windowEvents: any = {};

  get nowTime() {
    return this.nowTimeDate.getTime();
  }
  get nowDayTime() {
    const date = this.nowTimeDate;
    return (
      date.getHours() * oneHourTime +
      date.getMinutes() * oneMinuteTime +
      date.getSeconds() * 1000
    );
  }

  private lastIndex = undefined;

  constructor(el: MountedEl, option: TimeLineOption) {
    this.initRootDom(el);
    this.initOption(option);

    this.render();

    this.zoomTool.injectZoomCb(this.zoomCb.bind(this));

    this.initEventListeners();
  }

  // 释放内存
  dispose() {
    for (const key in this.windowEvents) {
      if (this.windowEvents.hasOwnProperty(key)) {
        const fn = this.windowEvents[key];
        window.removeEventListener(key, fn);
      }
    }
    this.windowEvents = {};
  }

  private initEventListeners() {
    this.initMouseWheelListener();
    this.initMouseDragListener();
    this.initResizeListener();
  }

  private initMouseWheelListener() {
    let timer: any = null;
    this.timeLineWrapDom.addEventListener("wheel", (event: WheelEvent) => {
      if (timer) {
        return;
      }
      // 限流
      timer = setTimeout(() => {
        if (event.deltaY > 0) {
          this.zoomTool.zoomIn();
        } else {
          this.zoomTool.zoomOut();
        }
        clearTimeout(timer);
        timer = null;
      }, 200);
    });
  }

  private initMouseDragListener() {
    this.timeLineWrapDom.addEventListener("mousedown", (event: MouseEvent) => {
      event.preventDefault();

      const gapTime = this.zoomTool.getGapTime();
      let startX = event.clientX;

      let { gapWidth, nowTime: startTime, nowDayTime: startDayTime } = this;

      const mouseMove = (event: MouseEvent) => {
        let endX = event.clientX;
        const diffX = endX - startX;

        const diffTime = (diffX / gapWidth) * gapTime;
        const nowTime = startTime - diffTime;

        this.setNowTime(nowTime);
        const nowDayTime = startDayTime - diffTime;
        if (nowDayTime < 0) {
          this.renderHeightLightAreas();
          this.listeners.prevDay && this.listeners.prevDay();
          startX = endX;
          startTime = this.nowTime;
          startDayTime = this.nowDayTime;
        }
        if (nowDayTime >= oneDayTime) {
          this.renderHeightLightAreas();
          this.listeners.nextDay && this.listeners.nextDay();
          startX = endX;
          startTime = this.nowTime;
          startDayTime = this.nowDayTime;
        }
        this.listeners.dateChanging &&
          this.listeners.dateChanging(this.nowDayTime);

        this.renderTimeLine();
      };

      const mouseUp = (event: MouseEvent) => {
        window.removeEventListener("mousemove", mouseMove);
        window.removeEventListener("mouseup", mouseUp);
        this.listeners.dateChangeEnd &&
          this.listeners.dateChangeEnd(this.nowTime);
      };
      this.listeners.dateChangeStart &&
        this.listeners.dateChangeStart(this.nowTime);
      window.addEventListener("mousemove", mouseMove);
      window.addEventListener("mouseup", mouseUp);
    });
  }

  private initResizeListener() {
    this.windowEvents.resize = () => {
      this.renderTimeLine(true);
    };

    window.addEventListener("resize", this.windowEvents.resize);
  }

  zoomCb() {
    this.renderTimeLine(true);
  }

  initOption(option: TimeLineOption) {
    traverseAssignObj(this, option);
  }

  initRootDom(el: MountedEl) {
    let parent = typeof el === "string" ? document.querySelector(el)! : el;
    if (!parent) {
      throw Error(`${el} 不存在`);
    }
    this.rootDom = document.createElement("div");
    this.rootDom.className = "time-line-container";
    parent.appendChild(this.rootDom);
  }

  setNowTime(nowTime: number) {
    this.nowTimeDate.setTime(nowTime);
    this.renderTimeLine();
  }

  render() {
    this.renderTimeLine(true);
    this.zoomTool.renderTimeLineZoomTool(this.rootDom);
  }

  renderTimeLine(force = false) {
    if (!this.timeLineWrapDom) {
      this.timeLineWrapDom = document.createElement("div");
      this.timeLineWrapDom.className = "time-line-wrap";
      this.timeLineWrapDom.innerHTML = `<div class="time-line-time-pick"></div>`;
      this.timeLineDom = document.createElement("div")!;
      this.timeLineDom.className = "time-line";
      this.timeLineWrapDom.appendChild(this.timeLineDom);

      this.timeHeightLightAreaWrapDom = document.createElement("div");
      this.timeHeightLightAreaWrapDom.className = "time-line-height-light-wrap";

      this.rootDom.appendChild(this.timeLineWrapDom);
    }
    const {
      timeLineDom,
      gapWidth,
      zoomTool,
      nowDayTime,
      repeatCount,
      itemLineWidth,
    } = this;
    const { oneUnitItemCount, zoomUnit } = zoomTool;

    const { index } = this.zoomTool.getInfoFromZoomTool(nowDayTime);

    if (!force && index === this.lastIndex) {
      this.translateTimeLine();
      return;
    } else {
      this.lastIndex = index;
    }
    const gapTime = this.zoomTool.getGapTime();

    timeLineDom.innerHTML = "";

    // 获取总宽度
    const itemCount = oneUnitItemCount! * repeatCount;
    let width = gapWidth * (itemCount - 1) + itemLineWidth;
    timeLineDom.style.width = `${width}px`;

    const frag = document.createDocumentFragment();

    // 渲染时间线
    for (let i = 0; i < itemCount; i++) {
      const dayTime =
        (index - 1 + Math.floor(i / oneUnitItemCount!)) * zoomUnit! +
        (i % oneUnitItemCount) * gapTime!;

      const div = this.renderTimeLineItem(dayTime, i !== itemCount - 1);
      // if (i !== itemCount - 1) {
      //   div.style.marginRight = `${gapWidth - itemLineWidth}px`;
      // }
      frag.appendChild(div);
    }

    timeLineDom.appendChild(frag);

    timeLineDom.appendChild(this.timeHeightLightAreaWrapDom);
    //
    this.translateTimeLine();
    this.renderHeightLightAreas();
  }

  renderHeightLightAreas() {
    const { heightLightAreas } = this;
    if (!heightLightAreas) {
      return;
    }
    const frag = document.createDocumentFragment();
    const {
      timeLineDom,
      gapWidth,
      zoomTool,
      nowDayTime,
      repeatCount,
      itemLineWidth,
    } = this;
    const { oneUnitItemCount, zoomUnit } = zoomTool;

    const { index } = this.zoomTool.getInfoFromZoomTool(nowDayTime);

    const gapTime = this.zoomTool.getGapTime();

    const itemCount = oneUnitItemCount! * repeatCount;
    const startItemIndex = 0;
    const startDayTime =
      (index - 1 + Math.floor(startItemIndex / oneUnitItemCount!)) * zoomUnit! +
      (startItemIndex % oneUnitItemCount) * gapTime!;

    const endItemIndex = itemCount - 1;
    const endDayTime =
      (index - 1 + Math.floor(endItemIndex / oneUnitItemCount!)) * zoomUnit! +
      (endItemIndex % oneUnitItemCount) * gapTime!;

    // console.log(startDayTime, endDayTime);

    const startTime = this.nowTime - nowDayTime + startDayTime;
    const endTime = this.nowTime - nowDayTime + endDayTime;

    for (let i = 0; i < heightLightAreas.length; i++) {
      const area = heightLightAreas[i];
      const [areaStartTime, areaEndTime] = area;

      const width = ((areaEndTime - areaStartTime) / gapTime!) * gapWidth;
      const left = ((areaStartTime - startTime) / gapTime!) * gapWidth;
      const div = document.createElement("div");
      div.className = "time-line-height-light-area";
      div.style.width = `${width}px`;
      div.style.left = `${left}px`;
      frag.appendChild(div);
    }
    this.timeHeightLightAreaWrapDom.innerHTML = "";
    this.timeHeightLightAreaWrapDom.appendChild(frag);
    return frag;
  }

  updateHeightLightAreas(heightLightAreas: number[][]) {
    this.heightLightAreas = heightLightAreas;
    this.renderHeightLightAreas();
  }

  renderTimeLineItem(dayTime: number, needSubItem: boolean) {
    const div = document.createElement("div");
    div.style.width = this.gapWidth + "px";
    div.className = "time-line-item";
    let subItemHtml = needSubItem
      ? `
    <div class="time-line-item-sub"></div>
    <div class="time-line-item-sub"></div>
    <div class="time-line-item-sub"></div>
    <div class="time-line-item-sub"></div>
    <div class="time-line-item-end"></div>
    `
      : "";
    div.innerHTML = `
      <div class="time-line-item-main"></div>
      ${subItemHtml}
      <p class="time-line-item-time">${this.dayTimeTextFormat(dayTime)}</p>
    `;
    return div;
  }

  translateTimeLine() {
    const nowDayTime = this.nowDayTime;

    const { offset } = this.zoomTool.getInfoFromZoomTool(nowDayTime);

    const { oneUnitItemCount, zoomUnit } = this.zoomTool;
    const { gapWidth } = this;

    let translateX = (1 + offset / zoomUnit) * oneUnitItemCount! * gapWidth!;

    let halfContainerWidth =
      parseInt(getComputedStyle(this.timeLineWrapDom).width) / 2;
    // console.log(halfContainerWidth);

    // console.log(offset / zoomUnit, translateX, halfContainerWidth);
    translateX = translateX - halfContainerWidth;

    // console.log("set", translateX);

    this.timeLineDom.style.transform = `translateX(-${translateX}px)`;
  }
}
