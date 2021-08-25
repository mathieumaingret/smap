(function ($) {
    'use strict';

    /**
     * SmapMarker
     *
     * @param {object} options
     * @param {object} iconInterface
     *
     * @return {$.SmapMarker}
     */
    $.SmapMarker = function (options, iconInterface) {
        // Config
        this.options = {
            //cluster: undefined
        };
        $.extend(true, this.options, $.SmapMarker.defaults, options);

        this.layer = undefined;
        this.icon = undefined;
        this.iconInterface = iconInterface;
        this.popup = undefined;


        // Init
        if (this.prepareOptions()) {
            this.init();
        }

        return this;
    };

    $.SmapMarker.defaults = {
        position: undefined,
        customIcon: true,
        icon: {
            html: undefined,
            data: {
                id: undefined,
            },
            iconSize: [50, 50],
            iconAnchor: [],
            popupAnchor: []
        },
        popup: undefined,
        popupOptions: undefined,
        //showPopup: false, // Popup affichée dès le chargement
        centerOnFocus: true,
        sourceContainer: undefined,
        sourceContainerEvent: 'mouseenter focus',
        sourceContainerSelector: '.js-map-trigger',
        cluster: undefined,
        data: {},
        classes: {
            prefix: 'smap-marker',
            layer: '{prefix}--default',
            focused: 'is-focused',
            active: 'is-active'
        }
    };

    $.SmapMarker.prototype = {
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

            if (self.options.position === undefined || typeof self.options.position !== 'object') {
                $.Smap.prototype.setLog('Missing required position parameter as array.', 'error');
                return false;
            }

            // Anchors
            if (self.options.icon.iconAnchor.length === 0) {
                self.options.icon.iconAnchor = [Math.floor(self.options.icon.iconSize[0]/2), self.options.icon.iconSize[1]];
            }
            if (self.options.icon.popupAnchor.length === 0) {
                self.options.icon.popupAnchor = [0, - Math.floor(self.options.icon.iconSize[1]/1.5)];
            }

            // Classes
            $.each(self.options.classes, function (key, value) {
                if (typeof value === 'string') {
                    self.options.classes[key] = value.replace(/{prefix}/, self.options.classes.prefix);
                }
                self.options.icon.className = self.options.classes.prefix + ' ' + self.options.classes.layer;
            });

            return true;
        },

        /**
         * Instantiate
         */
        init: function () {
            var self = this;
            var options = {};

            // Instance d'un icon de marker
            if (self.options.customIcon === true) {
                self.icon = new self.iconInterface(self.options.icon);

                options.icon = self.icon;
            }

            // Add
            options.smap_init_options = self.options;

            // Instance du marker
            self.layer = L.marker(self.options.position, options);
            self.layer.layerType = 'marker';

            if (self.options.customIcon === true && self.options.icon.html !== undefined) {
                self.getContainer().html(self.options.icon.html);
            }

            // Popup
            if (self.options.popup !== undefined) {
                self.popup = new $.SmapPopup(self.getLayer(), self.options, self.options.popupOptions);
            }

            // Events
            self.getLayer().on({
                'click': function () {
                    if (self.options.centerOnFocus === true) {
                        self.map().setView(self.getLayer().getLatLng());
                    }
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

            // Click on source target => focus on corresponding marker
            if (self.options.sourceContainer !== undefined) {
                if (self.options.centerOnFocus === true && self.options.cluster !== undefined) {
                    var timeout = undefined;

                    var execution = function () {
                        self.options.cluster.zoomToShowLayer(self.getLayer(), function () {
                            if (self.popup !== undefined) {
                                self.popup.getLayer().openPopup();
                            }
                        });
                    };

                    var events = self.options.sourceContainerEvent.split(' ').join('.smapsourceinteraction ') + '.smapsourceinteraction';
                    self.options.sourceContainer.on(events, self.options.sourceContainerSelector,  function () {
                        if (self.options.sourceContainerEvent !== 'click') {
                            if (timeout !== undefined) {
                                clearTimeout(timeout);
                            }
                            timeout = setTimeout(function () {
                                execution();
                            }, 600);
                        } else {
                            execution();
                        }
                    });

                    self.options.sourceContainer.on('mouseleave.smapsourceinteraction', self.options.sourceContainerSelector, function () {
                        if (timeout !== undefined) {
                            clearTimeout(timeout);
                        }
                    });
                }
            }


            // Custom events
            if (self.options.events !== undefined) {
                $.each(self.options.events, function (event, callback) {
                    self.getLayer().on(event, callback);
                });
            }

            return this;
        },

        /**
         * Return lat,lng array
         *
         * @return {array}
         */
        getPosition: function () {
            return this.options.position;
        },

        /**
         * Return lat,lng Leaflet object
         *
         * @return {object}
         */
        getLatLng: function () {
            return this.getLayer().getLatLng();
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
         * @return {jQuery}
         */
        getContainer: function () {
            return $(this.getLayer()._icon);
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
