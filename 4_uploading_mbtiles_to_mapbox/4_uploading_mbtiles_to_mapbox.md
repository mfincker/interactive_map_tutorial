The tiles we created must be hosted and then served on the web in order
for us to move forward. We will use [MapBox]() to host and serve our
tiles, and we will use their MapboxGL.js library to build the map.
Mapbox hosting service is free if your data is not larger than 50GB and
hosting services are free as long as the number of reqest made to their
API every month is low enough.

Go to the Mapbox website and create an account, then head to the Studio.
You can uplaod your tile sets by clicking on Tilesets in the left menu
and then pressing "New Tileset". Upload your 3 mbtile files. It may take
some time to upload and process the files but soon enough, you should
see 3 new tilesets available in the list below on the page. They should
have a name similar to `tract-d3quh`. Mapbox adds a random string of
character after the tile set name to make it unique.

While you're on the Mapbox website, go to Account and copy (or create if
you don't have one) your API access token. This string of character will
be needed when we'll start building the map to request the dat from
Mapbox.
