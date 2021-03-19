/**
 * Code by Kıraç Armağan Önal (thearmagan.github.io)
 */

const appElm = document.querySelector("#app");

const infoElms = {
  low: document.querySelector(".info.right .low"),
  mid: document.querySelector(".info.right .mid"),
  hig: document.querySelector(".info.right .hig"),
  max: document.querySelector(".info.right .max"),
  other: document.querySelector(".info.left .other")
}

const debugElms = document.querySelectorAll(".debug");
const ballElm = document.querySelector(".middle-ball");

const barElms = {
  left: document.querySelector(".bars.left"),
  right: document.querySelector(".bars.right")
};

let directions = ["left", "right"];

directions.forEach((direction) => {
  for (let i = 0; i < 64; i++) {
    const span = document.createElement("span");
    span.classList.add("bar", `bar-${direction}-${i}`);
    barElms[direction].appendChild(span);
  }
});


let isShowing = true;
let lastSum = 0;
let sumChangedAt = 0;
let debugMode = 0;

const config = {};

function onConfigChange(_config) {
  
  Object.entries(_config).forEach(([key, value]) => {
    if (key.startsWith("_")) return;
    switch (value?.type) {
      case "color": {
        try {
          let values = value.value.split(" ").map(i => Number((Number(i) * 255).toFixed(0)));
          config[key] = `rgb(${values?.[0]}, ${values?.[1]}, ${values?.[2]})`;
          config[key + "RGB"] = values;
        } catch {
          config[key] = "";
          config[key + "RGB"].rgb = [0, 0, 0];
        }
        break;
      };
      case "file": {
        config[key] = !!value?.value ? `file:///${value?.value}` : "";
        break;
      };
      default: {
        config[key] = value?.value;
      }
    }

  })


  switch (config.backgroundMode) {
    case "CUSTOM_COLOR": {
      appElm.setAttribute("style", `background-color: ${config.backgroundColor}`);
      break;
    }
    case "CUSTOM_IMAGE": {
      appElm.setAttribute("style", `background-image: url('${config.backgroundImage}');`);
      break;
    }
  }

  switch (config.ballBackgroundMode) {
    case "CUSTOM_IMAGE": {
      ballElm.setAttribute("style", `background-image: url('${config.ballBackgroundImage}');`);
      break;
    }
    case "CUSTOM_COLOR": {
      ballElm.setAttribute("style", "");
      break;
    }
  }

  if (config.barsHide) {
    gsap.to(".bars", {
      opacity: 0
    })
  } else {
    gsap.to(".bars", {
      opacity: 1
    })
  }

  console.log(config);
}

/**
* @param {Array<Number>} audioArray 
*/
function onAudio(audioArray) {
  let maxVolume = Math.max(...audioArray);
  audioArray = normalize(audioArray);
  let audio = processAudio(audioArray);

  if (audio.sum == 0) return;

  let isLoud = maxVolume > 0.05;

  if (debugMode == 1 || debugMode == 3) {
    infoElms.other.style.display = "block";
    infoElms.other.innerHTML = `Wallpaper By TheArmagan<br/>${Array(64).fill("").map((_, i) => `${i.toString().padStart(2, "0")} &gt; ${(audio.left[i] * 100).toFixed(0).toString().padStart(3, '_')} ${(audio.middle[i] * 100).toFixed(0).toString().padStart(3, '_')} ${(audio.right[i] * 100).toFixed(0).toString().padStart(3, '_')}`).join("<br>")}<br>Sum > ${(audio.sum * 100).toFixed(0)}`;
  } else {
    infoElms.other.style.display = "none";
  }

  if (debugMode == 2 || debugMode == 3) {
    infoElms.low.style.display = "block";
    infoElms.mid.style.display = "block";
    infoElms.hig.style.display = "block";
    infoElms.max.style.display = "block";

    infoElms.low.textContent = `${audio.LOW.toFixed(3)} LOW`
    gsap.to(infoElms.low, {
      color: `hsl(1, 50%, ${100 - audio.LOW * 50}%)`,
      duration: 0.1
    })
    infoElms.mid.textContent = `${audio.MID.toFixed(3)} MID`
    gsap.to(infoElms.mid, {
      color: `hsl(39, 50%, ${100 - audio.MID * 50}%)`,
      duration: 0.1
    })
    infoElms.hig.textContent = `${audio.HIG.toFixed(3)} HIG`
    gsap.to(infoElms.hig, {
      color: `hsl(120, 50%, ${100 - audio.HIG * 50}%)`,
      duration: 0.1
    });
    infoElms.max.textContent = `${maxVolume.toFixed(3)} MAX`;
    gsap.to(infoElms.max, {
      color: `rgb(255,255,255,${maxVolume})`,
      duration: 0.1
    });
  } else {
    infoElms.low.style.display = "none";
    infoElms.mid.style.display = "none";
    infoElms.hig.style.display = "none";
    infoElms.max.style.display = "none";
  }

  if (lastSum != audio.sum) {
    sumChangedAt = performance.now();
  }
  lastSum = audio.sum;


  let shouldShow = !(performance.now() - sumChangedAt > 100);

  if (shouldShow != isShowing) {
    isShowing = shouldShow;
    if (shouldShow) {
      gsap.to(".visualizers", { opacity: "1", duration: 1 });
    } else {
      gsap.to(".visualizers", { opacity: "0", duration: 0.1 });
    }
  }

  if (!shouldShow) return;

  // 85

  gsap.to(".middle-ball", {
    boxShadow: `
    0px 0px ${6 + audio.LOW * 36}px ${Math.min(Math.max(1, maxVolume * 2), 2) + audio.LOW}px ${config.ballGlowColor},
    inset 0px 0px 0px ${Math.min(Math.max(1, maxVolume * 6), 2) + audio.LOW * 4}px rgba(${config.ballGlowColorRGB[0]}, ${config.ballGlowColorRGB[1]}, ${config.ballGlowColorRGB[2]}, 85),
    inset 0px 0px ${audio.LOW * 60}px ${Math.min(Math.max(1, maxVolume * 6), 2) + audio.LOW * 10}px ${config.ballGlowColor}
    `,
    scale: `${1 + audio.LOW / 4}`,
    duration: 0.1,
    ease: "linear"
  });

  gsap.to(".middle-ball", {
    opacity: `${config.ballDoNotHide ? 1 : isLoud ? Math.min(maxVolume * 10, 1) : 0}`,
    duration: 1,
    ease: "linear"
  });

  gsap.to(".middle-ball", {
    x: audio.HIG > 0.3 ? (audio.LOW > 0.4 ? RD(R(0, audio.HIG * 10)) : RD(R(0, audio.HIG * 6))) : 0,
    y: audio.HIG > 0.3 ? (audio.LOW > 0.4 ? RD(R(0, audio.HIG * 10)) : RD(R(0, audio.HIG * 6))) : 0,

    backgroundColor: config.ballBackgroundTransparent ? "#00000000" : config.ballBackgroundColor,
    duration: 0
  });

  if (!config.barsHide) {
    let sat = config.barsDoNotChangeSatAndLight ? config.barsSaturation : NaNSafe(Math.min((isLoud ? 30 : 20) + maxVolume * 30, 50) + audio.LOW * 10);
    let light = config.barsDoNotChangeSatAndLight ? config.barsLight : NaNSafe(((isLoud ? 30 : 20) + maxVolume * 30) + audio.LOW * 10);

    directions.forEach((direction) => {
      audio[direction].forEach((volume, index) => {
        let selector = `.bar-${direction}-${index}`;
        gsap.to(selector, {
          height: `${(16 + (volume * ((innerHeight / (isLoud ? 4 : 8)) - 16))) + audio.LOW * 16}`,
          duration: 0.1,
          ease: "linear"
        });
        gsap.to(selector, {
          backgroundColor: `hsl(${NaNSafe(190 - (volume * 360))}, ${sat}%, ${light}%)`,
          duration: 1,
          ease: "linear"
        });
      })
    })
  }

}

/**
* @param {Array<Number>} audioArray
*/
function processAudio(audioArray) {
  let left = new Float32Array(audioArray.slice(0, 64));
  let right = new Float32Array(audioArray.slice(64, 128));
  let middle = new Float32Array(left.reduce((all, current, index) => { all.push((current + right[index]) / 2); return all; }, []));
  let LOW = ((middle[1] + middle[2] + middle[3] + middle[4]) / 4);
  let MID = ((middle[30] + middle[31] + middle[32]) / 3);
  let HIG = ((middle[59] + middle[60] + middle[61] + middle[62]) / 4);


  let sum = NaNSafe(audioArray.reduce((all, current) => all + current, 0));

  return { left, right, middle, sum, LOW, MID, HIG };
}

/**
* @param {Array<Number>} audioArray
*/
function normalize(audioArray, by = 1) {
  const ratio = Math.max(...audioArray) / by;
  return audioArray.map(i => i / ratio);
}

/**
 * 
 * @param {Number} v Value
 * @param {Number} f Fallback
 */
function NaNSafe(v, f=0) {
  if (isNaN(v)) return f;
  return v;
}

/** Random Number */
function R(max, min) { return Math.random() * (max - min) + min };
/** Random Number Direction */
function RD(val) {
  return Math.random() > 0.5 ? val*-1 : val
}






window.wallpaperRegisterAudioListener(onAudio);
window.wallpaperPropertyListener = {applyUserProperties: onConfigChange};
