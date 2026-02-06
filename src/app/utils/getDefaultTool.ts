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
    easing: 'easeInOutExpo',
    start: { taper: 20, easing: 'easeInOutExpo' },
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
    easing: 'easeInOutSine',
    start: { taper: 5, easing: 'linear' },
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
    thinning: 0,
    streamline: 0.5,
    smoothing: 0.23,
    easing: 'linear',
    start: { taper: 0, easing: 'linear' },
    end: { taper: 0, easing: 'linear' },
    outline: { color: '#9747ff', width: 0 },
  };
}
