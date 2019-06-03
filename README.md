# Documentation Smap

Smap permet de simplifier l'utilisation de cartes OpenStreeMap via l'API Leaflet.

* Compatibilité : 
    * IE11+
* Dépendances recquises : 
   * jQuery >= 3.3.0
   * [Leaflet](https://leafletjs.com/download.html) >= 1.5.1
* Dépendances facultatives :
   * [Leaflet.GestureHandling](https://github.com/elmarquis/Leaflet.GestureHandling) : 1.1.8
   * [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) 1.4.1
  

**Démos :**
* [Exemples d'utilisation SmapMarker](#Exemples d'utilisation SmapMarker)

---

## Créer des cartes Smap

```
var smap = $('#map').smap([options]);
```
    
* @param *{object}* **options**  (optionnel) [Options de Smap](#options-smap)

    ```
    var smap = $('#map').smap({
        map: {
            center: [46.16101, -1.14994]
        }
    });
    ```

### Options Smap

| Option                           | Type     | Valeur par défaut | Description                                               |
|----------------------------------|----------|-------------------|-----------------------------------------------------------|
| map                              | object   | Options de Leaflet *  | Objet pour les options ci-dessous                     |
| &nbsp;&nbsp;&nbsp;&nbsp;center   | array    | undefined            | Tableau à 2 entrées [lat, lng]                         |
| &nbsp;&nbsp;&nbsp;&nbsp;zoom     | int      | 10                   | Zoom par défaut de la carte                            |
| &nbsp;&nbsp;&nbsp;&nbsp;minZoom  | int      | 4                    | Niveau de zoom minimum                                 |
| &nbsp;&nbsp;&nbsp;&nbsp;maxZoom  | int      | 18                   | Niveau de zoom maximum                                 |
| &nbsp;&nbsp;&nbsp;&nbsp;zoomPosition | string       | 'topright'   | Position y/x du contrôle du zoom dans la carte         |
| &nbsp;&nbsp;&nbsp;&nbsp;gestureHandling | boolean   | true         | Active la librairie GestureHandling                    |
| autoCenter                       | boolean  | true                 | Centre automatiquement la carte par rapport à la position des markers |
| tileLayer                        | object L.tileLayer | L.tileLayer | Fond de la carte **                   |
| enableClusters                   | boolean | true                  | Utilise la librairie markercluster pour regrouper les markers trop proches |

#### API Leaflet

(\*) Voir https://leafletjs.com/reference-1.5.0.html#map 

(**) Exemples de fonds de carte : https://leaflet-extras.github.io/leaflet-providers/preview/

### API Smap

#### leaflet()

Retourne l'objet L (Leaflet) représentant la carte.  Permet ensuite d'utiliser l'API de Leaflet.

* @return  *{L.map}* **map** 

```
var leafletMap = smap.leaflet();
```

#### setCenter()

Change le centre de la carte

* @param {array} **center** Tableau à 2 entrées [lat, lng]

```
smap.setCenter([46.16101, -1.14994]);
```

#### setZoom()

Change le zoom actuel de la carte. Doit être compris entre minZoom et maxZoom

* @param *{int}* **zoom** Zoom

```
smap.setZoom(14);
```

#### setMapOptions()

Modifie globalement certaines options de Leaflet. Voir [API Leaflet](#api-leaflet)

* @param  *{object}* **options** Objet contenant les options à modifier

```
smap.setMapOptions({
   zoomPosition: 'bottomleft',
   minZoom: 10
});
```

#### fitBounds()

Recentre la carte soit selon la position de toutes les markers, soit selon le centre de la carte. 

```
smap.fitBounds();
```

#### addMarkers()

Ajoute des markers sur la carte

* @param  *{array}* **markers** Tableau contenant les infos des markers. Voir [API Leaflet](#api-leaflet)
* @param  *{boolean}* **replace** Doit remplacer les markers existant ou être ajoutés à la suite


```
// Markers array
var markers = [
    {
        position: [46.16101, -1.14994],
        popup: '<h2>Bonjour</h2>'
    },
    {             
        position: [46.16101, -1.14994],
        popup: '<h2>Bonjour</h2>'
    }
];
// Add to map 
var map = $('#map').smap({
    map: {
        center: markers[0].position
    }
}).addMarkers(markers);
```

#### getMarkers()

Retourne la liste des markers

* @return  *{SmapMarkers[]}* Tableau d'objets [SmapMarkers](#options-SmapMarker) représentant l'ensemble des markers présents sur la carte.

```
var mapMarkers = map.getMarkers();
```

---


## Créer des markers : SmapMarker

Vous n'avez pas besoin d'initialiser vous-même la classe SmapMarker, Smap s'en charge via la méthode [Smap.addMarkers](#addmarkers)

### Options SmapMarker

| Option                           | Type     | Valeur par défaut | Description                                               |
|----------------------------------|----------|-------------------|-----------------------------------------------------------|
| position                         | array    | []                | Tableau à 2 entrées [lat, lng]                            |
| customIcon                       | boolean  | true              | Active la personnalisation HTML/CSS de l'icône du marker  |
| icon                             | object   | Voir ci-dessous   |                                                           |
| &nbsp;&nbsp;&nbsp;&nbsp;html     | string   | undefined         | HTML de l'icône du marker. Par exemple, le contenu d'un SVG  |
| &nbsp;&nbsp;&nbsp;&nbsp;data     | object   | {data: {id: undefined}} | Data attributes à appliquer sur le marker (data-xx) |
| &nbsp;&nbsp;&nbsp;&nbsp;iconSize | array    | [50, 50]          | Tableau à 2 entrées [width, height] pour désigner la taille de l'icône. |
| &nbsp;&nbsp;&nbsp;&nbsp;popupAnchor | array | [0, -20]          | Tableau à 2 entrées [x, y] représentant le décalage de la popup par rapport au marker |
| popup                            | string/jQuery object | undefined  | Contenu du la popup si besoin |
| showPopup                        | boolean  | false             | Affiche la popup du marker directement à sa création. Idéal dans le cas d'une carte avec un seul marker |
| centerOnFocus                    | boolean  | true              | Au focus/click sur le marker, la carte se centre sur ses coordonnées. A utiliser avec précaution si les popup ont beaucoup de contenu (leur hauteur ne sera plus prise en compte, et elles pourraient être coupées à l'affichage. |
| sourceContainer                  | jQuery object | undefined    | Référence à un élément HTML qui représente le marker et ses informations ailleurs dans la page, et permet des intéractions entre les deux. Au hover/focus sur le marker, une classe est ajouté à l'élément HTML désigné ici, et inversement. Voir [Exemples d'utilisation](#Exemples d'utilisation SmapMarker) |
| classes                          | object   | Voir ci-dessous   | Objet pour les options ci-dessous                         |
| &nbsp;&nbsp;&nbsp;&nbsp;prefix   | string   | 'marker'          | Préfix de classe                                          |
| &nbsp;&nbsp;&nbsp;&nbsp;marker   | string   | '{prefix}--default' | Variante du marker                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;popup    | string   | '{prefix}-popup'  | Classe représentant la popup associée au marker           |
| &nbsp;&nbsp;&nbsp;&nbsp;focused  | string   | 'is-focused'      | Classe au survol du marker (hover par exemple)            |
| &nbsp;&nbsp;&nbsp;&nbsp;active   | string   | 'is-active'       | Classe au click sur un marker, popup ouverte              |

### API SmapMarker

#### getPosition()

Retourne la position du marker sous forme de tableau [lat, lng]

* @return  *{array}* **position** 

#### getLatLng()

Retourne la position du marker sous forme d'un objet L.LatLng

* @return  *{L.LatLng}* **position** 

#### getContainer()

Retourne le markup HTML du marker

* @return  *{jQuery}* **marker** 

#### leaflet()

Retourne l'objet L (Marker) représentant le marker. Permet ensuite d'utiliser l'API de Leaflet.

* @return  *{L.marker}* **marker** 

#### map()

Retourne l'objet L (Leaflet) représentant la carte associée au marker. Permet ensuite d'utiliser l'API de Leaflet.

* @return  *{L.map}* **map** 


### Exemples d'utilisation SmapMarker

Ci-dessous un exemple (à retrouver dans la démo) simple d'utilisation du script, avec l'implémentation de l'option Smap.sourceContainer.

**[Démo disponible ici](demo/index.html)**

**HTML : Liste d'informations et carte**

```
<ul class="list-group" id="map-source">
    <li data-marker-id="1">
        <div>
            <h6>PHARMACIE ASSELIN SCANU</h6>
            <small class="lat">46.16101</small>
            <small class="lng">-1.14994</small>
        </div>
        <span>#1</span>
    </li>
    <li data-marker-id="2">
        <div>
            <h6>PHARMACIE DU GABUT</h6>
            <small class="lat">46.1555</small>
            <small class="lng">-1.14981</small>
        </div>
        <span>#2</span>
    </li>
</ul>
<div id="map-1" class="map map--primary"></div>
```

**JS : Récupération des infos de la liste et affichage sur la carte**

```
var markers = [];
var markerSVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 54 63.7"><path d="M52 26.4c0 5.2-2.1 10.5-6.5 16.2-3.9 5-9.2 9.8-13.6 14-1.7 1.5-3.3 3-4.7 4.4-1.5-1.4-3.1-2.9-4.7-4.4-4.6-4.2-9.7-9-13.6-14C4.1 36.9 2 31.6 2 26.4c0-3.3.7-6.5 1.9-9.5C5.2 14 7 11.4 9.2 9.1c2.4-2.2 5-4 7.9-5.2C20.2 2.7 23.6 2 26.9 2s6.7.7 9.7 1.9c2.9 1.2 5.7 3 7.9 5.3 2.4 2.2 4 4.9 5.4 7.8 1.4 2.8 2.1 6.1 2.1 9.4z" stroke="#fff" stroke-width="4"/></svg>';

/* Markers list
   ========================================================================== */
$('#map-source').children().each(function (i, item) {
    item = $(item);

    markers.push({
        position: [
            item.find('.lat').text(),
            item.find('.lng').text()
        ],
        icon: {
            html: markerSVG,
            iconSize: [40, 47],
            data: {
                id: item.attr('data-marker-id')
            }
        },
        popup: item.html(),
        sourceContainer: item
    });
});

/* Map declaration
   ========================================================================== */
var map = $('#map-1').smap({
    map: {
        center: markers[0].position
    }
}).addMarkers(markers);
```
