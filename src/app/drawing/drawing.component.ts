import { Component, ElementRef, ViewChild } from '@angular/core';
import { getStroke } from 'perfect-freehand';

interface Stroke {
  path: string;
  color: string;
  width: number;
  opacity: number;
}

interface ToolConfig {
  color: string;
  width: number;
  opacity: number;
}

@Component({
  selector: 'app-drawing',
  templateUrl: './drawing.component.html',
  styleUrls: ['./drawing.component.scss'],
})
export class DrawingComponent {
  @ViewChild('svgElement') svgElement!: ElementRef;

  allStrokes: Stroke[] = [];
  currentPoints: number[][] = [];
  activeTool: 'pen1' | 'pen2' | 'highlighter' | 'eraser' = 'pen1';

  // Independent configs for each pen
  tools: Record<string, ToolConfig> = {
    pen1: { color: '#000000', width: 4, opacity: 1 },
    pen2: { color: '#e91e63', width: 12, opacity: 1 },
    highlighter: { color: '#ffeb3b', width: 25, opacity: 0.5 },
  };

  onPointerDown(e: PointerEvent) {
    const { x, y } = this.getCoords(e);

    if (this.activeTool === 'eraser') {
      this.eraseAt(e);
    } else {
      this.currentPoints = [[x, y, e.pressure]];
      const config = this.tools[this.activeTool];

      this.allStrokes.push({
        path: '',
        color: config.color,
        width: config.width,
        opacity: config.opacity,
      });
    }
  }

  onPointerMove(e: PointerEvent) {
    if (e.buttons !== 1) return;
    if (this.activeTool === 'eraser') {
      this.eraseAt(e);
      return;
    }

    const { x, y } = this.getCoords(e);
    this.currentPoints = [...this.currentPoints, [x, y, e.pressure]];

    const config = this.tools[this.activeTool];
    const strokeData = getStroke(this.currentPoints, {
      size: config.width,
      thinning: 0.5,
      smoothing: 0.5,
      streamline: 0.5,
    });

    this.allStrokes[this.allStrokes.length - 1].path =
      this.getSvgPathFromStroke(strokeData);
  }

  // Same helper methods as before (getCoords, eraseAt, getSvgPathFromStroke, saveSVG)
  private getCoords(e: PointerEvent) {
    const rect = this.svgElement.nativeElement.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  eraseAt(e: PointerEvent) {
    const element = document.elementFromPoint(e.clientX, e.clientY);
    if (element?.tagName === 'path') {
      const index = element.getAttribute('data-index');
      if (index !== null) this.allStrokes.splice(Number(index), 1);
    }
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
    link.download = 'drawing.svg';
    link.click();
  }
}
