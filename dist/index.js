// import "./time-line/time-line.css";
import { TimeLineContainer } from "./time-line/time-line";
var timeLine = new TimeLineContainer("#app", {
    listeners: {
        sliding: function (nowTime) {
            // console.log("sliding", nowTime);
        },
        prevDay: function () {
            console.log("prevDay");
        },
        nextDay: function () {
            console.log("nextDay");
        },
    },
});
