/**
 * SMap
 */

(function ($) {
    'use strict';

    /**
     *
     * @param element
     * @param options
     * @constructor
     */
    $.SMap = function (element, options) {
        // HTML Elements
        this.elements = {
            container: element
        };

        // Plugin options
        this.options = {};

        // Leaflet map entity
        this.map = undefined;

        // Markers data
        this.markers = {
            items: [],
            positions: [],
            cluster: undefined,
            iconInterface: undefined
        };

        // Config
        $.extend(true, this.options, $.SMap.defaults, options);

        // Init
        if (this.prepareOptions() === true) {
            this.init();
        }

        return this;
    };

    /**
     *
     */
    $.SMap.defaults = {
        map: { // leaflet main options
            center: undefined,  // Map center [X, X]
            zoom: 10,
            minZoom: 4,
            maxZoom: 18,
            zoomPosition: 'topright',
            gestureHandling: true // Leaflet.GestureHandling
        },
        autoCenter: true, // On update, fit bounds automatically
        tileLayer: undefined, // Background tile
        enableClusters: true, // Enable clustering for markers
    };

    /**
     *
     */
    $.SMap.prototype = {
        /**
         * Test the existence of required elements
         */
        prepareOptions: function () {
            if (typeof L === 'undefined') {
                this.setLog('error', '"L" function from Leaflet is undefined');
                return false;
            }

            // Élément
            if (this.elements.container.length === 0) {
                this.setLog('error', 'Map container not found');
                return false;
            }

            // Map html tag has no id attribute
            if (this.elements.container.attr('id') === undefined) {
                this.setLog('error', 'Map container must have an "id" attribute');
                return false;
            }

            // Center
            if (this.options.map.center === undefined || typeof this.options.map.center !== 'object') {
                this.setLog('error', 'Missing required center parameter as array');
                return false;
            }

            // Tile Layer
            if (this.options.tileLayer === undefined) {
                this.options.tileLayer = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://cartodb.com/attributions">CartoDB</a>'
                });
            }

            // markerClusterGroup
            if (this.options.enableClusters === true && typeof L.enableClusters === undefined) {
                this.setLog('error', 'Missing markerClusterGroup library');
                return false;
            }

            return true;
        },

        /**
         * Launch
         */
        init: function () {
            // Init Leaflet map
            this.map = L.map(this.elements.container.attr('id'), this.options.map);

            // Map center
            this.options.center = new L.LatLng(this.options.map.center[0], this.options.map.center[1]);

            // Apply background tile layout
            this.setTileLayer();

            // Apply options to map and refresh
            this.setView();

            // Custom icon interface for custom markers
            this.initMarkerIcon();
        },

        /**
         * Update map after changes
         */
        update: function () {
            this.setView();

            // Auto center map
            if (this.options.autoCenter === true) {
                this.fitBounds();
            }

            // If map size change
            this.leaflet().invalidateSize();
        },

        /**
         * Apply settings to leaflet map
         */
        setView: function () {
            this.leaflet().setView(this.options.map.center, this.options.map.zoom);
            this.leaflet().zoomControl.setPosition(this.options.map.zoomPosition);
        },

        /**
         * Apply background tile
         */
        setTileLayer: function () {
            this.options.tileLayer.addTo(this.leaflet());
        },

        /**
         * Set map center and refresh map
         *
         * @param center
         */
        setCenter: function (center) {
            if (typeof center !== 'object') {
                this.setLog('error', 'Center must be an indexed array');
                return;
            }

            this.options.map.center = center;
            this.options.center = new L.LatLng(this.options.map.center[0], this.options.map.center[1]);
            this.update();
        },

        /**
         * Set zoom and refresh map
         *
         * @param zoom
         */
        setZoom: function (zoom) {
            this.options.map.zoom = zoom;
            this.update();
        },

        /**
         * Override all leaflet options and refresh map
         *
         * @param options
         */
        setMapOptions: function (options) {
            if (typeof options !== 'object') {
                this.setLog('error', 'Options must be an object');
                return;
            }

            $.extend(true, this.options.map, options);
            $.extend(true, this.leaflet().options, options);

            this.update();
        },

        /**
         * Auto center map if options enabled
         */
        fitBounds: function () {
            var coordinates;

            if (this.markers.positions.length) {
                coordinates = this.markers.positions;
            } else {
                coordinates = [this.options.center];
            }

            this.leaflet().fitBounds(coordinates, {
                padding: [10, 10] // todo config
            });
        },


        /**
         * Add markers to map
         *
         * @param markers  array
         * @param replace  bool Replace existing markers
         */
        addMarkers: function (markers, replace) {
            // Supprime les existants
            if (replace === true) {
                this.removeMarkers();
            }

            // Recreate marker cluster interface if undefined
            if (this.options.enableClusters === true && this.markers.cluster === undefined) {
                this.initMarkerCluster();
            }

            // Add each marker through an EasyMarker instance
            var i = 0;
            var length = markers.length;

            for (i; i < length; i++) {
                markers[i].cluster = this.markers.cluster;
                var marker = new $.SMapMarker(markers[i], this.markers.iconInterface);

                this.markers.items.push(marker);
                this.markers.positions.push(marker.getLatLng());

                if (!this.clusterEnabled()) {
                    marker.leaflet().addTo(this.leaflet());
                } else {
                    this.markers.cluster.addLayer(marker.leaflet())
                }

                //
                marker.handleInteractions();
            }

            // Si MarkerCluster, on ajoute le cluster contenant les markers à la carte
            if (this.clusterEnabled()) {
                this.leaflet().addLayer(this.markers.cluster);
            }

            // Mise à jour de l'affichage
            this.update();
        },

        /**
         *
         * @returns {Array}
         */
        getMarkers: function () {
            return this.markers.items;
        },

        /**
         * Supprime tous les markers de la carte
         */
        removeMarkers: function () {
            var self = this;

            var propertyToTest = this.markers.cluster === undefined ? '_icon' : '_markerCluster';

            self.leaflet().eachLayer(function (layer) {
                if (layer[propertyToTest] !== undefined) {
                    self.leaflet().removeLayer(layer);
                }
            });

            this.markers.items = [];
            this.markers.positions = [];
            this.markers.cluster = undefined;

            this.update();
        },

        /**
         *
         */
        initMarkerCluster: function () {
            this.markers.cluster = L.markerClusterGroup();
        },

        /**
         *
         */
        initMarkerIcon: function () {
            this.markers.iconInterface = L.DivIcon.extend({
                createIcon: function (oldIcon) {
                    var div = L.DivIcon.prototype.createIcon.call(this, oldIcon);
                    if (this.options.data) {
                        for (var key in this.options.data) {
                            div.dataset[key] = this.options.data[key];
                        }
                    }
                    return div;
                }
            });
        },


        /**
         *
         * @param type
         * @param log
         */
        setLog: function (type, log) {
            console[type]('SMap : ' + log);
        },

        /**
         *
         * @returns {boolean}
         */
        clusterEnabled: function () {
            return this.markers.cluster !== undefined;
        },

        /**
         *
         * @returns {*}
         */
        leaflet: function () {
            return this.map;
        },
    };

    /**
     *
     * @param options
     * @returns {*}
     */
    $.fn.sMap = function (options) {
        return new $.SMap($(this), options);
    };

})(jQuery);