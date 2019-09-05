import React from 'react';
import PropTypes from 'prop-types';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import ReactPlayer from 'react-player'
import './About.css';
import { Typography } from '@material-ui/core';

const vdemDataUrl = `${process.env.PUBLIC_URL}/data/vdem_variables.csv`;


const partners = [
  {
    short: 'GGBC',
    long: 'Gothenburg Global Biodiversity Centre',
    logo: `${process.env.PUBLIC_URL}/logos/ggbc.png`,
    url: 'https://ggbc.gu.se'
  },
  {
    short: 'Kew',
    long: 'Royal Botanic Gardens, Kew',
    logo: `${process.env.PUBLIC_URL}/logos/kew.svg`,
    url: 'https://www.kew.org'
  },
  {
    short: 'V-Dem',
    long: 'Varieties of Democracy',
    logo: `${process.env.PUBLIC_URL}/logos/v-dem.png`,
    url: 'https://www.v-dem.net'
  },
  {
    short: 'iDiv',
    long: 'German Centre for Integrative Biodiversity Research',
    logo: `${process.env.PUBLIC_URL}/logos/idiv.png`,
    url: 'https://www.idiv.de/'
  },
  {
    short: 'BECC',
    long: 'Biodiversity and Ecosystem services in a Changing Climate',
    logo: `${process.env.PUBLIC_URL}/logos/becc.png`,
    url: 'https://www.becc.lu.se'
  },
];

class About extends React.Component {
  render() {
    const { vdemExplanations, gbifExplanations } = this.props;

    return (
      <Grid container>
        {/* First main column */}
        <Grid item className="column" xs={12} sm={6}>
          <h2 id="about">About</h2>
          <p>
            The distribution of biological diversity, or biodiversity, has
            fascinated humans for centuries. On a global scale, the scientific
            knowledge on the geographic distribution of this diversity, is based
            on natural history collections; traditionally as physical specimens
            in museums herbaria or private collections and more recently
            complemented by observations (vegetation plots or bird surveys),
            camera trap observation and citizen science data linked to
            photographs. The public availability of information from these
            sources has increased dramatically in the last decade, in good parts
            due to large scale data aggregators, such as the Global Biodiversity
            Information Facility.
          </p>

          <p>
            Fantastic as it is, the data available from such public aggregators
            is often biased geographically, for instance because some localities
            are more easily accessible, more spectacular or have a stronger
            naturalist history then others. While it is relative well understood
            which geographic factors favour record collection and hence
            knowledge on biodiversity,{" "}
            <strong>
              relatively little is known on the impact of society and political
              regime on record collection.
            </strong>{" "}
            This is surprising because first, it seems straight forward that
            some regimes would favour naturalist collection (e.g. open, safe,
            democratic) whereas others would not (repressive, unsafe,
            authoritarian), and second a considerable body of literature exists
            on the links between political regimes and the environmental
            performance of countries.
          </p>

          <p>
            <strong>Bio-Dem addresses this gap</strong>, and provides a web-app
            to visually explore the availability of geographic occurrence
            records of biological species available from the Global Biodiversity
            Information Facility (as proxy for scientific biodiversity
            knowledge) in relation to political systems around the world Some
            specific questions that motivated the development of Bio-Dem are:{" "}
          </p>

          <ul>
            <li>
              Which role do political regimes play for collecting specimens (and
              getting them into GBIF)?{" "}
            </li>

            <li>
              Do democracies perform better in collecting biodiversity
              knowledge?{" "}
            </li>

            <li>
              How important are individual dimensions of regime types, such as
              freedom of movement, rule of law and strength of the civil
              society?{" "}
            </li>

            <li>Which role do other factors play, such as national GDP?</li>

            <li>How do conflicts impact record availability </li>
          </ul>

          <h3 id="gbif">
            Biodiversity collection: The global biodiversity Information
            Facility
          </h3>

          <p>
            <a target="_blank" rel="noopener noreferrer" href="https://www.gbif.org">
              The Global Biodiversity Information Facility (GBIF)
            </a>{" "}
            provides access to digitalized information on the geographic
            distribution of biological species, mostly georeferenced point
            occurrences. The data are contributed from scientific institutions
            and citizen science projects around the world and include among
            others scientific collections from museums and herbaria, scientific
            observation records, camera trap pictures or citizen science
            observations. GBIF to date provides free access to more than 1
            billion occurrence records collected in over three centuries around
            the globe. If you want to learn more about GBIF or access species
            occurrence information, visit{" "}
            <a target="_blank" rel="noopener noreferrer" href="https://www.gbif.org">GBIF</a>. Bio-Dem fetches the number
            of occurrence records live from the latest version of GBIF via the{" "}
            <a target="_blank" rel="noopener noreferrer" href="https://www.gbif.org/developer/summary">GBIF API</a>.
          </p>

          <h3 id="v-dem">
            Political Regimes: The Varieties of Democracy project
          </h3>

          <p>
            <a target="_blank" rel="noopener noreferrer" href="https://v-dem.net">Varieties of Democracy (V-Dem)</a> is a
            research project dedicated to the conceptualization and collection
            of data on democracy. It is one of the largest existent databases on
            democracy containing over 18 million data points, where the latest
            version covers 201 countries and the years 1789 to 2017. These data
            enable to work with both aggregated higher-level concepts such as
            "electoral democracy" or disaggregated concepts capturing for
            example women's participation in civil society or freedom of
            academic expression. The data combine factual data with expert-based
            subjective measures through a Bayesian modelling procedure,
            accounting for coder bias and heterogeneity across countries and
            years. For more information, visit{" "}
            <a target="_blank" rel="noopener noreferrer" href="https://www.v-dem.net/en/">V-Dem's website</a>, read{" "}
            <a target="_blank" rel="noopener noreferrer" href="http://journals.sagepub.com/doi/abs/10.1177/0192512115622046?journalCode=ipsa">
              "Measuring high level democratic principles using the V-Dem data"
            </a>{" "}
            or{" "}
            <a target="_blank" rel="noopener noreferrer" href="https://www.v-dem.net/en/data/data-version-8/">
              download the data and browse the codebook
            </a>
            . Bio-Dem currently{" "}
            <a target="_blank" rel="noopener noreferrer" href="https://github.com/AntonelliLab/Bio-Dem/blob/master/public/data/vdem_variables.csv">
              uses V-Dem version 8
            </a>{" "}
            and will be updated as new versions are being published. The current
            selected data for the application can be downloaded{" "}
            <a target="_blank" rel="noopener noreferrer" href={vdemDataUrl} download >
              here
            </a>
            .
          </p>

          <h3 id="inthegreatercontext">In the greater context</h3>
          <p>
            Bio-Dem visualizes the relation between biological collection
            records from any given country and the political situation in this
            country. It must be noted that, in general, correlation is not
            causation (see{" "}
            <a target="_blank" rel="noopener noreferrer" href="http://www.tylervigen.com/spurious-correlations">here</a>{" "}
            for illustrative examples) and that, in particular, there are some
            caveats related to the data used by Bio-Dem. For instance, the
            amount of occurrence information available from GBIF is only a crude
            and certainly biased proxy of national knowledge of biodiversity
            (and not all countries have institutions contributing to GBIF); and
            the connection between political systems and biodiversity collection
            and knowledge are certainly complicated. However, scientific
            collection and laymen naturalist activity--two major sources of
            species occurrence information--are clearly influenced by political
            structure and society of a country, such as the freedom of movement
            and physical violence. We only included those indicators in Bio-Dem
            which have a
            <a href="#political-indicator-variables">
              mechanistic link
            </a>{" "}
            to biodiversity collections. Indeed, interesting patterns emerge
            globally and for individual countries through time as shown by the
            example plots. We consider Bio-Dem primarily as an exploration tool
            to reveal interesting patterns and inspire new thoughts on research,
            collection activity, data sharing and, ideally, policy.
          </p>

          <h2 id="tutorials">Tutorials</h2>
          <p>
            Learn more about the features of Bio-Dem to explore the relation
            between biodiversity data and political regime in our video
            tutorials:
          </p>

          <h3 id="tutorial1Biodiversityknowledgeandpoliticalregimes">
            Tutorial 1 - Biodiversity knowledge & political regimes
          </h3>
          <div className="youtube-wrapper">
            <ReactPlayer
              url="https://www.youtube.com/watch?v=dkUHRdBRUj0"
              config={{ youtube: { playerVars: { origin: window.location.origin } } }}
            />
          </div>

          <h3 id="tutorial2Biodiversityknowledgethroughtime">
            Tutorial 2 - Biodiversity knowledge through time
          </h3>
          <div className="youtube-wrapper">
            <ReactPlayer
              url="https://www.youtube.com/watch?v=9c4-qgBXYw4"
              config={{ youtube: { playerVars: { origin: window.location.origin } } }}
            />
          </div>
          

          <h2 id="team">Team</h2>
          <div>
            <a target="_blank" rel="noopener noreferrer" href="https://alexanderzizka.net/">Alexander Zizka</a>
          </div>
          <div>
            <a target="_blank" rel="noopener noreferrer" href="https://www.linkedin.com/in/oskarryden/">Oskar Ryden</a>
          </div>
          <div>
            <a target="_blank" rel="noopener noreferrer" href="http://icelab.se/about/team/daniel-edler/">
              Daniel Edler
            </a>
          </div>
          <div>
            <a target="_blank" rel="noopener noreferrer" href="https://www.linkedin.com/in/dr-johannes-klein-220479127/">
              Johannes Klein
            </a>
          </div>
          <div>
            <a target="_blank" rel="noopener noreferrer" href="https://www.v-dem.net/en/v-dem-institute/staff/">
              Staffan Lindberg
            </a>
          </div>
          <div>
            <a target="_blank" rel="noopener noreferrer" href="https://www.kew.org/science/our-science/people/alexandre-antonelli">
              Alexandre Antonelli
            </a>
          </div>

          <h3>Partners</h3>
          { partners.map(partner => <div key={partner.short}><a href={partner.url}>{`${partner.short} - ${partner.long}`}</a></div>) }

          <Box id="partners" display="flex" flexWrap="wrap">
            { partners.map(partner => (
              <Box key={partner.short} className="partner" display="flex" flexDirection="column" alignItems="center" component="a" href={partner.url} p={1} title={partner.long}>
                { partner.logo ? <img alt={partner.short} src={partner.logo} height={80} /> : null }
                { false ? <Typography>{partner.long}</Typography> : null }
              </Box>
            ))}
          </Box>

          <p>
            <a href="mailto:bio-dem@googlegroups.com">Contact us</a>, check out
            the{" "}
            <a target="_blank" rel="noopener noreferrer" href="https://github.com/AntonelliLab/Bio-Dem">source code</a> or
            file a{" "}
            <a target="_blank" rel="noopener noreferrer" href="https://github.com/AntonelliLab/Bio-Dem/issues">
              bug report
            </a>
            .
          </p>

          <h2 id="references">References</h2>
          <p>
            Amano, T. and W.J Sutherland (2013). “Four barriers to the global
            understanding of biodiversity conservation: wealth, language,
            geographical location and security”.{" "}
            <em>Proceedings of the Royal Society</em>, 20122649.
          </p>
          <p>
            Bernauer, T., T. Böhmelt and V. Koubi (2013). “Is There a
            Democracy–Civil Society Paradox in Global Environmental
            Governance?”. <em>Global Environmental Politics</em>, vol. 13(1):
            88-107.
          </p>
          <p>
            Binder, S. and E. Neumayer (2005). “Environmental pressure group
            strength and air pollution: An empirical analysis”.{" "}
            <em>Ecological Economics</em>, 55: 527-538.
          </p>
          <p>
            Buitenzorgy, M. and A.P.J. Mol (2010). “Does Democracy Lead to a
            Better Environment? Deforestation and the Democratic Transition
            Peak”. <em>Environmental Resource Economics</em>, 48: 59-70.
          </p>
          <p>
            Bolt, J., R. Inklaar, H. De Jong and J.L. Van Zanden (2018).
            ”Rebasing ”Maddison”: New Income Comparisons and the Shape of
            Long-Run Economic Development”. Maddison Working Paper 10.
          </p>
          <p>
            Coppedge, M., J. Gerring, C.H. Knutsen, S.I. Lindberg, S-E.
            Skaaning, J. Teorell, D. Altman, M. Bernhard, A. Cornell, M.S. Fish,
            H, Gjerløw, A. Glynn, A. Hicken, J. Krusell, A. Lührmann, K.L.
            Marquardt, K. McMann, V. Mechkova, M. Olin, P. Paxton, D. Pemstein,
            B. Seim, R. Sigman, J. Staton, A. Sundtröm, E. Tzelgov, L. Uberti,
            Y-T. Wang, T. Wig, and D. Ziblatt (2018). “V-Dem Codebook v8”,
            Varieties of Democracy (V-Dem) Project.
          </p>
          <p>
            Chadwick, B.P. (1995) “Fisheries, Sovereignties and Red Herrings”.{" "}
            <em>Journal of International Affars</em>, vol. 48(2): 559-584.
          </p>
          <p>
            Desai, U (1998). “Environment, Economic Growth, and Government in
            Developing Countries”, in (ed.) Desai, U.{" "}
            <em>
              Ecological Policy and Politics in Developing Countries: Economic
              Growth, Democracy, and Environment
            </em>
            . State University of New York Press: Albany, New York.
          </p>
          <p>
            Freitag, S., C. Hobson, H.C. Biggs and A.S.V. Jaarsveld (1998).
            “Testing for potential survey bias: the effect of roads, urban areas
            and nature reserves on a southern African mammal data set”.{" "}
            <em>Animal Conservation</em>, 1: 119-127.
          </p>
          <p>
            Li, Q. and R. Reuveny (2006). “Democracy and Environmental
            Degradation”. <em>International Studies Quarterly</em>, 50: 935-956.
          </p>
          <p>
            Meyer, C. H. Kreft, R. Guralnick and W. Jetz (2015). “Global
            priorities for an effective information basis of biodiversity
            distributions”. <em>Nature Communications</em>, 6:8221.
          </p>
          <p>
            Midlarsky M.I. (1998). “Democracy and the Environment: An Empirical
            Assessment”. <em>Journal of peace Research</em>, 35(3):341-361.
          </p>
          <p>
            Neumayer, E (2002). “Do Democracies Exhibit Stronger International
            Environmental Commitment? A Cross-Country Analysis”.{" "}
            <em>Journal of Peace Research</em>, vol. 39(2): 139-164.
          </p>
          <p>
            Payne, R.A (1995). “Freedom and the environment”.{" "}
            <em>Journal of Democracy</em>, vol. 6(3). Pellegrini, L. and R.
          </p>
          <p>
            Gerlach (2006). “Corruption, Democracy, and Environmental Policy: An
            Empirical Contribution to the Debate”.{" "}
            <em>The Journal of Environment &amp; Development</em>, vol. 15(3):
            332-354.
          </p>
          <p>
            Shandra, J.M., C. Leckband, L.A. McKinney and B. London (2009).
            “Ecologically Unequal Exchange, World Polity, and Biodiversity Loss:
            A Cross-National Analysis of Threatened Mammals”.{" "}
            <em>International Journal of Comparative Sociology</em>, vol.
            50(3-4): 285-310.
          </p>
          <p>
            Smith, R.J., R.D.J. Muir, M.J Walpole, A. Balmford and M.
            Leader-Williams (2003). “Governance and the loss of biodiversity”.{" "}
            <em>Nature</em>, 426.
          </p>
          <p>
            Sundström, A (2015). “Covenants with broken swords: Corruption and
            law enforcement in governance of the commons”.{" "}
            <em>Global Environmental Change</em>, 31: 253-262.
          </p>
          <p>
            Yang, W. K. Ma and H. Kreft (2014). “Environmental and
            socio-economic factors shaping the geography of floristic
            collections in China”. <em>Global Ecology and Biogeography</em>, 23:
            1284-1292.
          </p>
        </Grid>

        {/* Second main column */}
        <Grid item className="column" xs={12} sm={6}>
          <h2 id="political-indicator-variables">
            Political indicator variables and their connection to biodiversity
            collections
          </h2>

          {
            vdemExplanations.map(d => (
              <div key={d.id}>
                <h4 id={d.id}>{d.short_name}</h4>

                <p>
                  <em>Description:</em> {d.description}
                </p>
                <p>
                  <em>Relevance:</em> {d.relevance}
                </p>
                <p>
                  <em>References:</em> {d.references}
                </p>
              </div>
            ))
          }

          <h2 id="biodiversity-indicator-variables">
            Biodiversity indicator variables
          </h2>
          {
            gbifExplanations.map(d => (
              <div key={d.id}>
                <h4 id={d.id}>{d.short_name}</h4>

                <p>
                  <em>Description:</em> {d.description}
                </p>
                <p>
                  <em>Relevance:</em> {d.relevance}
                </p>
              </div>
            ))
          }
        </Grid>
      </Grid>
    );
  }
}

About.propTypes = {
  vdemExplanations: PropTypes.array.isRequired,
  gbifExplanations: PropTypes.array.isRequired,
};

export default About;
