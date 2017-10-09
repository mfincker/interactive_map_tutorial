This is step 2 in our step-by-step guide to make an interactive Web Map
displaying demographic data in the US. We assume that you have the 3
tables `state_data`, `county_data` and `tract_data`, containing
demographic information by origin/race at the state, county and census
tract level respectively.

You can adapt the following chunk to load the data files.

    county_data <- 
        '../data/county_data.tsv' %>% 
        read_tsv()

    state_data <- 
      '../data/state_data.tsv' %>% 
      read_tsv()

    tract_data <- 
      '../data/tract_data.tsv' %>% 
      read_tsv()

    ## Warning in rbind(names(probs), probs_f): number of columns of result is not
    ## a multiple of vector length (arg 1)

    ## Warning: 122 parsing failures.
    ## row # A tibble: 5 x 5 col     row       col               expected actual                     file expected   <int>     <chr>                  <chr>  <chr>                    <chr> actual 1  1191 pop_total no trailing characters     e3 '../data/tract_data.tsv' file 2  1892 pop_total no trailing characters     e3 '../data/tract_data.tsv' row 3  2391 pop_total no trailing characters     e3 '../data/tract_data.tsv' col 4  2641 pop_total no trailing characters     e3 '../data/tract_data.tsv' expected 5  2771  hispanic no trailing characters     e3 '../data/tract_data.tsv'
    ## ... ................. ... ........................................................................ ........ ........................................................................ ...... ........................................................................ .... ........................................................................ ... ........................................................................ ... ........................................................................ ........ ........................................................................
    ## See problems(...) for more details.

The goal is now to obtain the geographic boundaries for states, counties
and census tracts.

Tiger files from the census bureau
----------------------------------

Since we are using the 2010 census data, we will use the 2010 boundaries
available on the census bureau website. Every year, the census bureau
releases an up-to-date version of the legal boundaries for state,
counties and census tracts, among other geographic areas. These files
are in the shapefile format, a format that is comprehensive but too
heavy to use on the web. We will download the shapefiles, load them into
R to join with our data and then export them into geoJSON. GeoJSON is
the format that most web mapping libraries are expecting.

-   state boundary:
    `ftp://ftp2.census.gov/geo/tiger/TIGER2010//STATE/2010/tl_2010_us_state10.zip`
-   county boundary:
    `ftp://ftp2.census.gov/geo/tiger/TIGER2010//COUNTY/2010/tl_2010_us_county10.zip`
-   census tract boundary:
    `ftp://ftp2.census.gov/geo/tiger/TIGER2010//TRACT/2010`

The census tract boundary is split by states and/or counties. You will
have to download all files labelled as `tl_2010_**_tract10.zip`, where
`**` represents a 2 digit number (i.e. the state number).

I have created a `boundary` folder in my workspace and a `state`,
`county` and `tract` subfolder to store the newly downloaded shapefile.

### State geography

To load and manipulate the data in the shapefile, we will use the `sf`
package. `sf` represents the data in the shapefile as a list of simple
features. You can learn more about `sf` and simple features
[here](http://r-spatial.org/r/2016/02/15/simple-features-for-r.html).

The shapefile we downloaded does not use the same geographic coordinate
system that GPS and WebMap providers use. We will need to transform our
coordinates to EPSG:4326, the most common coordinate system in web maps.

To load a shapefile in R, we use `st_read`. To change coordinate system,
we'll use `st_transform` along with the `crs` corresponding to
EPSG:4326. You can learn more about coordinate systems
[here](http://spatialreference.org/ref/epsg/wgs-84/).

    state_geo <- 
      '../boundary/state/tl_2010_us_state10.shp' %>% 
      st_read() %>% 
      st_transform(crs = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs")

    ## Reading layer `tl_2010_us_state10' from data source `/Users/maeva/repos/interactive_map_tutorial/boundary/state/tl_2010_us_state10.shp' using driver `ESRI Shapefile'
    ## Simple feature collection with 52 features and 14 fields
    ## geometry type:  MULTIPOLYGON
    ## dimension:      XY
    ## bbox:           xmin: -179.2311 ymin: 17.83151 xmax: 179.8597 ymax: 71.44106
    ## epsg (SRID):    4269
    ## proj4string:    +proj=longlat +datum=NAD83 +no_defs

    state_geo %>% head()

    ## Simple feature collection with 6 features and 14 fields
    ## geometry type:  MULTIPOLYGON
    ## dimension:      XY
    ## bbox:           xmin: -111.0569 ymin: 31.33217 xmax: -71.08857 ymax: 45.00589
    ## epsg (SRID):    4326
    ## proj4string:    +proj=longlat +datum=WGS84 +no_defs
    ##   REGION10 DIVISION10 STATEFP10 STATENS10 GEOID10 STUSPS10       NAME10
    ## 1        4          8        56  01779807      56       WY      Wyoming
    ## 2        1          2        42  01779798      42       PA Pennsylvania
    ## 3        2          3        39  01085497      39       OH         Ohio
    ## 4        4          8        35  00897535      35       NM   New Mexico
    ## 5        3          5        24  01714934      24       MD     Maryland
    ## 6        1          1        44  01219835      44       RI Rhode Island
    ##   LSAD10 MTFCC10 FUNCSTAT10      ALAND10    AWATER10  INTPTLAT10
    ## 1     00   G4000          A 251470069067  1864445306 +42.9918024
    ## 2     00   G4000          A 115883064314  3397122731 +40.9042486
    ## 3     00   G4000          A 105828706692 10269012119 +40.4149297
    ## 4     00   G4000          A 314160748240   756659673 +34.4391265
    ## 5     00   G4000          A  25141638381  6989579585 +38.9466584
    ## 6     00   G4000          A   2677566454  1323668539 +41.5978358
    ##     INTPTLON10                       geometry
    ## 1 -107.5419255 MULTIPOLYGON (((-108.621313...
    ## 2 -077.8280624 MULTIPOLYGON (((-80.519091 ...
    ## 3 -082.7119975 MULTIPOLYGON (((-84.052709 ...
    ## 4 -106.1261511 MULTIPOLYGON (((-109.046156...
    ## 5 -076.6744939 MULTIPOLYGON (((-75.747761 ...
    ## 6 -071.5252895 MULTIPOLYGON (((-71.653208 ...

`state_geo` is now a simple feature collection of 52 rows, one row per
state. The data we downloaded contains variables we do not need, such as
`ALAND10`, which represents the land area of each state. Thanks to `sf`,
`sf` objects can be manipulated as easily as if they were simple data
frames. We can therefore easily remove the variables we won't use. We
will only keep `GEOID10` (the state number), `STUSPS10` (the state
abbreviation) and `NAME10` (the state name). The geometry column will
"stick" during column selection, whether you specify you want to keep it
or not.

    state_geo <- 
      state_geo %>% 
      select(GEOID10, STUSPS10, NAME10)

    state_geo %>% head()

    ## Simple feature collection with 6 features and 3 fields
    ## geometry type:  MULTIPOLYGON
    ## dimension:      XY
    ## bbox:           xmin: -111.0569 ymin: 31.33217 xmax: -71.08857 ymax: 45.00589
    ## epsg (SRID):    4326
    ## proj4string:    +proj=longlat +datum=WGS84 +no_defs
    ##   GEOID10 STUSPS10       NAME10                       geometry
    ## 1      56       WY      Wyoming MULTIPOLYGON (((-108.621313...
    ## 2      42       PA Pennsylvania MULTIPOLYGON (((-80.519091 ...
    ## 3      39       OH         Ohio MULTIPOLYGON (((-84.052709 ...
    ## 4      35       NM   New Mexico MULTIPOLYGON (((-109.046156...
    ## 5      24       MD     Maryland MULTIPOLYGON (((-75.747761 ...
    ## 6      44       RI Rhode Island MULTIPOLYGON (((-71.653208 ...

We now want to join the demographic data to the geographic boundary.
Before we can join, we need to make sure that the variables that we join
on are of the same type in both `state_geo` and `state_data`. We want to
join on the state number, `state` in `state_data` and `GEOID10` in
`state_geo`.

    cat("state_geo\n")

    ## state_geo

    state_geo %>% head() %>% glimpse()

    ## Observations: 6
    ## Variables: 4
    ## $ GEOID10  <fctr> 56, 42, 39, 35, 24, 44
    ## $ STUSPS10 <fctr> WY, PA, OH, NM, MD, RI
    ## $ NAME10   <fctr> Wyoming, Pennsylvania, Ohio, New Mexico, Maryland, R...
    ## $ geometry <simple_feature> MULTIPOLYGON (((-108.621313..., MULTIPOLYG...

    cat("\nstate_data\n")

    ## 
    ## state_data

    state_data %>% head() %>% glimpse()

    ## Observations: 6
    ## Variables: 10
    ## $ name      <chr> "Alabama", "Alaska", "Arizona", "Arkansas", "Califor...
    ## $ pop_total <int> 4779736, 710231, 6392017, 2915918, 37253956, 5029196
    ## $ hispanic  <int> 185602, 39249, 1895149, 186050, 14013719, 1038687
    ## $ white     <int> 3204402, 455320, 3695647, 2173469, 14956253, 3520793
    ## $ black     <int> 1244437, 21949, 239101, 447102, 2163804, 188778
    ## $ native    <int> 25907, 102556, 257426, 20183, 162250, 31244
    ## $ asian     <int> 52937, 37459, 170509, 35647, 4775070, 135564
    ## $ pacific   <int> 1976, 7219, 10959, 5509, 128577, 5661
    ## $ other     <int> 4030, 1111, 8595, 2121, 85587, 7622
    ## $ state     <chr> "01", "02", "04", "05", "06", "08"

We will coerce `state` and `GEOID10` to numeric type.

    state_data <- 
      state_data %>% 
      mutate(state = as.numeric(state))

    state_data %>% head() %>% glimpse()

    ## Observations: 6
    ## Variables: 10
    ## $ name      <chr> "Alabama", "Alaska", "Arizona", "Arkansas", "Califor...
    ## $ pop_total <int> 4779736, 710231, 6392017, 2915918, 37253956, 5029196
    ## $ hispanic  <int> 185602, 39249, 1895149, 186050, 14013719, 1038687
    ## $ white     <int> 3204402, 455320, 3695647, 2173469, 14956253, 3520793
    ## $ black     <int> 1244437, 21949, 239101, 447102, 2163804, 188778
    ## $ native    <int> 25907, 102556, 257426, 20183, 162250, 31244
    ## $ asian     <int> 52937, 37459, 170509, 35647, 4775070, 135564
    ## $ pacific   <int> 1976, 7219, 10959, 5509, 128577, 5661
    ## $ other     <int> 4030, 1111, 8595, 2121, 85587, 7622
    ## $ state     <dbl> 1, 2, 4, 5, 6, 8

    state_geo <- 
      state_geo %>% 
      mutate(GEOID10 = as.numeric(as.character(GEOID10)))

    state_geo %>% head() %>% glimpse()

    ## Observations: 6
    ## Variables: 4
    ## $ GEOID10  <dbl> 56, 42, 39, 35, 24, 44
    ## $ STUSPS10 <fctr> WY, PA, OH, NM, MD, RI
    ## $ NAME10   <fctr> Wyoming, Pennsylvania, Ohio, New Mexico, Maryland, R...
    ## $ geometry <simple_feature> MULTIPOLYGON (((-108.621313..., MULTIPOLYG...

We are now ready to join `state_geo` and `state_data`.

    state <- 
      state_geo %>% 
      inner_join(state_data,
                 by = c("GEOID10" = "state"))

    state %>% head()

    ## Simple feature collection with 6 features and 12 fields
    ## geometry type:  MULTIPOLYGON
    ## dimension:      XY
    ## bbox:           xmin: -111.0569 ymin: 31.33217 xmax: -71.08857 ymax: 45.00589
    ## epsg (SRID):    4326
    ## proj4string:    +proj=longlat +datum=WGS84 +no_defs
    ##   GEOID10 STUSPS10       NAME10         name pop_total hispanic    white
    ## 1      56       WY      Wyoming      Wyoming    563626    50231   483874
    ## 2      42       PA Pennsylvania Pennsylvania  12702379   719660 10094652
    ## 3      39       OH         Ohio         Ohio  11536504   354674  9359263
    ## 4      35       NM   New Mexico   New Mexico   2059179   953403   833810
    ## 5      24       MD     Maryland     Maryland   5773552   470632  3157958
    ## 6      44       RI Rhode Island Rhode Island   1052567   130655   803685
    ##     black native  asian pacific other                       geometry
    ## 1    4351  11784   4279     365   437 MULTIPOLYGON (((-108.621313...
    ## 2 1327091  16909 346288    2715 16469 MULTIPOLYGON (((-80.519091 ...
    ## 3 1389115  20906 190765    3400 15158 MULTIPOLYGON (((-84.052709 ...
    ## 4   35462 175368  26305    1246  3750 MULTIPOLYGON (((-109.046156...
    ## 5 1674229  13815 316694    2412 11972 MULTIPOLYGON (((-75.747761 ...
    ## 6   51560   4020  29988     305  8875 MULTIPOLYGON (((-71.653208 ...

We end up with the full dataset, with redundant `name` and `NAME10`
variables. Before we get rid of one of them, let's do a quick sanity
check to make sure that `name` and `NAME10` are identical.

    state %>% 
      as.data.frame() %>% 
      select(NAME10, name) %>% 
      transmute(id = (name == NAME10)) %>% 
      .$id %>% 
      all()

    ## [1] TRUE

Everything is in order, but we will do one last thing before exporting
the dataset to GeoJSON. Because of the large range of population
numbers, it might be easier to display origin/race as percentage of the
total population. We will create the percentages and remove the absolute
population number.

    state <- 
      state %>% 
      transmute(abb = STUSPS10,
                name = name,
                pop_total,
                hispanic_percent = hispanic / pop_total,
                white_percent = white / pop_total,
                black_percent = black / pop_total,
                native_percent = native / pop_total,
                asian_percent = asian / pop_total,
                pacific_percent = pacific / pop_total,
                other_percent = other / pop_total)

    state %>% head()

    ## Simple feature collection with 6 features and 10 fields
    ## geometry type:  MULTIPOLYGON
    ## dimension:      XY
    ## bbox:           xmin: -111.0569 ymin: 31.33217 xmax: -71.08857 ymax: 45.00589
    ## epsg (SRID):    4326
    ## proj4string:    +proj=longlat +datum=WGS84 +no_defs
    ##   abb         name pop_total hispanic_percent white_percent black_percent
    ## 1  WY      Wyoming    563626       0.08912115     0.8585019   0.007719658
    ## 2  PA Pennsylvania  12702379       0.05665553     0.7947056   0.104475784
    ## 3  OH         Ohio  11536504       0.03074363     0.8112738   0.120410395
    ## 4  NM   New Mexico   2059179       0.46300152     0.4049235   0.017221427
    ## 5  MD     Maryland   5773552       0.08151516     0.5469697   0.289982493
    ## 6  RI Rhode Island   1052567       0.12412987     0.7635476   0.048985005
    ##   native_percent asian_percent pacific_percent other_percent
    ## 1    0.020907481   0.007591914    0.0006475926  0.0007753368
    ## 2    0.001331168   0.027261665    0.0002137395  0.0012965288
    ## 3    0.001812161   0.016535772    0.0002947167  0.0013139162
    ## 4    0.085164039   0.012774509    0.0006050955  0.0018211141
    ## 5    0.002392808   0.054852541    0.0004177671  0.0020735935
    ## 6    0.003819234   0.028490348    0.0002897678  0.0084317673
    ##                         geometry
    ## 1 MULTIPOLYGON (((-108.621313...
    ## 2 MULTIPOLYGON (((-80.519091 ...
    ## 3 MULTIPOLYGON (((-84.052709 ...
    ## 4 MULTIPOLYGON (((-109.046156...
    ## 5 MULTIPOLYGON (((-75.747761 ...
    ## 6 MULTIPOLYGON (((-71.653208 ...

    if (!file.exists('../geojson/state.geojson')) {
      state %>% 
        st_write('../geojson/state.geojson')
    }

### County geography

We will do the same analysis for the county data.

Loading the county boundary file:

    county_geo <- 
      '../boundary/county/tl_2010_us_county10.shp' %>% 
      st_read() %>% 
      st_transform(crs = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs")

    ## Reading layer `tl_2010_us_county10' from data source `/Users/maeva/repos/interactive_map_tutorial/boundary/county/tl_2010_us_county10.shp' using driver `ESRI Shapefile'
    ## Simple feature collection with 3221 features and 17 fields
    ## geometry type:  MULTIPOLYGON
    ## dimension:      XY
    ## bbox:           xmin: -179.2311 ymin: 17.83151 xmax: 179.8597 ymax: 71.44106
    ## epsg (SRID):    4269
    ## proj4string:    +proj=longlat +datum=NAD83 +no_defs

    county_geo %>% arrange(STATEFP10, COUNTYFP10) %>% head()

    ## Simple feature collection with 6 features and 17 fields
    ## geometry type:  MULTIPOLYGON
    ## dimension:      XY
    ## bbox:           xmin: -88.03731 ymin: 30.14656 xmax: -85.04882 ymax: 34.26048
    ## epsg (SRID):    4326
    ## proj4string:    +proj=longlat +datum=WGS84 +no_defs
    ##   STATEFP10 COUNTYFP10 COUNTYNS10 GEOID10  NAME10     NAMELSAD10 LSAD10
    ## 1        01        001   00161526   01001 Autauga Autauga County     06
    ## 2        01        003   00161527   01003 Baldwin Baldwin County     06
    ## 3        01        005   00161528   01005 Barbour Barbour County     06
    ## 4        01        007   00161529   01007    Bibb    Bibb County     06
    ## 5        01        009   00161530   01009  Blount  Blount County     06
    ## 6        01        011   00161531   01011 Bullock Bullock County     06
    ##   CLASSFP10 MTFCC10 CSAFP10 CBSAFP10 METDIVFP10 FUNCSTAT10    ALAND10
    ## 1        H1   G4020     388    33860       <NA>          A 1539582278
    ## 2        H1   G4020     380    19300       <NA>          A 4117521611
    ## 3        H1   G4020    <NA>    21640       <NA>          A 2291818968
    ## 4        H1   G4020     142    13820       <NA>          A 1612480789
    ## 5        H1   G4020     142    13820       <NA>          A 1669961855
    ## 6        H1   G4020    <NA>     <NA>       <NA>          A 1613056905
    ##     AWATER10  INTPTLAT10   INTPTLON10                       geometry
    ## 1   25775735 +32.5363818 -086.6444901 MULTIPOLYGON (((-86.62619 3...
    ## 2 1133190229 +30.6592183 -087.7460666 MULTIPOLYGON (((-87.615417 ...
    ## 3   50864716 +31.8706701 -085.4054562 MULTIPOLYGON (((-85.620276 ...
    ## 4    9289057 +33.0158929 -087.1271475 MULTIPOLYGON (((-87.025614 ...
    ## 5   15157440 +33.9774479 -086.5672464 MULTIPOLYGON (((-86.743607 ...
    ## 6    6056528 +32.1017589 -085.7172613 MULTIPOLYGON (((-85.926296 ...

We only need to keep the `STATEFP10`, `COUNTYFP10` and `NAMELSAD10`
variables from `county_geo`.

    county_geo <- 
      county_geo %>% 
      select(STATEFP10, COUNTYFP10, NAMELSAD10)

    county_geo %>% 
      head()

    ## Simple feature collection with 6 features and 3 fields
    ## geometry type:  MULTIPOLYGON
    ## dimension:      XY
    ## bbox:           xmin: -179.2311 ymin: 32.12035 xmax: 179.8597 ymax: 57.30527
    ## epsg (SRID):    4326
    ## proj4string:    +proj=longlat +datum=WGS84 +no_defs
    ##   STATEFP10 COUNTYFP10                 NAMELSAD10
    ## 1        02        013     Aleutians East Borough
    ## 2        02        016 Aleutians West Census Area
    ## 3        28        107              Panola County
    ## 4        28        101              Newton County
    ## 5        28        027             Coahoma County
    ## 6        22        065             Madison Parish
    ##                         geometry
    ## 1 MULTIPOLYGON (((-162.637688...
    ## 2 MULTIPOLYGON (((177.445931 ...
    ## 3 MULTIPOLYGON (((-90.134762 ...
    ## 4 MULTIPOLYGON (((-89.134967 ...
    ## 5 MULTIPOLYGON (((-90.590625 ...
    ## 6 MULTIPOLYGON (((-91.035107 ...

We will join the county data by state and county numbers. Again we will
have to make sure that the variables we join on are of the same type
across the 2 datasets.

    cat('county_data:\n')

    ## county_data:

    county_data %>% head() %>% glimpse()

    ## Observations: 6
    ## Variables: 11
    ## $ name      <chr> "Autauga County", "Baldwin County", "Barbour County"...
    ## $ pop_total <dbl> 54571, 182265, 27457, 22915, 57322, 10914
    ## $ hispanic  <int> 1310, 7992, 1387, 406, 4626, 777
    ## $ white     <dbl> 42154, 152200, 12837, 17191, 50952, 2392
    ## $ black     <dbl> 9595, 16966, 12820, 5024, 724, 7637
    ## $ native    <int> 217, 1146, 60, 64, 285, 20
    ## $ asian     <int> 467, 1340, 107, 22, 115, 20
    ## $ pacific   <int> 22, 79, 24, 7, 18, 4
    ## $ other     <int> 45, 245, 13, 20, 35, 5
    ## $ state     <chr> "01", "01", "01", "01", "01", "01"
    ## $ county    <chr> "001", "003", "005", "007", "009", "011"

    cat('\ncounty_geo:\n')

    ## 
    ## county_geo:

    county_geo %>% head() %>% glimpse()

    ## Observations: 6
    ## Variables: 4
    ## $ STATEFP10  <fctr> 02, 02, 28, 28, 28, 22
    ## $ COUNTYFP10 <fctr> 013, 016, 107, 101, 027, 065
    ## $ NAMELSAD10 <fctr> Aleutians East Borough, Aleutians West Census Area...
    ## $ geometry   <simple_feature> MULTIPOLYGON (((-162.637688..., MULTIPOL...

We will coerce the joining varaibles to numeric values.

    county_data <- 
      county_data %>% 
      mutate(state = as.numeric(state),
             county = as.numeric(county))

    county_data %>% head() %>% glimpse()

    ## Observations: 6
    ## Variables: 11
    ## $ name      <chr> "Autauga County", "Baldwin County", "Barbour County"...
    ## $ pop_total <dbl> 54571, 182265, 27457, 22915, 57322, 10914
    ## $ hispanic  <int> 1310, 7992, 1387, 406, 4626, 777
    ## $ white     <dbl> 42154, 152200, 12837, 17191, 50952, 2392
    ## $ black     <dbl> 9595, 16966, 12820, 5024, 724, 7637
    ## $ native    <int> 217, 1146, 60, 64, 285, 20
    ## $ asian     <int> 467, 1340, 107, 22, 115, 20
    ## $ pacific   <int> 22, 79, 24, 7, 18, 4
    ## $ other     <int> 45, 245, 13, 20, 35, 5
    ## $ state     <dbl> 1, 1, 1, 1, 1, 1
    ## $ county    <dbl> 1, 3, 5, 7, 9, 11

    county_geo <- 
      county_geo %>% 
      mutate(STATEFP10 = as.numeric(as.character(STATEFP10)),
             COUNTYFP10 = as.numeric(as.character(COUNTYFP10)))

    county_geo %>% head() %>% glimpse()

    ## Observations: 6
    ## Variables: 4
    ## $ STATEFP10  <dbl> 2, 2, 28, 28, 28, 22
    ## $ COUNTYFP10 <dbl> 13, 16, 107, 101, 27, 65
    ## $ NAMELSAD10 <fctr> Aleutians East Borough, Aleutians West Census Area...
    ## $ geometry   <simple_feature> MULTIPOLYGON (((-162.637688..., MULTIPOL...

We are now ready to join the 2 datasets!

    county <- 
      county_geo %>% 
      inner_join(county_data,
                 by = c("STATEFP10" = "state",
                        "COUNTYFP10" = "county"))

    county %>% head()

    ## Simple feature collection with 6 features and 12 fields
    ## geometry type:  MULTIPOLYGON
    ## dimension:      XY
    ## bbox:           xmin: -179.2311 ymin: 32.12035 xmax: 179.8597 ymax: 57.30527
    ## epsg (SRID):    4326
    ## proj4string:    +proj=longlat +datum=WGS84 +no_defs
    ##   STATEFP10 COUNTYFP10                 NAMELSAD10
    ## 1         2         13     Aleutians East Borough
    ## 2         2         16 Aleutians West Census Area
    ## 3        28        107              Panola County
    ## 4        28        101              Newton County
    ## 5        28         27             Coahoma County
    ## 6        22         65             Madison Parish
    ##                         name pop_total hispanic white black native asian
    ## 1     Aleutians East Borough      3141      385   425   212    869  1113
    ## 2 Aleutians West Census Area      5561      726  1745   318    841  1575
    ## 3              Panola County     34707      494 16981 16801     70    61
    ## 4              Newton County     21720      287 13599  6536   1072    51
    ## 5             Coahoma County     26151      293  5918 19698     20   114
    ## 6             Madison Parish     12093      188  4396  7357     23    26
    ##   pacific other                       geometry
    ## 1      19     1 MULTIPOLYGON (((-162.637688...
    ## 2     102     5 MULTIPOLYGON (((177.445931 ...
    ## 3       0    14 MULTIPOLYGON (((-90.134762 ...
    ## 4       0     9 MULTIPOLYGON (((-89.134967 ...
    ## 5       4     7 MULTIPOLYGON (((-90.590625 ...
    ## 6       0     8 MULTIPOLYGON (((-91.035107 ...

We end up with the full dataset, with redundant variables for names.
Before we get rid of one of them, let's do a quick sanity check to make
sure that `name` and `NAME10` are identical.

    county %>% 
      as.data.frame() %>% 
      select(NAMELSAD10, name) %>% 
      mutate(id = (name == NAMELSAD10)) %>% 
      filter(!id)

    ##                    NAMELSAD10                    name    id
    ## 1         Manat\xed Municipio        Manatí Municipio FALSE
    ## 2     Las Mar\xedas Municipio    Las Marías Municipio FALSE
    ## 3         Cata\xf1o Municipio        Cataño Municipio FALSE
    ## 4        Comer\xedo Municipio       Comerío Municipio FALSE
    ## 5          Do\xf1a Ana County         Doña Ana County FALSE
    ## 6         Rinc\xf3n Municipio        Rincón Municipio FALSE
    ## 7       Mayag\xfcez Municipio      Mayagüez Municipio FALSE
    ## 8       Pe\xf1uelas Municipio      Peñuelas Municipio FALSE
    ## 9         A\xf1asco Municipio        Añasco Municipio FALSE
    ## 10    San Germ\xe1n Municipio    San Germán Municipio FALSE
    ## 11         Lo\xedza Municipio         Loíza Municipio FALSE
    ## 12     Can\xf3vanas Municipio     Canóvanas Municipio FALSE
    ## 13    R\xedo Grande Municipio    Río Grande Municipio FALSE
    ## 14 San Sebasti\xe1n Municipio San Sebastián Municipio FALSE
    ## 15    Juana D\xedaz Municipio    Juana Díaz Municipio FALSE
    ## 16       Gu\xe1nica Municipio       Guánica Municipio FALSE
    ## 17       Bayam\xf3n Municipio       Bayamón Municipio FALSE

The 2 name variables don't have the same encoding, hence the difference.
But the joining of the 2 datasets worked. Let's transform absolute
numbers into percentage before saving the dataset as GeoJSON.
Additionally, we'll add the state name for each county before moving on
to the census tract data!

    county <- 
      county %>% 
      inner_join(state_geo %>% 
                   as_data_frame() %>% 
                   select(-geometry),
                 by = c("STATEFP10" = "GEOID10")) %>% 
      transmute(county = name,
                state = NAME10,
                abb = STUSPS10,
                pop_total,
                hispanic_percent = hispanic / pop_total,
                white_percent = white / pop_total,
                black_percent = black / pop_total,
                native_percent = native / pop_total,
                asian_percent = asian / pop_total,
                pacific_percent = pacific / pop_total,
                other_percent = other / pop_total)

    county %>% head()

    ## Simple feature collection with 6 features and 11 fields
    ## geometry type:  MULTIPOLYGON
    ## dimension:      XY
    ## bbox:           xmin: -179.2311 ymin: 32.12035 xmax: 179.8597 ymax: 57.30527
    ## epsg (SRID):    4326
    ## proj4string:    +proj=longlat +datum=WGS84 +no_defs
    ##                       county       state abb pop_total hispanic_percent
    ## 1     Aleutians East Borough      Alaska  AK      3141       0.12257243
    ## 2 Aleutians West Census Area      Alaska  AK      5561       0.13055206
    ## 3              Panola County Mississippi  MS     34707       0.01423344
    ## 4              Newton County Mississippi  MS     21720       0.01321363
    ## 5             Coahoma County Mississippi  MS     26151       0.01120416
    ## 6             Madison Parish   Louisiana  LA     12093       0.01554618
    ##   white_percent black_percent native_percent asian_percent pacific_percent
    ## 1     0.1353072    0.06749443   0.2766634830   0.354345750    0.0060490290
    ## 2     0.3137925    0.05718396   0.1512317928   0.283222442    0.0183420248
    ## 3     0.4892673    0.48408102   0.0020168842   0.001757571    0.0000000000
    ## 4     0.6261050    0.30092081   0.0493554328   0.002348066    0.0000000000
    ## 5     0.2263011    0.75324079   0.0007647891   0.004359298    0.0001529578
    ## 6     0.3635161    0.60836848   0.0019019267   0.002150004    0.0000000000
    ##   other_percent                       geometry
    ## 1  0.0003183699 MULTIPOLYGON (((-162.637688...
    ## 2  0.0008991189 MULTIPOLYGON (((177.445931 ...
    ## 3  0.0004033768 MULTIPOLYGON (((-90.134762 ...
    ## 4  0.0004143646 MULTIPOLYGON (((-89.134967 ...
    ## 5  0.0002676762 MULTIPOLYGON (((-90.590625 ...
    ## 6  0.0006615397 MULTIPOLYGON (((-91.035107 ...

    if (!file.exists('../geojson/county.geojson')) {
      county %>% 
        st_write('../geojson/county.geojson')
    }

### Census tract geography

Creating the census tract geoJSON will require a little more work
because we had to download a separate shapefile for each state. We need
to merge all these shapefile into a single dataset before we can join
the census tract data. To do that we can use the `rbind` function from
`sf` that extends row binding functionality to simple feature objects.
Because this might take a while, once it's done, we are going to save
the concatenated `tract_geo` simple feature collection as geoJSON. If
you want to rerun this analysis later, you will just have to load the
geosjon file instead of concatenating all the shapefiles again.

    if (!file.exists('../boundary/tract/tract.geojson')) {
      tract_geo <- 
        list.files('../boundary/tract/', pattern = "\\.shp$", recursive = T) %>% 
        str_c('../boundary/tract/', .) %>% 
        map(function(x) {x %>% 
                          st_read %>% 
                          st_transform(crs = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs")}
        ) %>% 
        do.call("rbind", .)

      tract_geo %>% 
        st_write('../boundary/tract/tract.geojson')
      
    } else {
      tract_geo <- 
        '../boundary/tract/tract.geojson' %>% 
        st_read()
    }

    ## Reading layer `OGRGeoJSON' from data source `/Users/maeva/repos/interactive_map_tutorial/boundary/tract/tract.geojson' using driver `GeoJSON'
    ## Simple feature collection with 74134 features and 12 fields
    ## geometry type:  MULTIPOLYGON
    ## dimension:      XY
    ## bbox:           xmin: -179.2311 ymin: -14.60181 xmax: 179.8597 ymax: 71.44106
    ## epsg (SRID):    4326
    ## proj4string:    +proj=longlat +datum=WGS84 +no_defs

    tract_geo %>% head()

    ## Simple feature collection with 6 features and 12 fields
    ## geometry type:  MULTIPOLYGON
    ## dimension:      XY
    ## bbox:           xmin: -85.70896 ymin: 31.70312 xmax: -85.04882 ymax: 32.14825
    ## epsg (SRID):    4326
    ## proj4string:    +proj=longlat +datum=WGS84 +no_defs
    ##   STATEFP10 COUNTYFP10 TRACTCE10     GEOID10 NAME10        NAMELSAD10
    ## 1        01        005    950300 01005950300   9503 Census Tract 9503
    ## 2        01        005    950900 01005950900   9509 Census Tract 9509
    ## 3        01        005    950800 01005950800   9508 Census Tract 9508
    ## 4        01        005    950700 01005950700   9507 Census Tract 9507
    ## 5        01        005    950600 01005950600   9506 Census Tract 9506
    ## 6        01        005    950100 01005950100   9501 Census Tract 9501
    ##   MTFCC10 FUNCSTAT10   ALAND10 AWATER10  INTPTLAT10   INTPTLON10
    ## 1   G5020          S 352811329   499970 +31.7908933 -085.5670514
    ## 2   G5020          S  16201446  8339342 +31.8467221 -085.1462332
    ## 3   G5020          S  14630162   380622 +31.9206930 -085.1760317
    ## 4   G5020          S 127200997   112809 +31.9440855 -085.2620842
    ## 5   G5020          S 101697268  1101261 +31.8783526 -085.2729215
    ## 6   G5020          S 485263821 29057811 +32.0353533 -085.2477678
    ##                         geometry
    ## 1 MULTIPOLYGON (((-85.527437 ...
    ## 2 MULTIPOLYGON (((-85.164122 ...
    ## 3 MULTIPOLYGON (((-85.148718 ...
    ## 4 MULTIPOLYGON (((-85.145784 ...
    ## 5 MULTIPOLYGON (((-85.145723 ...
    ## 6 MULTIPOLYGON (((-85.318499 ...

There are 74134 census tracts in our boundary dataset, but only 74002 in
our `tract_data`. We will check those census tracts that are only
present in the boundary dataset.

Now that we have our boundaries in a single dataset, we can just repeat
the previous steps to merge `tract_data` with `tract_geo`, joining on
census tract, county and state numbers. But first, we will format
`tract_data` and add the county and state names.

    tract_data <- 
      tract_data %>% 
      transmute(name,
                pop_total,
                hispanic_percent = hispanic / pop_total,
                white_percent = white / pop_total,
                black_percent = black / pop_total,
                native_percent = native / pop_total,
                asian_percent = asian / pop_total,
                pacific_percent = pacific / pop_total,
                other_percent = other / pop_total,
                state = as.numeric(state),
                county = as.numeric(county),
                tract = as.numeric(tract)) %>% 
      inner_join(state_geo %>% 
                  as_data_frame() %>% 
                  select(-geometry),
                by = c("state" = "GEOID10")) %>% 
      rename(abb = STUSPS10,
             state_name = NAME10) %>% 
      inner_join(county_data %>% 
                   select(state, county, name),
                 by = c("state", "county"), 
                 suffix = c("", "_county")) %>% 
      rename(county_name = name_county)

    tract_data %>% head() %>% glimpse()

    ## Observations: 6
    ## Variables: 15
    ## $ name             <chr> "Census Tract 201", "Census Tract 202", "Cens...
    ## $ pop_total        <int> 1912, 2170, 3373, 4386, 10766, 3668
    ## $ hispanic_percent <dbl> 0.02301255, 0.03456221, 0.02579306, 0.0193798...
    ## $ white_percent    <dbl> 0.8373431, 0.3889401, 0.7524459, 0.9188326, 0...
    ## $ black_percent    <dbl> 0.11349372, 0.55944700, 0.19181737, 0.0435476...
    ## $ native_percent   <dbl> 0.006799163, 0.002304147, 0.002668248, 0.0025...
    ## $ asian_percent    <dbl> 0.007322176, 0.002304147, 0.005040024, 0.0041...
    ## $ pacific_percent  <dbl> 0.0000000000, 0.0000000000, 0.0014823599, 0.0...
    ## $ other_percent    <dbl> 0.0005230126, 0.0013824885, 0.0020753039, 0.0...
    ## $ state            <dbl> 1, 1, 1, 1, 1, 1
    ## $ county           <dbl> 1, 1, 1, 1, 1, 1
    ## $ tract            <dbl> 20100, 20200, 20300, 20400, 20500, 20600
    ## $ abb              <fctr> AL, AL, AL, AL, AL, AL
    ## $ state_name       <fctr> Alabama, Alabama, Alabama, Alabama, Alabama,...
    ## $ county_name      <chr> "Autauga County", "Autauga County", "Autauga ...

    tract_geo <- 
      tract_geo %>% 
      transmute(STATEFP10 = as.numeric(as.character(STATEFP10)),
                COUNTYFP10 = as.numeric(as.character(COUNTYFP10)),
                TRACTCE10 = as.numeric(as.character(TRACTCE10)),
                NAMELSAD10)

    tract_geo %>% head()

    ## Simple feature collection with 6 features and 4 fields
    ## geometry type:  MULTIPOLYGON
    ## dimension:      XY
    ## bbox:           xmin: -85.70896 ymin: 31.70312 xmax: -85.04882 ymax: 32.14825
    ## epsg (SRID):    4326
    ## proj4string:    +proj=longlat +datum=WGS84 +no_defs
    ##   STATEFP10 COUNTYFP10 TRACTCE10        NAMELSAD10
    ## 1         1          5    950300 Census Tract 9503
    ## 2         1          5    950900 Census Tract 9509
    ## 3         1          5    950800 Census Tract 9508
    ## 4         1          5    950700 Census Tract 9507
    ## 5         1          5    950600 Census Tract 9506
    ## 6         1          5    950100 Census Tract 9501
    ##                         geometry
    ## 1 MULTIPOLYGON (((-85.527437 ...
    ## 2 MULTIPOLYGON (((-85.164122 ...
    ## 3 MULTIPOLYGON (((-85.148718 ...
    ## 4 MULTIPOLYGON (((-85.145784 ...
    ## 5 MULTIPOLYGON (((-85.145723 ...
    ## 6 MULTIPOLYGON (((-85.318499 ...

Joining!

    tract <- 
      tract_geo %>% 
      inner_join(tract_data,
                 by = c("STATEFP10" = "state",
                        "COUNTYFP10" = "county",
                        "TRACTCE10" = "tract")) %>% 
      rename(tract = NAMELSAD10, 
             state = state_name, 
             county = county_name) %>% 
      select(-ends_with("10"))


    tract %>% head() %>% glimpse()

    ## Observations: 6
    ## Variables: 14
    ## $ tract            <fctr> Census Tract 9503, Census Tract 9509, Census...
    ## $ name             <chr> "Census Tract 9503", "Census Tract 9509", "Ce...
    ## $ pop_total        <int> 1638, 4583, 2055, 1727, 2099, 3321
    ## $ hispanic_percent <dbl> 0.04090354, 0.05673140, 0.02773723, 0.0248986...
    ## $ white_percent    <dbl> 0.4218559, 0.3822823, 0.5435523, 0.4354372, 0...
    ## $ black_percent    <dbl> 0.5262515, 0.5478944, 0.4034063, 0.5332947, 0...
    ## $ native_percent   <dbl> 0.0024420024, 0.0002181977, 0.0034063260, 0.0...
    ## $ asian_percent    <dbl> 0.0000000000, 0.0024001746, 0.0145985401, 0.0...
    ## $ pacific_percent  <dbl> 0.0000000000, 0.0039275584, 0.0000000000, 0.0...
    ## $ other_percent    <dbl> 0.0000000000, 0.0000000000, 0.0009732360, 0.0...
    ## $ abb              <fctr> AL, AL, AL, AL, AL, AL
    ## $ state            <fctr> Alabama, Alabama, Alabama, Alabama, Alabama,...
    ## $ county           <chr> "Barbour County", "Barbour County", "Barbour ...
    ## $ geometry         <simple_feature> MULTIPOLYGON (((-85.527437 ..., MU...

Checking for name equality:

    tract %>% 
      as.data.frame() %>% 
      select(name, tract) %>% 
      mutate(id = (name == as.character(tract))) %>% 
      filter(!id)

    ##                   name               tract    id
    ## 1   Census Tract 133.1 Census Tract 133.10 FALSE
    ## 2  Census Tract 615.00    Census Tract 615 FALSE
    ## 3  Census Tract 108.00    Census Tract 108 FALSE
    ## 4  Census Tract 156.00    Census Tract 156 FALSE
    ## 5  Census Tract 164.00    Census Tract 164 FALSE
    ## 6  Census Tract 320.00    Census Tract 320 FALSE
    ## 7  Census Tract 128.00    Census Tract 128 FALSE
    ## 8   Census Tract 34.00     Census Tract 34 FALSE
    ## 9   Census Tract 11.00     Census Tract 11 FALSE
    ## 10 Census Tract 244.00    Census Tract 244 FALSE
    ## 11 Census Tract 807.00    Census Tract 807 FALSE
    ## 12 Census Tract 423.00    Census Tract 423 FALSE
    ## 13 Census Tract 511.00    Census Tract 511 FALSE

Some census tract have trailing zeros in their name, but they match the
names in the boundary dataset. So we can safely remove the redundant
name variable.

    tract <- 
      tract %>% 
      mutate(tract = as.character(tract)) %>% 
      select(-name)

    tract %>% head() %>% glimpse()

    ## Observations: 6
    ## Variables: 13
    ## $ tract            <chr> "Census Tract 9503", "Census Tract 9509", "Ce...
    ## $ pop_total        <int> 1638, 4583, 2055, 1727, 2099, 3321
    ## $ hispanic_percent <dbl> 0.04090354, 0.05673140, 0.02773723, 0.0248986...
    ## $ white_percent    <dbl> 0.4218559, 0.3822823, 0.5435523, 0.4354372, 0...
    ## $ black_percent    <dbl> 0.5262515, 0.5478944, 0.4034063, 0.5332947, 0...
    ## $ native_percent   <dbl> 0.0024420024, 0.0002181977, 0.0034063260, 0.0...
    ## $ asian_percent    <dbl> 0.0000000000, 0.0024001746, 0.0145985401, 0.0...
    ## $ pacific_percent  <dbl> 0.0000000000, 0.0039275584, 0.0000000000, 0.0...
    ## $ other_percent    <dbl> 0.0000000000, 0.0000000000, 0.0009732360, 0.0...
    ## $ abb              <fctr> AL, AL, AL, AL, AL, AL
    ## $ state            <fctr> Alabama, Alabama, Alabama, Alabama, Alabama,...
    ## $ county           <chr> "Barbour County", "Barbour County", "Barbour ...
    ## $ geometry         <simple_feature> MULTIPOLYGON (((-85.527437 ..., MU...

    if (!file.exists('../geojson/tract.geojson')) {
      tract %>% 
        st_write('../geojson/tract.geojson')
    }
