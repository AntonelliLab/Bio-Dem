import * as d3 from "d3";
import { getExtent, computeLegendLayout } from "./helpers";
import "./DualChart.css";

/**
 * Render a bar chart in element el with selected properties
 * @param {string} el d3 selector string, e.g. '#chartElement'
 * @param {Object} properties chart props
 */
export default function DualChart(el, properties) {
  let props = Object.assign(
    {
      autoResize: true,
      width: null, // null to set it to the width of the anchor element
      top: 60,
      right: 80,
      bottom: 45,
      left: 80,
      height: 400,
      xTickGap: 80,
      yTickGap: 30,
      xMin: null,
      xMax: null,
      yMin: null,
      yMax: null,
      y2Min: null,
      y2Max: null,
      zMin: null,
      zMax: null,
      y2LogScale: false,
      data: [],
      stackKeys: null,
      grouped: false, // grouped bar chart instead of stacked (better if y scale is logarithmic)
      // secondData: [],
      extraCurves: [],
      x: (d) => d.x,
      y: (d) => d.y,
      y2: (d) => d.y,
      color: (d) => "steelblue",
      fillOpacity: (d) => 1.0,
      y2Stroke: "#fdd471",
      y2Fill: "#b88918",
      y2Opacity: (d) => 1,
      aux: null, // () => b:Boolean, auxiliary boolean input based on the same x axis
      auxFill: "#CA1229",
      auxStroke: "none",
      auxOpacity: 0.1,
      auxLabel: "Aux",
      aux2: null, // () => b:Boolean, auxiliary boolean input based on the same x axis
      // aux2Fill: "#FB6347",
      aux2Fill: "#FC7E45",
      aux2Stroke: "none",
      aux2Opacity: 0.1,
      aux2Label: "Aux 2",
      xLabel: "Year",
      yLabel: "Value",
      y2Label: "Value #2",
      // zLabel: d => d.z,
      title: "Title",
      fetching: false,
      verticalLineAt: null,
      verticalLineLabel: "Label",
      legend: [],
    },
    properties,
  );

  const stackKeys =
    props.stackKeys && props.stackKeys.length ? props.stackKeys : [];
  const grouped = props.grouped && stackKeys.length > 1;

  const anchorElement = d3.select(el);
  let svg = anchorElement.select("svg");

  // Create svg if not already created
  if (svg.empty()) {
    anchorElement.selectAll("*").remove();
    svg = anchorElement.append("svg");
    svg.append("g");
  }

  const g = svg.select("g");

  // TODO: Remove and use enter set instead
  g.selectAll("*").remove();

  let totalWidth = props.width;
  if (!totalWidth) {
    totalWidth = anchorElement.node().getBoundingClientRect().width;
  }

  const { data } = props;
  const auxData = data.filter(props.aux);
  const aux2Data = data.filter(props.aux2);

  const legendItems =
    props.legend && props.legend.length > 1 ? props.legend : [];

  if (auxData.length > 0) {
    legendItems.push({
      key: "aux",
      label: props.auxLabel,
      fill: props.auxFill,
      opacity: props.auxOpacity,
      aux: true,
    });
  }
  if (aux2Data.length > 0) {
    legendItems.push({
      key: "aux2",
      label: props.aux2Label,
      fill: props.aux2Fill,
      opacity: props.aux2Opacity,
      aux: true,
    });
  }

  const legendLayout = computeLegendLayout(
    legendItems.map((d) => d.label),
    {
      width: totalWidth - props.left - props.right,
      fontSize: "0.8em",
      hGap: 20,
      vGap: 8,
      // lineHeight: 20,
    },
  );
  if (legendItems.length > 0) {
    props.bottom += legendLayout.height;
  }

  const useCurveLegends = props.extraCurves.length > 0;

  const curveLegendItems = useCurveLegends
    ? [
        {
          key: "y2",
          label: props.y2Label,
          fill: props.y2Fill,
          stroke: props.y2Stroke,
        },
        ...props.extraCurves.map(({ label, fill, stroke }) => ({
          key: label,
          label,
          fill,
          stroke,
        })),
      ]
    : [];

  const curveLegendLayout = computeLegendLayout(
    curveLegendItems.map((d) => d.label),
    {
      width: totalWidth - props.left - props.right,
      fontSize: "0.8em",
      hGap: 8,
      vGap: 0,
    },
  );
  if (curveLegendItems.length > 0) {
    props.bottom += curveLegendLayout.height;
  }

  const height = props.height - props.top - props.bottom;
  const width = totalWidth - props.left - props.right;

  svg.attr("width", totalWidth).attr("height", props.height);

  g.attr("transform", `translate(${props.left}, ${props.top})`);

  // Scale the range of the data in the domains
  const xExtent = getExtent(data, props.x, props.xMin, props.xMax);
  const yExtent = getExtent(data, props.y, props.yMin, props.yMax);
  // For second axis
  // const y2Extent = getExtent(data, props.y2, props.y2Min, props.y2Max);
  const y2Extent = getExtent(
    data,
    props.y2,
    !props.y2LogScale || props.y2Min > 1 ? props.y2Min : 1,
    props.y2Max,
  );
  // For z dimension
  // const zExtent = getExtent(data, props.z, props.zMin, props.zMax);

  // set the ranges
  const x = d3
    .scaleBand()
    .domain(d3.range(xExtent[0], xExtent[1] + 1))
    .range([0, width])
    .padding(0.2);

  // For grouped bar chart
  const xGroup = d3
    .scaleBand()
    .domain(stackKeys)
    .rangeRound([0, x.bandwidth()])
    .padding(0.05);

  const y = d3.scaleLog().domain(yExtent).range([height, 0]);

  const logSafe = (v) => Math.max(1, v);

  const y2 = (props.y2LogScale ? d3.scaleLog() : d3.scaleLinear())
    .domain(y2Extent)
    .range([height, 0]);

  const yCurve = d3.scaleLinear().domain([0, 1]).range([height, 0]);

  const xAxis = d3
    .axisBottom(x)
    .tickSizeOuter(0)
    .tickValues(d3.ticks(xExtent[0], xExtent[1], totalWidth / props.xTickGap));

  const yAxis = d3.axisLeft(y).ticks(height / props.yTickGap, "~s");

  const y2Axis = d3.axisRight(y2).ticks(height / props.yTickGap, "~s");

  // Second y data
  const y2line = d3
    .line()
    .x((d) => x(props.x(d)))
    .y((d) => y2(props.y2(d)));

  // const color = d3.scaleSequential(d3.interpolateViridis)
  //   .domain(zExtent);

  const barColor = (d) => {
    // return props.fetching ? '#aaa' : color(props.z(d));
    return props.fetching ? "#aaa" : props.color(d);
  };

  // add the x Axis
  g.append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(0,${height})`)
    .call(xAxis);

  // add the y Axis
  g.append("g").attr("class", "y axis").call(yAxis);

  // Add the second y Axis
  g.append("g")
    .attr("class", "y2 axis")
    .style("fill", useCurveLegends ? "none" : props.y2Stroke)
    .attr("transform", `translate(${width}, 0)`)
    .call(y2Axis);

  // text label for the x axis
  g.append("text")
    .attr("transform", `translate(${width / 2},${height + 45})`)
    .attr("dy", "-0.5em")
    .style("text-anchor", "middle")
    .text(props.xLabel);

  // text label for the y axis
  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - props.left)
    .attr("x", 0 - height / 2)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text(props.yLabel);

  // text label for the second y axis
  if (!useCurveLegends) {
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", width + props.right)
      .attr("x", 0 - height / 2)
      .attr("dy", "-0.5em")
      .style("text-anchor", "middle")
      .text(props.y2Label);
  }

  // text label for title
  g.append("text")
    .attr("transform", `translate(${width / 2},${-props.top})`)
    .attr("dy", "1.5em")
    .style("text-anchor", "middle")
    .text(props.title);

  if (legendItems.length > 0) {
    const legend = g
      .append("g")
      .attr("class", "legend")
      .selectAll(".legend-item")
      .data(legendItems, (d) => d.key)
      .join("g")
      .attr("class", "legend-item")
      .attr(
        "transform",
        (d, i) =>
          `translate(${legendLayout.items[i].x},${
            height + 45 + legendLayout.items[i].y
          })`,
      );

    legend
      .append("rect")
      .attr("width", 10)
      .attr("height", 20)
      .style("fill", (d) => (d.aux ? d.fill : props.color(d)))
      .style("stroke", (d) => (d.aux ? d.fill : props.color(d)))
      .style("stroke-opacity", (d) => (d.aux ? 0.2 : 1))
      .style("fill-opacity", (d) => (d.aux ? d.opacity : props.fillOpacity(d)));

    // Bottom border of aux bar
    legend
      .append("rect")
      .attr("y", 17)
      .attr("width", 10)
      .attr("height", 3)
      .style("fill", (d) => (d.aux ? d.fill : "none"))
      .style("stroke", "none");

    legend
      .append("text")
      .attr("x", 16)
      .attr("y", 10)
      .attr("dy", ".35em")
      .attr("font-size", "0.8em")
      .text((d) => d.label);
  }

  if (curveLegendItems.length > 0) {
    const legend = g
      .append("g")
      .attr("class", "legend")
      .selectAll(".extra-legend-item")
      .data(curveLegendItems, (d) => d.key)
      .join("g")
      .attr("class", "extra-legend-item")
      .attr(
        "transform",
        (d, i) =>
          `translate(${curveLegendLayout.items[i].x},${
            height + 45 + curveLegendLayout.items[i].y + legendLayout.height
          })`,
      );

    legend
      .append("rect")
      .attr("height", 2)
      .attr("width", 14)
      .attr("x", -2)
      .attr("y", 9)
      .style("fill", (d) => d.stroke)
      .style("stroke", "none");

    legend
      .append("circle")
      .attr("r", 3)
      .attr("cx", 5)
      .attr("cy", 10)
      .style("fill", (d) => d.fill)
      .style("stroke", "none");

    legend
      .append("text")
      .attr("x", 16)
      .attr("y", 10)
      .attr("dy", ".35em")
      .attr("font-size", "0.8em")
      .text((d) => d.label);
  }

  if (auxData.length > 0) {
    // Dots for auxiliary boolean input
    const gAux = g
      .selectAll(".aux")
      .data(auxData)
      .join("g")
      .attr("class", "aux");

    // stroke below the bar
    gAux
      .append("rect")
      // .attr("class", "aux")
      .style("fill", props.auxFill)
      .style("stroke", props.auxStroke)
      .attr("x", (d) => x(props.x(d)))
      .attr("width", x.bandwidth())
      .attr("y", height)
      .attr("height", 5);

    // Half-transparent bar to the x-axis to connect with bars
    gAux
      .append("rect")
      .style("fill", props.auxFill)
      .style("stroke", props.auxStroke)
      .style("opacity", props.auxOpacity)
      .attr(
        "x",
        (d) =>
          x(props.x(d)) -
          (0.5 * x.paddingInner() * x.bandwidth()) / (1 - x.paddingInner()),
      )
      .attr("width", x.bandwidth() / (1 - x.paddingInner()))
      .attr("y", -10)
      .attr("height", height + 10);
  }

  if (aux2Data.length > 0) {
    // Dots for auxiliary boolean input
    const gAux = g
      .selectAll(".aux2")
      .data(aux2Data)
      .join("g")
      .attr("class", "aux2");

    // stroke below the bar
    gAux
      .append("rect")
      // .attr("class", "aux")
      .style("fill", props.aux2Fill)
      .style("stroke", props.aux2Stroke)
      .attr("x", (d) => x(props.x(d)))
      .attr("width", x.bandwidth())
      .attr("y", height)
      .attr("height", 5);

    // Half-transparent bar to the x-axis to connect with bars
    gAux
      .append("rect")
      .style("fill", props.aux2Fill)
      .style("stroke", props.aux2Stroke)
      .style("opacity", props.aux2Opacity)
      .attr(
        "x",
        (d) =>
          x(props.x(d)) -
          (0.5 * x.paddingInner() * x.bandwidth()) / (1 - x.paddingInner()),
      )
      .attr("width", x.bandwidth() / (1 - x.paddingInner()))
      .attr("y", -10)
      .attr("height", height + 10);
  }

  if (!grouped) {
    if (stackKeys.length > 1) {
      const stackedData = d3
        .stack()
        .keys(stackKeys)(data)
        .map((d) => (d.forEach((v) => (v.key = d.key)), d));

      g.append("g")
        .selectAll("g")
        .data(stackedData)
        .join("g")
        // .attr("fill", (d) => (d.key === "countPreserved" ? "red" : "blue"))
        .selectAll("rect")
        .data((d) => d)
        .join("rect")
        .attr("class", "bar")
        .style("fill-opacity", props.fillOpacity)
        .style("fill", barColor)
        .style("stroke", barColor)
        .attr("x", (d) => x(props.x(d.data)))
        .attr("width", x.bandwidth())
        // .attr("y", (d) => y(yLogFriendlyAccessor(d)))
        // .attr("height", (d) => height - y(yLogFriendlyAccessor(d)));
        .attr("y", (d) => y(logSafe(d[1])))
        .attr("height", (d) => y(logSafe(d[0])) - y(logSafe(d[1])));
      //     .append("title")
      //       .text(d => `${d.data.name} ${d.key}
      // ${formatValue(d.data[d.key])}`);
    } else {
      g.append("g")
        .selectAll(".bar")
        .data(data)
        .join("rect")
        .attr("class", "bar")
        .style("fill-opacity", props.fillOpacity)
        .style("fill", barColor)
        .style("stroke", barColor)
        .attr("x", (d) => x(props.x(d)))
        .attr("width", x.bandwidth())
        .attr("y", (d) => y(logSafe(props.y(d))))
        .attr("height", (d) => height - y(logSafe(props.y(d))));
    }
  } else {
    g.append("g")
      .selectAll("g")
      .data(data)
      .join("g")
      .attr("transform", (d) => `translate(${x(props.x(d))},0)`)
      .selectAll("rect")
      .data((d) =>
        props.stackKeys.map((key) => ({ data: d, key, value: d[key] })),
      )
      .join("rect")
      .attr("x", (d) => xGroup(d.key))
      .attr("y", (d) => y(logSafe(d.value)))
      .attr("width", xGroup.bandwidth())
      .attr("height", (d) => y(logSafe(0)) - y(logSafe(d.value)))
      .attr("fill", (d) => barColor(d));
  }

  const { extraCurves } = props;
  if (extraCurves.length > 0) {
    const extraLines = extraCurves.map((curve) =>
      d3
        .line()
        .x((d) => x(props.x(d)))
        .y((d) => yCurve(curve.y(d))),
    );

    extraCurves.forEach((curve, i) => {
      // line
      g.append("path")
        .datum(data)
        .style("fill", "none")
        .style("stroke", curve.stroke)
        .style("stroke-width", 2)
        .attr("d", extraLines[i]);

      // dots
      g.append("g")
        .selectAll(`.dot-extra-${i}`)
        .data(data)
        .join("circle")
        .attr("class", `.dot-extra-${i}`)
        .style("fill", curve.fill)
        .attr("cx", (d) => x(props.x(d)))
        .attr("cy", (d) => yCurve(curve.y(d)))
        .attr("r", 3);
    });
  }

  const cleanData = data.filter((d) => !Number.isNaN(props.y2(d)));

  // Add second line
  g.append("path")
    .datum(cleanData)
    .attr("class", "y2line")
    .style("fill", "none")
    .style("stroke", props.y2Stroke)
    .style("opacity", props.y2Opacity)
    .style("stroke-width", 3)
    .attr("d", y2line);

  // Dots for second line
  g.selectAll(".dot")
    .data(cleanData)
    .enter()
    .append("circle") // Uses the enter().append() method
    .attr("class", "dot") // Assign a class for styling
    .style("fill", props.y2Fill)
    .attr("cx", (d) => x(props.x(d)))
    .attr("cy", (d) => y2(props.y2(d)))
    .attr("r", 3);

  const { verticalLineAt } = props;
  if (verticalLineAt) {
    const xMid = x(verticalLineAt) + x.bandwidth() / 2;
    if (verticalLineAt >= props.xMin) {
      g.append("line")
        .attr("x1", xMid)
        .attr("y1", -12)
        .attr("x2", xMid)
        .attr("y2", height)
        .style("stroke-width", 2)
        .style("stroke-dasharray", 4)
        .style("stroke", "#75B176")
        .style("fill", "none");

      // Label on top of vertical line
      g.append("text")
        .attr("transform", `translate(${xMid},${0})`)
        .attr("dy", "-1.3em")
        .attr("font-size", "0.8em")
        .style("text-anchor", "middle")
        .text(props.verticalLineLabel);
    }
  }
}
