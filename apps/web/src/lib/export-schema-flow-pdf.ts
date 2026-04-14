import { getNodesBounds, getViewportForBounds, type Node } from "@xyflow/react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

/** Margin on each side as a fraction of span (8% each side → factor 1 + 2×0.08 on width/height). */
const BOUNDS_PADDING_RATIO = 0.08;
/** Longer raster side cap (stay under html-to-image canvas limits). */
const MAX_EXPORT_DIMENSION = 8192;
/** Minimum longer side in pixels so small graphs stay sharp. */
const MIN_EXPORT_LONG_SIDE = 1600;
/** Allow zoom-out enough to fit huge graphs into the raster (avoid cropping at 0.5). */
const VIEWPORT_MIN_ZOOM = 0.001;
const VIEWPORT_MAX_ZOOM = 2;
/** Bounds already include padding; do not add viewport padding again. */
const VIEWPORT_PADDING = 0;

const DEFAULT_EDGE_STROKE = "#b1b1b7";

type Bounds = { x: number; y: number; width: number; height: number };

function inflateBoundsCentered(bounds: Bounds, ratio: number): Bounds {
  const w = Math.max(bounds.width, 1);
  const h = Math.max(bounds.height, 1);
  const factor = 1 + 2 * ratio;
  const w2 = w * factor;
  const h2 = h * factor;
  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;
  return {
    x: cx - w2 / 2,
    y: cy - h2 / 2,
    width: w2,
    height: h2,
  };
}

/** Picks exportW × exportH matching padded bounds aspect, clamped between MIN long side and MAX dimensions. */
function computeExportDimensions(padded: Bounds): { exportW: number; exportH: number } {
  const pw = Math.max(padded.width, 1);
  const ph = Math.max(padded.height, 1);
  const longSide = Math.max(pw, ph);

  let s = Math.min(MAX_EXPORT_DIMENSION / pw, MAX_EXPORT_DIMENSION / ph);
  const sFloor = MIN_EXPORT_LONG_SIDE / longSide;
  s = Math.max(s, sFloor);
  s = Math.min(s, MAX_EXPORT_DIMENSION / pw, MAX_EXPORT_DIMENSION / ph);

  const exportW = Math.max(1, Math.ceil(pw * s));
  const exportH = Math.max(1, Math.ceil(ph * s));
  return { exportW, exportH };
}

/**
 * html-to-image embeds the subtree in an SVG foreignObject; nested edge SVG paths
 * often lose strokes that only exist via CSS variables on ancestors. Inline computed
 * stroke so the capture matches the screen.
 */
function inlineReactFlowEdgePresentation(scope: HTMLElement): () => void {
  type PathBackup = {
    el: SVGPathElement;
    stroke: string | null;
    strokeWidth: string | null;
    fill: string | null;
  };

  const pathBackups: PathBackup[] = [];
  scope.querySelectorAll<SVGPathElement>(".react-flow__edge-path").forEach((path) => {
    const win = path.ownerDocument.defaultView;
    const cs = win?.getComputedStyle(path);
    const resolvedStroke =
      cs?.stroke && cs.stroke !== "none" && cs.stroke !== "rgba(0, 0, 0, 0)" ? cs.stroke : DEFAULT_EDGE_STROKE;
    const sw = cs?.strokeWidth ? parseFloat(cs.strokeWidth) : 1.75;

    pathBackups.push({
      el: path,
      stroke: path.getAttribute("stroke"),
      strokeWidth: path.getAttribute("stroke-width"),
      fill: path.getAttribute("fill"),
    });

    path.style.stroke = resolvedStroke;
    path.style.strokeWidth = `${Number.isFinite(sw) ? sw : 1.75}px`;
    path.style.fill = "none";
  });

  const interactionBackups: { el: SVGPathElement; visibility: string | null }[] = [];
  scope.querySelectorAll<SVGPathElement>(".react-flow__edge-interaction").forEach((path) => {
    interactionBackups.push({ el: path, visibility: path.getAttribute("visibility") });
    path.setAttribute("visibility", "hidden");
  });

  return () => {
    for (const b of pathBackups) {
      b.el.style.removeProperty("stroke");
      b.el.style.removeProperty("stroke-width");
      b.el.style.removeProperty("fill");
      if (b.stroke === null) b.el.removeAttribute("stroke");
      else b.el.setAttribute("stroke", b.stroke);
      if (b.strokeWidth === null) b.el.removeAttribute("stroke-width");
      else b.el.setAttribute("stroke-width", b.strokeWidth);
      if (b.fill === null) b.el.removeAttribute("fill");
      else b.el.setAttribute("fill", b.fill);
    }
    for (const b of interactionBackups) {
      if (b.visibility === null) b.el.removeAttribute("visibility");
      else b.el.setAttribute("visibility", b.visibility);
    }
  };
}

export async function exportSchemaFlowToPdf(
  getNodes: () => Node[],
  viewportElement: HTMLElement,
): Promise<void> {
  const nodes = getNodes();
  if (nodes.length === 0) return;

  const bounds = getNodesBounds(nodes);
  const paddedBounds = inflateBoundsCentered(bounds, BOUNDS_PADDING_RATIO);
  const { exportW, exportH } = computeExportDimensions(paddedBounds);
  const viewport = getViewportForBounds(
    paddedBounds,
    exportW,
    exportH,
    VIEWPORT_MIN_ZOOM,
    VIEWPORT_MAX_ZOOM,
    VIEWPORT_PADDING,
  );

  const restoreEdges = inlineReactFlowEdgePresentation(viewportElement);
  let dataUrl: string;
  try {
    dataUrl = await toPng(viewportElement, {
      backgroundColor: "#ffffff",
      width: exportW,
      height: exportH,
      style: {
        width: `${exportW}px`,
        height: `${exportH}px`,
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      },
    });
  } finally {
    restoreEdges();
  }

  const pdf = new jsPDF({
    unit: "mm",
    format: "a4",
    orientation: exportW >= exportH ? "landscape" : "portrait",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgProps = pdf.getImageProperties(dataUrl);

  let renderWidth = pageWidth;
  let renderHeight = (imgProps.height * renderWidth) / imgProps.width;
  if (renderHeight > pageHeight) {
    renderHeight = pageHeight;
    renderWidth = (imgProps.width * renderHeight) / imgProps.height;
  }

  const x = (pageWidth - renderWidth) / 2;
  const y = (pageHeight - renderHeight) / 2;
  pdf.addImage(dataUrl, "PNG", x, y, renderWidth, renderHeight);
  pdf.save("schema-erd.pdf");
}
