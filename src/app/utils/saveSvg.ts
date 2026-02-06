export function saveSVG(svgEl: SVGElement) {
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
