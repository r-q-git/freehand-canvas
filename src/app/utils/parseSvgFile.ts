import { DrawingStroke } from '../models/drawing.model';

export function parseSVGFile(file: File): Promise<DrawingStroke[]> {
  return new Promise((resolve, reject) => {
    if (!file || (!file.type.includes('svg') && !file.name.endsWith('.svg'))) {
      resolve([]);
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => reject('Failed to read SVG file');

    reader.onload = (e: any) => {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(e.target.result, 'image/svg+xml');
        const paths = doc.querySelectorAll('path');
        const imported: DrawingStroke[] = [];

        paths.forEach((p) => {
          const d = p.getAttribute('d');
          if (!d) return;

          // --- ERASER FIX: simulate points from path ---
          const coords =
            d.match(/[+-]?\d+(\.\d+)?/g)?.map(Number) || [];

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
            points: simulatedPoints,
          });
        });

        resolve(imported);
      } catch (err) {
        reject(err);
      }
    };

    reader.readAsText(file);
  });
}
