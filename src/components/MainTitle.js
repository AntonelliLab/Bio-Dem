import React from "react";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import BioDemText from "./BioDemText";

export function SubTitle() {
  const isSmall = useMediaQuery((theme) => theme.breakpoints.down("xs"));
  return (
    <div
      style={{
        borderTop: "1px solid #ccc",
        marginTop: -10,
        paddingTop: 10,
      }}
    >
      <Typography
        variant="h5"
        gutterBottom
        className="heading"
        style={{ color: "#666" }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: isSmall ? "column" : "row",
            alignItems: "center",
          }}
        >
          <span style={{ whiteSpace: "nowrap" }}>
            <strong>Biodiversity</strong> knowledge
          </span>
          <span style={{ margin: "0 7px" }}>&amp;</span>
          <strong>democracy</strong>
        </div>
      </Typography>
    </div>
  );
}

export default function MainTitle() {
  return (
    <Grid item className="grid-item intro section section-0" xs={12}>
      <Grid container direction="column" alignItems="center">
        <Grid item style={{ marginTop: 0, padding: "40px 0" }}>
          <Grid container direction="column" alignItems="center">
            <Typography
              variant="h3"
              gutterBottom
              className="heading"
              style={{ color: "rgba(0, 0, 0, 0.54)" }}
            >
              <BioDemText />
            </Typography>
            <SubTitle />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}
