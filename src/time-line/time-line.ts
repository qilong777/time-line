import { oneDayTime } from "./constant";
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
  nowTime = 0.0 * oneDayTime;
  timeTextFormat = formatTime2Text;

  gapWidth = 150;
  itemLineWidth = 1;

  theme = defaultTheme;

  zoomTool = new TimeLineZoomTool();

  animation = defaultAnimation;

  // 根节点
  rootDom!: HTMLElement;

  timeLineDom!: HTMLElement;

  listeners: ListenersOption = {};

  private readonly repeatCount = 3;

  constructor(el: MountedEl, option: TimeLineOption) {
    this.initRootDom(el);
    this.initOption(option);

    this.render();

    this.zoomTool.injectZoomCb(this.zoomCb.bind(this));

    this.translateTimeLine();

    this.initEventListeners();
  }

  private initEventListeners() {
    this.initMouseWheelListener();
    this.initMouseDragListener();
  }

  private initMouseWheelListener() {
    let timer: any = null;
    this.rootDom.addEventListener("wheel", (event: WheelEvent) => {
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
    this.rootDom.addEventListener("mousedown", (event: MouseEvent) => {
      event.preventDefault();

      let couldMove = true;
      const gapTime = this.zoomTool.getGapTime();
      let startX = event.clientX;

      let startTranslateX = parseInt(
        getComputedStyle(this.timeLineDom).transform.split(",")[4]
      );
      const { oneUnitItemCount } = this.zoomTool;
      let { gapWidth, nowTime: startTime } = this;
      const oneUnitWidth = gapWidth * oneUnitItemCount;
      let halfContainerWidth =
        parseInt(getComputedStyle(this.rootDom).width) / 2;
      const mouseMove = (event: MouseEvent) => {
        // if (!couldMove) {
        //   return;
        // }
        let endX = event.clientX;
        const diffX = endX - startX;

        const diffTime = (diffX / gapWidth) * gapTime;
        let translateX = startTranslateX + diffX;
        this.nowTime = startTime - diffTime;
        if (this.nowTime < 0) {
          this.nowTime = oneDayTime + this.nowTime;
          this.listeners.prevDay && this.listeners.prevDay();
        }
        if (this.nowTime >= oneDayTime) {
          this.nowTime = this.nowTime % oneDayTime;

          this.listeners.nextDay && this.listeners.nextDay();
        }
        this.listeners.sliding && this.listeners.sliding(this.nowTime);
        if (translateX > -(oneUnitWidth - halfContainerWidth)) {
          this.renderTimeLine();
          this.translateTimeLine();
          startTranslateX = -(2 * oneUnitWidth - halfContainerWidth);
          startX = endX;
          startTime = oneDayTime;
          couldMove = false;
          return;
        } else if (translateX <= -(2 * oneUnitWidth - halfContainerWidth)) {
          this.renderTimeLine();
          this.translateTimeLine();
          startTranslateX = -(oneUnitWidth - halfContainerWidth);
          startX = endX;
          startTime = 0;
          couldMove = false;
          return;
        }

        this.timeLineDom.style.transform = `translateX(${translateX}px)`;
      };

      const mouseUp = (event: MouseEvent) => {
        window.removeEventListener("mousemove", mouseMove);
        window.removeEventListener("mouseup", mouseUp);
      };

      window.addEventListener("mousemove", mouseMove);
      window.addEventListener("mouseup", mouseUp);
    });
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
    this.rootDom.innerHTML = `
      <div class="time-line-time-pick"></div>
      
    `;
    parent.appendChild(this.rootDom);
  }

  setDayTime(nowTime: number) {
    this.nowTime = nowTime;
    this.render();
  }

  render() {
    this.renderTimeLine();
    this.zoomTool.renderTimeLineZoomTool(this.rootDom);
  }

  renderTimeLine() {
    if (!this.timeLineDom) {
      this.timeLineDom = document.createElement("div")!;
      this.timeLineDom.className = "time-line";
      this.rootDom.appendChild(this.timeLineDom);
    }
    const {
      timeLineDom,
      gapWidth,
      zoomTool,
      nowTime,
      repeatCount,
      itemLineWidth,
    } = this;
    const { oneUnitItemCount, zoomUnit } = zoomTool;

    const { index } = this.zoomTool.getInfoFromZoomTool(nowTime);
    const gapTime = this.zoomTool.getGapTime();

    timeLineDom.innerHTML = "";

    // 获取总宽度
    const itemCount = oneUnitItemCount! * repeatCount;
    let width = gapWidth * (itemCount - 1) + itemLineWidth;
    timeLineDom.style.width = `${width}px`;

    const frag = document.createDocumentFragment();
    for (let i = 0; i < itemCount; i++) {
      const time =
        (index - 1 + Math.floor(i / oneUnitItemCount!)) * zoomUnit! +
        (i % oneUnitItemCount) * gapTime!;

      const div = this.renderTimeLineItem(time, i);
      if (i !== itemCount - 1) {
        div.style.marginRight = `${gapWidth - itemLineWidth}px`;
      }
      frag.appendChild(div);
    }
    timeLineDom.appendChild(frag);
  }

  renderTimeLineItem(time: number, count: number) {
    const div = document.createElement("div");
    div.className = "time-line-item";
    div.innerHTML = `
      <div class="time-line-item-line"></div>
      <p class="time-line-item-time">${this.timeTextFormat(time)}</p>
    `;
    return div;
  }

  translateTimeLine() {
    const nowTime = this.nowTime;

    const { index, offset } = this.zoomTool.getInfoFromZoomTool(nowTime);

    const { oneUnitItemCount, zoomUnit } = this.zoomTool;
    const { gapWidth } = this;

    let translateX = (1 + offset / zoomUnit) * oneUnitItemCount! * gapWidth!;

    let halfContainerWidth = parseInt(getComputedStyle(this.rootDom).width) / 2;

    translateX = translateX - halfContainerWidth;

    this.timeLineDom.style.transform = `translateX(-${translateX}px)`;
  }
}
