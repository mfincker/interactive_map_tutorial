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


    // *****************************************************************
    // *****************************************************************
    // ************************** NEW CONTENT **************************

    // Polygon highlighting
    // TODO: make sure the tileset have 'region' field, acting as primary key
    // currently, the county layer doesn't have a "name" property
    const layers_highlight = Object.entries(zoom).map(
        (z) => {const region = z[0];
                const zoom = z[1];

                // layer_names.push(region + '-layer-highlight');

                return {
                       'layer': {
                                'id': region + '-layer-highlight',
                                'type': 'line',
                                'source': region,
                                'source-layer': region,
                                'minzoom': zoom.min,
                                'maxzoom': zoom.max,
                                'paint': {
                                            'line-color': '#fff',
                                            'line-width': 3,
                                            'line-opacity': 1
                                        },
                                'filter': ['==', 'name', '']
                                },
                       // Add new layer above this layer
                       'before': 'waterway-label',
                      };

        }
    );

    // Add highlight-layers
    layers_highlight.forEach((l) => {Map.addLayer(l.layer, l.before);});

    // Initialize pop-up
    const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 10
    });

    // Register a hover event listerner for each data layers
    layers.forEach((l) => {
        Map.on('mousemove', l.layer.id, (e) => {
            const feature = e.features[0];

            // Add highlighting
            Map.setFilter(l.layer.id + '-highlight',
                          ['==', 'name', feature.properties.name]);
            // Add popup
            popup
                .setLngLat(e.lngLat)
                .setHTML(format_pop_up(feature, l.layer.id))
                .addTo(Map);

            add_bar_chart(feature.properties);
        });

        Map.on('mouseleave', l.layer.id, () => {

            // Remove highlighting
            Map.setFilter(l.layer.id + '-highlight',
                          ['==', 'name', '']);
            // Remove pop-up
            popup.remove();
        });

    });

    // Format popup text
    function format_pop_up(feature, region) {
        let name;

        if (region == "state-layer") {
            name = '<h1>' + feature.properties.name + '</h1>'
        } else if (region == "county-layer") {
            name = '<h1>' + feature.properties.county + ', ' + feature.properties.abb + '</h1>'
        } else {
            name = '<h1>' + feature.properties.name + '</h1><h3>' + feature.properties.county + ', ' + feature.properties.abb + '</h3>'
        }

        return '<div class="tooltip">' + name + '</div>'
    }


    // Compute bar chart for tooltip
    function add_bar_chart(props) {
        console.log(props);

        const data = [  {'origin': 'asian',
                         'percent': props.asian_percent},
                        {'origin': 'black',
                         'percent': props.black_percent},
                        {'origin': 'hispanic',
                         'percent': props.hispanic_percent},
                        // {'origin': 'native american',
                        //  'percent': props.native_percent},
                        // {'origin': 'pacific islander',
                        //  'percent': props.pacific_percent},
                        {'origin': 'white',
                         'percent': props.white_percent},
                        {'origin': 'other',
                         'percent': props.other_percent + props.native_percent + props.pacific_percent},
        ];

        // Remove previous svg element, if any
        d3.select(".tooltip")
                    .selectAll("svg")
                    .remove();

        // Dimensions
        const m = {top: 10, right: 5, bottom: 5, left: 5},
            p = {top: 0, right: 15, bottom: 0, left: 33},
            width = 150 - m.left - m.right,
            height = 110 - m.top - m.bottom;

        // Initialize svg element
        const popup_svg = d3.select(".tooltip")
                                    .append("svg")
                                        .attr("width", width + m.left + m.right)
                                        .attr("height", height + m.top + m.bottom)
                                    .append('g')
                                        .attr('transform', "translate(" + m.left + "," + m.top + ")");


        // Scales
        const color = d3.scaleOrdinal(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
        
        const x = d3.scaleLinear()
                    .rangeRound([0, width - p.left - p.right])
                    .domain([0, 1]);

        const y = d3.scaleBand()
                    .rangeRound([0, height])
                    .paddingInner(0.2)
                    .domain(data.map(d => d.origin));

        const yAxis = d3.axisLeft(y).tickSize(0);

        const format = d3.format(".0%");

        // y-Axis
        popup_svg.append("g")
                 .attr("class", "axis axis-y")
                 .call(yAxis)
                 .attr('transform', "translate(" + p.left + ",0)");

        // Bar + percent text group
        const bars = popup_svg.selectAll('g.bar')
                              .data(data)
                              .enter()
                                .append('g')
                                .attr('class', 'bar')
                                .attr('transform', d => ('translate(' + p.left + ',' + y(d.origin) +')'));

        // Bars
        bars.append('rect')
            .attr('height', y.bandwidth())
            .attr('width', d => x(d.percent))
            .attr('fill', (d, i) => color(i))

        // Percent text
        bars.append('text')
            .attr('class', 'value')
            .attr('x', d => x(d.percent))
            .attr('y', d => (y.bandwidth() / 2))
            .attr('dx', 2)
            .attr('dy', '0.35em')
            .text(d => format(d.percent))
    
    };





    // *****************************************************************
    // *****************************************************************
    // *****************************************************************

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
        return innerHtml + 
               '<label><input type="radio" name="layers" value="' + 
               v.varname + 
               ((v.name === "asian") ? '" checked>' : '">') + 
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