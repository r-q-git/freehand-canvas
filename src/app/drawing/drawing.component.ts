import { Component, ElementRef, ViewChild } from '@angular/core';
import { getStroke } from 'perfect-freehand';

interface DrawingStroke {
  points: number[][];
  path: string;
  color: string;
  opacity: number;
  outlineColor: string;
  outlineWidth: number;
}

const EASINGS: Record<string, (t: number) => number> = {
  linear: (t) => t,
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  easeInQuart: (t) => t * t * t * t,
  easeOutQuart: (t) => 1 - Math.pow(1 - t, 4),
  easeInOutQuart: (t) => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2,
  easeInQuint: (t) => t * t * t * t * t,
  easeOutQuint: (t) => 1 - Math.pow(1 - t, 5),
  easeInOutQuint: (t) => t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2,
  easeInSine: (t) => 1 - Math.cos((t * Math.PI) / 2),
  easeOutSine: (t) => Math.sin((t * Math.PI) / 2),
  easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  easeInExpo: (t) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
  easeOutExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  easeInOutExpo: (t) => t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
};

@Component({
  selector: 'app-drawing',
  templateUrl: './drawing.component.html',
  styleUrls: ['./drawing.component.scss']
})
export class DrawingComponent {
  @ViewChild('svgElement') svgElement!: ElementRef<SVGElement>;

  allStrokes: DrawingStroke[] = [];
  redoStack: DrawingStroke[] = [];
  activeTool: 'pen1' | 'pen2' | 'highlighter' | 'eraser' = 'pen1';
  
  currentPoints: number[][] = [];
  previewPath: string = '';

  easingOptions = Object.keys(EASINGS).map(key => ({ label: key, value: key }));

  tools: any = {
    pen1: this.getDefaultTool('#000000', 16),
    pen2: this.getDefaultTool('#3b82f6', 16),
    highlighter: this.getDefaultTool('#ffeb3b', 30, 0.4),
    eraser: { size: 40 }
  };

  private getDefaultTool(color: string, size: number, opacity: number = 1) {
    return {
      color, size, opacity, 
      thinning: 0.5, streamline: 0.5, smoothing: 0.23, easing: 'linear',
      start: { taper: 18, easing: 'linear' },
      end: { taper: 38, easing: 'line' },
      outline: { color: '#000000', width: 0 } 
    };
  }

 
  resetPenSettings() {
    if (this.activeTool === 'eraser') return;
    const defaults = {
      pen1: { color: '#000000', size: 16 },
      pen2: { color: '#3b82f6', size: 16 },
      highlighter: { color: '#ffeb3b', size: 30, opacity: 0.4 }
    };
    const d = (defaults as any)[this.activeTool];
    this.tools[this.activeTool] = this.getDefaultTool(d.color, d.size, d.opacity || 1);
  }

  undo() {
    const s = this.allStrokes.pop();
    if (s) this.redoStack.push(s);
  }

  redo() {
    const s = this.redoStack.pop();
    if (s) this.allStrokes.push(s);
  }

  clearCanvas() {
    this.allStrokes = [];
    this.redoStack = [];
  }

  saveSVG() {
    const svgEl = this.svgElement.nativeElement;
    svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const svgData = svgEl.outerHTML;
    const preface = '<?xml version="1.0" standalone="no"?>\r\n';
    const blob = new Blob([preface, svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `drawing-${Date.now()}.svg`;
    link.click();
  }

  // --- CORE DRAWING LOGIC ---

  private getLibOptions() {
    const t = this.tools[this.activeTool];
    return {
      size: t.size,
      thinning: t.thinning,
      streamline: t.streamline,
      smoothing: t.smoothing,
      easing: EASINGS[t.easing],
      start: { taper: t.start.taper, easing: EASINGS[t.start.easing], cap: true },
      end: { taper: t.end.taper, easing: EASINGS[t.end.easing], cap: true }
    };
  }

  onPointerDown(e: PointerEvent) {
    if (this.activeTool === 'eraser') { this.erase(e); return; }
    const { x, y } = this.getCoords(e);
    this.currentPoints = [[x, y, e.pressure]];
    this.redoStack = [];
  }

  onPointerMove(e: PointerEvent) {
    if (e.buttons !== 1) return;
    if (this.activeTool === 'eraser') { this.erase(e); return; }
    const { x, y } = this.getCoords(e);
    this.currentPoints = [...this.currentPoints, [x, y, e.pressure]];
    this.previewPath = this.getSvgPathFromStroke(getStroke(this.currentPoints, this.getLibOptions()));
  }

  onPointerUp() {
    if (this.currentPoints.length > 0 && this.activeTool !== 'eraser') {
      const t = this.tools[this.activeTool];
      this.allStrokes.push({
        points: [...this.currentPoints],
        path: this.previewPath,
        color: t.color,
        opacity: t.opacity,
        outlineColor: t.outline.color,
        outlineWidth: t.outline.width
      });
    }
    this.currentPoints = [];
    this.previewPath = '';
  }

  private erase(e: PointerEvent) {
    const { x, y } = this.getCoords(e);
    this.allStrokes = this.allStrokes.filter(s => 
      !s.points.some(p => Math.hypot(p[0]-x, p[1]-y) < this.tools.eraser.size)
    );
  }

  private getCoords(e: PointerEvent) {
    const rect = this.svgElement.nativeElement.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  private getSvgPathFromStroke(stroke: number[][]) {
    if (!stroke.length) return '';
    const d = stroke.reduce((acc, [x0, y0], i, _arr) => {
      const [x1, y1] = _arr[(i + 1) % _arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    }, ['M', ...stroke[0], 'Q']);
    d.push('Z');
    return d.join(' ');
  }
}