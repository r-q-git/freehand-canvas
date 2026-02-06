import { parseSVGFile } from './parseSvgFile';

export function importFromBase64(base64String: string, clearCanvas: any) {
  // Clear current canvas before loading new data
  clearCanvas();

  // Remove the Data URI prefix if it exists to get the raw base64
  const base64Data = base64String.split(',')[1] || base64String;

  try {
    const decodedSvg = decodeURIComponent(escape(window.atob(base64Data)));

    // We convert the string to a File-like object to reuse your existing parser
    const blob = new Blob([decodedSvg], { type: 'image/svg+xml' });
    const file = new File([blob], 'imported.svg', { type: 'image/svg+xml' });

    parseSVGFile(file);
    console.log('Successfully loaded SVG from Parent');
  } catch (error) {
    console.error('Error decoding SVG from parent:', error);
  }
}
