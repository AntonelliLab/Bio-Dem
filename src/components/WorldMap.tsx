import React, { useState, useEffect, useCallback } from "react";
import { scaleQuantize } from "@visx/scale";
import { NaturalEarth, Graticule } from "@visx/geo";
import * as topojson from "topojson-client";
import * as d3 from "d3";
import countryCodes from "../helpers/countryCodes";
import ColorAxisBottom from "./ColorAxisBottom";
import { useTooltip, TooltipWithBounds as Tooltip } from "@visx/tooltip";
import { localPoint } from "@visx/event";

export const background = "#f9f7e8";

const worldTopoURL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const fetchWorld = async (callback) => {
  console.log(`Fetch world topology from '${worldTopoURL}'...`);
  try {
    const worldTopo = await fetch(worldTopoURL).then((response) =>
      response.json(),
    );
    // topojson.merge(us, us.objects.states.geometries.filter(d => d.id in [...]))
    const world = topojson.feature(worldTopo, worldTopo.objects.countries);
    world.features = world.features.filter((feature) => {
      const id = countryCodes.numericToAlpha3(feature.id);
      if (!id) {
        // No id for N. Cyprus, Somaliland and Kosovo.
        // Merge Somaliland with Somalia and N. Cyprus with Cyprus.
        if (feature.properties.name === "Kosovo") {
          feature.id = "KOS";
          return true;
        }
        console.log(
          `Warning: numeric country id ${feature.id} missing. TODO: Merge with other?`,
          feature,
        );
        return false;
      }
      feature.id = id;
      return true;
    });
    callback(world);
  } catch (error) {
    callback(null, error);
  }
};
// const world = topojson.feature(topology, topology.objects.units);
// {
//   type: 'FeatureCollection';
//   features: FeatureShape[];
// };

export default ({
  width,
  data,
  valueMin = null,
  valueMax = null,
  logScale = false,
  tickCount = 10,
  tickFormat = "~s",
  renderTooltip = (country) => country,
  onMouseOver = () => {},
  onMouseOut = () => {},
  onClick = () => {},
  valueAccessor = (value) => value,
}) => {
  const [world, setWorld] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip();

  useEffect(() => {
    fetchWorld((world, err) => {
      if (err) {
        setError(err);
      } else {
        setWorld(world);
        setLoading(false);
      }
    });
  }, []);

  const _onMouseOver = useCallback(
    (event, feature) => {
      const coords = localPoint(event.target.ownerSVGElement, event);
      showTooltip({
        tooltipLeft: coords.x,
        tooltipTop: coords.y,
        tooltipData: feature.id,
      });
      onMouseOver(feature.id, { feature, coords });
    },
    [onMouseOver],
  );

  const _onMouseOut = useCallback(
    (event, feature) => {
      const coords = localPoint(event.target.ownerSVGElement, event);
      hideTooltip();
      onMouseOut(feature.id, { feature, coords });
    },
    [onMouseOut],
  );

  const _onClick = useCallback(
    (event, feature) => {
      event.stopPropagation();
      onClick(feature.id, { feature });
    },
    [onClick],
  );

  const mapHeight = width * 0.52;
  const legendHeight = 50;
  const height = mapHeight + legendHeight;
  if (loading) {
    return <div style={{ height }}>Loading world map...</div>;
  }
  if (error) {
    return <div style={{ height }}>Error: {error.message}</div>;
  }

  const centerX = width / 2;
  const centerY = mapHeight / 2;
  const scale = (width / 630) * 100;

  if (valueMin === null && valueMax === null) {
    [valueMin, valueMax] = d3.extent(data, (d) => d[1]);
  } else if (valueMin === null) {
    valueMin = d3.min(data, (d) => d[1]);
  } else if (valueMax === null) {
    valueMax = d3.max(data, (d) => d[1]);
  }
  const domain = [valueMin, valueMax];

  const sequentialScale = logScale ? d3.scaleSequentialLog : d3.scaleSequential;
  const colorScale = sequentialScale(d3.interpolateYlOrRd).domain(domain);

  const color = (feature) => {
    if (!data) {
      return "#999999";
    }
    return colorScale(valueAccessor(data.get(feature.id))) ?? "#cccccc";
  };

  if (width < 10) {
    return null;
  }

  return (
    <React.Fragment>
      <svg width={width} height={height} onClick={() => onClick(null)}>
        <NaturalEarth
          data={world.features}
          scale={scale}
          translate={[centerX, centerY]}
        >
          {(projection) => (
            <g>
              <Graticule
                graticule={(g) => projection.path(g) || ""}
                stroke="rgba(33,33,33,0.05)"
              />
              {projection.features.map(({ feature, path }, i) => (
                <path
                  key={`map-feature-${i}`}
                  d={path || ""}
                  fill={color(feature)}
                  stroke={background}
                  strokeWidth={0.5}
                  onMouseOver={(e) => _onMouseOver(e, feature)}
                  onMouseOut={(e) => _onMouseOut(e, feature)}
                  onClick={(e) => _onClick(e, feature)}
                />
              ))}
            </g>
          )}
        </NaturalEarth>
        <g transform={`translate(0,${mapHeight})`}>
          <ColorAxisBottom
            width={width}
            colorScale={colorScale}
            logScale={logScale}
            tickCount={tickCount}
            tickFormat={tickFormat}
          />
        </g>
      </svg>
      {tooltipOpen && (
        <Tooltip
          // set this to random so it correctly updates with parent bounds
          key={Math.random()}
          top={tooltipTop}
          left={tooltipLeft}
        >
          {renderTooltip(tooltipData)}
        </Tooltip>
      )}
    </React.Fragment>
  );
};
