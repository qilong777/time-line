import "./time-line/time-line.css";
import { TimeLineContainer } from "./time-line/time-line";

const timeLine = new TimeLineContainer("#app", {
  listeners: {
    sliding: (nowTime: number) => {
      // console.log("sliding", nowTime);
    },
    prevDay: () => {
      console.log("prevDay");
    },
    nextDay: () => {
      console.log("nextDay");
    },
  },
});
