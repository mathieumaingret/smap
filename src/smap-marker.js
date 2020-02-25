/**
 * SmapMarker
 */

(function ($) {
    'use strict';

    /**
     *
     * @param options
     * @param iconInterface
     * @returns {$.SmapMarker}
     * @constructor
     */
    $.SmapMarker = function (options, iconInterface) {
        /**
         * @type {{}}
         */
        this.elements = {};

        /**
         * @type {{}}
         */
        this.options = {
            cluster: undefined
        };

        this.marker = undefined;

        this.icon = undefined;
        this.iconInterface = iconInterface;

        this.popup = undefined;

        // Config
        $.extend(true, this.options, $.SmapMarker.defaults, options);

        // Init
        if (this.prepareOptions()) {
            this.init();
        }

        return this;
    };

    /**
     *
     */
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
        showPopup: false, // Popup affichée dès le chargement
        centerOnFocus: true,
        sourceContainer: undefined,
        classes: {
            prefix: 'marker',
            marker: '{prefix}--default',
            popup: '{prefix}-popup',
            focused: 'is-focused',
            active: 'is-active'
        }
    };

    /**
     *
     */
    $.SmapMarker.prototype = {
        /**
         * @returns {boolean}
         */
        prepareOptions: function () {
            var self = this;

            if (typeof L === 'undefined') {
                self.setLog('error', '"L" function from Leaflet is undefined');
                return false;
            }

            if (self.options.position === undefined || typeof self.options.position !== 'object') {
                self.setLog('error', 'Missing required position parameter as array');
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
                self.options.icon.className = self.options.classes.prefix + ' ' + self.options.classes.marker;
            });

            return true;
        },

        /**
         *
         */
        init: function () {
            var options = {};

            // Instance d'un icon de marker
            if (this.options.customIcon === true) {
                this.icon = new this.iconInterface(this.options.icon);

                options.icon = this.icon;
            }

            // Instance du marker
            this.marker = L.marker(this.options.position, options);

            if (this.options.customIcon === true && this.options.icon.html !== undefined) {
                this.getContainer().html(this.options.icon.html);
            }

            // Popup
            this.managePopup();
        },

        /**
         *
         */
        managePopup: function () {
            var self = this;

            if (self.options.popup !== undefined) {
                if (typeof self.options.popup === 'object') {
                    self.options.popup.html();
                }

                var popupContent = $('<div>', {
                    'class': self.options.classes.popup,
                    html: self.options.popup
                });

                self.popup = self.leaflet().bindPopup(popupContent.prop('outerHTML'));
            }
        },

        /**
         *
         */
        handleInteractions: function () {
            var self = this;

            // Load
            if (self.options.showPopup === true) {
                self.leaflet().openPopup();
            }

            // Events
            this.leaflet().on({
                'click': function () {
                    //self.setLog('log', 'click');
                    if (self.options.centerOnFocus === true) {
                        self.map().setView(self.leaflet().getLatLng());
                    }
                },
                'mouseover': function () {
                    //self.setLog('log', 'mouseover');
                    self.getContainer().addClass(self.options.classes.focused);
                },
                'mouseout': function () {
                    //self.setLog('log', 'mouseout');
                    self.getContainer().removeClass(self.options.classes.focused);
                },
                'popupopen': function () {
                    //self.setLog('log', 'popupopen');
                    self.getContainer().addClass(self.options.classes.active);

                    if (self.options.sourceContainer !== undefined) {
                        self.options.sourceContainer.addClass(self.options.classes.active);
                    }
                },
                'popupclose': function () {
                    //self.setLog('log', 'popupclose');
                    self.getContainer().removeClass(self.options.classes.active);

                    if (self.options.sourceContainer !== undefined) {
                        self.options.sourceContainer.removeClass(self.options.classes.active);
                    }
                }
            });

            // Click on source target => focus on corresponding marker
            if (self.options.sourceContainer !== undefined) {
                self.options.sourceContainer.on('click', null, function () {
                    //self.setLog('log', 'sourceContainer click');

                    if (self.options.centerOnFocus === true) {
                        if (self.options.cluster !== undefined) {
                           self.options.cluster.zoomToShowLayer(self.leaflet());
                        }
                    }

                    self.leaflet().openPopup();
                });
            }
        },

        /**
         *
         * @returns {*}
         */
        getPosition: function () {
            return this.options.position;
        },

        /**
         *
         * @returns {*|boolean}
         */
        getLatLng: function () {
            return this.leaflet().getLatLng();
        },

        /**
         *
         * @returns {*|jQuery|HTMLElement}
         */
        getContainer: function () {
            return $(this.leaflet()._icon);
        },


        /**
         *
         * @param type
         * @param log
         */
        setLog: function (type, log) {
            console[type]('SmapMarker : ' + log);
        },

        /**
         *
         * @returns {*}
         */
        leaflet: function () {
            return this.marker;
        },

        /**
         *
         * @returns {*}
         */
        map: function () {
            return this.leaflet()._map;
        }
    };

})(jQuery);