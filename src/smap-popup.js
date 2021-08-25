(function ($) {
    'use strict';

    /**
     * SmapPopup
     *
     * @param {object} layer
     * @param {object} layerOptions
     * @param {object=undefined} options
     *
     * @return {$.SmapPopup}
     */
    $.SmapPopup = function (layer, layerOptions, options) {
        // Config
        $.extend(true, this.options = {}, $.SmapPopup.defaults, options);

        // Variables
        this.layer = layer;
        this.layerOptions = layerOptions;

        // Init
        if (this.prepareOptions()) {
            this.init();
        }

        return this;
    };

    $.SmapPopup.defaults = {
        showPopup: false, // Popup affichée dès le chargement
        classes: {
            prefix: 'smap-popup',
            layer: '{prefix}--default'
        },
        attributes: {}
    };

    $.SmapPopup.prototype = {
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

            // Classes
            $.each(self.options.classes, function (key, value) {
                if (typeof value === 'string') {
                    self.options.classes[key] = value.replace(/{prefix}/, self.options.classes.prefix);
                }
                self.options.className = self.options.classes.prefix + ' ' + self.options.classes.layer;
            });
            return true;
        },

        /**
         * Instantiate
         */
        init: function () {
            var self = this;

            if (self.layerOptions.popup !== undefined) {
                var attributes = self.options.attributes;
                $.extend(true, attributes, {
                    html: self.layerOptions.popup
                });
                attributes.class += ' ' + self.options.classes.prefix + ' ' + self.options.classes.layer;

                var popupContent = $('<div>', attributes);
                self.getLayer().bindPopup(popupContent.get(0));
            }

            self.eventsHandler();

            return self;
        },

        /**
         * Hooks
         */
        eventsHandler: function () {
            var self = this;

            // Load
            if (self.options.showPopup === true) {
                self.getLayer().openPopup();
            }

            // Click on source target => focus on corresponding marker
            if (self.options.sourceContainer !== undefined) {
                self.options.sourceContainer.on('click', function () {
                    if (self.options.centerOnFocus === true && self.options.cluster !== undefined) {
                        self.options.cluster.zoomToShowLayer(self.getLayer());
                    }

                    self.getLayer().openPopup();
                });
            }

            return self;
        },

        /**
         *
         * @returns {*}
         */
        getLayer: function () {
            return this.layer;
        },

        /**
         *
         * @returns {*|jQuery|HTMLElement}
         */
        getContainer: function () {
            if (this.getLayer().layerType === 'marker' && this.getLayer()._icon !== undefined) {
                return $(this.getLayer()._icon);

            } else if (this.getLayer().layerType === 'shape') {
                var firstLayer = null;

                $.each(this.getLayer()._layers, function (layerId, layer) {
                    return firstLayer = layer;
                });

                if (firstLayer._path !== undefined) {
                    return $(firstLayer._path);
                }
            }
        },

        /**
         *
         * @returns {*}
         */
        map: function () {
            return this.getLayer()._map;
        }
    };

})(jQuery);
