export function calculateImageSize(numberImages) {
  let calc = new SizeCalculator();
  return calc.calculate(numberImages);
}

class SizeCalculator {
  constructor() {
    this.displayWidth = displayWidth();
    this.displayHeight = displayHeight();

    this.heightToWidthMult = 640/480;
    this.widthToHeightMult = 480/640;
  }

  calculate(numberImages) {
    let widthToHeightWindow = this.displayWidth / this.displayHeight;
    let ratio = (widthToHeightWindow / this.heightToWidthMult);

    this.numberImages = numberImages;

    if (numberImages == 1) {
      return this.optimize(1, 1);
    } else {
      let numInX = Math.round(Math.sqrt(numberImages));
      numInX = Math.round(numInX * ratio);
      let numInY = this.yGivenX(numberImages, numInX);
      return this.optimize(numInX, numInY, numberImages);
    }
  }

  optimize(x, y) {
    let largestArea = 0;
    let best = null;

    let measurements = [];
    for (let i = 1; i <= this.numberImages; i++) {
      let m = this.yIfLegal(i);
      if (m) {
        measurements.push(m);
      }
      let n = this.xIfLegal(i);
      if (n) {
        measurements.push(n);
      }
    }
    for (let i = 0; i < measurements.length; i++) {
      let measurement = measurements[i];
      if (measurement) {
        let a = measurement.width * measurement.height;
        if (a > largestArea) {
          largestArea = a;
          best = measurement;
        }
      }
    }

    return best;
  }

  yIfLegal(y) {
    let v = this.useY(y);
    if (this.isLegal(v, this.xGivenY(y), y)) {
      return v;
    } else {
      return null;
    }
  }

  xIfLegal(x) {
    let v = this.useX(x);
    if (this.isLegal(v, x, this.yGivenX(x))) {
      return v;
    } else {
      return null;
    }
  }

   yGivenX(x) {
    let numInY = Math.ceil(this.numberImages/x);
    if (numInY * x < this.numberImages) {
      return numInY + 1;
    } else {
      return numInY;
    }
  }

  xGivenY(y) {
    let numInX = Math.ceil(this.numberImages/y);
    if (numInX * y < this.numberImages) {
      return numInX + 1;
    } else {
      return numInX;
    }
  }

  isLegal(measurement, x, y) {
    return (measurement.width * x <= this.displayWidth
        && measurement.height * y <= this.displayHeight);
  }

  useX(x) {
    let allowedWidth = Math.min(640, this.displayWidth/x);
    return {
      width: allowedWidth,
      height: allowedWidth * this.widthToHeightMult
    };
  }

  useY(y) {
    let allowedHeight = Math.min(480, this.displayHeight/y);
    return {
      width: allowedHeight * this.heightToWidthMult,
      height: allowedHeight
    };
  }
}

function displayHeight() {
  let w = window,
      d = document,
      g = d.getElementsByTagName('body')[0];
  return (w.innerHeight || e.clientHeight|| g.clientHeight) - 60;
}

function displayWidth() {
  let w = window,
      d = document,
      g = d.getElementById('office-faces')[0];
  return (w.innerWidth || e.clientWidth || g.clientWidth) - 20;
}
