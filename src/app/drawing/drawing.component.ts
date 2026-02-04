import {
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { getStroke } from 'perfect-freehand';
import { QlIframeMessageService } from '../main.service';

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
  easeInOutCubic: (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  easeInQuart: (t) => t * t * t * t,
  easeOutQuart: (t) => 1 - Math.pow(1 - t, 4),
  easeInOutQuart: (t) =>
    t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2,
  easeInQuint: (t) => t * t * t * t * t,
  easeOutQuint: (t) => 1 - Math.pow(1 - t, 5),
  easeInOutQuint: (t) =>
    t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2,
  easeInSine: (t) => 1 - Math.cos((t * Math.PI) / 2),
  easeOutSine: (t) => Math.sin((t * Math.PI) / 2),
  easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  easeInExpo: (t) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
  easeOutExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  easeInOutExpo: (t) =>
    t === 0
      ? 0
      : t === 1
        ? 1
        : t < 0.5
          ? Math.pow(2, 20 * t - 10) / 2
          : (2 - Math.pow(2, -20 * t + 10)) / 2,
};

@Component({
  selector: 'app-drawing',
  templateUrl: './drawing.component.html',
  styleUrls: ['./drawing.component.scss'],
})
export class DrawingComponent {
  @ViewChild('svgElement') svgElement!: ElementRef<SVGElement>;

  allStrokes: DrawingStroke[] = [];
  redoStack: DrawingStroke[] = [];
  activeTool: 'pen1' | 'pen2' | 'highlighter' | 'eraser' = 'pen1';
  showSettings: boolean = false; // For Hamburger toggle

  currentPoints: number[][] = [];
  previewPath: string = '';

  easingOptions = Object.keys(EASINGS).map((key) => ({
    label: key,
    value: key,
  }));

  currentSvgBase64: string = '';

  constructor(private mainService: QlIframeMessageService) {}

  // ----------------handling window events to get the data from the parent app :
  
  ngOnInit() {
    // Listen for messages from the Parent Window
    window.addEventListener('message', this.handleParentMessage.bind(this));
  }

  ngOnDestroy() {
    // Clean up listener to prevent memory leaks
    window.removeEventListener('message', this.handleParentMessage.bind(this));
  }

  handleParentMessage(event: MessageEvent) {
    // Security: It is highly recommended to check the origin
    // if (event.origin !== 'https://your-parent-app.com') return;

    const message = event.data;

    // Check if the message type matches what your parent sends
    if (message.type === 'LOAD_SVG_TO_EDIT' && message.payload) {
      this.importFromBase64(message.payload);
    }
  }

  private importFromBase64(base64String: string) {
    // Clear current canvas before loading new data
    this.clearCanvas();

    // Remove the Data URI prefix if it exists to get the raw base64
    const base64Data = base64String.split(',')[1] || base64String;

    try {
      const decodedSvg = decodeURIComponent(escape(window.atob(base64Data)));

      // We convert the string to a File-like object to reuse your existing parser
      const blob = new Blob([decodedSvg], { type: 'image/svg+xml' });
      const file = new File([blob], 'imported.svg', { type: 'image/svg+xml' });

      this.parseSVGFile(file);
      console.log('Successfully loaded SVG from Parent');
    } catch (error) {
      console.error('Error decoding SVG from parent:', error);
    }
  }

  // ------------------------------------

  tools: any = {
    pen1: this.getDefaultTool('#eb454a', 16),
    pen2: this.getDefaultTool('#3b82f6', 16),
    highlighter: this.getDefaultTool('#ffeb3b', 30, 0.4),
    eraser: { size: 40 },
  };

  private getDefaultTool(color: string, size: number, opacity: number = 1) {
    return {
      color,
      size,
      opacity,
      thinning: 0.5,
      streamline: 0.5,
      smoothing: 0.23,
      easing: 'linear',
      start: { taper: 0, easing: 'linear' },
      end: { taper: 0, easing: 'linear' },
      outline: { color: '#9747ff', width: 0 },
    };
  }

  // --- UTILITIES ---

  toggleSettings() {
    this.showSettings = !this.showSettings;
  }

  resetPenSettings() {
    if (this.activeTool === 'eraser') return;
    const defaults = {
      pen1: { color: '#eb454a', size: 16 },
      pen2: { color: '#3b82f6', size: 16 },
      highlighter: { color: '#ffeb3b', size: 30, opacity: 0.4 },
    };
    const d = (defaults as any)[this.activeTool];
    this.tools[this.activeTool] = this.getDefaultTool(
      d.color,
      d.size,
      d.opacity || 1,
    );
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

  // --- FILE I/O ---

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    if (
      event.dataTransfer &&
      event.dataTransfer.files &&
      event.dataTransfer.files.length > 0
    ) {
      this.parseSVGFile(event.dataTransfer.files[0]);
    }
  }

  triggerUpload() {
    const fileInput = document.getElementById('svgUpload') as HTMLInputElement;
    fileInput.click();
  }

  handleFileUpload(event: any) {
    const file = event.target.files[0];
    if (file) this.parseSVGFile(file);
  }

  parseSVGFile(file: File) {
    if (!file || (!file.type.includes('svg') && !file.name.endsWith('.svg')))
      return;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(e.target.result, 'image/svg+xml');
      const paths = doc.querySelectorAll('path');
      const imported: DrawingStroke[] = [];

      paths.forEach((p) => {
        const d = p.getAttribute('d');
        if (d) {
          // --- NEW LOGIC TO FIX ERASER ---
          // We extract the numbers from the 'd' attribute to simulate points
          // This regex finds all coordinate pairs like "100 200"
          const coords = d.match(/[+-]?\d+(\.\d+)?/g)?.map(Number) || [];
          const simulatedPoints: number[][] = [];
          for (let i = 0; i < coords.length; i += 2) {
            if (coords[i + 1] !== undefined) {
              simulatedPoints.push([coords[i], coords[i + 1]]);
            }
          }

          imported.push({
            path: d,
            color: p.getAttribute('fill') || '#000000',
            opacity: parseFloat(p.getAttribute('fill-opacity') || '1'),
            outlineColor: p.getAttribute('stroke') || 'none',
            outlineWidth: parseFloat(p.getAttribute('stroke-width') || '0'),
            points: simulatedPoints, // Now the eraser has data to check!
          });
        }
      });
      this.allStrokes = [...this.allStrokes, ...imported];
    };
    reader.readAsText(file);
  }

  saveSVG() {
    const svgEl = this.svgElement.nativeElement;
    svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const svgData = svgEl.outerHTML;
    const preface = '<?xml version="1.0" standalone="no"?>\r\n';
    const blob = new Blob([preface, svgData], {
      type: 'image/svg+xml;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `drawing-${Date.now()}.svg`;
    link.click();
  }

  // --- DRAWING CORE ---

  private getLibOptions() {
    const t = this.tools[this.activeTool];
    return {
      size: t.size,
      thinning: t.thinning,
      streamline: t.streamline,
      smoothing: t.smoothing,
      easing: EASINGS[t.easing],
      start: {
        taper: t.start.taper,
        easing: EASINGS[t.start.easing],
        cap: true,
      },
      end: { taper: t.end.taper, easing: EASINGS[t.end.easing], cap: true },
    };
  }

  onPointerDown(e: PointerEvent) {
    if (this.activeTool === 'eraser') {
      this.erase(e);
      return;
    }
    const { x, y } = this.getCoords(e);
    this.currentPoints = [[x, y, e.pressure]];
    this.redoStack = [];
  }

  onPointerMove(e: PointerEvent) {
    if (e.buttons !== 1) return;
    if (this.activeTool === 'eraser') {
      this.erase(e);
      return;
    }
    const { x, y } = this.getCoords(e);
    this.currentPoints = [...this.currentPoints, [x, y, e.pressure]];
    this.previewPath = this.getSvgPathFromStroke(
      getStroke(this.currentPoints, this.getLibOptions()),
    );
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
        outlineWidth: t.outline.width,
      });
    }
    this.currentPoints = [];
    this.previewPath = '';
  }

  private erase(e: PointerEvent) {
    const { x, y } = this.getCoords(e);
    this.allStrokes = this.allStrokes.filter(
      (s) =>
        !s.points.some(
          (p) => Math.hypot(p[0] - x, p[1] - y) < this.tools.eraser.size,
        ),
    );
  }

  private getCoords(e: PointerEvent) {
    const rect = this.svgElement.nativeElement.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  private getSvgPathFromStroke(stroke: number[][]) {
    if (!stroke.length) return '';
    const d = stroke.reduce(
      (acc, [x0, y0], i, _arr) => {
        const [x1, y1] = _arr[(i + 1) % _arr.length];
        acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
        return acc;
      },
      ['M', ...stroke[0], 'Q'],
    );
    d.push('Z');
    return d.join(' ');
  }

  captureSvgAsBase64() {
    const svgEl = this.svgElement.nativeElement;

    // 1. Ensure the namespace is present for standalone rendering
    svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    // 2. Get the outer HTML (the XML string)
    const svgData = new XMLSerializer().serializeToString(svgEl);

    // 3. Encode to Base64
    // We use btoa() for the encoding.
    // encodeURIComponent + unescape handles special characters (like emojis or symbols) safely.
    const base64 = window.btoa(unescape(encodeURIComponent(svgData)));

    // 4. Create the Data URI
    this.currentSvgBase64 = `data:image/svg+xml;base64,${base64}`;

    // Log it or pass it to your required method
    console.log('Generated Base64:', this.currentSvgBase64);
  }

  sendToProject() {
    this.captureSvgAsBase64();
    QlIframeMessageService.sendMessageToParent({
      type: 'ADD_OBJECT',
      payload: {
        dataString: this.currentSvgBase64, // svg string
        type: 'stickerbox',
      },
    });
  }
}
