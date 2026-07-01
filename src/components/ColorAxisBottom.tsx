import React from "react";
import * as d3 from "d3";

function translateX(scale0, scale1, d) {
  const x = scale0(d);
  return `translate(${isFinite(x) ? x : scale1(d)},0)`;
}

function translateY(scale0, scale1, d) {
  const y = scale0(d);
  return `translate(0,${isFinite(y) ? y : scale1(d)})`;
}

export const TOP = "TOP";
export const RIGHT = "RIGHT";
export const BOTTOM = "BOTTOM";
export const LEFT = "LEFT";

const defaultAxisStyle = {
  orient: BOTTOM,
  tickSizeInner: 6,
  tickSizeOuter: 6,
  tickPadding: 3,
  strokeWidth: 1,
  strokeColor: "#777777",
  tickFont: "sans-serif",
  tickFontSize: 10,
};

export default ({
  width: fullWidth,
  colorScale,
  logScale,
  style,
  tickCount = 10,
  tickFormat = "~s",
  colorBarWidth = 20,
  margin = 30,
}) => {
  const width = fullWidth - 2 * margin;
  const domain = colorScale.domain();
  const scale = logScale ? d3.scaleLog() : d3.scaleLinear();
  scale.domain(domain).range([0, width]);
  // const axis = d3.axisBottom(scale)

  const range = scale.range();
  const values = scale.ticks(tickCount);
  const format = scale.tickFormat(tickCount, tickFormat);
  const position = scale.copy();

  const axisStyle = Object.assign({}, defaultAxisStyle, style);
  const {
    orient,
    tickSizeInner,
    tickPadding,
    tickSizeOuter,
    strokeWidth,
    strokeColor,
    tickFont,
    tickFontSize,
  } = axisStyle;

  const transform =
    orient === TOP || orient === BOTTOM ? translateX : translateY;
  const tickTransformer = (d) => transform(position, position, d);

  const k = orient === TOP || orient === LEFT ? -1 : 1;
  const isRight = orient === RIGHT;
  const isLeft = orient === LEFT;
  const isTop = orient === TOP;
  const isBottom = orient === BOTTOM;
  const isHorizontal = isRight || isLeft;
  const x = isHorizontal ? "x" : "y";
  const y = isHorizontal ? "y" : "x";

  const halfWidth = strokeWidth / 2;
  const range0 = range[0] + halfWidth;
  const range1 = range[range.length - 1] + halfWidth;

  const spacing = Math.max(tickSizeInner, 0) + tickPadding;
  const colorRectProps = [];
  for (let i = 1; i < values.length; ++i) {
    const x0 = scale(values[i - 1]);
    const x1 = scale(values[i]);
    colorRectProps.push({
      key: i,
      color: colorScale(values[i]),
      x: x0,
      y: 0,
      width: x1 - x0,
      height: colorBarWidth,
    });
  }

  return (
    <g transform={`translate(${margin},0)`}>
      <g>
        {colorRectProps.map(({ key, x, y, width, height, color }) => (
          <rect
            key={key}
            x={x}
            y={y}
            width={width}
            height={height}
            fill={color}
          />
        ))}
      </g>
      <g
        transform={`translate(0,${colorBarWidth})`}
        fill={"none"}
        fontSize={tickFontSize}
        fontFamily={tickFont}
        textAnchor={isRight ? "start" : isLeft ? "end" : "middle"}
        strokeWidth={strokeWidth}
      >
        <path
          stroke={strokeColor}
          d={
            isHorizontal
              ? `M${k * tickSizeOuter},${range0}H${halfWidth}V${range1}H${
                  k * tickSizeOuter
                }`
              : `M${range0},${k * tickSizeOuter}V${halfWidth}H${range1}V${
                  k * tickSizeOuter
                }`
          }
        />
        {values.map((v, idx) => {
          let lineProps = { stroke: strokeColor };
          lineProps[`${x}2`] = k * tickSizeInner;
          lineProps[`${y}1`] = halfWidth;
          lineProps[`${y}2`] = halfWidth;

          let textProps = {
            fill: strokeColor,
            dy: isTop ? "0em" : isBottom ? "0.71em" : "0.32em",
          };
          textProps[`${x}`] = k * spacing;
          textProps[`${y}`] = halfWidth;

          return (
            <g key={`tick-${idx}`} opacity={1} transform={tickTransformer(v)}>
              <line {...lineProps} />
              <text {...textProps}>{format(v)}</text>
            </g>
          );
        })}
      </g>
    </g>
  );
};
