import { oneDayTime, oneHourTime } from "./constant";
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

const defaultZoomTool: ZoomTool = {
  // 是否展示
  show: true,

  bottom: 5,
  right: 5,

  // 缩放单位
  zoomUnit: oneDayTime,
  // 一个单位存在的时间戳个数
  oneUnitItemCount: 12,
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
  addHour = 8;
  nowTime = new Date().getTime();
  private nowDayTime = 0.0 * oneDayTime;

  // heightLightAreas = [
  //   [new Date().getTime(), new Date().getTime() + 1 * oneHourTime],
  //   [
  //     new Date().getTime() - 2 * oneHourTime,
  //     new Date().getTime() - 1 * oneHourTime,
  //   ],
  // ];
  heightLightAreas = [];
  dayTimeTextFormat = formatTime2Text;

  gapWidth = 90;
  itemLineWidth = 1;

  theme = defaultTheme;

  zoomTool = new TimeLineZoomTool();

  animation = defaultAnimation;

  // 根节点
  rootDom!: HTMLElement;

  timeLineWrapDom!: HTMLElement;
  timeLineDom!: HTMLElement;
  timeHeightLightAreaDom!: HTMLElement;

  listeners: ListenersOption = {};

  private readonly repeatCount = 3;

  private windowEvents: any = {};

  constructor(el: MountedEl, option: TimeLineOption) {
    this.initRootDom(el);
    this.initOption(option);

    this.setDayTimeFromNowTime();

    this.render();

    this.zoomTool.injectZoomCb(this.zoomCb.bind(this));

    this.translateTimeLine();

    this.initEventListeners();
  }

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

      let couldMove = true;
      const gapTime = this.zoomTool.getGapTime();
      let startX = event.clientX;

      let startTranslateX = parseInt(
        getComputedStyle(this.timeLineDom).transform.split(",")[4]
      );
      const { oneUnitItemCount } = this.zoomTool;
      let { gapWidth, nowTime: startTime, nowDayTime: startDayTime } = this;
      const oneUnitWidth = gapWidth * oneUnitItemCount;
      let halfContainerWidth =
        parseInt(getComputedStyle(this.timeLineWrapDom).width) / 2;
      const mouseMove = (event: MouseEvent) => {
        // if (!couldMove) {
        //   return;
        // }
        let endX = event.clientX;
        const diffX = endX - startX;

        const diffTime = (diffX / gapWidth) * gapTime;
        let translateX = startTranslateX + diffX;
        this.nowTime = startTime - diffTime;
        this.nowDayTime = startDayTime - diffTime;
        if (this.nowDayTime < 0) {
          this.nowDayTime = oneDayTime + this.nowDayTime;
          this.listeners.prevDay && this.listeners.prevDay();
        }
        if (this.nowDayTime >= oneDayTime) {
          this.nowDayTime = this.nowDayTime % oneDayTime;
          this.listeners.nextDay && this.listeners.nextDay();
        }
        this.listeners.sliding && this.listeners.sliding(this.nowDayTime);
        if (translateX > -(oneUnitWidth - halfContainerWidth)) {
          // console.log("右", formatTime2Text(this.nowDayTime));

          this.renderTimeLine();
          this.translateTimeLine();
          // startTranslateX = -(2 * oneUnitWidth - halfContainerWidth);
          startTranslateX = parseInt(
            getComputedStyle(this.timeLineDom).transform.split(",")[4]
          );
          startX = endX;
          startTime = this.nowTime;
          startDayTime = this.nowDayTime;
          couldMove = false;
          return;
        } else if (translateX < -(2 * oneUnitWidth - halfContainerWidth)) {
          // console.log("左", formatTime2Text(this.nowDayTime));
          this.renderTimeLine();
          this.translateTimeLine();
          // startTranslateX = -(oneUnitWidth - halfContainerWidth);
          startTranslateX = parseInt(
            getComputedStyle(this.timeLineDom).transform.split(",")[4]
          );
          startX = endX;
          startTime = this.nowTime;
          startDayTime = this.nowDayTime;
          couldMove = false;
          return;
        }
        // console.log("move", translateX);

        this.timeLineDom.style.transform = `translateX(${translateX}px)`;
      };

      const mouseUp = (event: MouseEvent) => {
        window.removeEventListener("mousemove", mouseMove);
        window.removeEventListener("mouseup", mouseUp);
        this.listeners.dateChange && this.listeners.dateChange(this.nowTime);
      };

      window.addEventListener("mousemove", mouseMove);
      window.addEventListener("mouseup", mouseUp);
    });
  }

  private initResizeListener() {
    this.windowEvents.resize = () => {
      this.translateTimeLine();
    };

    window.addEventListener("resize", this.windowEvents.resize);
  }

  zoomCb() {
    this.renderTimeLine();
    this.translateTimeLine();
  }

  initOption(option: TimeLineOption) {
    Object.assign(this, option);
    Object.assign(this.theme, defaultAnimation, option.theme);
    Object.assign(this.zoomTool, defaultZoomTool, option.zoomTool);
    Object.assign(this.animation, defaultAnimation, option.animation);
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
    this.nowTime = nowTime;
    this.setDayTimeFromNowTime();
    this.translateTimeLine();
  }

  private setDayTimeFromNowTime() {
    this.nowDayTime = (this.nowTime + this.addHour * oneHourTime) % oneDayTime;
  }

  render() {
    this.renderTimeLine();
    this.zoomTool.renderTimeLineZoomTool(this.rootDom);
  }

  renderTimeLine() {
    if (!this.timeLineWrapDom) {
      this.timeLineWrapDom = document.createElement("div");
      this.timeLineWrapDom.className = "time-line-wrap";
      this.timeLineWrapDom.innerHTML = `<div class="time-line-time-pick"></div>`;
      this.timeLineDom = document.createElement("div")!;
      this.timeLineDom.className = "time-line";
      this.timeLineWrapDom.appendChild(this.timeLineDom);

      this.timeHeightLightAreaDom = document.createElement("div");
      this.timeHeightLightAreaDom.className = "time-line-height-light-wrap";

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

    timeLineDom.appendChild(this.timeHeightLightAreaDom);
    //
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
    this.timeHeightLightAreaDom.innerHTML = "";
    this.timeHeightLightAreaDom.appendChild(frag);
    return frag;
  }

  updateHeightLightAreas(heightLightAreas: number[][]) {
    this.heightLightAreas = heightLightAreas;
    this.renderHeightLightAreas();
  }

  renderTimeLineItem(dayTime: number, needSubItem: boolean) {
    const div = document.createElement("div");
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
