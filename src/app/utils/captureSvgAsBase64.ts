export function captureSvgAsBase64(svgEl: SVGElement): string {
  // 1. Ensure the namespace is present for standalone rendering
  svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  // 2. Get the outer HTML (the XML string)
  const svgData = new XMLSerializer().serializeToString(svgEl);

  // 3. Encode to Base64
  // We use btoa() for the encoding.
  // encodeURIComponent + unescape handles special characters (like emojis or symbols) safely.
  const base64 = window.btoa(unescape(encodeURIComponent(svgData)));

  console.log(`data:image/svg+xml;base64,${base64}`);

  // 4. Create the Data URI
  return `data:image/svg+xml;base64,${base64}`;
}
