import React from "react";
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import './About.css';

export default class About extends React.Component {
  render() {
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

          <h4 id="regimetypev2x_regime">Regime type (v2x_regime)</h4>

          <p>
            <em>Description.</em> This variable classifies regimes according to
            how democratic they are. It evaluates regimes according to two
            principles. First, how competetive the process of access to power is.
            A competetive process is characterized by free and fair multiparty
            elections supported by political and civil liberties such as freedom
            of expression, right to alternative information and associational
            freedom. Second, how liberal democratic a regime is. This is
            characterized by the so called rule of law and the presence of both
            legislative and judicial constraints on the executive. The end-product
            is four types of regimes: Closed autocracy, a regime that holds no
            elections. Electoral autocracy, a regime that on paper elects the
            legislative and executive, but these elections are neither free, fair,
            multiparty in the real sense or supported by the essential political
            liberties. Electoral democracy, a regime that holds elections for the
            legislature and executive that are free, fair, multiparty and
            supported by essential political liberties. Liberal democracy, a
            regime that fulfills the requirements of electoral democracy, but also
            live up to the liberal principles of democracy. This classification is
            ordinal, ranging from autocratic to liberal democratic.
          </p>

          <p>
            <em>Relevance</em>
          </p>

          <p>
            <em>References</em> @Coppedge2018;
          </p>

          <h4 id="polyarchyorelectoraldemocracyv2x_polyarchy">
            Polyarchy (or electoral democracy?) (v2x_polyarchy)
          </h4>

          <p>
            <em>Description</em> This variable measures to what extent a country
            is democratic in the electoral sense. It is theoretically derived from
            the prominent political scientist Robert Dahl's conception of
            polyarchy, rule by the many. It includes to what degree a regime
            selects is executive and legislative through popular elections,
            whether these elections are free and fair, and how widespread the
            right to vote is. It also measures the presence of freedom of
            expression and the right to alternative information, and the freedom
            of association of people to organize themselves in political parties
            and civil society organizations, despite being potential oppositional
            forces. It ranges from 0 to 1, where higher scores indicate more
            electoral democracy.
          </p>

          <p>
            <em>Relevance</em>
          </p>

          <p>
            <em>References</em> @Coppedge2018;{" "}
          </p>

          <h4 id="freedomofexpressionandalternativeinformationv2x_freexp_altinf">
            Freedom of expression and alternative information (v2x
            <em>freexp</em>altinf)
          </h4>

          <p>
            <em>Description.</em> To what extent has a country freedom of
            expression and alternative sources of information do exist? This
            include aspects concerning press and media freedom, academic and
            cultural freedom as well as the freedom for citizens to discuss
            political matters in public and private spheres. It ranges from 0 to
            1, where higher scores indicate more freedom of expression and access
            to alternative information.
          </p>

          <p>
            <em>Relevance.</em> In countries characterized by higher levels of
            informational freedom and the ability to openly discuss and
            disseminate information on virtually any aspect, we should expect
            citizens to be more informed about environmental issues. This can
            generate higher levels of environmental interest among citizens and
            subsequently spur engagement for contributing to the information
            collection of biodiversity related indicators. If information
            collection potentially is conflictual to the aims or interests of the
            government, political freedoms such as these should stimulate the
            collection and dissemination of them, despite the risks.
          </p>

          <p>References: @Coppedge2018; @Chadwick1995; @Payne1995.</p>

          <h4 id="freedomofassociationv2x_frassoc_thick">
            Freedom of association (v2x
            <em>frassoc</em>thick)
          </h4>

          <p>
            <em>Description.</em> To what extent a country does a country provide
            freedom of association to its citizens? The variable captures if civil
            society organizations can operate freely and without fear of
            repression from the government, and whether new or oppositional
            political parties are free to take form and participate in elections.
            It ranges from 0 to 1, where higher scores indicate higher levels of
            associational freedom.
          </p>

          <p>
            <em>Relevance.</em> In countries where people are free to organize
            themselves, either in civil society organizations or political
            parties, it is more likely that such organizations with an ecological
            orientation exist. Especially if there are environmental aspects that
            further motivate such actions. These collective "green" actors can
            play multiple roles in the collection of information. They can
            facilitate information collection on biodiversity outcomes by
            gathering support for it through campaigning and lobbying efforts,
            aimed at both the public and decision-makers. They can engage in
            information collection themselves or provide necessary infrastructure.
            Further, these type of political rights should also make it easier for
            international environmental organizations to operate in the country.{" "}
          </p>

          <p>
            <em>References.</em> @Coppedge2018; @Binder2005; @Payne1995.
          </p>

          <h4 id="freedomofmovementv2xcl_dmove">
            Freedom of movement (v2xcl_dmove)
          </h4>

          <p>
            <em>Description.</em> To what extent enjoy citizens formal freedom of
            movement and residence? The variable gauges aspects such as the right
            for men and women to move at all times of the day, across regions
            using public thoroughfares. It ranges from 0 to 1, where higher scores
            indicate more freedom of movement.
          </p>

          <p>
            <em>Relevance.</em> In countries with restrictions on where and how
            citizens can travel and reside, one can expect the collection of
            biodiversity related information to face critical impediments. First,
            by limiting the ways of travelling it can make it harder to reach
            areas where observations can be made. Second, if certain areas where
            observations of biodiversity can be made are put under restrictions,
            it should decrease collections from that area.
          </p>

          <p>
            <em>References.</em> @Coppedge2018; @Freitag1998 @Meyer2015
          </p>

          <h4 id="civilsocietyv2xcs_ccsi">Civil society (v2xcs_ccsi)</h4>

          <p>
            <em>Description.</em> How autonomous is a country's civil society?
            This variable captures the extent to which a state allows civil
            society organizations (CSO) to freely organize and operate without
            being regulated or repressed, if these organizations are included in
            policy-making processes and if civil society participation is
            inclusive.
          </p>

          <p>
            <em>Relevance.</em> In countries with relatively more robust civil
            societies, one often find environmental performance in general to be
            higher. The main reason behind this logic is that CSOs with an
            ecological orientation can come to exist. Subsequently, they can
            mobilize "ecological "green"" political preferences and call out
            governments that are not addressing environmental degradation
            adequately. One can expect that organizations such as these also
            contribute to higher levels of information collection by pushing
            governments to better manage their biodiversity, by providing
            infrastructure that motivate others to collect information or by
            collecting it themselves.
          </p>

          <p>
            <em>References.</em> @Coppedge2018; @Bernauser2013; @Shandra2009.
          </p>

          <h4 id="politicalcorruptionv2x_corr">
            Political corruption (v2x_corr)
          </h4>

          <p>
            <em>Description.</em> The level of political corruption in a country.
            This variable includes the extent of corruption within the public
            sector, the judiciary, the executive and the legislative bodies. As
            such, this captures different forms of corruption, operating at both
            grand and petty levels, and aimed at affecting both political
            decision-making and the implementation of policy. It ranges from 0 to
            1, where higher scores indicate more corruption.
          </p>

          <p>
            <em>Relevance.</em> In countries characterized by higher levels of
            political corruption, one can expect that conservational efforts are
            hampered. Corruption is for example argued to increase the
            embezzlement of funds for conservational purposes, distort political
            initiatives away from public goods toward private benefits and create
            an institutional environment beneficial to illegal activity such as
            poaching. To the extent that information collection depends on
            sufficient economic resources and support from public policy,
            corruption should be negative to the amount of records collected.
            Further, if poaching is relatively higher in corrupt areas, then it
            can discourage practitioners and scientist from travelling there and
            collection information due to safety reasons.
          </p>

          <p>
            <em>References.</em> @Coppedge2018; @Pellegrini2006; @Smith2003;
            @Sundström2015.{" "}
          </p>

          <h4 id="physicalviolenceindexv2x_clphy">
            Physical violence index (v2x_clphy)
          </h4>

          <p>
            <em>Description.</em> To what extent a regime respects citizens
            physical integrity? This variable captures to what degree torture and
            killings for political purposes are carried out by the government. It
            ranges from 0 to 1, where higher scores indicate higher levels of
            physical violence.
          </p>

          <p>
            <em>Relevance.</em> If countries have relatively low respect for
            citizens physical integrity, one can expect this to have a negative
            effect on practitioners and scientists motivations for travelling to
            these countries. This can be both due to political concerns of
            citizens well-being but also for personal safety reasons, as the scope
            of violence potentially can expand to include country visitors.
          </p>

          <p>
            <em>References.</em> @Amano2013; @Meyer2015.
          </p>

          <h4 id="averagelevelofeducationinpopulationolderthan15yearse_peaveduc">
            Average level of education in population older than 15 years
            (e_peaveduc)
          </h4>

          <p>
            <em>Description.</em> The average level of education among citizens
            that are older than fifteen years old.{" "}
          </p>

          <p>
            <em>Relevance.</em> In countries that are characterized by relatively
            higher levels of education, one can expect higher levels of
            environmental awareness, more resources being allocated to educational
            and scientific purposes, and more sound environmental policy. In turn,
            this can be beneficial for information collection through higher
            levels of interest and likely larger allocation of resources to
            knowledge producing processes.
          </p>

          <p>
            <em>References.</em> @Coppedge2018; @Amano2013; @Buitenzorgy2010;
            @Pellegrini2006.
          </p>

          <h4 id="grossdomesticproductpercapitae_migdppc">
            Gross domestic product per capita (e_migdppc)
          </h4>

          <p>
            <em>Description.</em> The gross domestic product (GDP) per capita in a
            country.
          </p>

          <p>
            <em>Relevance.</em> In countries with higher levels of economic
            development, understood here as GDP per capita, one can expect the
            level of financial resources allocated to science and education to be
            relatively lower. Thus, the capacity of research institutions to
            provide infrastructure for the collection of information on
            biodiversity should be limited. Development is also theorized to be
            accompanied with environmentalistic values. Thus, more development can
            lead to a higher interest in environmental issues, which consequently
            can increase ambitions for and interest in the collection of
            information.
          </p>

          <p>
            <em>References.</em> @Bolt2018; @Amano2013; @Desai1998; @Meyer2015.
          </p>

          <h4 id="protectedarease_wri_pa">
            Protected areas (e
            <em>wri</em>pa)
          </h4>

          <p>
            <em>Description.</em> The share of total land area that is put under
            conservational status, as defined by the IUCN. It specifically
            captures terrestrial protected areas.
          </p>

          <p>
            <em>Relevance.</em> In countries with a larger proportion of its
            terrestrial area under protective status, one can expect the
            information collection of biodiversity to be relatively higher. First,
            protected areas are often places with great biodiversity and
            attractive species. As such, they can signal to both practitioners and
            scientists that interesting observations can be made there. Second,
            protected areas are often accompanied by relevant infrastructure for
            explorations, which make it easier for interested actors to make
            observations. Third, a larger share of protected areas can be a proxy
            for the presence of relatively higher conservational ambitions within
            a country. One can expect this to be associated with more collections.
          </p>

          <p>
            <em>References.</em> @Meyer2015; @Yang2014.
          </p>

          <h2 id="references">References</h2>

        </Grid>
      </Grid>
    );
  }
}
