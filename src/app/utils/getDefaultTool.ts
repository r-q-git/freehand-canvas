export function getDefaultTool(
  color: string,
  size: number,
  opacity: number = 1,
) {
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

export function getDefaultToolPen1(
  color: string,
  size: number,
  opacity: number = 1,
) {
  return {
    color,
    size,
    opacity,
    thinning: 0.5,
    streamline: 0.5,
    smoothing: 0.23,
    easing: 'linear',
    start: { taper: 10, easing: 'linear' },
    end: { taper: 0, easing: 'linear' },
    outline: { color: '#9747ff', width: 0 },
  };
}

export function getDefaultToolPen2(
  color: string,
  size: number,
  opacity: number = 1,
) {
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

export function getDefaultToolHighlighter(
  color: string,
  size: number,
  opacity: number = 0.4,
) {
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
