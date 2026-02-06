import { Component, ElementRef, ViewChild } from '@angular/core';

import { getStroke } from 'perfect-freehand';

import { DrawingStroke } from '../models/drawing.model';
import { IframeMessageType } from '../models/drawing.model';

import { QlIframeMessageService } from '../services/QlIframeMessageService';
import { EASINGS } from '../utils/easingMethods';

import { captureSvgAsBase64 } from '../utils/captureSvgAsBase64';
import { saveSVG } from '../utils/saveSvg';
import { parseSVGFile } from '../utils/parseSvgFile';
import { importFromBase64 } from '../utils/importFromBase64';
import {
  getDefaultTool,
  getDefaultToolPen1,
  getDefaultToolPen2,
  getDefaultToolHighlighter,
} from '../utils/getDefaultTool';

import { getSvgPathFromStroke } from '../utils/getSvgPathFromStroke';

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

  currentPoints: number[][] = [];
  previewPath: string = '';

  easingOptions = Object.keys(EASINGS).map((key) => ({
    label: key,
    value: key,
  }));

  tools: any = {
    pen1: getDefaultToolPen1('#eb454a', 16),
    pen2: getDefaultToolPen2('#3b82f6', 16),
    highlighter: getDefaultToolHighlighter('#ffeb3b', 30, 0.4),
    eraser: { size: 40 },
  };

  // ----------handling window events to get the data from the parent app :

  ngOnInit() {
    window.addEventListener('message', this.handleParentMessage.bind(this));
  }

  ngOnDestroy() {
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
    importFromBase64(base64String, this.clearCanvas);
  }

  // ------------------- UTILITIES -----------------
  showSettings: boolean = false; // Hamburger toggle

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
    this.tools[this.activeTool] = getDefaultTool(
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

  // --------------- FILE I/O -----------------------

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
    parseSVGFile(file).then((strokes) => {
      this.allStrokes = strokes;
    });
  }

  // -----------------Save File ------------------------------

  saveSVG() {
    const svgEl = this.svgElement.nativeElement;
    saveSVG(svgEl);
  }

  // -------------- DRAWING CORE ------------------------------

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

  // ------------------Control Methods------------------

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

  private getSvgPathFromStroke(stroke: number[][]): string {
    return getSvgPathFromStroke(stroke);
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

  // ------- send to parent method ---------------------------

  currentSvgBase64: string = '';

  sendAddObject(
    dataString: string,
    type: 'imagebox' | 'stickerbox' | 'textbox' | 'svg',
    metaData?: Record<string, any>,
    targetOrigin: string = '*',
  ) {
    QlIframeMessageService.sendMessageToParent(
      {
        type: IframeMessageType.ADD_OBJECT,
        payload: {
          dataString,
          type,
          metaData,
        },
      },
      targetOrigin,
    );
  }

  sendToProject() {
    const svgEl = this.svgElement.nativeElement;
    //capturing the svg and converting to base64 string
    this.currentSvgBase64 = captureSvgAsBase64(svgEl);
    this.sendAddObject(this.currentSvgBase64, 'imagebox');
  }
}
