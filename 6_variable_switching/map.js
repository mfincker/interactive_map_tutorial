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
const Map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mfincker/cj8q54extaap22rqmx4ylissd',
    center: [-98, 38.88],
    zoom: 3,
    minZoom: 3
});

// ====================================================================
// MAP LOAD
Map.on('load', function() {

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
                                                            'property': 'asian_percent',
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
    sources.forEach((s) => {Map.addSource(s.level, s.source);});

    layers.forEach((l) => {Map.addLayer(l.layer, l.before);});


    // ==================================================================
    // ==================================================================
    // NEW CONTENT STARTS BELOW


    // ==================================================================
    // VARIABLE SWITCH

    // Variable list
    const var_names = [
                        { varname: "asian_percent", name: "asian"},
                        { varname: "black_percent", name: "black"},
                        { varname: "hispanic_percent", name: "hispanic"},
                        // { varname: "pacific_percent", name: "pacific islander"},
                        { varname: "white_percent", name: "white"},
                        // { varname: "other_percent", name: "other"},
                      ];

    // Populate the var-switch div automatically
    document.getElementById("vars").innerHTML = var_names.reduce(populate_vars, '');

    function populate_vars(innerHtml, v) {
        return (v.name === "asian") 
            ? innerHtml + 
              '<label><input type="radio" name="layers" value="' + 
              v.varname + 
              '" checked>' + 
              v.name + 
              "</label>"

            : innerHtml + 
              '<label><input type="radio" name="layers" value="' + 
              v.varname + 
              '">' + 
              v.name + 
              "</label>";
    }


    // Event listener  to switch between variables
    document.getElementById("vars").addEventListener("click", varSwitch, false);


    function varSwitch(e) {
        if (e.target.value && e.target !== e.currentTarget) {

            // Iterate over each data layer and set the variable to be used
            layer_names.forEach(
                (n) => { Map.setPaintProperty(n, 'fill-color', { property: e.target.value,
                                                                 stops: color_scale });
                });
        }

        e.stopPropagation();
    }

    //===============================================================
    // LEGEND   

    // Legend svg group + constants
    const legend_group = d3.select("#legend")
                            .append("svg")
                            .attr("width", 200)
                            .attr("height", 250)

    const square_height = 15;
    const square_width = 30;
    const padding_left = 20;
    const padding_top = 20;
    const spacer = 2;

    // Legend title
    legend_group.append("text")
            .attr("class", "title")
            .attr("x", padding_left)
            .attr("y", padding_top)
            .text("Population percentage:")

    // Legend elements
    const square = legend_group.selectAll(".legend")
                    .data(color_scale)
                    .enter().append("g")
                    .attr("class", "legend")
                    .attr("transform", (d, i) => {return "translate(" + padding_left +"," + ((i * (square_height + spacer)) + (2 * padding_top)) + ")";});


    // Legend square
    square.append("rect")
          .attr("width", square_width)
          .attr("height", square_height)
          .attr("fill", (d) => {return d[1];})

    // Legend percentage
    square.append("text")
          .attr("x", square_width + 5)
          .attr("y", square_height - 3)
          .text((d) => {return d[0] * 100 + "%" ;})



});