The goal of this tutorial is to get and format the population data
needed to build an interactive web map displaying population information
at different geographic levels.

We will first create tables of population at the state, county and tract
level. Then we will join this data with geographic boundaries for each
level of aggregation.

The result should be 3 geoJSON files containing both the geographic
boundaries as well as the data for each geographic zone.

Requesting population data from the census bureau API
=====================================================

Every 10 years, the census bureau conducts a full survey reporting many
socio-economic and demographic variables down to the block level. The
data from the last census survery (2010) can be requested at the
following API: `api.census.gov/data/2010/sf1?`.

You can query the API up to 50 variables up to 500 times per IP adress
per day. If you think you'll need to run more queries, you can sign-up
for an API key [here](www.census.gov/developers/). Once you have your
API key, create a variable `key <- <YOUR API KEY>`.

Variables to query
------------------

The list of variables available from the ACS census can be seen
[here](https://api.census.gov/data/2010/sf1/variables.html). You can
also find examples on how to query the API
[here](https://api.census.gov/data/2010/sf1/examples.html). We will need
to request the following variables for each level of geographic
resolution: \* name of the location: `NAME` \* population total /
hispanic - hispanic or latino: `P0040003` \* population total / not
hispanic or latino - white alone: `P0050003` \* population total / not
hispanic or latino - black or african american alone: `P0050004` \*
population total / not hispanic or latino - american indian and alaska
native alone: `P0050005` \* population total / not hispanic or latino -
asian alone: `P0050006` \* population total / not hispanic or latino -
native hawaiian and other pcaific islander alone: `P0050007` \*
population total / not hispanic or latino - some other race alone:
`P0050008` \* population total / not hispanic or latino - two or more
races: `P0050009`

    variables <- 
      c('name' = 'NAME',
        'pop_total' = 'P0010001', 
        'hispanic' = 'P0040003',
        'white' = 'P0050003',
        'black' = 'P0050004',
        'native' = 'P0050005',
        'asian' = 'P0050006',
        'pacific' = 'P0050007',
        'other' = 'P0050008') 

    variables_api <- variables %>% str_c(collapse = ',')

API request construction
------------------------

If you created an API key and stored it in the `key` variable, the
`key=` parameter will be added to the end of your request.

    base_api <- "https://api.census.gov/data/2010/sf1?get="
    key_api <- if_else(exists("key"),
                       c("&key=", key) %>% str_c(collapse = ''),
                       '')

The API returns a JSON object. We will use the package `jsonlite` to
query and parse the response.

    queryAPI <- function(request) {
      require(jsonlite)
      
      # Request and parse JSON response
      df <- 
        request %>% 
        fromJSON(flatten = TRUE) %>% 
        as_tibble()
      
      # Rename the variables
      colnames(df) <- 
        c(
        names(variables),
        df[1, (length(variables) + 1):length(df)]
        )
      
      # Return the data without the first row (containing the variables' names) 
      # and coerce the numeric variables we downloaded to be numbers.
      return(df %>% 
               slice(2:n()) %>% 
               mutate_at(2:length(variables), as.numeric))
        
    }

State level data
----------------

The request returns the variables aggregated at state level for each
state.

    geo_api <- "&for=state:*"
    request <- c(base_api, variables_api, geo_api, key_api) %>% str_c(collapse = '')

Request state data:

    # If we've already downloaded the data,
    # load data from file
    if (file.exists('../data/state_data.tsv')) {
      state_data <- 
        '../data/state_data.tsv' %>% 
        read_tsv()
      
    # If not, query the API
    # and save the data to file
    } else {
      state_data <- 
        request %>% 
        queryAPI()
      
      state_data %>% 
        write_tsv('../data/state_data.tsv')
    }

    ## Parsed with column specification:
    ## cols(
    ##   name = col_character(),
    ##   pop_total = col_integer(),
    ##   hispanic = col_integer(),
    ##   white = col_integer(),
    ##   black = col_integer(),
    ##   native = col_integer(),
    ##   asian = col_integer(),
    ##   pacific = col_integer(),
    ##   other = col_integer(),
    ##   state = col_character()
    ## )

    # Let's have a look at the state_data
    state_data %>% 
      head() %>%
      glimpse()

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

The data contains all the 50 states, as well as DC (11) and Puerto Rico
(72).

### Data sanity checks:

The sum of all race/origin variables should add to the total population
(minus people cateogrized as two or more races).

    state_data %>% 
      mutate(sum = rowSums(.[] %>% select_if(is.numeric) %>% select(-pop_total))) %>% 
      select(name, pop_total, sum) %>% 
      transmute(percent = sum / pop_total) %>% 
      summarise_all(mean)

    ## # A tibble: 1 x 1
    ##     percent
    ##       <dbl>
    ## 1 0.9777406

98% of the population is either of hispanic origin or of 1 race alone.
That seems right. We will use the hispanic / not\_hispanic variables in
our map.

County level data
-----------------

We will now request the variables aggregated at the county level for
each state.

The request returns the variables aggregated at state level for each
county.

    geo_api <- "&for=county:*"
    request <- c(base_api, variables_api, geo_api, key_api) %>% str_c(collapse = '')

Request county data:

    # If we've already downloaded the data,
    # load data from file
    if (file.exists('../data/county_data.tsv')) {
      county_data <- 
        '../data/county_data.tsv' %>% 
        read_tsv()
      
    # If not, query the API
    # and save the data to file
    } else {
      county_data <- 
        request %>% 
        queryAPI()
      
      county_data %>% 
        write_tsv('../data/county_data.tsv')
    }

    ## Parsed with column specification:
    ## cols(
    ##   name = col_character(),
    ##   pop_total = col_double(),
    ##   hispanic = col_integer(),
    ##   white = col_double(),
    ##   black = col_double(),
    ##   native = col_integer(),
    ##   asian = col_integer(),
    ##   pacific = col_integer(),
    ##   other = col_integer(),
    ##   state = col_character(),
    ##   county = col_character()
    ## )

    # Let's have a look at the count_data
    county_data %>% 
      head() %>% 
      glimpse()

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

There are around 3142 counties in the main 50 states. But we got 3221.
Are the extra ones from DC and Puerto Rico?

    nrow(county_data) - (
      county_data %>% 
      inner_join(state_data %>% select(name, state),
                 by = "state") %>% 
      filter(name.y %in% c("Puerto Rico", "District of Columbia")) %>% 
      nrow()
    ) == 3142

    ## [1] TRUE

Census tract level data
-----------------------

We will now request the variables aggregated at the census tract level
for each county in each state. The data cannot be requested for all 50
states at once because it's too large. Instead, we are going to request
census tract data for each state separately. We will then bind the
responses into a single data frame.

    # Given a state, return a formatted request
    censusTract_APIrequest <- function(state) {
      geo_api <- c("&for=tract:*&in=state:", state) %>% str_c(collapse = '')
      variables_api <- variables %>% str_c(collapse = ',')
      request <- c(base_api, variables_api, geo_api, key_api) %>% str_c(collapse = '')
      return(request)
    }

    # Given a state number, query the API and return the census tract data
    censusTract_query <- function(state) {
      req <- censusTract_APIrequest(state)
      df <- queryAPI(req)
      return(df)
    }

Request census tract data:

    # If we've already downloaded the data,
    # load data from file
    if (file.exists('../data/tract_data.tsv')) {
      tract_data <- 
        '../data/tract_data.tsv' %>% 
        read_tsv()
      
    # If not, download the data from the API
    } else {
      tract_data <- 
        state_data %>% 
        .$state %>% 
        map_dfr(censusTract_query)
      
      tract_data %>% 
        write_tsv('../data/tract_data.tsv') 
    }

    ## Parsed with column specification:
    ## cols(
    ##   name = col_character(),
    ##   pop_total = col_integer(),
    ##   hispanic = col_integer(),
    ##   white = col_double(),
    ##   black = col_integer(),
    ##   native = col_integer(),
    ##   asian = col_integer(),
    ##   pacific = col_integer(),
    ##   other = col_integer(),
    ##   state = col_character(),
    ##   county = col_character(),
    ##   tract = col_character()
    ## )

    ## Warning in rbind(names(probs), probs_f): number of columns of result is not
    ## a multiple of vector length (arg 1)

    ## Warning: 122 parsing failures.
    ## row # A tibble: 5 x 5 col     row       col               expected actual                     file expected   <int>     <chr>                  <chr>  <chr>                    <chr> actual 1  1191 pop_total no trailing characters     e3 '../data/tract_data.tsv' file 2  1892 pop_total no trailing characters     e3 '../data/tract_data.tsv' row 3  2391 pop_total no trailing characters     e3 '../data/tract_data.tsv' col 4  2641 pop_total no trailing characters     e3 '../data/tract_data.tsv' expected 5  2771  hispanic no trailing characters     e3 '../data/tract_data.tsv'
    ## ... ................. ... ........................................................................ ........ ........................................................................ ...... ........................................................................ .... ........................................................................ ... ........................................................................ ... ........................................................................ ........ ........................................................................
    ## See problems(...) for more details.

And done! We finally have all the data needed to build our interactive
map. Next, we will get the boundary files and join them with the data we
just obtained.
