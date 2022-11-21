import "./time-line/time-line.css";
import { TimeLineContainer } from "./time-line/time-line";
import { oneHourTime } from "./time-line/constant";

const timeLine = new TimeLineContainer("#app", {
  gapWidth: 90,
  nowTime: new Date().getTime(),
  heightLightAreas: [
    [new Date().getTime(), new Date().getTime() + 1 * oneHourTime],
    [
      new Date().getTime() - 2 * oneHourTime,
      new Date().getTime() - 1 * oneHourTime,
    ],
  ],
  listeners: {
    dateChange(time: number) {
      let date = new Date(time);
      let hour = date.getHours();
      let minute = date.getMinutes();
      let second = date.getSeconds();
      let day = date.getDate();
      let month = date.getMonth() + 1;
      let year = date.getFullYear();
      console.log(`${year}-${month}-${day} ${hour}:${minute}:${second}`);
      console.log("dateChange", new Date(time));
    },
    prevDay: () => {
      console.log("prevDay");
    },
    nextDay: () => {
      console.log("nextDay");
    },
  },
});
