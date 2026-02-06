const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const canvasWrap = canvas.parentElement;

const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const fileMeta = document.getElementById("fileMeta");
const cropToggle = document.getElementById("cropToggle");
const cropSelect = document.getElementById("cropSelect");
const applyCropBtn = document.getElementById("applyCrop");
const resetCropBtn = document.getElementById("resetCrop");
const cropMeta = document.getElementById("cropMeta");
const ratioSelect = document.getElementById("ratioSelect");
const customRatio = document.getElementById("customRatio");
const customW = document.getElementById("customW");
const customH = document.getElementById("customH");
const ratioMeta = document.getElementById("ratioMeta");
const imageOffset = document.getElementById("imageOffset");
const offsetMeta = document.getElementById("offsetMeta");
const watermarkToggle = document.getElementById("watermarkToggle");
const watermarkInput = document.getElementById("watermarkInput");
const watermarkMeta = document.getElementById("watermarkMeta");
const wmXRange = document.getElementById("wmXRange");
const wmXInput = document.getElementById("wmXInput");
const wmYRange = document.getElementById("wmYRange");
const wmYInput = document.getElementById("wmYInput");
const wmScaleRange = document.getElementById("wmScaleRange");
const wmScaleInput = document.getElementById("wmScaleInput");
const wmOpacityRange = document.getElementById("wmOpacityRange");
const wmOpacityInput = document.getElementById("wmOpacityInput");
const barColor = document.getElementById("barColor");
const barOpacity = document.getElementById("barOpacity");
const styleMeta = document.getElementById("styleMeta");
const downloadBtn = document.getElementById("downloadBtn");
const barInfo = document.getElementById("barInfo");
const placeholder = document.getElementById("placeholder");

const state = {
  image: null,
  imageName: "",
  cropEnabled: true,
  cropAspect: null,
  cropRect: null,
  drag: null,
  barRatio: 2.39,
  barColor: "#0b0b0b",
  barOpacity: 1,
  imageOffsetY: 0,
  watermarkEnabled: false,
  watermarkImage: null,
  watermarkName: "",
  watermarkSize: 0,
  watermarkOffsetX: 0,
  watermarkOffsetY: 0,
  watermarkScale: 100,
  watermarkOpacity: 0.8,
  fitRect: null,
};

const handles = [
  "nw",
  "n",
  "ne",
  "e",
  "se",
  "s",
  "sw",
  "w",
];

const handleSize = 10;
const minCropSize = 40;
const idlePreviewHeight = 420;
const minPreviewHeight = 260;
const maxPreviewHeight = 820;

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let index = 0;
  let value = bytes;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(1)} ${units[index]}`;
}

function updateCanvasWrapHeight() {
  const width = canvasWrap.clientWidth;
  if (!width) return;
  let target = idlePreviewHeight;
  if (state.image) {
    const ratio = state.image.width / state.image.height;
    target = Math.round(width / ratio);
    const maxH = Math.min(window.innerHeight * 0.7, maxPreviewHeight);
    target = Math.max(minPreviewHeight, Math.min(target, maxH));
  }
  const current = canvasWrap.getBoundingClientRect().height;
  if (Math.abs(current - target) > 1) {
    canvasWrap.style.height = `${target}px`;
  }
}

function resizeCanvas() {
  updateCanvasWrapHeight();
  const rect = canvas.parentElement.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (state.image && state.cropRect && state.fitRect) {
    const oldFit = state.fitRect;
    const nextFit = computeFitRect();
    if (nextFit) {
      const scale = oldFit.w / state.image.width;
      const sx = (state.cropRect.x - oldFit.x) / scale;
      const sy = (state.cropRect.y - oldFit.y) / scale;
      const sw = state.cropRect.w / scale;
      const sh = state.cropRect.h / scale;
      const newScale = nextFit.w / state.image.width;
      state.cropRect = {
        x: nextFit.x + sx * newScale,
        y: nextFit.y + sy * newScale,
        w: sw * newScale,
        h: sh * newScale,
      };
      state.fitRect = nextFit;
      updateCropMeta();
    }
  }
  draw();
}

function computeFitRect() {
  if (!state.image) return null;
  const cw = canvas.clientWidth;
  const ch = canvas.clientHeight;
  const iw = state.image.width;
  const ih = state.image.height;
  const scale = Math.min(cw / iw, ch / ih);
  const w = iw * scale;
  const h = ih * scale;
  const x = (cw - w) / 2;
  const y = (ch - h) / 2;
  return { x, y, w, h, scale };
}

function initCropRect() {
  if (!state.image) return;
  const fit = computeFitRect();
  if (!fit) return;
  state.fitRect = fit;
  let w = fit.w * 0.8;
  let h = fit.h * 0.8;
  if (state.cropAspect) {
    if (w / h > state.cropAspect) {
      w = h * state.cropAspect;
    } else {
      h = w / state.cropAspect;
    }
  }
  const x = fit.x + (fit.w - w) / 2;
  const y = fit.y + (fit.h - h) / 2;
  state.cropRect = { x, y, w, h };
}

function clampRect(rect, bounds) {
  let { x, y, w, h } = rect;
  w = Math.min(w, bounds.w);
  h = Math.min(h, bounds.h);
  x = Math.min(Math.max(x, bounds.x), bounds.x + bounds.w - w);
  y = Math.min(Math.max(y, bounds.y), bounds.y + bounds.h - h);
  return { x, y, w, h };
}

function resizeRect(start, handle, dx, dy, aspect) {
  let x = start.x;
  let y = start.y;
  let w = start.w;
  let h = start.h;
  const hasE = handle.includes("e");
  const hasW = handle.includes("w");
  const hasN = handle.includes("n");
  const hasS = handle.includes("s");

  if (aspect) {
    const signX = hasE ? 1 : hasW ? -1 : 0;
    const signY = hasS ? 1 : hasN ? -1 : 0;

    if ((hasE || hasW) && (hasN || hasS)) {
      if (Math.abs(dy) > Math.abs(dx)) {
        h = start.h + signY * dy;
        w = h * aspect;
      } else {
        w = start.w + signX * dx;
        h = w / aspect;
      }
    } else if (hasE || hasW) {
      w = start.w + signX * dx;
      h = w / aspect;
    } else if (hasN || hasS) {
      h = start.h + signY * dy;
      w = h * aspect;
    }

    w = Math.max(w, minCropSize);
    h = Math.max(h, minCropSize);

    if (hasW) x = start.x + (start.w - w);
    if (hasN) y = start.y + (start.h - h);
    if (!hasW && !hasE) x = start.x + (start.w - w) / 2;
    if (!hasN && !hasS) y = start.y + (start.h - h) / 2;
  } else {
    if (hasE) w = start.w + dx;
    if (hasS) h = start.h + dy;
    if (hasW) {
      w = start.w - dx;
      x = start.x + dx;
    }
    if (hasN) {
      h = start.h - dy;
      y = start.y + dy;
    }

    w = Math.max(w, minCropSize);
    h = Math.max(h, minCropSize);
  }

  return { x, y, w, h };
}

function getHandlePositions(rect) {
  const { x, y, w, h } = rect;
  return {
    nw: { x, y },
    n: { x: x + w / 2, y },
    ne: { x: x + w, y },
    e: { x: x + w, y: y + h / 2 },
    se: { x: x + w, y: y + h },
    s: { x: x + w / 2, y: y + h },
    sw: { x, y: y + h },
    w: { x, y: y + h / 2 },
  };
}

function getHandleAt(px, py, rect) {
  const positions = getHandlePositions(rect);
  for (const key of handles) {
    const pos = positions[key];
    if (
      Math.abs(px - pos.x) <= handleSize &&
      Math.abs(py - pos.y) <= handleSize
    ) {
      return key;
    }
  }
  return null;
}

function pointInRect(px, py, rect) {
  return (
    px >= rect.x &&
    px <= rect.x + rect.w &&
    py >= rect.y &&
    py <= rect.y + rect.h
  );
}

function getCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function drawHandles(rect) {
  ctx.save();
  ctx.fillStyle = "#f5f3f0";
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.lineWidth = 1;
  const positions = getHandlePositions(rect);
  for (const key of handles) {
    const { x, y } = positions[key];
    ctx.beginPath();
    ctx.rect(x - 5, y - 5, 10, 10);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function hexToRgba(hex, alpha) {
  const normalized = hex.replace("#", "");
  const value = parseInt(normalized, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function computeBars(width, height, ratio) {
  if (!ratio) return null;
  const current = width / height;
  if (Math.abs(current - ratio) < 0.001) return null;
  if (current > ratio) {
    const visibleW = height * ratio;
    const bar = (width - visibleW) / 2;
    return { type: "pillar", size: bar };
  }
  const visibleH = width / ratio;
  const bar = (height - visibleH) / 2;
  return { type: "letter", size: bar };
}

function draw() {
  const cw = canvas.clientWidth;
  const ch = canvas.clientHeight;
  ctx.clearRect(0, 0, cw, ch);

  if (!state.image) {
    placeholder.classList.remove("hidden");
    barInfo.textContent = "未加载";
    return;
  }

  placeholder.classList.add("hidden");
  const fit = computeFitRect();
  state.fitRect = fit;

  const drawH = fit.h;
  const drawY = fit.y + (state.imageOffsetY / 100) * fit.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(fit.x, fit.y, fit.w, fit.h);
  ctx.clip();
  ctx.drawImage(state.image, fit.x, drawY, fit.w, drawH);
  ctx.restore();

  const bars = computeBars(state.image.width, state.image.height, state.barRatio);
  if (bars) {
    ctx.save();
    ctx.fillStyle = hexToRgba(state.barColor, state.barOpacity);
    const scale = fit.w / state.image.width;
    if (bars.type === "letter") {
      const barH = bars.size * scale;
      ctx.fillRect(fit.x, fit.y, fit.w, barH);
      ctx.fillRect(fit.x, fit.y + fit.h - barH, fit.w, barH);
    } else {
      const barW = bars.size * scale;
      ctx.fillRect(fit.x, fit.y, barW, fit.h);
      ctx.fillRect(fit.x + fit.w - barW, fit.y, barW, fit.h);
    }
    ctx.restore();
  }

  if (state.watermarkEnabled && state.watermarkImage) {
    const scale = fit.w / state.image.width;
    const wmScale = state.watermarkScale / 100;
    const drawW = state.watermarkImage.width * scale * wmScale;
    const drawH = state.watermarkImage.height * scale * wmScale;
    const centerX = fit.x + fit.w / 2;
    const centerY = fit.y + fit.h / 2;
    const offsetX = (state.watermarkOffsetX / 100) * fit.w;
    const offsetY = (state.watermarkOffsetY / 100) * fit.h;
    const x = centerX - drawW / 2 + offsetX;
    const y = centerY - drawH / 2 + offsetY;
    ctx.save();
    ctx.beginPath();
    ctx.rect(fit.x, fit.y, fit.w, fit.h);
    ctx.clip();
    ctx.globalAlpha = state.watermarkOpacity;
    ctx.drawImage(state.watermarkImage, x, y, drawW, drawH);
    ctx.restore();
  }

  if (state.cropEnabled && state.cropRect) {
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.beginPath();
    ctx.rect(0, 0, cw, ch);
    ctx.rect(state.cropRect.x, state.cropRect.y, state.cropRect.w, state.cropRect.h);
    ctx.fill("evenodd");
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = "rgba(245, 243, 240, 0.85)";
    ctx.lineWidth = 2;
    ctx.strokeRect(state.cropRect.x, state.cropRect.y, state.cropRect.w, state.cropRect.h);
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(state.cropRect.x + state.cropRect.w / 3, state.cropRect.y);
    ctx.lineTo(state.cropRect.x + state.cropRect.w / 3, state.cropRect.y + state.cropRect.h);
    ctx.moveTo(state.cropRect.x + (state.cropRect.w / 3) * 2, state.cropRect.y);
    ctx.lineTo(state.cropRect.x + (state.cropRect.w / 3) * 2, state.cropRect.y + state.cropRect.h);
    ctx.moveTo(state.cropRect.x, state.cropRect.y + state.cropRect.h / 3);
    ctx.lineTo(state.cropRect.x + state.cropRect.w, state.cropRect.y + state.cropRect.h / 3);
    ctx.moveTo(state.cropRect.x, state.cropRect.y + (state.cropRect.h / 3) * 2);
    ctx.lineTo(state.cropRect.x + state.cropRect.w, state.cropRect.y + (state.cropRect.h / 3) * 2);
    ctx.stroke();
    ctx.restore();

    drawHandles(state.cropRect);
  }
}

function updateFileMeta() {
  if (!state.image) {
    fileMeta.textContent = "尚未选择图片";
    return;
  }
  fileMeta.textContent = `${state.imageName} · ${state.image.width}×${state.image.height}`;
}

function updateCropMeta() {
  if (!state.image) {
    cropMeta.textContent = "等待图片";
    return;
  }
  if (!state.cropEnabled) {
    cropMeta.textContent = "裁切已关闭";
    return;
  }
  if (!state.cropRect || !state.fitRect) {
    cropMeta.textContent = "等待图片";
    return;
  }
  const scale = state.fitRect.w / state.image.width;
  const w = Math.round(state.cropRect.w / scale);
  const h = Math.round(state.cropRect.h / scale);
  cropMeta.textContent = `裁切区域 ${w}×${h}px`;
}

function updateRatioMeta() {
  if (!state.image) {
    ratioMeta.textContent = "等待图片";
    return;
  }
  const current = (state.image.width / state.image.height).toFixed(2);
  ratioMeta.textContent = `原图比例 ${current}:1`;
}

function updateOffsetMeta() {
  const value = Math.round(state.imageOffsetY);
  offsetMeta.textContent = `偏移 ${value}%`;
}

function clamp(value, min, max) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function updateWatermarkMeta() {
  if (!state.watermarkEnabled) {
    watermarkMeta.textContent = "水印已关闭";
    return;
  }
  if (!state.watermarkImage) {
    watermarkMeta.textContent = "未选择水印";
    return;
  }
  watermarkMeta.textContent = `${state.watermarkName} · ${state.watermarkImage.width}×${state.watermarkImage.height} · ${formatBytes(state.watermarkSize)}`;
}

function updateWatermarkControls() {
  const enabled = state.watermarkEnabled;
  watermarkInput.disabled = !enabled;
  const adjustDisabled = !enabled || !state.watermarkImage;
  const inputs = [
    wmXRange,
    wmXInput,
    wmYRange,
    wmYInput,
    wmScaleRange,
    wmScaleInput,
    wmOpacityRange,
    wmOpacityInput,
  ];
  inputs.forEach((input) => {
    input.disabled = adjustDisabled;
  });
}

function setWatermarkEnabled(enabled) {
  state.watermarkEnabled = enabled;
  updateWatermarkControls();
  updateWatermarkMeta();
  draw();
}

function setWatermarkOffsetX(value) {
  state.watermarkOffsetX = value;
  wmXRange.value = value;
  wmXInput.value = value;
  draw();
}

function setWatermarkOffsetY(value) {
  state.watermarkOffsetY = value;
  wmYRange.value = value;
  wmYInput.value = value;
  draw();
}

function setWatermarkScale(value) {
  state.watermarkScale = value;
  wmScaleRange.value = value;
  wmScaleInput.value = value;
  draw();
}

function setWatermarkOpacity(value) {
  state.watermarkOpacity = value / 100;
  wmOpacityRange.value = value;
  wmOpacityInput.value = value;
  draw();
}

function updateStyleMeta() {
  styleMeta.textContent = `不透明度 ${Math.round(state.barOpacity * 100)}%`;
}

function updateBarInfo() {
  if (!state.image) {
    barInfo.textContent = "未加载";
    return;
  }
  const bars = computeBars(state.image.width, state.image.height, state.barRatio);
  if (!bars) {
    barInfo.textContent = "无需遮幅";
    return;
  }
  const size = Math.round(bars.size);
  if (bars.type === "letter") {
    barInfo.textContent = `上下遮幅 ${size}px`;
  } else {
    barInfo.textContent = `左右遮幅 ${size}px`;
  }
}

function setControlsEnabled(enabled) {
  applyCropBtn.disabled = !enabled || !state.cropEnabled;
  resetCropBtn.disabled = !enabled || !state.cropEnabled;
  downloadBtn.disabled = !enabled;
}

function handleImage(file) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    URL.revokeObjectURL(url);
    state.image = img;
    state.imageName = file.name;
    updateCanvasWrapHeight();
    if (state.cropEnabled) {
      initCropRect();
    } else {
      state.cropRect = null;
    }
    updateFileMeta();
    updateCropMeta();
    updateRatioMeta();
    updateBarInfo();
    setControlsEnabled(true);
    resizeCanvas();
  };
  img.src = url;
}

function handleWatermarkFile(file) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    URL.revokeObjectURL(url);
    state.watermarkImage = img;
    state.watermarkName = file.name;
    state.watermarkSize = file.size;
    updateWatermarkControls();
    updateWatermarkMeta();
    draw();
  };
  img.src = url;
}

function applyCrop() {
  if (!state.image || !state.cropEnabled || !state.cropRect || !state.fitRect) return;
  const scale = state.fitRect.w / state.image.width;
  let sx = (state.cropRect.x - state.fitRect.x) / scale;
  let sy = (state.cropRect.y - state.fitRect.y) / scale;
  let sw = state.cropRect.w / scale;
  let sh = state.cropRect.h / scale;

  sx = Math.max(0, Math.round(sx));
  sy = Math.max(0, Math.round(sy));
  sw = Math.min(state.image.width - sx, Math.round(sw));
  sh = Math.min(state.image.height - sy, Math.round(sh));

  const offscreen = document.createElement("canvas");
  offscreen.width = sw;
  offscreen.height = sh;
  const offCtx = offscreen.getContext("2d");
  offCtx.drawImage(state.image, sx, sy, sw, sh, 0, 0, sw, sh);

  const newImg = new Image();
  newImg.onload = () => {
    state.image = newImg;
    state.imageName = `${state.imageName.replace(/\.[^.]+$/, "")}-crop.png`;
    updateCanvasWrapHeight();
    initCropRect();
    updateFileMeta();
    updateCropMeta();
    updateRatioMeta();
    updateBarInfo();
    resizeCanvas();
  };
  newImg.src = offscreen.toDataURL("image/png");
}

function resetCrop() {
  if (!state.image) return;
  if (!state.cropEnabled) return;
  initCropRect();
  updateCropMeta();
  draw();
}

function setCropEnabled(enabled) {
  state.cropEnabled = enabled;
  cropSelect.disabled = !enabled;
  canvas.style.cursor = "default";
  if (!enabled) {
    state.cropRect = null;
    state.drag = null;
  } else if (state.image) {
    initCropRect();
  }
  setControlsEnabled(!!state.image);
  updateCropMeta();
  draw();
}

function updateCropAspect() {
  const value = cropSelect.value;
  if (value === "free") {
    state.cropAspect = null;
  } else if (value.includes(":")) {
    const [w, h] = value.split(":").map(Number);
    state.cropAspect = w / h;
  } else {
    state.cropAspect = parseFloat(value);
  }
  if (state.cropEnabled && state.image) {
    initCropRect();
  }
  updateCropMeta();
  draw();
}

function updateBarRatio() {
  if (ratioSelect.value === "custom") {
    customRatio.classList.remove("hidden");
  } else {
    customRatio.classList.add("hidden");
  }

  let ratio;
  if (ratioSelect.value === "custom") {
    const w = parseFloat(customW.value) || 1;
    const h = parseFloat(customH.value) || 1;
    ratio = w / h;
  } else {
    ratio = parseFloat(ratioSelect.value);
  }
  state.barRatio = ratio;
  updateBarInfo();
  draw();
}

function downloadImage() {
  if (!state.image) return;
  const output = document.createElement("canvas");
  output.width = state.image.width;
  output.height = state.image.height;
  const outCtx = output.getContext("2d");
  const drawH = output.height;
  const drawY = (state.imageOffsetY / 100) * output.height;
  outCtx.drawImage(state.image, 0, drawY, output.width, drawH);

  const bars = computeBars(state.image.width, state.image.height, state.barRatio);
  if (bars) {
    outCtx.fillStyle = hexToRgba(state.barColor, state.barOpacity);
    if (bars.type === "letter") {
      const barH = bars.size;
      outCtx.fillRect(0, 0, state.image.width, barH);
      outCtx.fillRect(0, state.image.height - barH, state.image.width, barH);
    } else {
      const barW = bars.size;
      outCtx.fillRect(0, 0, barW, state.image.height);
      outCtx.fillRect(state.image.width - barW, 0, barW, state.image.height);
    }
  }

  if (state.watermarkEnabled && state.watermarkImage) {
    const wmScale = state.watermarkScale / 100;
    const drawW = state.watermarkImage.width * wmScale;
    const drawWMH = state.watermarkImage.height * wmScale;
    const centerX = output.width / 2;
    const centerY = output.height / 2;
    const offsetX = (state.watermarkOffsetX / 100) * output.width;
    const offsetY = (state.watermarkOffsetY / 100) * output.height;
    const x = centerX - drawW / 2 + offsetX;
    const y = centerY - drawWMH / 2 + offsetY;
    outCtx.save();
    outCtx.globalAlpha = state.watermarkOpacity;
    outCtx.drawImage(state.watermarkImage, x, y, drawW, drawWMH);
    outCtx.restore();
  }

  const link = document.createElement("a");
  link.download = `${state.imageName.replace(/\.[^.]+$/, "")}-letterbox.png`;
  link.href = output.toDataURL("image/png");
  link.click();
}

function onPointerDown(event) {
  if (!state.image || !state.cropEnabled || !state.cropRect || !state.fitRect) return;
  const { x, y } = getCanvasPoint(event);
  if (
    x < state.fitRect.x ||
    x > state.fitRect.x + state.fitRect.w ||
    y < state.fitRect.y ||
    y > state.fitRect.y + state.fitRect.h
  ) {
    return;
  }

  const handle = getHandleAt(x, y, state.cropRect);
  if (handle) {
    state.drag = {
      mode: "resize",
      handle,
      startX: x,
      startY: y,
      startRect: { ...state.cropRect },
    };
  } else if (pointInRect(x, y, state.cropRect)) {
    state.drag = {
      mode: "move",
      startX: x,
      startY: y,
      startRect: { ...state.cropRect },
    };
  }
  if (state.drag) {
    canvas.setPointerCapture(event.pointerId);
  }
}

function onPointerMove(event) {
  if (!state.image || !state.cropEnabled || !state.cropRect || !state.fitRect) return;
  const { x, y } = getCanvasPoint(event);

  if (!state.drag) {
    const handle = getHandleAt(x, y, state.cropRect);
    if (handle) {
      canvas.style.cursor = `${handle}-resize`;
    } else if (pointInRect(x, y, state.cropRect)) {
      canvas.style.cursor = "move";
    } else {
      canvas.style.cursor = "default";
    }
    return;
  }

  const dx = x - state.drag.startX;
  const dy = y - state.drag.startY;
  let next = state.drag.startRect;
  if (state.drag.mode === "move") {
    next = {
      x: state.drag.startRect.x + dx,
      y: state.drag.startRect.y + dy,
      w: state.drag.startRect.w,
      h: state.drag.startRect.h,
    };
  } else {
    next = resizeRect(state.drag.startRect, state.drag.handle, dx, dy, state.cropAspect);
  }

  if (state.cropAspect) {
    if (next.w / next.h > state.cropAspect) {
      next.w = next.h * state.cropAspect;
    } else {
      next.h = next.w / state.cropAspect;
    }
  }

  const bounded = clampRect(next, state.fitRect);
  state.cropRect = bounded;
  updateCropMeta();
  draw();
}

function onPointerUp(event) {
  if (state.drag) {
    try {
      canvas.releasePointerCapture(event.pointerId);
    } catch (err) {
      // ignore
    }
  }
  state.drag = null;
}

function onDrop(event) {
  event.preventDefault();
  dropzone.classList.remove("active");
  const file = event.dataTransfer.files[0];
  handleImage(file);
}

function onDragOver(event) {
  event.preventDefault();
  dropzone.classList.add("active");
}

function onDragLeave() {
  dropzone.classList.remove("active");
}

fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  handleImage(file);
});

cropToggle.addEventListener("change", (event) => {
  setCropEnabled(event.target.checked);
});

cropSelect.addEventListener("change", updateCropAspect);
applyCropBtn.addEventListener("click", applyCrop);
resetCropBtn.addEventListener("click", resetCrop);

ratioSelect.addEventListener("change", updateBarRatio);
customW.addEventListener("input", updateBarRatio);
customH.addEventListener("input", updateBarRatio);

imageOffset.addEventListener("input", (event) => {
  state.imageOffsetY = parseInt(event.target.value, 10);
  updateOffsetMeta();
  draw();
});

watermarkToggle.addEventListener("change", (event) => {
  setWatermarkEnabled(event.target.checked);
});

watermarkInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  handleWatermarkFile(file);
});

wmXRange.addEventListener("input", (event) => {
  const value = clamp(parseInt(event.target.value, 10), -50, 50);
  setWatermarkOffsetX(value);
});

wmXInput.addEventListener("input", (event) => {
  const value = clamp(parseInt(event.target.value, 10), -50, 50);
  setWatermarkOffsetX(value);
});

wmYRange.addEventListener("input", (event) => {
  const value = clamp(parseInt(event.target.value, 10), -50, 50);
  setWatermarkOffsetY(value);
});

wmYInput.addEventListener("input", (event) => {
  const value = clamp(parseInt(event.target.value, 10), -50, 50);
  setWatermarkOffsetY(value);
});

wmScaleRange.addEventListener("input", (event) => {
  const value = clamp(parseInt(event.target.value, 10), 10, 300);
  setWatermarkScale(value);
});

wmScaleInput.addEventListener("input", (event) => {
  const value = clamp(parseInt(event.target.value, 10), 10, 300);
  setWatermarkScale(value);
});

wmOpacityRange.addEventListener("input", (event) => {
  const value = clamp(parseInt(event.target.value, 10), 0, 100);
  setWatermarkOpacity(value);
});

wmOpacityInput.addEventListener("input", (event) => {
  const value = clamp(parseInt(event.target.value, 10), 0, 100);
  setWatermarkOpacity(value);
});

barColor.addEventListener("input", (event) => {
  state.barColor = event.target.value;
  draw();
});

barOpacity.addEventListener("input", (event) => {
  state.barOpacity = parseInt(event.target.value, 10) / 100;
  updateStyleMeta();
  draw();
});

applyCropBtn.addEventListener("mouseenter", () => {
  if (!state.cropEnabled) {
    cropMeta.textContent = "裁切已关闭";
  } else if (state.image) {
    cropMeta.textContent = "裁切会替换当前图像";
  }
});

applyCropBtn.addEventListener("mouseleave", updateCropMeta);

downloadBtn.addEventListener("click", downloadImage);

dropzone.addEventListener("drop", onDrop);
dropzone.addEventListener("dragover", onDragOver);
dropzone.addEventListener("dragleave", onDragLeave);

canvas.addEventListener("pointerdown", onPointerDown);
canvas.addEventListener("pointermove", onPointerMove);
window.addEventListener("pointerup", onPointerUp);

const resizeObserver = new ResizeObserver(resizeCanvas);
resizeObserver.observe(canvas.parentElement);

setCropEnabled(cropToggle.checked);
updateOffsetMeta();
setWatermarkOffsetX(parseInt(wmXRange.value, 10));
setWatermarkOffsetY(parseInt(wmYRange.value, 10));
setWatermarkScale(parseInt(wmScaleRange.value, 10));
setWatermarkOpacity(parseInt(wmOpacityRange.value, 10));
setWatermarkEnabled(watermarkToggle.checked);
updateStyleMeta();
updateBarRatio();
updateCropAspect();
resizeCanvas();
