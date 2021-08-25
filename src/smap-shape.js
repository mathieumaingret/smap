(function ($) {
    'use strict';

    /**
     * SmapShape
     *
     * @param {object} options
     *
     * @return {$.SmapShape}
     */
    $.SmapShape = function (options) {
        // Config
        $.extend(true, this.options = {}, $.SmapShape.defaults, options);

        // Variables
        this.layer = undefined;
        this.popup = undefined;

        // Init
        if (this.prepareOptions()) {
            this.init();
        }

        return this;
    };

    $.SmapShape.defaults = {
        type: 'geojson',
        geometry: undefined,
        style: {},
        popup: undefined,
        showPopup: false, // Popup affichée dès le chargement
        centerOnFocus: true,
        sourceContainer: undefined,
        classes: {
            prefix: 'smap-shape',
            layer: '{prefix}--default',
            focused: 'is-focused',
            active: 'is-active'
        }
    };

    $.SmapShape.prototype = {
        /**
         * Prepare user options
         *
         * @return {boolean}
         */
        prepareOptions: function () {
            var self = this;

            if (typeof L === 'undefined') {
                $.Smap.prototype.setLog('"L" function from Leaflet is undefined.', 'error');
                return false;
            }

            if (self.options.geometry === undefined || typeof self.options.geometry !== 'object') {
                $.Smap.prototype.setLog('Missing required geometry parameter as array.', 'error');
                return false;
            }

            // Classes
            $.each(self.options.classes, function (key, value) {
                if (typeof value === 'string') {
                    self.options.classes[key] = value.replace(/{prefix}/, self.options.classes.prefix);
                }
            });

            return true;
        },

        /**
         * Instantiate
         */
        init: function () {
            var self = this;

            if (self.options.type === 'geojson') {
                self.layer = L.geoJson({
                    type: 'Feature',
                    properties: {},
                    geometry: self.options.geometry,
                    smap_init_options: self.options
                }, self.options.style);

                self.layer.layerType = 'shape';

                setTimeout(function () {
                    self.getContainer().addClass(self.options.classes.prefix + ' ' + self.options.classes.layer);
                }, 0);
            }

            // Popup
            if (self.options.popup !== undefined) {
                self.popup = new $.SmapPopup(self.getLayer(), self.options, self.options.popupOptions);
            }

            // Events
            self.getLayer().on({
                'click': function () {
                    // if (self.options.centerOnFocus === true) {
                    //     self.map().fitBounds(self.getLayer().getBounds());
                    // }
                },
                'mouseover': function () {
                    self.getContainer().addClass(self.options.classes.focused);
                },
                'mouseout': function () {
                    self.getContainer().removeClass(self.options.classes.focused);
                },
                'popupopen': function () {
                    self.getContainer().addClass(self.options.classes.active);

                    if (self.options.sourceContainer !== undefined) {
                        self.options.sourceContainer.addClass(self.options.classes.active);
                    }
                },
                'popupclose': function () {
                    self.getContainer().removeClass(self.options.classes.active);

                    if (self.options.sourceContainer !== undefined) {
                        self.options.sourceContainer.removeClass(self.options.classes.active);
                    }
                }
            });

            // Custom events
            if (self.options.events !== undefined) {
                $.each(self.options.events, function (event, callback) {
                    self.getLayer().on(event, callback);
                });
            }

            return self;
        },

        /**
         * Return bounds layer
         *
         * @return {object}
         */
        getBounds: function () {
            return this.getLayer().getBounds();
        },

        /**
         * Return current layer
         *
         * @return {object}
         */
        getLayer: function () {
            return this.layer;
        },

        /**
         * Return the layer container
         *
         * @returns {boolean|jQuery}
         */
        getContainer: function () {
            var firstLayer = null;
            $.each(this.getLayer()._layers, function (layerId, layer) {
                return firstLayer = layer;
            });

            if (firstLayer !== null && firstLayer._path !== undefined) {
                return $(firstLayer._path);
            }

            return false;
        },

        /**
         * Return the associated map
         *
         * @return {object}
         */
        map: function () {
            return this.getLayer()._map;
        }
    };

})(jQuery);
