import "./time-line/time-line.css";
import { TimeLineContainer } from "./time-line/time-line";
import { oneHourTime } from "./time-line/constant";
const timeLine = new TimeLineContainer("#app", {
    nowTimeDate: new Date(),
    heightLightAreas: [
        [new Date().getTime(), new Date().getTime() + 1 * oneHourTime],
        [
            new Date().getTime() - 2 * oneHourTime,
            new Date().getTime() - 1 * oneHourTime,
        ],
    ],
    listeners: {
        dateChangeStart() {
            console.log("dateChangeStart");
        },
        dateChangeEnd(time) {
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
            console.log(timeLine.nowTimeDate);
            console.log("prevDay");
        },
        nextDay: () => {
            console.log(timeLine.nowTimeDate);
            console.log("nextDay");
        },
    },
});
console.log(timeLine);
setInterval(() => {
    timeLine.setNowTime(new Date().getTime());
}, 200);
const change = function () {
    console.log(new Date(timeLine.nowTime + 1000 * 60));
    timeLine.setNowTime(timeLine.nowTime + 1000 * 60);
};
document.querySelector("#button").addEventListener("click", change);
