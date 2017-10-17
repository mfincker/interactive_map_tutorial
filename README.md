# Interactive web map with MapBox - tutorial

In this tutorial, I will show you how to build an interactive web map from scratch, from gathering and formatting the data, to styling your map and adding user interactivity with MapBoxGL.js.

Tutorial parts:

  1. [Data gathering and formatting](./1_data_gathering_formatting): first, we will download demographic data from the Census bureau programatically and format it to only retain the information we need.
  2. [Geographic information and GeoJSON creation](./2_geographies_gathering_formatting): second, we will obtain the geographic boundaries from the Census bureau and merge our data with it to obtain GeoJSON files containing both data and geographies.
  3. [GeoJSON to Mbtiles](./3_geojson_to_mbtiles): the GeoJSON files contain all the information we need but can be too heavy to transfer over the internet. Instead, we will cut it in small pieces, called vector tiles, that are much lighter to query.
  4. [Mapbox set up](./4_uploading_mbtiles_to_mapbox): MapBox will host our tiles and serve them whenver we need them. In this step, we will set up a MapBox account and upload our tiles.
  5. [First map using MapBoxGL.js](./5_map_skeleton_and_zoom_feature): In this step, we will build our first map and we will set it up so that the layer displayed depends on the zoom level. You can see the live version of the map [here](https://mfincker.github.io/map_tutorial/part5/map.html). - **UNDER CONSTRUCTION, might not work all the time. Watch the repo for updates.**
