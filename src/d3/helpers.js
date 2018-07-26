import * as d3 from 'd3';

/**
 * Get extent with optional specified limits
 * 
 * Example: const xExtent = getExtent(data, x, xMin, xMax);
 * 
 * @param {Array} data the data
 * @param {Function} accessor the accessor function for a choosen dimension
 * @param {Number} min optional minimum value, default to data minimum
 * @param {Number} max optional maximum value, default to data maximum
 * @returns {Array} the extent as [xMin, xMax]
 */
export const getExtent = (data, accessor, min = null, max = null) => {
  if (min == null && max == null) {
    return d3.extent(data, d => accessor(d));
  }
  const minValue = min == null ? d3.min(data, d => accessor(d)) : min;
  const maxValue = max == null ? d3.max(data, d => accessor(d)) : max;
  return [minValue, maxValue];
}
