import Jimp from "jimp";
import cv from "./lib/opencv.js";

export function drawImg(img, name) {
  new Jimp({
    width: img.cols || img.width,
    height: img.rows || img.height,
    data: Buffer.from(img.data),
  })
    .quality(90)
    .write(name);
}

export default class ImageUtil {
  constructor(mat) {
    this.canvasContent = mat;
  }

  async findImgRect(mat, shot) {
    const mask = new cv.Mat();
    let matchResultMat = new cv.Mat();
    let histCrop = new cv.Mat();
    let histTemplate = new cv.Mat();
    let cropMatVec = new cv.MatVector();
    let templateMatVec = new cv.MatVector();
    let logImg = new cv.Mat();
    let templateMask = new cv.Mat();
    let histMask = new cv.Mat();

    try {
      let input = mat;
      let template = this.canvasContent;
      templateMask = new cv.Mat();
      template.copyTo(templateMask);

      for (let i = 3; i < templateMask.data.length; i += 4) {
        let data = 0;
        if (templateMask.data[i] > 0) {
          data = 255;
        }

        templateMask.data[i] = data; // alpha
        templateMask.data[i - 1] = data;
        templateMask.data[i - 2] = data;
        templateMask.data[i - 3] = data;
      }

      cv.matchTemplate(
        input,
        template,
        matchResultMat,
        cv.TM_CCOEFF_NORMED
        // !!! mask will change to `new Mat()`
        // templateMask.clone()
      );
      let result = cv.minMaxLoc(matchResultMat, mask);
      let maxPoint = result.maxLoc;

      let color = new cv.Scalar(255, 0, 0, 255);
      let point = new cv.Point(
        maxPoint.x + template.cols,
        maxPoint.y + template.rows
      );

      if (shot) {
        input.copyTo(logImg);
        // template.copyTo(logImg)
        cv.rectangle(logImg, maxPoint, point, color, 2, cv.LINE_8, 0);
        // drawImg(logImg, `./temp/findImgRect-${Date.now()}.jpg`);
      }

      let rect = new cv.Rect(
        maxPoint.x,
        maxPoint.y,
        template.cols,
        template.rows
      );

      let inputCrop = input.roi(rect);

      cropMatVec.push_back(inputCrop);
      templateMatVec.push_back(template);
      cv.cvtColor(templateMask, histMask, cv.COLOR_RGBA2GRAY, 0);

      cv.calcHist(
        cropMatVec,
        [0, 1, 2],
        histMask,
        histCrop,
        [8, 8, 8],
        [0, 256, 0, 256, 0, 256],
        false
      );

      cv.calcHist(
        templateMatVec,
        [0, 1, 2],
        histMask,
        histTemplate,
        [8, 8, 8],
        [0, 256, 0, 256, 0, 256],
        false
      );

      let colorHist = cv.compareHist(histCrop, histTemplate, cv.HISTCMP_CORREL);
      if (result.maxVal > 0.6 && colorHist > 0.7) {
        // find
        input.copyTo(logImg);
        cv.rectangle(logImg, maxPoint, point, color, 2, cv.LINE_8, 0);
        drawImg(logImg, `./temp/click-findImgRect-${Date.now()}.jpg`);
        return {
          ...rect,
          x: rect.x - input.cols / 2,
          y: rect.y - input.rows / 2,
        };
      }
      return false;
    } catch (error) {
      console.error(error);
    } finally {
      mask.delete();
      matchResultMat.delete();
      histCrop.delete();
      histTemplate.delete();
      cropMatVec.delete();
      templateMatVec.delete();
      logImg.delete();
      templateMask.delete();
      histMask.delete();
    }
  }
}
