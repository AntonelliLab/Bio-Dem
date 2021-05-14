import * as d3 from "d3";

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
    return d3.extent(data, (d) => accessor(d));
  }
  const minValue = min == null ? d3.min(data, (d) => accessor(d)) : min;
  const maxValue = max == null ? d3.max(data, (d) => accessor(d)) : max;
  return [minValue, maxValue];
};

/**
 * Check if array have any NaN values
 * @param {Array} data the data to check
 * @param {Function} accessor the accessor function for the potential NaN values, default to identity
 * @returns {Boolean} true if a NaN is found
 */
export const haveNaN = (data, accessor = (d) => d) => {
  return data.findIndex((d) => Number.isNaN(accessor(d))) !== -1;
  // return data.findIndex(d => accessor(d) > 0) !== -1;
};

/**
 * Check if value(s) are within the closed interval [minValue, maxValue]
 * @param {Array<Number>|Number} values value(s) to check
 * @param {Array<Number>} interval valid closed interval [minValue, maxValue]
 * @returns {Boolean} true if all values are not outside the specified range
 */
export const isWithin = (value, [minValue, maxValue]) => {
  const values = Array.isArray(value) ? value : [value];
  return values.findIndex((v) => v < minValue || v > maxValue) === -1;
};

/**
 * Get start and end index of first contigous set of numbers in an array
 * Example: Input [NaN, NaN, 1, 1, 2, NaN] gives result [2, 4]
 * @param {Array} data the data to check
 * @param {Function} accessor the accessor function for the potential NaN values, default to identity
 * @returns {Array<Number>} Closed index interval [startIndex, endIndex], where data[startIndex]
 * is the first number and data[endIndex] is the last number in the first contigous set of numbers.
 */
export const getFirstContiguousRangeNotNaN = (data, accessor = (d) => d) => {
  const valueStartIndex = data.findIndex((d) => !Number.isNaN(accessor(d)));
  if (valueStartIndex === -1) {
    return [-1, -1];
  }
  for (let i = valueStartIndex + 1; i < data.length; ++i) {
    if (Number.isNaN(accessor(data[i]))) {
      return [valueStartIndex, i - 1];
    }
  }
  return [valueStartIndex, data.length - 1];
};
