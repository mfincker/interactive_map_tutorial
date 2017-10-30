// Replace this with your own token when making maps with your own layers
mapboxgl.accessToken = 'pk.eyJ1IjoibWZpbmNrZXIiLCJhIjoiY2o3cW1vdTdlNDRiNjMzbnB4Yzc5OTF2cSJ9.ZOpKJ4FmWj8CUpsKbsh-dg';

// Color scale
const color_scale = [
                        [0,   '#fdffb4'],
                        [0.1, '#d1f7ae'],
                        [0.2, '#a7e7ad'],
                        [0.3, '#7ed6ad'],
                        [0.4, '#57c3ae'],
                        [0.5, '#30b0ae'],
                        [0.6, '#009cab'],
                        [0.7, '#0087a4'],
                        [0.8, '#007398'],
                        [0.9, '#1a5e89'],
                    ];

// Initialize mapbox map with desired stylesheet
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mfincker/cj8q54extaap22rqmx4ylissd',
    center: [-98, 38.88],
    zoom: 3,
    minZoom: 3
});

// ====================================================================
// MAP LOAD
map.on('load', function() {

    // Keep variables here to avoid polluting global namespace

    // Layers' name and mapbox links
    const data = {
                    'state' : 'mapbox://mfincker.5a5pwuuf', 
                    'county': 'mapbox://mfincker.6cry8xr7', 
                    'tract' : 'mapbox://mfincker.8wiiisxj',
                  };

    const layer_names = [];
    

    // Zoom levels for layer toggling
    const zoom = {
                    'state':  {'min': 3, 'max': 5},
                    'county': {'min': 5, 'max': 9},
                    'tract':  {'min': 9, 'max': 20},
                  };

    // MapBox source info
    const sources = Object.entries(data).map(
        (d) => {const region = d[0];
                const url = d[1];
                return {
                        'level': region,
                        'source': { 'type': 'vector',
                                    'url' : url
                                  },
                        };
                }
    );

    // MapBox layers
    const layers = Object.entries(zoom).map(
        (z) => {const region = z[0];
                const zoom = z[1];

                layer_names.push(region + '-layer');

                return {
                       'layer': {
                                'id': region + '-layer',
                                'type': 'fill',
                                'source': region,
                                'source-layer': region,
                                'minzoom': zoom.min,
                                'maxzoom': zoom.max,
                                'paint': {
                                            'fill-opacity': 0.8,
                                            'fill-color': {
                                                            'property': 'white_percent',
                                                            'stops': color_scale,
                                                          },
                                            'fill-outline-color': '#c3c7d6',
                                        },
                                },
                       // Add new layer above this layer
                       'before': 'border-admin-3-4',
                      };

        }
    );

    // Loading sources and layers
    sources.forEach((s) => {map.addSource(s.level, s.source);});

    layers.forEach((l) => {map.addLayer(l.layer, l.before);});

});

