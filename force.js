var geojson;
var countField = 'total';

function getColor(d) {
    return d > 400 ? '#800026' :
           d > 300 ? '#BD0026' :
           d > 250 ? '#E31A1C' :
           d > 200 ? '#FC4E2A' :
           d > 150 ? '#FD8D3C' :
           d > 100 ? '#FEB24C' :
           d > 50  ? '#FED976' :
                     '#FFEDA0';
}

function style(feature) {
    return {
        fillColor: getColor(feature.properties.total),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }

    info.update(layer.feature.properties, countField);
}

function resetHighlight(e) {
    geojson.resetStyle(e.target);
    info.update();
}

function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}
// Create the map centered in Seattle.
var map = L.map('map_canvas').setView([47.607413, -122.323370], 12);

L.tileLayer(
    'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.light',
        accessToken: 'pk.eyJ1Ijoia3Bpc2hkYWRpYW4iLCJhIjoiY2pvMTVzN2lwMDdrbTNrcG9mb2RvcDF5aSJ9.wbFcMArvH5wSmVwvRomNmg'
}).addTo(map);

geojson = L.geoJson(data, {
    style: style,
    onEachFeature: onEachFeature
}).addTo(map);

var info = L.control();

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.update();
    return this._div;
};

// method that we will use to update the control based on feature properties passed
info.update = function (props, countField) {
    this._div.innerHTML = '<h4>Use of Force Incidents</h4>' +  (props ?
        '<b>Beat: ' + props.beat + '</b><br />' + props[countField] + ' incidents'
        : 'Hover over a region');
};

info.addTo(map);

var legend = L.control({position: 'bottomright'});

legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend'),
        grades = [0, 50, 100, 150, 200, 250, 300, 400],
        labels = [];

    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }

    return div;
};

legend.addTo(map);


// Control menu setup.
L.control.slideMenu('<p>test</p>', {}).addTo(map);
