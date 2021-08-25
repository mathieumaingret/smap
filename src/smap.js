(function ($) {
    'use strict';

    /**
     * Smap
     *
     * @param {object} element
     * @param {object=undefined} options
     *
     * @return {$.Smap}
     */
    $.Smap = function (element, options) {
        // HTML Elements
        this.elements = {
            container: element
        };

        // Leaflet map entity
        this.map = undefined;

        //
        this.groups = {};

        this.markers = {
            cluster: undefined,
            iconInterface: undefined
        };

        // Plugin options
        $.extend(true, this.options = {}, $.Smap.defaults, options);

        // Init
        if (this.prepareOptions()) {
            this.init();
        }

        return this;
    };

    $.Smap.defaults = {
        map: { // leaflet main options
            center: undefined,  // Map center [X, X]
            zoom: 10,
            minZoom: 4,
            maxZoom: 18,
            zoomPosition: 'topright',
            gestureHandling: true // Leaflet.GestureHandling
        },
        boundsOptions: {
            padding: [30, 30]
        },
        autoCenter: true, // On update, fit bounds automatically
        tileLayer: undefined, // Background tile
        enableClusters: true, // Enable clustering for markers,
        clusterOptions: {}
    };

    $.Smap.prototype = {
        /**
         * Prepare user options
         *
         * @return {boolean}
         */
        prepareOptions: function () {
            if (typeof L === 'undefined') {
                this.setLog('"L" function from Leaflet is undefined.', 'error');
                return false;
            }

            // Élément
            if (this.elements.container.length === 0) {
                this.setLog('Map container not found.', 'error');
                return false;
            }

            // Map html tag has no id attribute
            if (this.elements.container.attr('id') === undefined) {
                this.setLog('Map container must have an "id" attribute.', 'error');
                return false;
            }

            // Center
            if (this.options.map.center === undefined || typeof this.options.map.center !== 'object') {
                this.setLog('Missing required center parameter as array.', 'error');
                return false;
            }

            // Tile Layer
            if (this.options.tileLayer === undefined) {
                this.options.tileLayer = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> &copy; <a href="https://cartodb.com/attributions" target="_blank">CartoDB</a>'
                });
            }

            // markerClusterGroup
            if (this.options.enableClusters === true && typeof L.markerClusterGroup === 'undefined') {
                this.setLog('Missing "markerClusterGroup" library.', 'error');
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
            this.loadMarkerIcon();
        },

        /**
         * Update map after changes
         *
         * @returns {$.Smap}
         */
        update: function () {
            // Auto center map
            if (this.options.autoCenter) {
                this.fitBounds();
            }

            // If map size change
            this.leaflet().invalidateSize();

            return this;
        },

        /**
         * Apply settings to leaflet map
         *
         * @returns {$.Smap}
         */
        setView: function () {
            this.leaflet().setView(this.options.map.center, this.options.map.zoom);
            this.leaflet().zoomControl.setPosition(this.options.map.zoomPosition);

            return this;
        },

        /**
         * Apply background tile
         *
         * @returns {$.Smap}
         */
        setTileLayer: function () {
            this.options.tileLayer.addTo(this.leaflet());

            return this;
        },

        /**
         * Set map center and refresh map
         *
         * @param center
         * @returns {$.Smap}
         */
        setCenter: function (center) {
            if (typeof center !== 'object') {
                this.setLog('Center must be an indexed array.', 'error');
                return this;
            }

            this.options.map.center = center;
            this.options.center = new L.LatLng(this.options.map.center[0], this.options.map.center[1]);
            this.update();

            return this;
        },

        /**
         * Set zoom and refresh map
         *
         * @param zoom
         * @returns {$.Smap}
         */
        setZoom: function (zoom) {
            this.options.map.zoom = zoom;
            return this.update();
        },

        /**
         * Override leaflet options and refresh map
         *
         * @param options
         * @returns {$.Smap}
         */
        setMapOptions: function (options) {
            if (typeof options !== 'object') {
                this.setLog('Options must be an object.', 'error');
                return this;
            }

            $.extend(true, this.options.map, options);
            $.extend(true, this.leaflet().options, options);

            return this.update();
        },

        /**
         * Auto center map if option is enabled
         *
         * @returns {$.Smap}
         */
        fitBounds: function () {
            if (this.options.autoCenter === true && !$.isEmptyObject(this.groups)) {
                var bounds = L.latLngBounds();

                // Get bounds for groups not in markerCluster
                $.each(this.getGroups(), function (i, group) {
                    if (group.type !== 'marker_cluster' && group.layer.getBounds().isValid()) {
                        bounds.extend(group.layer.getBounds());
                    }
                });

                // Add marker cluster bounds
                if (this.clusterIsEnabled()) {
                    bounds.extend(this.getCluster().getBounds());
                }

                this.leaflet().fitBounds(bounds, this.options.boundsOptions);
            }

            return this;
        },

        /**
         * @returns {{}}
         */
        getGroups: function () {
            return this.groups;
        },

        /**
         *
         * @param group
         * @returns {*}
         */
        getGroup: function (group) {
            return this.groups[group] !== undefined ? this.groups[group] : null;
        },

        /**
         *
         * @param group
         * @param type
         */
        initGroup: function (group, type) {
            if (this.getGroup(group) === null) {
                this.groups[group] = {
                    layer: new L.FeatureGroup(),
                    children: [],
                    type: type
                };
                this.leaflet().addLayer(this.groups[group].layer);
            }

            return this.groups[group];
        },

        /**
         *
         * @param group
         * @param update
         * @returns {$.Smap}
         */
        removeGroup: function (group, update) {
            group = group || 'default';

            var groupLayer = this.getGroup(group);
            if (groupLayer !== null) {
                if (this.clusterIsEnabled()) {
                    // Remove only markers off current group
                    this.markers.cluster.removeLayers(groupLayer.children);
                }

                this.leaflet().removeLayer(groupLayer.layer);
                delete this.groups[group];

                if (update === true) {
                    this.update();
                }
            }

            return this;
        },

        /**
         *
         * @param update
         * @returns {$.Smap}
         */
        removeGroups: function (update) {
            var self = this;

            $.each(self.getGroups(), function (i, group) {
                self.leaflet().removeLayer(group.layer);
            });

            self.groups = {};

            // Remove cluster too
            if (this.markers.cluster !== undefined) {
                self.leaflet().removeLayer(self.markers.cluster);
                self.markers.cluster = undefined;
            }

            if (update === true) {
                self.update();
            }

            return self;
        },

        /**
         * Add markers to map
         *
         * @param markers
         * @param options
         * @param group
         * @returns {$.Smap}
         */
        addMarkers: function (markers, options, group) {
            options = options || {};
            group = group || 'default';

            // Remove existing markers
            if (options.replace !== undefined && options.replace === true) {
                this.removeGroup(group, false);
            }

            // Recreate marker cluster interface if undefined
            if (this.options.enableClusters === true && this.markers.cluster === undefined) {
                this.initCluster();
            }

            // Layers will be displayed into a Leaflet feature group
            this.initGroup(group, (this.clusterIsEnabled() ? 'marker_cluser' : 'marker'));

            var i = 0;
            var length = markers.length;

            // Add each marker
            for (i; i < length; i++) {
                markers[i].cluster = this.getCluster();
                var marker = new $.SmapMarker(markers[i], this.markers.iconInterface); // @todo ajouter le group ? + l'instance SMapMarker
                //marker.getLayer().options.group = group;

                this.groups[group].children.push(marker.getLayer());

                if (!this.clusterIsEnabled()) {
                    this.groups[group].layer.addLayer(marker.getLayer());
                }
            }

            if (this.clusterIsEnabled()) {
                this.markers.cluster.addLayers(this.groups[group].children);
            }

            // Update view
            return length > 0 ? this.update() : this;
        },


        /**
         * Add shapes to map
         *
         * @param shapes
         * @param options
         * @param group
         * @returns {$.Smap}
         */
        addShapes: function (shapes, options, group) {
            options = options || {};
            group = group || 'default';

            // Remove existing markers
            if (options.replace !== undefined && options.replace === true) {
                this.removeGroup(group, false);
            }

            // Layers will be displayed into a Leaflet feature group
            this.initGroup(group, 'shapes');

            // Add each marker
            var i = 0;
            var length = shapes.length;

            for (i; i < length; i++) {
                var shape = new $.SmapShape(shapes[i]); // @todo options shapes + group

                this.groups[group].children.push(shape.getLayer());
                this.groups[group].layer.addLayer(shape.getLayer());
            }

            // Update view
            return length > 0 ? this.update() : this;
        },

        /**
         * Add MarkerClusterGroup library
         */
        initCluster: function () {
            var options = $.extend(true, {
               removeOutsideVisibleBounds: true,
               // chunkedLoading: true
            }, this.options.clusterOptions);

            this.markers.cluster = L.markerClusterGroup(options);

            this.leaflet().addLayer(this.markers.cluster);

            return this;
        },

        /**
         *
         * @returns {any}
         */
        getCluster: function () {
            return this.markers.cluster;
        },

        /**
         * Determines if clusters are enabled
         *
         * @return {boolean}
         */
        clusterIsEnabled: function () {
            return this.markers.cluster !== undefined;
        },

        /**
         * Add DivIcon library
         */
        loadMarkerIcon: function () {
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
         * Add log
         *
         * @param {string} log
         * @param {string=undefined} type
         */
        setLog: function (log, type) {
            type = type || 'log';

            console[type]('Smap: ' + log);
        },

        /**
         * Get Leaflet library object
         *
         * @return Map
         */
        leaflet: function () {
            return this.map;
        }
    };

    $.fn.smap = function (options) {
        return new $.Smap($(this), options);
    };
})(jQuery);
