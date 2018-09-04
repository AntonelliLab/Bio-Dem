
export function hexToRGBA(hex, alpha = 1.0) {
  const [r,g,b] = [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16)
  ];
  return `rgba(${r},${g},${b},${alpha})`;
}