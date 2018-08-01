import React from "react";
import PropTypes from "prop-types";
import Grid from '@material-ui/core/Grid';
import './About.css';

class About extends React.Component {
  render() {
    const { vdemExplanations : vdem } = this.props;
    const vdemExplanations = Object.keys(vdem).map(d => vdem[d]);

    return (
      <Grid container>
        {/* First main column */}
        <Grid item className="column" xs={12} sm={6}>
          <h2 id="about">About</h2>
          <p>
            The distribution of biological diversity, or biodiversity, has
            fascinated humans for centuries. For centuries the humanities
            knowledge of the distribution of this diversity, beyond the local
            scale is based on naturalist collections, first as physical specimens
            in museums herbaria or private collections and in more recent times
            complemented by among others scientific and laymen observations,
            camera trap observation and most recently large scale citizen science
            data linked to photographs. The public availability of species
            occurrence information from these sources has increased dramatically
            in the last decade, in good parts thanks due large scale data
            aggregators, such as the global biodiversity Information Facility,
            that provide access to geographic distribution information of
            biological species.
          </p>

          <p>
            The availability of such collection is strongly biased geographically,
            for instance because some localities are more easily accessible, more
            spectacular or have a stronger naturalist history then others. While
            it is relative well understood which geographic factors favour record
            collection and hence knowledge on biodiversity, relatively little is
            known on the impact of society and political regime on record
            collection. This is surprising because first, it seems straight
            forward that some regimes would favour naturalist collection (e.g.
            open, safe, democratic) whereas others would not (repressive, unsafe,
            authoritarian) and second a considerable body of literature exists on
            the links between political regimes and the environmental performance.
          </p>

          <p>
            Bio-Dem tries to address this gap by exploring biodiversity knowledge
            (approximated as geographic occurrence records in GBIF) and political
            systems for countries around the world. Some specific questions that
            motivated the development of Bio-Dem are:{" "}
          </p>

          <ul>
            <li>
              Which role do political regimes play for collecting specimens (and
              getting them into GBIF)?{" "}
            </li>

            <li>
              Do democracies perform better in collecting biodiversity knowledge?{" "}
            </li>

            <li>
              How important are individual facets of regime types, such as freedom
              of movement, rule of law and strength of the civil society?{" "}
            </li>

            <li>Which role to other factors play, such as national GDP?</li>

            <li>How do conflicts impact record availability </li>
          </ul>

          
          <h3 id="howtousebiodem">How to use Bio-Dem</h3>
          <p>
            Learn more about the features of Bio-Dem to explore the relation between biodiversity data and political regime in this video:
          </p>


          <h3 id="highlights">Highlights</h3>
          <p>
            A set of four predefined plots which can be access directly and show
            some interesting pattern, plus explanatory text.
          </p>

          
          <h3 id="gbif">
            Biodiversity collection: The global biodiversity Information Facility
          </h3>
          
          <p>
            The Global Biodiversity Information Facility (GBIF) is a large scale
            data aggregation providing access to digitalized information on the
            geographic distribution of biological species, mostly in the form of
            geographic point occurrences. The data are contributed from scientific
            institutions and citizen science projects around the world and include
            among others scientific collections from museums and herbaria,
            scientific observation records, camera trap pictures or citizen
            science observations. GBIF to date provides free access to more than 1
            billion occurrence records collected in over three centuries from
            across the globe. If you want to learn more about GBIF or access
            species occurrence information, visit www.gbif.org. Bio-Dem fetches
            the number of occurrence records per country and time live from the
            recent version of GBIF via the GBIF API.
          </p>

          <h3 id="v-dem">
            Political Regimes: The Varieties of Democracy project
          </h3>

          <p>
            Varieties of Democracy (V-Dem) is a research project dedicated to the
            conceptualization and collection of data on democracy. It is one of
            the largest existent databases on democracy containing over 18 million
            data points, where the latest version covers 201 countries and the
            years 1789 to 2017. They provide superior flexibility in terms of
            measurement, in that one can work with both aggregated higher-level
            concepts such as "electoral democracy" or disaggregated concepts
            capturing for example women's participation in civil society or
            freedom of academic expression. The data is constructed by aggregating
            both factual data with expert-based subjective measures through a
            Bayesian procedure that manages several issues, including coder bias
            and heterogeneity across countries and years. For more information,
            visit <a href="https://www.v-dem.net/en/">V-Dem's website</a>, read <a href="http://journals.sagepub.com/doi/abs/10.1177/0192512115622046?journalCode=ipsa">
              "Measuring high level democratic principles using the V-Dem data"
            </a>{" "}
            or <a href="https://www.v-dem.net/en/data/data-version-8/">
              download the data and browse the codebook
            </a>. Bio-Dem currently uses V-Dem version 8 and will be updated as
            new version are being published.
          </p>


          <h2 id="inthegreatercontext">In the greater context</h2>

          <p>
            Bio-Dem is build to explore the relation between the number of
            biological collection records available from any given country with
            the political situation in this country, also through time. It must be
            noted that, in general, correlation is not causation (see <a href="http://www.tylervigen.com/spurious-correlations">here</a> for
            illustrative examples) and that, in particular, there are some caveats
            related to the data used by Bio-Dem. For instance, the amount of
            occurrence information available from GBIF is only a crude and
            certainly biased proxy of national knowledge of biodiversity (and not
            all countries have institutions contributing to GBIF); and the
            connection between political systems and biodiversity collection and
            knowledge are certainly complicated. However, scientific collection
            and laymen naturalist activity--two major sources of species
            occurrence information--are clearly influenced by political structure
            and society of a country, such as the freedom of movement and physical
            violence. We only included those indicators in Bio-Dem which have a
            sound mechanistic link to biodiversity collections (see <a href="link top the about theb data section">About the data</a>).
            Indeed, interesting <a href="link to highlights section">patterns emerge</a> globally and
            for individual countries through time. We consider Bio-Dem primarily
            as an exploration tool, which can reveal interesting patterns and
            inspire new thoughts on research, collection activity, data sharing
            and ideally policy.
          </p>

        </Grid>
        
        {/* Second main column */}
        <Grid item className="column" xs={12} sm={6}>
          
          
          <h3 id="politicalindicatorvariablesandtheirconnectiontobiodiversitycollections">
            Political indicator variables and their connection to biodiversity
            collections
          </h3>

          { vdemExplanations.map(d => (
            <div key={d.id}>
              <h4 id={d.id}>{d.short_name}</h4>
              
              <p><em>Description:</em> {d.description}</p>
              <p><em>Relevance:</em> {d.relevance}</p>
              <p><em>References:</em> {d.references}</p>
            </div>
          )) }

          <h2 id="references">References</h2>

        </Grid>
      </Grid>
    );
  }
}

About.propTypes = {
  vdemExplanations: PropTypes.object.isRequired,
};

export default About;