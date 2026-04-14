import { type Node } from "@xyflow/react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

const DEFAULT_EDGE_STROKE = "#b1b1b7";

/**
 * Longer side cap (px) for the capture. Avoids multi‑megapixel rasters when the
 * diagram panel is very large; scales width/height down proportionally.
 */
const MAX_EXPORT_LONG_SIDE = 2400;

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

/**
 * Rasterizes the **current on-screen viewport** (pan/zoom as shown), then saves a PDF.
 * This avoids recomputing a huge virtual bounds / refit pass around all nodes, which
 * was the main cost (very large html-to-image canvases, including upscaling small graphs).
 */
export async function exportSchemaFlowToPdf(
  getNodes: () => Node[],
  viewportElement: HTMLElement,
): Promise<void> {
  if (getNodes().length === 0) return;

  const w0 = Math.max(1, Math.round(viewportElement.clientWidth));
  const h0 = Math.max(1, Math.round(viewportElement.clientHeight));
  const longSide = Math.max(w0, h0);
  const scaleDown = longSide > MAX_EXPORT_LONG_SIDE ? MAX_EXPORT_LONG_SIDE / longSide : 1;
  const exportW = Math.max(1, Math.round(w0 * scaleDown));
  const exportH = Math.max(1, Math.round(h0 * scaleDown));

  const restoreEdges = inlineReactFlowEdgePresentation(viewportElement);
  let dataUrl: string;
  try {
    dataUrl = await toPng(viewportElement, {
      backgroundColor: "#ffffff",
      width: exportW,
      height: exportH,
      pixelRatio: 1,
      skipFonts: true,
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
