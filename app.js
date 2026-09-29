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
const imageOffsetValue = document.getElementById("imageOffsetValue");
const watermarkToggle = document.getElementById("watermarkToggle");
const watermarkInput = document.getElementById("watermarkInput");
const watermarkInput2 = document.getElementById("watermarkInput2");
const watermarkMeta = document.getElementById("watermarkMeta");
const watermarkText = document.getElementById("watermarkText");
const wmTextSizeRange = document.getElementById("wmTextSizeRange");
const wmTextSizeInput = document.getElementById("wmTextSizeInput");
const wmTextOffsetRange = document.getElementById("wmTextOffsetRange");
const wmTextOffsetInput = document.getElementById("wmTextOffsetInput");
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
const barOpacityValue = document.getElementById("barOpacityValue");
const downloadBtn = document.getElementById("downloadBtn");
const barInfo = document.getElementById("barInfo");
const placeholder = document.getElementById("placeholder");
const heroRatio = document.getElementById("heroRatio");
const ratioBadge = document.getElementById("ratioBadge");
const importBadge = document.getElementById("importBadge");
const cropBadge = document.getElementById("cropBadge");
const styleBadge = document.getElementById("styleBadge");
const frameBadge = document.getElementById("frameBadge");
const wmBadge = document.getElementById("wmBadge");
const exportMeta = document.getElementById("exportMeta");
const dropOverlay = document.getElementById("dropOverlay");

// 折叠分区容器
const blockImport = document.getElementById("blockImport");
const blockCrop = document.getElementById("blockCrop");
const blockFrame = document.getElementById("blockFrame");
const blockSolid = document.getElementById("blockSolid");
const blockWatermark = document.getElementById("blockWatermark");

const mobileQuery = window.matchMedia("(max-width: 960px)");

// 磨砂相框元素
const frostedFrameToggle = document.getElementById("frostedFrameToggle");
const frameWidth = document.getElementById("frameWidth");
const frameWidthValue = document.getElementById("frameWidthValue");
const frameBlur = document.getElementById("frameBlur");
const frameBlurValue = document.getElementById("frameBlurValue");
const frameOpacity = document.getElementById("frameOpacity");
const frameOpacityValue = document.getElementById("frameOpacityValue");
const framePadding = document.getElementById("framePadding");
const framePaddingValue = document.getElementById("framePaddingValue");
const frameBorderRadius = document.getElementById("frameBorderRadius");
const frameBorderRadiusValue = document.getElementById("frameBorderRadiusValue");
const frostedFrameMeta = document.getElementById("frostedFrameMeta");
const solidFrameToggle = document.getElementById("solidFrameToggle");
const solidFrameColor = document.getElementById("solidFrameColor");
const solidSwatches = document.getElementById("solidSwatches");
const solidFrameWidth = document.getElementById("solidFrameWidth");
const solidFrameWidthValue = document.getElementById("solidFrameWidthValue");
const solidFrameRadius = document.getElementById("solidFrameRadius");
const solidFrameRadiusValue = document.getElementById("solidFrameRadiusValue");
const solidFrameMeta = document.getElementById("solidFrameMeta");
const solidFrameBadge = document.getElementById("solidFrameBadge");



const state = {
  image: null,
  imageName: "",
  imageType: "",
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
  watermarkImage2: null,
  watermarkName2: "",
  watermarkSize2: 0,
  watermarkText: "",
  watermarkTextSize: 24,
  watermarkTextOffset: 10,
  watermarkOffsetX: 0,
  watermarkOffsetY: 0,
  watermarkScale: 100,
  watermarkOpacity: 0.8,
  fitRect: null,
  frostedFrameEnabled: false,
  frostedFrameImage: null,
  solidFrameEnabled: false,
  solidFrameImage: null,
  solidFrameColor: "#f2ede3",
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
// 相框交互合成上限：拖动滑块时按预览分辨率合成（长边不超过该值），导出时再按原图分辨率重新生成
const framePreviewMaxSide = 1600;

function setBlockCollapsed(block, collapsed) {
  if (!block) return;
  block.classList.toggle("collapsed", collapsed);
  const toggle = block.querySelector(".block-toggle");
  if (toggle) {
    toggle.setAttribute("aria-expanded", String(!collapsed));
  }
}

function formatRatio(ratio) {
  return `${Math.round(ratio * 100) / 100}:1`;
}

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
  let target = mobileQuery.matches ? 280 : idlePreviewHeight;
  if (state.image) {
    const ratio = state.image.width / state.image.height;
    target = Math.round(width / ratio);
    const cap = mobileQuery.matches
      ? Math.min(window.innerHeight * 0.45, 340)
      : Math.min(window.innerHeight * 0.7, maxPreviewHeight);
    target = Math.max(minPreviewHeight, Math.min(target, cap));
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

  // 绘制磨砂相框
  if (state.frostedFrameEnabled && state.frostedFrameImage) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(fit.x, fit.y, fit.w, fit.h);
    ctx.clip();
    ctx.drawImage(state.frostedFrameImage, fit.x, fit.y, fit.w, fit.h);
    ctx.restore();
  }

  // 绘制纯色相框
  if (state.solidFrameEnabled && state.solidFrameImage) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(fit.x, fit.y, fit.w, fit.h);
    ctx.clip();
    ctx.drawImage(state.solidFrameImage, fit.x, fit.y, fit.w, fit.h);
    ctx.restore();
  }

  const hasWmImage = !!(state.watermarkImage || state.watermarkImage2);
  if (state.watermarkEnabled && (hasWmImage || state.watermarkText)) {
    const scale = fit.w / state.image.width;
    const wmScale = state.watermarkScale / 100;
    const centerX = fit.x + fit.w / 2;
    const centerY = fit.y + fit.h / 2;
    const offsetX = (state.watermarkOffsetX / 100) * fit.w;
    const offsetY = (state.watermarkOffsetY / 100) * fit.h;

    ctx.save();
    ctx.beginPath();
    ctx.rect(fit.x, fit.y, fit.w, fit.h);
    ctx.clip();
    ctx.globalAlpha = state.watermarkOpacity;

    // 如果有两个水印，对称显示
    if (state.watermarkImage && state.watermarkImage2) {
      const drawW1 = state.watermarkImage.width * scale * wmScale;
      const drawH1 = state.watermarkImage.height * scale * wmScale;
      const drawW2 = state.watermarkImage2.width * scale * wmScale;
      const drawH2 = state.watermarkImage2.height * scale * wmScale;

      // 计算间距
      const spacing = fit.w * 0.1;

      // 左侧水印
      const x1 = centerX - spacing / 2 - drawW1 + offsetX;
      const y1 = centerY - drawH1 / 2 + offsetY;
      ctx.drawImage(state.watermarkImage, x1, y1, drawW1, drawH1);

      // 右侧水印
      const x2 = centerX + spacing / 2 + offsetX;
      const y2 = centerY - drawH2 / 2 + offsetY;
      ctx.drawImage(state.watermarkImage2, x2, y2, drawW2, drawH2);

      // 绘制文字（在两个水印中间下方）
      if (state.watermarkText) {
        ctx.globalAlpha = 1;
        const fontSize = state.watermarkTextSize * scale;
        ctx.font = `${fontSize}px "Space Grotesk", sans-serif`;
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const textY = Math.max(y1 + drawH1, y2 + drawH2) + (state.watermarkTextOffset / 100) * fit.h;
        ctx.fillText(state.watermarkText, centerX + offsetX, textY);
      }
    } else if (state.watermarkImage) {
      // 单个水印
      const drawW = state.watermarkImage.width * scale * wmScale;
      const drawH = state.watermarkImage.height * scale * wmScale;
      const x = centerX - drawW / 2 + offsetX;
      const y = centerY - drawH / 2 + offsetY;
      ctx.drawImage(state.watermarkImage, x, y, drawW, drawH);

      // 绘制文字（在水印下方）
      if (state.watermarkText) {
        ctx.globalAlpha = 1;
        const fontSize = state.watermarkTextSize * scale;
        ctx.font = `${fontSize}px "Space Grotesk", sans-serif`;
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const textY = y + drawH + (state.watermarkTextOffset / 100) * fit.h;
        ctx.fillText(state.watermarkText, centerX + offsetX, textY);
      }
    } else if (state.watermarkText) {
      // 纯文字水印
      ctx.globalAlpha = 1;
      const fontSize = state.watermarkTextSize * scale;
      ctx.font = `${fontSize}px "Space Grotesk", sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(state.watermarkText, centerX + offsetX, centerY + offsetY);
    }

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
    importBadge.textContent = "未选择";
    return;
  }
  fileMeta.textContent = `${state.imageName} · ${state.image.width}×${state.image.height}`;
  importBadge.textContent = state.imageName;
}

function updateCropMeta() {
  if (!state.cropEnabled) {
    cropMeta.textContent = "裁切已关闭";
    cropBadge.textContent = "已关闭";
    return;
  }
  if (!state.image) {
    cropMeta.textContent = "等待图片";
    cropBadge.textContent = "等待图片";
    return;
  }
  if (!state.cropRect || !state.fitRect) {
    cropMeta.textContent = "等待图片";
    cropBadge.textContent = "等待图片";
    return;
  }
  const scale = state.fitRect.w / state.image.width;
  const w = Math.round(state.cropRect.w / scale);
  const h = Math.round(state.cropRect.h / scale);
  cropMeta.textContent = `裁切区域 ${w}×${h}px · 双击画布可重置`;
  cropBadge.textContent = `${w}×${h}`;
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
  imageOffsetValue.textContent = `${value}%`;
  imageOffset.setAttribute("aria-valuenow", String(value));
}

function updateFrostedFrameMeta() {
  if (!state.frostedFrameEnabled) {
    frostedFrameMeta.textContent = "磨砂相框已关闭";
    frameBadge.textContent = "关闭";
    return;
  }
  frameBadge.textContent = "开启";
  if (!state.image) {
    frostedFrameMeta.textContent = "等待图片";
    return;
  }
  frostedFrameMeta.textContent = "使用当前图片作为相框背景";
}

function updateFrostedFrameControls() {
  const enabled = state.frostedFrameEnabled && state.image;
  frameWidth.disabled = !enabled;
  frameBlur.disabled = !enabled;
  frameOpacity.disabled = !enabled;
  framePadding.disabled = !enabled;
  frameBorderRadius.disabled = !enabled;
}

// 相框按该比例合成：交互时限制到预览分辨率，导出时传 1 用原图分辨率
function framePreviewScale(borderWidth) {
  if (!state.image) return 1;
  const longSide = Math.max(state.image.width, state.image.height) + borderWidth * 2;
  return longSide <= framePreviewMaxSide ? 1 : framePreviewMaxSide / longSide;
}

function buildFrostedFrameCanvas(scale) {
  const fWidth = Math.max(1, Math.round(parseInt(frameWidth.value, 10) * scale));
  const blur = Math.max(0, parseInt(frameBlur.value, 10) * scale);
  const opacity = parseInt(frameOpacity.value, 10) / 100;
  const padding = Math.max(0, Math.round(parseInt(framePadding.value, 10) * scale));
  const borderRadius = Math.max(0, parseInt(frameBorderRadius.value, 10) * scale);

  const srcW = state.image.width;
  const srcH = state.image.height;
  const imgW = Math.max(1, Math.round(srcW * scale));
  const imgH = Math.max(1, Math.round(srcH * scale));
  const canvasW = imgW + fWidth * 2;
  const canvasH = imgH + fWidth * 2;

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = canvasW;
  tempCanvas.height = canvasH;
  const tempCtx = tempCanvas.getContext("2d");

  // 创建模糊边框
  tempCtx.filter = `blur(${blur}px)`;

  // 上边框
  tempCtx.drawImage(state.image, 0, 0, srcW, 1, fWidth, 0, imgW, fWidth + padding);
  // 下边框
  tempCtx.drawImage(state.image, 0, srcH - 1, srcW, 1, fWidth, canvasH - fWidth - padding, imgW, fWidth + padding);
  // 左边框
  tempCtx.drawImage(state.image, 0, 0, 1, srcH, 0, fWidth, fWidth + padding, imgH);
  // 右边框
  tempCtx.drawImage(state.image, srcW - 1, 0, 1, srcH, canvasW - fWidth - padding, fWidth, fWidth + padding, imgH);

  // 四个角落
  tempCtx.drawImage(state.image, 0, 0, 1, 1, 0, 0, fWidth + padding, fWidth + padding);
  tempCtx.drawImage(state.image, srcW - 1, 0, 1, 1, canvasW - fWidth - padding, 0, fWidth + padding, fWidth + padding);
  tempCtx.drawImage(state.image, 0, srcH - 1, 1, 1, 0, canvasH - fWidth - padding, fWidth + padding, fWidth + padding);
  tempCtx.drawImage(state.image, srcW - 1, srcH - 1, 1, 1, canvasW - fWidth - padding, canvasH - fWidth - padding, fWidth + padding, fWidth + padding);

  // 创建最终画布
  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = canvasW;
  finalCanvas.height = canvasH;
  const finalCtx = finalCanvas.getContext("2d");

  // 应用不透明度和圆角
  finalCtx.save();
  finalCtx.globalAlpha = opacity;

  if (borderRadius > 0) {
    finalCtx.beginPath();
    finalCtx.roundRect(0, 0, canvasW, canvasH, borderRadius);
    finalCtx.clip();
  }

  finalCtx.drawImage(tempCanvas, 0, 0);
  finalCtx.restore();

  // 裁剪中心区域
  finalCtx.save();
  finalCtx.globalCompositeOperation = "destination-out";
  finalCtx.fillStyle = "black";
  if (borderRadius > 0) {
    finalCtx.beginPath();
    finalCtx.roundRect(fWidth, fWidth, imgW, imgH, Math.max(0, borderRadius - fWidth));
    finalCtx.fill();
  } else {
    finalCtx.fillRect(fWidth, fWidth, imgW, imgH);
  }
  finalCtx.restore();

  // 绘制中心清晰图片
  finalCtx.save();
  if (borderRadius > 0) {
    finalCtx.beginPath();
    finalCtx.roundRect(fWidth, fWidth, imgW, imgH, Math.max(0, borderRadius - fWidth));
    finalCtx.clip();
  }
  finalCtx.drawImage(state.image, fWidth, fWidth, imgW, imgH);
  finalCtx.restore();

  return finalCanvas;
}

// 每帧最多合成一次：拖动时的连续 input 事件合并成单次重算，画布直接复用（省去 PNG 编码与解码）
let frostedRegenQueued = false;
function generateFrostedFrame() {
  if (!state.image) return;
  if (frostedRegenQueued) return;
  frostedRegenQueued = true;
  requestAnimationFrame(() => {
    frostedRegenQueued = false;
    if (!state.image || !state.frostedFrameEnabled) return;
    state.frostedFrameImage = buildFrostedFrameCanvas(framePreviewScale(parseInt(frameWidth.value, 10)));
    updateExportMeta();
    draw();
  });
}

function setFrostedFrameEnabled(enabled) {
  // 与纯色相框互斥：开启磨砂时关闭纯色
  if (enabled && state.solidFrameEnabled) {
    pushUndo("solid", captureSolid());
    solidFrameToggle.checked = false;
    state.solidFrameEnabled = false;
    state.solidFrameImage = null;
    setBlockCollapsed(blockSolid, true);
    updateSolidFrameControls();
    updateSolidFrameMeta();
  }
  state.frostedFrameEnabled = enabled;
  updateFrostedFrameControls();
  updateFrostedFrameMeta();
  updateExportMeta();
  if (enabled && state.image) {
    generateFrostedFrame();
  } else {
    state.frostedFrameImage = null;
    draw();
  }
}

function updateSolidFrameMeta() {
  if (!state.solidFrameEnabled) {
    solidFrameMeta.textContent = "纯色相框已关闭";
    solidFrameBadge.textContent = "关闭";
    return;
  }
  solidFrameBadge.textContent = state.solidFrameColor.toUpperCase();
  if (!state.image) {
    solidFrameMeta.textContent = "等待图片";
    return;
  }
  solidFrameMeta.textContent = "使用所选颜色作为相框";
}

function updateSolidFrameControls() {
  const enabled = state.solidFrameEnabled && state.image;
  solidFrameColor.disabled = !enabled;
  solidFrameWidth.disabled = !enabled;
  solidFrameRadius.disabled = !enabled;
  solidSwatches.querySelectorAll(".swatch").forEach((btn) => {
    btn.disabled = !enabled;
  });
}

function updateSwatchActive() {
  solidSwatches.querySelectorAll(".swatch").forEach((btn) => {
    btn.classList.toggle(
      "active",
      btn.dataset.color.toLowerCase() === state.solidFrameColor.toLowerCase()
    );
  });
}

function buildSolidFrameCanvas(scale) {
  const bw = Math.max(1, Math.round(parseInt(solidFrameWidth.value, 10) * scale));
  const radius = Math.max(0, parseInt(solidFrameRadius.value, 10) * scale);
  const imgW = Math.max(1, Math.round(state.image.width * scale));
  const imgH = Math.max(1, Math.round(state.image.height * scale));
  const canvasW = imgW + bw * 2;
  const canvasH = imgH + bw * 2;

  const frameCanvas = document.createElement("canvas");
  frameCanvas.width = canvasW;
  frameCanvas.height = canvasH;
  const frameCtx = frameCanvas.getContext("2d");

  // 相框底色（外圆角）
  frameCtx.save();
  if (radius > 0) {
    frameCtx.beginPath();
    frameCtx.roundRect(0, 0, canvasW, canvasH, radius);
    frameCtx.clip();
  }
  frameCtx.fillStyle = state.solidFrameColor;
  frameCtx.fillRect(0, 0, canvasW, canvasH);
  frameCtx.restore();

  // 中心图片（内圆角随外圆角收缩，与磨砂相框一致）
  frameCtx.save();
  const innerRadius = Math.max(0, radius - bw);
  if (innerRadius > 0) {
    frameCtx.beginPath();
    frameCtx.roundRect(bw, bw, imgW, imgH, innerRadius);
    frameCtx.clip();
  }
  frameCtx.drawImage(state.image, bw, bw, imgW, imgH);
  frameCtx.restore();

  return frameCanvas;
}

let solidRegenQueued = false;
function generateSolidFrame() {
  if (!state.image) return;
  if (solidRegenQueued) return;
  solidRegenQueued = true;
  requestAnimationFrame(() => {
    solidRegenQueued = false;
    if (!state.image || !state.solidFrameEnabled) return;
    state.solidFrameImage = buildSolidFrameCanvas(framePreviewScale(parseInt(solidFrameWidth.value, 10)));
    updateExportMeta();
    draw();
  });
}

function setSolidFrameColor(color) {
  state.solidFrameColor = color;
  solidFrameColor.value = color;
  updateSwatchActive();
  updateSolidFrameMeta();
  if (state.solidFrameEnabled && state.image) {
    generateSolidFrame();
  }
}

function setSolidFrameEnabled(enabled) {
  // 与磨砂相框互斥：开启纯色时关闭磨砂
  if (enabled && state.frostedFrameEnabled) {
    pushUndo("frosted", captureFrosted());
    frostedFrameToggle.checked = false;
    state.frostedFrameEnabled = false;
    state.frostedFrameImage = null;
    setBlockCollapsed(blockFrame, true);
    updateFrostedFrameControls();
    updateFrostedFrameMeta();
  }
  state.solidFrameEnabled = enabled;
  updateSolidFrameControls();
  updateSolidFrameMeta();
  updateExportMeta();
  if (enabled && state.image) {
    generateSolidFrame();
  } else {
    state.solidFrameImage = null;
    draw();
  }
}


/* ============ 功能级撤销 / 取消 ============
 * 每个分区独立记录改动快照：滑块拖动等连续输入只在手势开始时记一次，
 * 「撤销」逐步回退本分区的改动，「取消」恢复默认设置（同样可再撤销）。 */
const featureStacks = {};

function featureStack(key) {
  if (!featureStacks[key]) {
    featureStacks[key] = { stack: [], gesture: null, refreshTimer: null, settled: null, lastPush: 0 };
  }
  return featureStacks[key];
}

// input/change 事件触发时控件值已被浏览器改掉，监听器里拿不到「改前」状态；
// 因此每个功能维护一份稳定基线 settled：改动落定后刷新，下一次手势开始时把它入栈。
function scheduleSettledRefresh(key) {
  const fs = featureStack(key);
  if (fs.gesture) return; // 手势进行中，结束时统一刷新
  if (fs.refreshTimer) clearTimeout(fs.refreshTimer);
  fs.refreshTimer = window.setTimeout(() => {
    fs.refreshTimer = null;
    fs.settled = featureRegistry[key].capture();
  }, 0);
}

function pushUndo(key, snapshot, cap) {
  const fs = featureStack(key);
  fs.stack.push(snapshot);
  const limit = cap || 30;
  while (fs.stack.length > limit) fs.stack.shift();
  fs.lastPush = Date.now();
  updateUndoButtons();
  scheduleSettledRefresh(key);
}

// 手势级快照：同一次拖动 / 连续输入只记一条，内容是手势开始前的基线
function pushGestureUndo(key, capture) {
  const fs = featureStack(key);
  if (fs.gesture) return;
  clearTimeout(fs.gesture);
  fs.gesture = window.setTimeout(() => {
    fs.gesture = null;
    fs.settled = featureRegistry[key].capture();
  }, 500);
  pushUndo(key, fs.settled || capture());
}

function undoFeature(key) {
  const fs = featureStacks[key];
  if (!fs || !fs.stack.length) return;
  featureRegistry[key].apply(fs.stack.pop());
  scheduleSettledRefresh(key);
  updateUndoButtons();
}

function cancelFeature(key) {
  pushUndo(key, featureRegistry[key].capture());
  featureRegistry[key].apply(featureRegistry[key].default());
}

function updateUndoButtons() {
  document.querySelectorAll("[data-undo]").forEach((btn) => {
    const fs = featureStacks[btn.dataset.undo];
    btn.disabled = !fs || fs.stack.length === 0;
  });
  const importCancel = document.querySelector('[data-cancel="import"]');
  if (importCancel) importCancel.disabled = !state.image;
}

function captureImport() {
  return { image: state.image, imageName: state.imageName, imageType: state.imageType };
}

function captureCrop() {
  return {
    ...captureImport(),
    cropEnabled: state.cropEnabled,
    cropSelectValue: state.cropSelectValue,
  };
}

function captureRatio() {
  return { ratio: ratioSelect.value, w: customW.value, h: customH.value };
}

function captureStyle() {
  return { offset: imageOffset.value, color: barColor.value, opacity: barOpacity.value };
}

function captureFrosted() {
  return {
    enabled: state.frostedFrameEnabled,
    width: frameWidth.value,
    blur: frameBlur.value,
    opacity: frameOpacity.value,
    padding: framePadding.value,
    radius: frameBorderRadius.value,
  };
}

function captureSolid() {
  return {
    enabled: state.solidFrameEnabled,
    color: state.solidFrameColor,
    width: solidFrameWidth.value,
    radius: solidFrameRadius.value,
  };
}

function captureWatermark() {
  return {
    enabled: state.watermarkEnabled,
    image: state.watermarkImage,
    name: state.watermarkName,
    image2: state.watermarkImage2,
    name2: state.watermarkName2,
    text: state.watermarkText,
    size: wmTextSizeRange.value,
    offset: wmTextOffsetRange.value,
    x: wmXRange.value,
    y: wmYRange.value,
    scale: wmScaleRange.value,
    opacity: wmOpacityRange.value,
  };
}

// 恢复图片类状态（导入撤销 / 取消时整个工作区跟着回退）
function restoreImageState(s) {
  state.image = s.image;
  state.imageName = s.imageName;
  state.imageType = s.imageType;
  state.cropRect = null;
  state.drag = null;
  state.fitRect = null;
  updateCanvasWrapHeight();
  if (state.cropEnabled && state.image) {
    initCropRect();
  }
  updateFileMeta();
  updateCropMeta();
  updateRatioMeta();
  updateBarInfo();
  updateExportMeta();
  updateFrostedFrameControls();
  updateSolidFrameControls();
  setControlsEnabled(!!state.image);
  setBlockCollapsed(blockImport, !!state.image);
  if (state.frostedFrameEnabled && state.image) {
    generateFrostedFrame();
  } else {
    state.frostedFrameImage = null;
  }
  if (state.solidFrameEnabled && state.image) {
    generateSolidFrame();
  } else {
    state.solidFrameImage = null;
  }
  resizeCanvas();
}

function restoreCropState(s) {
  if (s.image !== state.image) {
    state.image = s.image;
    state.imageName = s.imageName;
    state.imageType = s.imageType;
    updateFileMeta();
    updateRatioMeta();
    updateBarInfo();
    updateExportMeta();
    updateCanvasWrapHeight();
    if (state.frostedFrameEnabled) generateFrostedFrame();
    if (state.solidFrameEnabled) generateSolidFrame();
  }
  cropToggle.checked = s.cropEnabled;
  cropSelect.value = s.cropSelectValue;
  setCropEnabled(s.cropEnabled);
  updateCropAspect();
  setControlsEnabled(!!state.image);
  resizeCanvas();
}

function restoreRatioState(s) {
  ratioSelect.value = s.ratio;
  customW.value = s.w;
  customH.value = s.h;
  updateBarRatio();
}

function restoreStyleState(s) {
  imageOffset.value = s.offset;
  state.imageOffsetY = parseInt(s.offset, 10) || 0;
  barColor.value = s.color;
  state.barColor = s.color;
  barOpacity.value = s.opacity;
  state.barOpacity = (parseInt(s.opacity, 10) || 0) / 100;
  updateOffsetMeta();
  updateStyleMeta();
  draw();
}

function restoreFrostedState(s) {
  frameWidth.value = s.width;
  frameWidthValue.textContent = `${s.width}px`;
  frameBlur.value = s.blur;
  frameBlurValue.textContent = `${s.blur}px`;
  frameOpacity.value = s.opacity;
  frameOpacityValue.textContent = `${s.opacity}%`;
  framePadding.value = s.padding;
  framePaddingValue.textContent = `${s.padding}px`;
  frameBorderRadius.value = s.radius;
  frameBorderRadiusValue.textContent = `${s.radius}px`;
  frostedFrameToggle.checked = s.enabled;
  setBlockCollapsed(blockFrame, !s.enabled);
  setFrostedFrameEnabled(s.enabled);
}

function restoreSolidState(s) {
  solidFrameWidth.value = s.width;
  solidFrameWidthValue.textContent = `${s.width}px`;
  solidFrameRadius.value = s.radius;
  solidFrameRadiusValue.textContent = `${s.radius}px`;
  solidFrameToggle.checked = s.enabled;
  setBlockCollapsed(blockSolid, !s.enabled);
  setSolidFrameEnabled(s.enabled);
  setSolidFrameColor(s.color);
}

function restoreWatermarkState(s) {
  state.watermarkImage = s.image;
  state.watermarkName = s.name;
  state.watermarkImage2 = s.image2;
  state.watermarkName2 = s.name2;
  state.watermarkText = s.text;
  watermarkText.value = s.text;
  state.watermarkTextSize = parseInt(s.size, 10) || 24;
  wmTextSizeRange.value = s.size;
  wmTextSizeInput.value = s.size;
  state.watermarkTextOffset = parseInt(s.offset, 10) || 10;
  wmTextOffsetRange.value = s.offset;
  wmTextOffsetInput.value = s.offset;
  state.watermarkOffsetX = parseInt(s.x, 10) || 0;
  wmXRange.value = s.x;
  wmXInput.value = s.x;
  state.watermarkOffsetY = parseInt(s.y, 10) || 0;
  wmYRange.value = s.y;
  wmYInput.value = s.y;
  state.watermarkScale = parseInt(s.scale, 10) || 100;
  wmScaleRange.value = s.scale;
  wmScaleInput.value = s.scale;
  state.watermarkOpacity = (parseInt(s.opacity, 10) || 0) / 100;
  wmOpacityRange.value = s.opacity;
  wmOpacityInput.value = s.opacity;
  watermarkToggle.checked = s.enabled;
  setBlockCollapsed(blockWatermark, !s.enabled);
  setWatermarkEnabled(s.enabled);
}

const featureRegistry = {
  import: {
    capture: captureImport,
    apply: restoreImageState,
    default: () => ({ image: null, imageName: "", imageType: "" }),
  },
  crop: {
    capture: captureCrop,
    apply: restoreCropState,
    default: () => ({
      image: state.image,
      imageName: state.imageName,
      imageType: state.imageType,
      cropEnabled: true,
      cropSelectValue: "free",
    }),
  },
  ratio: {
    capture: captureRatio,
    apply: restoreRatioState,
    default: () => ({ ratio: "2.39", w: "2.39", h: "1" }),
  },
  style: {
    capture: captureStyle,
    apply: restoreStyleState,
    default: () => ({ offset: "0", color: "#0b0b0b", opacity: "100" }),
  },
  frosted: {
    capture: captureFrosted,
    apply: restoreFrostedState,
    default: () => ({ enabled: false, width: "60", blur: "30", opacity: "80", padding: "20", radius: "20" }),
  },
  solid: {
    capture: captureSolid,
    apply: restoreSolidState,
    default: () => ({ enabled: false, color: "#f2ede3", width: "60", radius: "0" }),
  },
  watermark: {
    capture: captureWatermark,
    apply: restoreWatermarkState,
    default: () => ({
      enabled: false,
      image: null,
      name: "",
      image2: null,
      name2: "",
      text: "",
      size: "24",
      offset: "10",
      x: "0",
      y: "0",
      scale: "100",
      opacity: "80",
    }),
  },
};

// 撤销 / 取消按钮（事件委托，各分区底部）
document.addEventListener("click", (event) => {
  const undoBtn = event.target.closest("[data-undo]");
  if (undoBtn) {
    undoFeature(undoBtn.dataset.undo);
    return;
  }
  const cancelBtn = event.target.closest("[data-cancel]");
  if (cancelBtn) cancelFeature(cancelBtn.dataset.cancel);
});

// Cmd/Ctrl+Z 撤销最近一次改动的分区；文本输入框内保留原生撤销
window.addEventListener("keydown", (event) => {
  if (!(event.metaKey || event.ctrlKey) || event.shiftKey || event.key.toLowerCase() !== "z") return;
  const el = document.activeElement;
  const tag = el ? el.tagName : "";
  const type = el && el.type ? el.type : "";
  const textLike = ["text", "number", "password", "search", "url", "email", "tel"];
  if (tag === "TEXTAREA" || tag === "SELECT" || (tag === "INPUT" && textLike.includes(type))) return;
  let target = null;
  let latest = 0;
  Object.keys(featureStacks).forEach((key) => {
    const fs = featureStacks[key];
    if (fs.stack.length && fs.lastPush > latest) {
      latest = fs.lastPush;
      target = key;
    }
  });
  if (target) {
    event.preventDefault();
    undoFeature(target);
  }
});

function clamp(value, min, max) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function updateWatermarkMeta() {
  if (!state.watermarkEnabled) {
    watermarkMeta.textContent = "水印已关闭";
    wmBadge.textContent = "关闭";
    return;
  }
  if (!state.watermarkImage && !state.watermarkImage2 && !state.watermarkText) {
    watermarkMeta.textContent = "选择水印图片或输入文字";
    wmBadge.textContent = "开启";
    return;
  }
  let metaText = "";
  if (state.watermarkImage) {
    metaText += `水印1: ${state.watermarkName} · ${state.watermarkImage.width}×${state.watermarkImage.height}`;
  }
  if (state.watermarkImage2) {
    if (metaText) metaText += " | ";
    metaText += `水印2: ${state.watermarkName2} · ${state.watermarkImage2.width}×${state.watermarkImage2.height}`;
  }
  if (state.watermarkText) {
    if (metaText) metaText += " | ";
    metaText += `文字: ${state.watermarkText}`;
  }
  watermarkMeta.textContent = metaText;
  wmBadge.textContent = "开启";
}

function updateWatermarkControls() {
  const enabled = state.watermarkEnabled;
  watermarkInput.disabled = !enabled;
  watermarkInput2.disabled = !enabled;
  watermarkText.disabled = !enabled;
  const hasContent = !!(state.watermarkImage || state.watermarkImage2 || state.watermarkText);
  const adjustDisabled = !enabled || !hasContent;
  const inputs = [
    wmXRange,
    wmXInput,
    wmYRange,
    wmYInput,
    wmScaleRange,
    wmScaleInput,
    wmOpacityRange,
    wmOpacityInput,
    wmTextSizeRange,
    wmTextSizeInput,
    wmTextOffsetRange,
    wmTextOffsetInput,
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
  const percent = Math.round(state.barOpacity * 100);
  barOpacityValue.textContent = `${percent}%`;
  styleBadge.textContent = `${state.barColor} · ${percent}%`;
}

// 探测浏览器能否将 canvas 编码为目标格式（失败时 toDataURL 会回退为 PNG）
const mimeSupportCache = new Map();
function supportsMime(mime) {
  if (!mime) return false;
  if (mimeSupportCache.has(mime)) return mimeSupportCache.get(mime);
  const probe = document.createElement("canvas");
  probe.width = 1;
  probe.height = 1;
  const supported = probe.toDataURL(mime).startsWith(`data:${mime}`);
  mimeSupportCache.set(mime, supported);
  return supported;
}

// 导出格式跟随导入格式；浏览器无法编码时回退 PNG
function getExportMime() {
  const type = state.imageType || "image/png";
  return supportsMime(type) ? type : "image/png";
}

function formatLabel(mime) {
  const labels = { "image/jpeg": "JPG", "image/png": "PNG", "image/webp": "WEBP" };
  return labels[mime] || mime.replace("image/", "").toUpperCase();
}

function extensionToMime(name) {
  const ext = (name.match(/\.([^.]+)$/) || [])[1] || "";
  const map = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    jpe: "image/jpeg",
    jfif: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    bmp: "image/bmp",
    avif: "image/avif",
  };
  return map[ext.toLowerCase()] || "image/png";
}

// 格式未变时保留原文件的扩展名写法，回退时按导出格式取名
function exportExtension(mime) {
  if (state.imageType === mime && state.imageName) {
    const ext = (state.imageName.match(/\.([^.]+)$/) || [])[1];
    if (ext) return ext;
  }
  const exts = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
  return exts[mime] || "png";
}

// 导出尺寸按相框宽度直接计算，不依赖合成结果（交互预览版是缩小合成的）
function frameOutputSize() {
  if (!state.image) return null;
  const bw = state.solidFrameEnabled
    ? parseInt(solidFrameWidth.value, 10)
    : state.frostedFrameEnabled
      ? parseInt(frameWidth.value, 10)
      : 0;
  return { w: state.image.width + bw * 2, h: state.image.height + bw * 2 };
}

function updateExportMeta() {
  if (!state.image) {
    exportMeta.textContent = "导入图片后可导出";
    return;
  }
  const size = frameOutputSize();
  exportMeta.textContent = `导出 ${size.w} × ${size.h}px · ${formatLabel(getExportMime())}`;
  downloadBtn.textContent = `下载 ${formatLabel(getExportMime())}`;
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
  // 覆盖导入前记一条快照，可撤销回上一张图
  if (state.image) pushUndo("import", captureImport(), 5);
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    URL.revokeObjectURL(url);
    state.image = img;
    state.imageName = file.name;
    state.imageType = file.type || extensionToMime(file.name);
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
    updateExportMeta();
    updateFrostedFrameControls();
    updateSolidFrameControls();
    if (state.frostedFrameEnabled) generateFrostedFrame();
    if (state.solidFrameEnabled) generateSolidFrame();
    setControlsEnabled(true);
    // 已导入图片，收起导入区减少干扰
    setBlockCollapsed(blockImport, true);
    resizeCanvas();
  };
  img.src = url;
}

function handleWatermarkFile(file) {
  if (!file) return;
  pushUndo("watermark", captureWatermark());
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

function handleWatermarkFile2(file) {
  if (!file) return;
  pushUndo("watermark", captureWatermark());
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    URL.revokeObjectURL(url);
    state.watermarkImage2 = img;
    state.watermarkName2 = file.name;
    state.watermarkSize2 = file.size;
    updateWatermarkControls();
    updateWatermarkMeta();
    draw();
  };
  img.src = url;
}

function applyCrop() {
  if (!state.image || !state.cropEnabled || !state.cropRect || !state.fitRect) return;
  // 裁切会替换图片，先记快照（栈深较浅，避免多张全尺寸画布占内存）
  pushUndo("crop", captureCrop(), 5);
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

  // 直接沿用裁切画布，省去一次全图 PNG 编码与解码
  state.image = offscreen;
  state.imageName = `${state.imageName.replace(/\.[^.]+$/, "")}-crop`;
  updateCanvasWrapHeight();
  initCropRect();
  updateFileMeta();
  updateCropMeta();
  updateRatioMeta();
  updateBarInfo();
  updateExportMeta();
  if (state.frostedFrameEnabled) generateFrostedFrame();
  if (state.solidFrameEnabled) generateSolidFrame();
  resizeCanvas();
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
  // 镜像到 state：change 事件里捕获快照时能拿到改前值
  state.cropSelectValue = value;
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
  const label = formatRatio(ratio);
  ratioBadge.textContent = label;
  heroRatio.textContent = label;
  updateBarInfo();
  draw();
}

function downloadImage() {
  if (!state.image) return;

  const mime = getExportMime();

  // 导出前按原图分辨率重新合成相框（交互预览用的是缩小版本）
  if (state.solidFrameEnabled) {
    state.solidFrameImage = buildSolidFrameCanvas(1);
  }
  if (state.frostedFrameEnabled) {
    state.frostedFrameImage = buildFrostedFrameCanvas(1);
  }

  const size = frameOutputSize();
  const output = document.createElement("canvas");
  output.width = size.w;
  output.height = size.h;
  const outCtx = output.getContext("2d");

  // JPEG 没有透明通道，先铺白底避免半透明区域（如遮幅）变黑
  if (mime === "image/jpeg") {
    outCtx.fillStyle = "#ffffff";
    outCtx.fillRect(0, 0, output.width, output.height);
  }

  // 如果启用了相框，先绘制相框（按导出尺寸铺满，缩小合成的版本也能正确映射）
  if (state.solidFrameEnabled && state.solidFrameImage) {
    outCtx.drawImage(state.solidFrameImage, 0, 0, size.w, size.h);
  } else if (state.frostedFrameEnabled && state.frostedFrameImage) {
    outCtx.drawImage(state.frostedFrameImage, 0, 0, size.w, size.h);
  } else {
    // 否则绘制原图
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
  }

  const hasWmImage = !!(state.watermarkImage || state.watermarkImage2);
  if (state.watermarkEnabled && (hasWmImage || state.watermarkText)) {
    const solidFramed = state.solidFrameEnabled && state.solidFrameImage;
    const frostedFramed = state.frostedFrameEnabled && state.frostedFrameImage;
    const framePad = solidFramed
      ? parseInt(solidFrameWidth.value, 10)
      : frostedFramed
        ? parseInt(frameWidth.value, 10)
        : 0;
    const baseWidth = solidFramed || frostedFramed ? state.image.width : size.w;
    const baseHeight = solidFramed || frostedFramed ? state.image.height : size.h;
    const offsetX = framePad;
    const offsetY = framePad;

    const wmScale = state.watermarkScale / 100;
    const centerX = offsetX + baseWidth / 2;
    const centerY = offsetY + baseHeight / 2;
    const posOffsetX = (state.watermarkOffsetX / 100) * baseWidth;
    const posOffsetY = (state.watermarkOffsetY / 100) * baseHeight;

    outCtx.save();
    outCtx.globalAlpha = state.watermarkOpacity;

    // 如果有两个水印，对称显示
    if (state.watermarkImage && state.watermarkImage2) {
      const drawW1 = state.watermarkImage.width * wmScale;
      const drawH1 = state.watermarkImage.height * wmScale;
      const drawW2 = state.watermarkImage2.width * wmScale;
      const drawH2 = state.watermarkImage2.height * wmScale;

      const spacing = baseWidth * 0.1;

      // 左侧水印
      const x1 = centerX - spacing / 2 - drawW1 + posOffsetX;
      const y1 = centerY - drawH1 / 2 + posOffsetY;
      outCtx.drawImage(state.watermarkImage, x1, y1, drawW1, drawH1);

      // 右侧水印
      const x2 = centerX + spacing / 2 + posOffsetX;
      const y2 = centerY - drawH2 / 2 + posOffsetY;
      outCtx.drawImage(state.watermarkImage2, x2, y2, drawW2, drawH2);

      // 绘制文字
      if (state.watermarkText) {
        outCtx.globalAlpha = 1;
        const fontSize = state.watermarkTextSize;
        outCtx.font = `${fontSize}px "Space Grotesk", sans-serif`;
        outCtx.fillStyle = "#ffffff";
        outCtx.textAlign = "center";
        outCtx.textBaseline = "top";
        const textY = Math.max(y1 + drawH1, y2 + drawH2) + (state.watermarkTextOffset / 100) * baseHeight;
        outCtx.fillText(state.watermarkText, centerX + posOffsetX, textY);
      }
    } else if (state.watermarkImage) {
      // 单个水印
      const drawW = state.watermarkImage.width * wmScale;
      const drawWMH = state.watermarkImage.height * wmScale;
      const x = centerX - drawW / 2 + posOffsetX;
      const y = centerY - drawWMH / 2 + posOffsetY;
      outCtx.drawImage(state.watermarkImage, x, y, drawW, drawWMH);

      // 绘制文字
      if (state.watermarkText) {
        outCtx.globalAlpha = 1;
        const fontSize = state.watermarkTextSize;
        outCtx.font = `${fontSize}px "Space Grotesk", sans-serif`;
        outCtx.fillStyle = "#ffffff";
        outCtx.textAlign = "center";
        outCtx.textBaseline = "top";
        const textY = y + drawWMH + (state.watermarkTextOffset / 100) * baseHeight;
        outCtx.fillText(state.watermarkText, centerX + posOffsetX, textY);
      }
    } else if (state.watermarkText) {
      // 纯文字水印
      outCtx.globalAlpha = 1;
      const fontSize = state.watermarkTextSize;
      outCtx.font = `${fontSize}px "Space Grotesk", sans-serif`;
      outCtx.fillStyle = "#ffffff";
      outCtx.textAlign = "center";
      outCtx.textBaseline = "middle";
      outCtx.fillText(state.watermarkText, centerX + posOffsetX, centerY + posOffsetY);
    }

    outCtx.restore();
  }

  const link = document.createElement("a");
  const suffix = state.solidFrameEnabled
    ? "-frame"
    : state.frostedFrameEnabled
      ? "-frosted"
      : "-letterbox";
  link.download = `${state.imageName.replace(/\.[^.]+$/, "")}${suffix}.${exportExtension(mime)}`;
  link.href = output.toDataURL(mime, mime === "image/jpeg" || mime === "image/webp" ? 0.92 : undefined);
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
  event.stopPropagation();
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

// 分区折叠：点击标题展开/收起
document.querySelectorAll(".block-toggle").forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const block = toggle.closest(".block");
    setBlockCollapsed(block, !block.classList.contains("collapsed"));
  });
});

// 拖放区键盘可达：Enter / 空格触发文件选择
dropzone.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    fileInput.click();
  }
});

// 全局拖放：图片可拖到页面任意位置导入
window.addEventListener("dragover", (event) => {
  event.preventDefault();
});

window.addEventListener("drop", (event) => {
  event.preventDefault();
  dropOverlay.classList.remove("active");
  const file = event.dataTransfer && event.dataTransfer.files[0];
  if (file) handleImage(file);
});

document.addEventListener("dragenter", (event) => {
  const types = event.dataTransfer ? Array.from(event.dataTransfer.types || []) : [];
  if (types.includes("Files")) {
    dropOverlay.classList.add("active");
  }
});

document.addEventListener("dragleave", (event) => {
  if (!event.relatedTarget) {
    dropOverlay.classList.remove("active");
  }
});

// 双击画布重置裁切框
canvas.addEventListener("dblclick", () => {
  if (state.image && state.cropEnabled) {
    resetCrop();
  }
});

cropToggle.addEventListener("change", (event) => {
  if (state.image) pushUndo("crop", captureCrop(), 5);
  setCropEnabled(event.target.checked);
  setBlockCollapsed(blockCrop, !event.target.checked);
});

cropSelect.addEventListener("change", () => {
  if (state.image) pushUndo("crop", captureCrop(), 5);
  updateCropAspect();
});
applyCropBtn.addEventListener("click", applyCrop);
resetCropBtn.addEventListener("click", resetCrop);

ratioSelect.addEventListener("change", () => {
  pushGestureUndo("ratio", captureRatio);
  updateBarRatio();
});
customW.addEventListener("input", () => {
  pushGestureUndo("ratio", captureRatio);
  updateBarRatio();
});
customH.addEventListener("input", () => {
  pushGestureUndo("ratio", captureRatio);
  updateBarRatio();
});

imageOffset.addEventListener("input", (event) => {
  pushGestureUndo("style", captureStyle);
  state.imageOffsetY = parseInt(event.target.value, 10);
  updateOffsetMeta();
  draw();
});

watermarkToggle.addEventListener("change", (event) => {
  pushUndo("watermark", captureWatermark());
  setWatermarkEnabled(event.target.checked);
  setBlockCollapsed(blockWatermark, !event.target.checked);
});

watermarkInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  handleWatermarkFile(file);
});

watermarkInput2.addEventListener("change", (event) => {
  const file = event.target.files[0];
  handleWatermarkFile2(file);
});

watermarkText.addEventListener("input", () => {
  pushGestureUndo("watermark", captureWatermark);
  state.watermarkText = watermarkText.value;
  updateWatermarkControls();
  updateWatermarkMeta();
  draw();
});

wmTextSizeRange.addEventListener("input", (event) => {
  pushGestureUndo("watermark", captureWatermark);
  const value = clamp(parseInt(event.target.value, 10), 10, 100);
  state.watermarkTextSize = value;
  wmTextSizeRange.value = value;
  wmTextSizeInput.value = value;
  draw();
});

wmTextSizeInput.addEventListener("input", (event) => {
  pushGestureUndo("watermark", captureWatermark);
  const value = clamp(parseInt(event.target.value, 10), 10, 100);
  state.watermarkTextSize = value;
  wmTextSizeRange.value = value;
  wmTextSizeInput.value = value;
  draw();
});

wmTextOffsetRange.addEventListener("input", (event) => {
  pushGestureUndo("watermark", captureWatermark);
  const value = clamp(parseInt(event.target.value, 10), 0, 50);
  state.watermarkTextOffset = value;
  wmTextOffsetRange.value = value;
  wmTextOffsetInput.value = value;
  draw();
});

wmTextOffsetInput.addEventListener("input", (event) => {
  pushGestureUndo("watermark", captureWatermark);
  const value = clamp(parseInt(event.target.value, 10), 0, 50);
  state.watermarkTextOffset = value;
  wmTextOffsetRange.value = value;
  wmTextOffsetInput.value = value;
  draw();
});

wmXRange.addEventListener("input", (event) => {
  pushGestureUndo("watermark", captureWatermark);
  const value = clamp(parseInt(event.target.value, 10), -50, 50);
  setWatermarkOffsetX(value);
});

wmXInput.addEventListener("input", (event) => {
  pushGestureUndo("watermark", captureWatermark);
  const value = clamp(parseInt(event.target.value, 10), -50, 50);
  setWatermarkOffsetX(value);
});

wmYRange.addEventListener("input", (event) => {
  pushGestureUndo("watermark", captureWatermark);
  const value = clamp(parseInt(event.target.value, 10), -50, 50);
  setWatermarkOffsetY(value);
});

wmYInput.addEventListener("input", (event) => {
  pushGestureUndo("watermark", captureWatermark);
  const value = clamp(parseInt(event.target.value, 10), -50, 50);
  setWatermarkOffsetY(value);
});

wmScaleRange.addEventListener("input", (event) => {
  pushGestureUndo("watermark", captureWatermark);
  const value = clamp(parseInt(event.target.value, 10), 10, 300);
  setWatermarkScale(value);
});

wmScaleInput.addEventListener("input", (event) => {
  pushGestureUndo("watermark", captureWatermark);
  const value = clamp(parseInt(event.target.value, 10), 10, 300);
  setWatermarkScale(value);
});

wmOpacityRange.addEventListener("input", (event) => {
  pushGestureUndo("watermark", captureWatermark);
  const value = clamp(parseInt(event.target.value, 10), 0, 100);
  setWatermarkOpacity(value);
});

wmOpacityInput.addEventListener("input", (event) => {
  pushGestureUndo("watermark", captureWatermark);
  const value = clamp(parseInt(event.target.value, 10), 0, 100);
  setWatermarkOpacity(value);
});

barColor.addEventListener("input", (event) => {
  pushGestureUndo("style", captureStyle);
  state.barColor = event.target.value;
  updateStyleMeta();
  draw();
});

barOpacity.addEventListener("input", (event) => {
  pushGestureUndo("style", captureStyle);
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

downloadBtn.addEventListener("click", () => {
  downloadImage();
  downloadBtn.textContent = "已导出 ✓";
  window.setTimeout(() => {
    downloadBtn.textContent = `下载 ${formatLabel(getExportMime())}`;
  }, 1600);
});

dropzone.addEventListener("drop", onDrop);
dropzone.addEventListener("dragover", onDragOver);
dropzone.addEventListener("dragleave", onDragLeave);

canvas.addEventListener("pointerdown", onPointerDown);
canvas.addEventListener("pointermove", onPointerMove);
window.addEventListener("pointerup", onPointerUp);

// 磨砂相框事件监听
frostedFrameToggle.addEventListener("change", (event) => {
  pushUndo("frosted", captureFrosted());
  setFrostedFrameEnabled(event.target.checked);
  setBlockCollapsed(blockFrame, !event.target.checked);
});

frameWidth.addEventListener("input", (event) => {
  pushGestureUndo("frosted", captureFrosted);
  const value = event.target.value;
  frameWidthValue.textContent = `${value}px`;
  if (state.frostedFrameEnabled && state.image) {
    generateFrostedFrame();
  }
});

frameBlur.addEventListener("input", (event) => {
  pushGestureUndo("frosted", captureFrosted);
  const value = event.target.value;
  frameBlurValue.textContent = `${value}px`;
  if (state.frostedFrameEnabled && state.image) {
    generateFrostedFrame();
  }
});

frameOpacity.addEventListener("input", (event) => {
  pushGestureUndo("frosted", captureFrosted);
  const value = event.target.value;
  frameOpacityValue.textContent = `${value}%`;
  if (state.frostedFrameEnabled && state.image) {
    generateFrostedFrame();
  }
});

framePadding.addEventListener("input", (event) => {
  pushGestureUndo("frosted", captureFrosted);
  const value = event.target.value;
  framePaddingValue.textContent = `${value}px`;
  if (state.frostedFrameEnabled && state.image) {
    generateFrostedFrame();
  }
});

frameBorderRadius.addEventListener("input", (event) => {
  pushGestureUndo("frosted", captureFrosted);
  const value = event.target.value;
  frameBorderRadiusValue.textContent = `${value}px`;
  if (state.frostedFrameEnabled && state.image) {
    generateFrostedFrame();
  }
});

// 纯色相框事件监听
solidFrameToggle.addEventListener("change", (event) => {
  pushUndo("solid", captureSolid());
  setSolidFrameEnabled(event.target.checked);
  setBlockCollapsed(blockSolid, !event.target.checked);
});

solidFrameColor.addEventListener("input", (event) => {
  pushGestureUndo("solid", captureSolid);
  setSolidFrameColor(event.target.value);
});

solidSwatches.addEventListener("click", (event) => {
  const btn = event.target.closest(".swatch");
  if (!btn || btn.disabled) return;
  pushUndo("solid", captureSolid());
  setSolidFrameColor(btn.dataset.color);
});

solidFrameWidth.addEventListener("input", (event) => {
  pushGestureUndo("solid", captureSolid);
  const value = event.target.value;
  solidFrameWidthValue.textContent = `${value}px`;
  if (state.solidFrameEnabled && state.image) {
    generateSolidFrame();
  }
});

solidFrameRadius.addEventListener("input", (event) => {
  pushGestureUndo("solid", captureSolid);
  const value = event.target.value;
  solidFrameRadiusValue.textContent = `${value}px`;
  if (state.solidFrameEnabled && state.image) {
    generateSolidFrame();
  }
});

const resizeObserver = new ResizeObserver(resizeCanvas);
resizeObserver.observe(canvas.parentElement);

// 断点切换时重算预览高度
if (typeof mobileQuery.addEventListener === "function") {
  mobileQuery.addEventListener("change", resizeCanvas);
}

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
updateFrostedFrameMeta();
updateFrostedFrameControls();
updateSolidFrameMeta();
updateSolidFrameControls();
updateSwatchActive();
// 各功能以加载时的状态作为首次手势的撤销基线
Object.keys(featureRegistry).forEach((key) => {
  featureStack(key).settled = featureRegistry[key].capture();
});
updateUndoButtons();
updateExportMeta();
frameWidthValue.textContent = `${frameWidth.value}px`;
frameBlurValue.textContent = `${frameBlur.value}px`;
frameOpacityValue.textContent = `${frameOpacity.value}%`;
framePaddingValue.textContent = `${framePadding.value}px`;
frameBorderRadiusValue.textContent = `${frameBorderRadius.value}px`;
solidFrameWidthValue.textContent = `${solidFrameWidth.value}px`;
solidFrameRadiusValue.textContent = `${solidFrameRadius.value}px`;
resizeCanvas();
