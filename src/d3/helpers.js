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

export const computeLegendLayout = (
  labels,
  {
    width = 300,
    fontSize = "0.8em",
    hGap = 20,
    vGap = 0,
    lineHeight = null,
  } = {},
) => {
  if (!labels || !labels.length) {
    return null;
  }
  const svgNode = document.createElement("svg");
  document.body.append(svgNode);
  const svg = d3.select(svgNode).attr("id", "tmpLegendLayout");
  const text = svg
    .selectAll(".tmpText")
    .data(labels)
    .join("text")
    .attr("class", "tmpText")
    .attr("font-size", fontSize)
    .text((d) => d);
  // const getWidth = (node) => node.getComputedTextLength(); // Why not available here?!
  const getWidth = (node) => node.getBoundingClientRect().width;
  const textLengths = text.nodes().map(getWidth);
  const rowHeight =
    lineHeight || text.nodes()[0].getBoundingClientRect().height;
  let layout = [
    {
      x: 0,
      row: 0,
      indexInRow: 0,
      textWidth: textLengths[0],
      label: labels[0],
    },
  ];
  let currX = 0;
  let row = 0;
  let maxWidth = 0;
  textLengths.forEach((size, i) => {
    currX += size + hGap;
    if (currX > width && i > 0 && layout[i].indexInRow > 0) {
      currX = 0;
      row += 1;
      layout[i] = { ...layout[i], x: currX, row, indexInRow: 0 };
      currX += size + hGap;
    }
    maxWidth = Math.max(currX, maxWidth);
    if (i < textLengths.length - 1) {
      layout.push({
        x: currX,
        row,
        indexInRow: layout[i].indexInRow + 1,
        label: labels[i + 1],
        textWidth: size,
      });
    }
  });
  document.body.removeChild(tmpLegendLayout);
  layout = layout.map((d) => ({
    ...d,
    y: (rowHeight + vGap) * d.row,
    xEnd: d.x + d.textWidth + hGap,
  }));
  maxWidth = d3.max(layout, (d) => d.xEnd);
  return {
    items: layout,
    height: row * (rowHeight + vGap) + rowHeight,
    width: maxWidth,
    lineHeight: rowHeight,
  };
};
