// download from https://docs.opencv.org/4.4.0/opencv.js
import cv from "./lib/opencv.js";

let resolve;
const opencvPromise = new Promise((res) => {
  resolve = res;
});

cv.onRuntimeInitialized = () => {
  // console.log(cv.getBuildInformation());
  resolve();
};

export { opencvPromise };
