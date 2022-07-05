import { VideoCapture } from "camera-capture";
import Jimp from "jimp";
import notifier from "node-notifier";
import { readFileSync } from "node:fs";
import ImageUtil, { drawImg } from "./image-util.mjs";
import cv from "./lib/opencv.js";
import { opencvPromise } from "./opencv-promise.mjs";

await opencvPromise;

const imageData = await Jimp.read(readFileSync("./target.png"));
const mat = cv.matFromImageData(imageData.bitmap);

const imageUtil = new ImageUtil(mat);

const videoCapture = new VideoCapture({
  video: true,
  mime: "image/png",
});

await videoCapture.initialize();

const devicesList = await videoCapture.getDevicesList();

await videoCapture.startCamera({
  video: {
    deviceId: devicesList[3].deviceId,
  },
});

while (true) {
  await new Promise((resolve, reject) => {
    setTimeout(resolve, 3000);
  });

  let f = await videoCapture.readFrame("rgba"); // raw image data (as default)

  // drawImg(f, `./temp/webcam-${Date.now()}.jpg`);

  const mat = cv.matFromImageData(f);
  // const imageData = await Jimp.read(readFileSync("./test.png"));
  // const mat = cv.matFromImageData(imageData.bitmap);

  const result = await imageUtil.findImgRect(mat, true);

  if (result) {
    notifier.notify("👀📱🦆");
  }
}
