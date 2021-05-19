import React, { useState, useEffect } from "react";
import { scaleQuantize } from "@visx/scale";
import { NaturalEarth, Graticule } from "@visx/geo";
import * as topojson from "topojson-client";
import * as d3 from "d3";
import countryCodes from "../helpers/countryCodes";
// import topology from "../..public/world-topo.json";

export const background = "#f9f7e8";

const worldTopoURL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const fetchWorld = async (callback) => {
  console.log(`Fetch world topology from '${worldTopoURL}'...`);
  try {
    const worldTopo = await fetch(worldTopoURL).then((response) =>
      response.json(),
    );
    console.log("worldTopo", worldTopo);
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
          `!!!! numeric id ${feature.id} missing TODO: Merge with other!`,
          feature,
        );
        return false;
      }
      feature.id = id;
      return true;
    });
    console.log("world:", world);
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
  colorBy,
  valueMin = null,
  valueMax = null,
  logScale = false,
  events = true,
}) => {
  const [world, setWorld] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const height = width * 0.5;
  if (loading) {
    return <div style={{ height }}>Loading world map...</div>;
  }
  if (error) {
    return <div style={{ height }}>Error: {error.message}</div>;
  }

  const centerX = width / 2;
  const centerY = height / 2;
  const scale = (width / 630) * 100;

  if (valueMin === null && valueMax === null) {
    [valueMin, valueMax] = d3.extent(data, (d) => d[colorBy]);
  } else if (valueMin === null) {
    valueMin = d3.min(data, (d) => d[colorBy]);
  } else if (valueMax === null) {
    valueMax = d3.max(data, (d) => d[colorBy]);
  }
  const domain = [valueMin, valueMax];

  const sequentialScale = logScale ? d3.scaleSequentialLog : d3.scaleSequential;
  const colorScale = sequentialScale(d3.interpolateYlOrRd).domain(domain);

  const color = (feature) => {
    if (!data) {
      return "#999999";
    }
    return colorScale(data.get(feature.id)) ?? "#cccccc";
  };

  return width < 10 ? null : (
    <svg width={width} height={height}>
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
                onClick={() => {
                  if (events)
                    console.log(
                      `Clicked: ${feature.properties.name} (${feature.id})`,
                      feature,
                    );
                }}
              />
            ))}
          </g>
        )}
      </NaturalEarth>
    </svg>
  );
};
