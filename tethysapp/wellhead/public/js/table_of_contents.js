/*****************************************************************************
 * FILE:    table_of_contents.js
 * DATE:    12/16/2016
 * AUTHOR:  Shawn Crawley and Jacob Fullerton
 * COPYRIGHT: (c) 2016 Brigham Young University
 * LICENSE: BSD 2-Clause
 * CONTRIBUTIONS:   http://openlayers.org/
 * OTHER SOURCES: Source code for the original Table of Contents tool is
 *      located at https://github.com/hydroshare/tethysapp-hydroshare_gis,
 *      extracted from the main.js page in tethysapp/hydroshare_gis/public/js
 *
 *****************************************************************************/

/*****************************************************************************
 *                           Gizmo Functions
 *****************************************************************************/
var readInitialLayers;
var createLayerListItem;
var addListenersToListItem;
var editLayerDisplayName;
var closeLyrEdtInpt;
var add_layer;
var delete_layer;

var initializeLayersContextMenus;
var initializeJqueryVariables;
var addListenersToInitialLayers;
var addInitialEventListeners;
var initialize_listeners;

var onClickRenameLayer;
var onClickEditLayer;
var onClickSaveEdits;
var onClickCancelEdits;
var onClickShowAttrTable;

/*****************************************************************************
 *                             Variables
 *****************************************************************************/
 var $tocLayersList;
 var projectInfo;
 var contextMenuDict;
/*****************************************************************************
 *                            Main Script
 *****************************************************************************/

//  Initialize JQUERY Variables
initializeJqueryVariables = function(){
    $tocLayersList = $('#toc-layers-list');
}

//  Read in the layers from the map_view gizmo
readInitialLayers = function (){
    var map;
    var layers;
    var i;

    //  Get the map object to read in initial layers on map
    map = TETHYS_MAP_VIEW.getMap();
    layers = map.getLayers();

    //  Make Drawing Layer not editable on initialization as edit mode will appropriately handle the editable state
    for (i=0; i < map.getLayers().getArray().length;i++){
        if (map.getLayers().item(i).tethys_legend_title === "Drawing Layer"){
            map.getLayers().item(i).tethys_editable = false;
        }
    };

    //  Start 'i' counter and count backwards in reverse order to obtain the correct map index for the layer
    i = layers.array_.length - 1;

    //  Read through layers and sift out only the layers that are wanted for the Table of Contents
    for (layer in layers.array_.reverse()){
        if (layers.item(layer).tethys_data.tethys_toc === true){
            createLayerListItem(layers.item(layer),i);
        }
        i -= 1
    }
    //  Put layers back in original order and add listeners
    layers.array_.reverse();
    addMenus_and_ListenersToInitialLayers();
}

//  Add new layer dynamically
add_layer = function(mapIndex,type){
    var map;
    var layer;

    if (!type === undefined){
        type = 'GeographicFeatureResource';
    }

    map = TETHYS_MAP_VIEW.getMap();
    layer = map.getLayers().item(mapIndex);

    createLayerListItem(layer,mapIndex,'prepend');

    initializeJqueryVariables();
    var $list = $tocLayersList;
    var $listItem;
    $listItem = $tocLayersList.find('li:first-child');
    addListenersToListItem($listItem);
    addContextMenuToListItem($listItem,type);
    $('.layer-name').parent().off('click');
    initialize_listeners();
};

delete_layer = function(mapIndex){
    var map;
    var layer;
    var layerName;
    initializeJqueryVariables();
    var $list = $tocLayersList;

    map = TETHYS_MAP_VIEW.getMap();
    layer = map.getLayers().item(mapIndex);

    //  Get the layerName to delete the correct list item in the TOC
    layerName = layer.tethys_legend_title;

    try{
        $list.find('li').each(function(index){
            if ($(this).find('.layer-name').text()===layerName){
                this.remove();
            }
        });
    }
    catch(err){console.log(err);}
};

//  Add listeners to the initial table of contents as read in from the map view gizmo layers
addMenus_and_ListenersToInitialLayers = function()
{
    // Reinitialize the variables to make sure the list is up-to-date
    initializeJqueryVariables();
    var $list = $tocLayersList;
    var $listItem;
    for (i=0; i < $list.children().length; i++){
        $listItem = $tocLayersList.find('li:nth-child(' + (i+1) + ')');
        addListenersToListItem($listItem);
        if(projectInfo['map']['layers'][$listItem.find('.layer-name').text().trim()]['resType']===undefined){
            addContextMenuToListItem($listItem,'View');
        }
        else{
            addContextMenuToListItem($listItem,String(projectInfo['map']['layers'][$listItem.find('.layer-name').text().trim()]['resType']));
        }
        // if ($listItem.find('.layer-name').text().trim() === "Basemap"){
        //     addContextMenuToListItem($listItem,'View');
        // }
        // else{
        //     addContextMenuToListItem($listItem,'GeographicFeatureResource');
        // };
    };
};

projectInfo = {
    'editMode': false,
    'map': {
        'baseMap': 'None',
        'layers': {},
    }
};

createLayerListItem = function (layer,mapIndex,position) {
        var $newLayerListItem;
        var zIndex;
        var chkbxHtml;
        var featureCount;

        //  Get the feature count for updating the layers
        try{featureCount = layer.getSource().getFeatures().length;}
        catch(err){featureCount = 0;}

        var listHtmlString =
            '<li class="ui-state-default" ' +
            'data-editable="' + layer.editable + '" ' +
            'data-geom-type="' + layer.geometry_attribute + '"> ' +
            '<input class="chkbx-layer" type="checkbox">' +
            '<span class="layer-name">' + layer.tethys_legend_title + '</span>' +
            '<input type="text" class="edit-layer-name hidden" value="' + layer.tethys_legend_title + '">' +
            '<span class="feature-count">(' + featureCount + ') </span>' +
            '<div class="hmbrgr-div"><img src="/static/wellhead/images/hamburger-menu.png"></div>' +
            '</li>';

        if (position === 'prepend') {
            $tocLayersList.prepend(listHtmlString);
            $newLayerListItem = $tocLayersList.find('li:first-child');
        } else {
            $tocLayersList.append(listHtmlString);
            $newLayerListItem = $tocLayersList.find(':last-child');
        }

        if (layer.getProperties().visible === true){
            $newLayerListItem.find('.chkbx-layer').prop('checked', layer.getProperties().visible);
        }

        // Get the count and assign the initial list order value to the new layer in the TOC
        initializeJqueryVariables();
        zIndex = $tocLayersList.children().length;

        projectInfo.map.layers[layer.tethys_legend_title] = {
            displayName: layer.tethys_legend_title,
            TethysMapIndex: Number(mapIndex),
            layerListIndex: zIndex,
            extents: layer.tethys_legend_extent,
            editable: layer.tethys_editable,
            geomType: layer.getProperties().geometry_attribute,
            color: layer.color,
            resType: layer.resType
        };
};

addContextMenuToListItem = function ($listItem, resType) {
    var contextMenuId;

    $listItem.find('.hmbrgr-div img')
        .contextMenu('menu', contextMenuDict[resType], {
            'triggerOn': 'click',
            'displayAround': 'trigger',
            'mouseClick': 'left',
            'position': 'right',
            'onOpen': function (e) {
                $('.hmbrgr-div').removeClass('hmbrgr-open');
                $(e.trigger.context).parent().addClass('hmbrgr-open');
            },
            'onClose': function (e) {
                $(e.trigger.context).parent().removeClass('hmbrgr-open');
            }
        });
    contextMenuId = $('.iw-contextMenu:last-child').attr('id');
    $listItem.data('context-menu', contextMenuId);
};

addListenersToListItem = function ($listItem) {/*, layerIndex) {*/
        var $layerNameInput;
        $listItem.find('.layer-name').on('dblclick', function () {
            var $layerNameSpan = $(this);
            $layerNameSpan.addClass('hidden');
            var $layerNameInput = $listItem.find('input[type=text]');
            $layerNameInput
                .val($layerNameSpan.text())
                .removeClass('hidden')
                .select()
                .on('keyup', function (e) {
                    editLayerDisplayName(e, $(this), $layerNameSpan);/*, layerIndex);*/
                })
                .on('click', function (e) {
                    e.stopPropagation();
                });

            $(document).on('click.edtLyrNm', function () {
                closeLyrEdtInpt($layerNameSpan, $layerNameInput);
            });
        });

        $listItem.find('.hmbrgr-div img').on('click', function (e) {
            var clickedObj = $(e.currentTarget);
            var contextmenuId;
            var menuObj;
            var newStyle;
            contextmenuId = $listItem.data('context-menu');
            menuObj = $('#' + contextmenuId);
            if (menuObj.attr('style') !== undefined && menuObj.attr('style').indexOf('display: none;') === -1) {
                window.setTimeout(function () {
                    newStyle = menuObj.attr('style').replace('inline-block', 'none');
                    menuObj.attr('style', newStyle);
                    clickedObj.parent().removeClass('hmbrgr-open');
                }, 50);
            }
        });
    };

editLayerDisplayName = function (e, $layerNameInput, $layerNameSpan) {
    var newDisplayName;
    var map = TETHYS_MAP_VIEW.getMap();
    var nameB4Change = $layerNameSpan.text();
    if (e.which === 13) {  // Enter key
        newDisplayName = $layerNameInput.val();
        if (nameB4Change !== newDisplayName) {
            // Make sure the user does not rename a layer the same name as an existing layer
            if (projectInfo.map.layers[newDisplayName] !== undefined) {
                error_message('A layer already exists with that name. Please choose a different name');
            } else {
                $layerNameSpan.text(newDisplayName);
                projectInfo.map.layers[nameB4Change].displayName = newDisplayName;
                map.getLayers().item(projectInfo.map.layers[nameB4Change].TethysMapIndex).tethys_legend_title = newDisplayName;
                projectInfo.map.layers[newDisplayName] = projectInfo.map.layers[nameB4Change];
                delete projectInfo.map.layers[nameB4Change];
                TETHYS_MAP_VIEW.updateLegend();
//                $btnSaveProject.prop('disabled', false);
                closeLyrEdtInpt($layerNameSpan, $layerNameInput);
            }
        } else {
            closeLyrEdtInpt($layerNameSpan, $layerNameInput);
        }
    } else if (e.which === 27) {  // Esc key
        closeLyrEdtInpt($layerNameSpan, $layerNameInput);
    }
};

initializeLayersContextMenus = function () {
    layersContextMenuBase = [
        {
            name: 'Isolate',
            title: 'Isolate',
            fun: function (e) {
                onClickisolateLayer(e);
            }
        },
        {
            name: 'Rename',
            title: 'Rename',
            fun: function (e) {
                onClickRenameLayer(e);
            }
        }
//        {
//            name: 'Delete',
//            title: 'Delete',
//            fun: function (e) {
////                onClickDeleteLayer(e);
//                console.log("Deleting the layer sir...")
//            }
//        }
    ];

    layersContextMenuGeospatialBase = layersContextMenuBase.slice();
    layersContextMenuGeospatialBase.unshift({
        name: 'Zoom to',
        title: 'Zoom to',
        fun: function (e) {
//            onClickZoomToLayer(e);
            console.log("Zoomin' to the layer captain...I'm giving it all she's got captain!")
        }
    });

    layersContextMenuRaster = layersContextMenuGeospatialBase.slice();
//     layersContextMenuRaster.unshift({
//         name: 'Modify symbology',
//         title: 'Modify symbology',
//         fun: function (e) {
// //            onClickModifySymbology(e);
//             console.log("Modifying the symbology!...oh wait...")
//         }
//     }),
//    {
//        name: 'View legend',
//        title: 'View legend',
//        fun: function (e) {
//            onClickViewLegend(e);
//        }
//    },
//        {
//        name: 'Get pixel value on click',
//        title: 'Get pixel value on click',
//        fun: function (e) {
//            onClickViewGetPixelVal(e);
//        }
//    });

    layersContextMenuVector = layersContextMenuRaster.slice();
    layersContextMenuVector.unshift(
//    {
//        name: 'Attribute Table',
//        title: 'Attribute Table',
//        fun: function (e) {
//            onClickShowAttrTable(e);
//        }
//    },
    {
        name: 'Edit Features',
        title: 'Edit Features',
        fun: function (e) {
            onClickEditLayer(e);
        }
    }
//    {
//        name: 'Save Edits',
//        title: 'Save Edits',
//        fun: function (e) {
//            onClickSaveEdits(e);
//        }
//    }
    );


    contextMenuDict = {
//        'GenericResource': layersContextMenuViewFile,
        'GeographicFeatureResource': layersContextMenuVector,
        'Base':layersContextMenuBase,
        'View':layersContextMenuGeospatialBase
//        'TimeSeriesResource': layersContextMenuTimeSeries,
//        'RefTimeSeriesResource': layersContextMenuTimeSeries,
//        'RasterResource': layersContextMenuRaster
    };
};

drawLayersInListOrder = function () {
    var i;
    var index;
    var $layer;
    var displayName;
    var numLayers;
    var zIndex;
    var map;

    //  Define map as TETHYS_MAP
    map = TETHYS_MAP_VIEW.getMap();

    numLayers = $tocLayersList.children().length;
    for (i = 1; i <= numLayers; i += 1) {
        $layer = $tocLayersList.find('li:nth-child(' + (i) + ')');
        displayName = $layer.find('.layer-name').text().trim();
        index = Number(projectInfo.map.layers[$layer.find('.layer-name').text().trim()].TethysMapIndex);
        if (index < 1000) {
            zIndex = numLayers - i;
            map.getLayers().item(index).setZIndex(zIndex);
        }
        projectInfo.map.layers[displayName].layerListIndex = i;
//        $btnSaveProject.prop('disabled', false);
    }
};

addInitialEventListeners = function(){
    var map;

    //  Initialize the map object
    map = TETHYS_MAP_VIEW.getMap();

    //  Add a listener for all checkbox layers
    $(document).on('change', '.chkbx-layer', function () {
        var layerName = $(this).next().text().trim();
        var index = projectInfo.map.layers[layerName].TethysMapIndex;

        map.getLayers().item(index).setVisible($(this).is(':checked'));
    });
};

/*****************************************************************************
 *                           Context Menu Functions
 *****************************************************************************/

onClickRenameLayer = function (e) {
    var clickedElement = e.trigger.context;
    var $lyrListItem = $(clickedElement).parent().parent();
    var $layerNameInput = $lyrListItem.find('input[type=text]');
    var $LayerNameSpan = $lyrListItem.find('.layer-name');

    $LayerNameSpan.addClass('hidden');
    $lyrListItem.find('input')
        .removeClass('hidden')
        .select()
        .on('keyup', function (e) {
            editLayerDisplayName(e, $(this), $LayerNameSpan);/*, layerIndex);*/
        })
        .on('click', function (e) {
            e.stopPropagation();
        });

    $(document).on('click.edtLyrNm', function () {
        closeLyrEdtInpt($LayerNameSpan, $layerNameInput);
    });
};

closeLyrEdtInpt = function ($layerNameSpan, $layerNameInput) {
    $layerNameInput
        .addClass('hidden')
        .off('keyup')
        .off('click');
    $layerNameSpan.removeClass('hidden');
    $(document).off('click.edtLyrNm');
};

onClickisolateLayer = function(e) {
    var clickedElement = e.trigger.context;
    var $lyrListItem = $(clickedElement).parent().parent();
    var layerName = $lyrListItem.find('.layer-name').text().trim();
    var i;
    var numLayers;
    var map;
    var mapIndex;

    //  Use the projectInfo for finding the mapIndex and initialize map
    mapIndex = projectInfo.map.layers[layerName].TethysMapIndex;
    map = TETHYS_MAP_VIEW.getMap();

    //  Find the number of layers in the map object
    numLayers = map.getLayers().getArray().length;

    //  Set layer visibility state, leaving only the 'clicked' layer as visible
    for (i=0; i < numLayers; i++){
        if (i != mapIndex){
            map.getLayers().item(i).setVisible(false);
        }
        else{
            map.getLayers().item(i).setVisible(true);
        }
    }
};
//*TODO*Need to select drawing layer regardless of index, right now it's hard coded to be layer 1 = Drawing Layer
onClickEditLayer = function(e){
    //  Initialize the layer item variables, use a try/catch to make a button available as an option for layer editing.
    try{
        if (e){
            var clickedElement = e.trigger.context;
            var $lyrListItem = $(clickedElement).parent().parent();
        }
        else{
            var $lyrListItem = $('.ui-selected');
        }
    }
    catch(err){console.log(err);};
    if ($lyrListItem[0] === undefined){
        error_message("You have not selected a layer, please select one for editing");
        return;
    }

    var layerName = $lyrListItem.find('.layer-name').text().trim();
    var numLayers;
    var map;
    var mapIndex;
    var layer;
    var features;
    var clone;
    var copyFeatures=[];
    var featureProps=[];
    var copied;
    var newStyle;
    var jsonFeatures;
    var jsonStyle;
    var color;

    //  Make sure that the user cannot change the selected layer or pull up another attribute table while in
    //  edit mode.
    $('.layer-name').parent().off('click');

    //  Use the projectInfo for finding the mapIndex and initialize map
    mapIndex = projectInfo.map.layers[layerName].TethysMapIndex;
    map = TETHYS_MAP_VIEW.getMap();
    layer = map.getLayers().item(mapIndex);

    //  Make sure that the layer being edited is actually editable
    if (projectInfo['editMode'] === true){
        error_message("This layer is locked and cannot be edited," +
            " make sure that you aren't already editing another layer." +
            " Otherwise, contact the administrator.");
        return;
    }

    //  Find the number of layers in the map object
    numLayers = map.getLayers().getArray().length;

    //  Make all layers except for Drawing Layer not-editable
    for (i=0; i < numLayers; i++){
        if (map.getLayers().item(i).tethys_legend_title != "Drawing Layer"){
            map.getLayers().item(i).tethys_editable = false;
        }
        else{
            map.getLayers().item(i).tethys_editable = true;
            map.getLayers().item(i).setVisible(true);
        }
    }

    try{
        features = layer.getSource().getFeatures();
        features.sort(function(a,b){
            return a.getProperties()['ID']-b.getProperties()['ID'];
        });
        for (feature in features){
            copyFeatures.push({
                'type': 'Feature',
                'geometry':{
                    'type': features[feature].getGeometry().getType(),
                    'coordinates': features[feature].getGeometry().getCoordinates(),
                }
            });
            //  Gather the properties for each element
            featureProps[feature] = [];
            for (property in features[feature].getProperties()){
                if (String(property) === 'geometry'){}
                else{
                    featureProps[feature].push([String(property),features[feature].getProperties()[property]])
                }
            };
            //  This copies the features to the drawinglayer
            map.getLayers().item(1).getSource().addFeature(features[feature].clone())
        };

        //  Add Properties to feature list
        for (feature in copyFeatures){
            copyFeatures[feature]['properties']={};
            for (prop in featureProps[feature]){
                copyFeatures[feature]['properties'][featureProps[feature][prop][0]] = featureProps[feature][prop][1];
            }
        };
        copied = {
            'type': 'FeatureCollection',
            'crs': {
                'type': 'name',
                'properties': {
                    'name':'EPSG:4326'
                }
            },
            'features': copyFeatures
        };
//        newStyle = layer.getStyle();
        //  Read in the layer color to be stored and to apply new color to edit layer
        color = projectInfo.map.layers[layerName].color;

        //  Read features and style to string for sessionStorage and then store features and style
        jsonFeatures = JSON.stringify(copyFeatures);
        jsonStyle = JSON.stringify(color);

        sessionStorage.setItem(String(layerName + "_Features"),jsonFeatures);
        sessionStorage.setItem(String(layerName + "_Style"),jsonStyle);

        //  Set drawing layer style to match the layer to be edited
        newStyle = map.getLayers().item(1).getStyle();
        newStyle.fill_.color_ = color;
        newStyle.image_=new ol.style.Circle({
            radius: 4,
            fill: new ol.style.Fill({
              color: color
            })
        });
        newStyle.stroke_.color_ = color;

        map.getLayers().item(1).setStyle(newStyle);

    }
    catch(err){
        console.log(err);
        color = map.getLayers().item(mapIndex).getStyle().fill_.color_;

        //  Read style to string for sessionStorage and store style
        jsonStyle = JSON.stringify(color);
        sessionStorage.setItem(String(layerName + "_Style"),jsonStyle);

        //  Set layer style to match
        newStyle = map.getLayers().item(mapIndex).getStyle();
        newStyle.fill_.color_ = color;
        newStyle.image_=new ol.style.Circle({
            radius: 4,
            fill: new ol.style.Fill({
              color: color
            })
        });
        newStyle.stroke_.color_ = color;

        map.getLayers().item(1).setStyle(newStyle);
    }

    layer.getSource().clear();
    map.getLayers().item(1).tag = layerName;
    enter_edit_mode(projectInfo.map.layers[layerName].geomType,'#attr-table input');
    $('#editSave').removeClass("hidden");
    $('#editCancel').removeClass("hidden");

    //  Verify that the layer actually has features before trying to build the table
    if (copyFeatures.length === 0){
        $('#attr-table tbody').empty()
        $('#attr-table tbody').append("<tr><td align='center'>No Features on Selected Layer</td></tr>")
        return;
    }
    else{build_table(layerName,copyFeatures,true);}
};

onClickSaveEdits = function(){
    var layerName;
    var numLayers;
    var map;
    var mapIndex;
    var layer;
    var features;
    var newFeatures;
    var clone;
    var copyFeatures=[];
    var featureProps=[];
    var copied;
    var format;
    var color;
    var newStyle;
    var newSource;
    var jsonFeatures;
    var jsonStyle;

    //  Initialize map object
    map = TETHYS_MAP_VIEW.getMap();

    //  Set the layer to the edit layer
    map = TETHYS_MAP_VIEW.getMap();
    for (i=0;i < map.getLayers().getArray().length;i++){
        if (map.getLayers().item(i).tethys_legend_title === "Drawing Layer"){
            layer = map.getLayers().item(i);
        }
    };

    //  Make sure that edit mode is turned on
    if (projectInfo['editMode'] === false){
        error_message("You are not in edit mode.");
        return;
    }

    layerName = map.getLayers().item(1).tag;

    //  Use the projectInfo for finding the mapIndex
    mapIndex = projectInfo.map.layers[layerName].TethysMapIndex;


    //  Return all layers to their original editable state based on ProjectInfo
    for (mapObj in projectInfo.map.layers){
        if (projectInfo.map.layers[mapObj].editable === true){
            map.getLayers().item(projectInfo.map.layers[mapObj].TethysMapIndex).tethys_editable = true;
        }
        else{
            map.getLayers().item(projectInfo.map.layers[mapObj].TethysMapIndex).tethys_editable = false;
        }
    };

    try{
        features = layer.getSource().getFeatures();
        features.sort(function(a,b){
            return a.getProperties()['ID']-b.getProperties()['ID'];
        });
        for (feature in features){
            copyFeatures.push({
                'type': 'Feature',
                'geometry':{
                    'type': features[feature].getGeometry().getType(),
                    'coordinates': features[feature].getGeometry().getCoordinates(),
                },

            });
        //  Gather the properties for each element
        featureProps[feature] = [];
        for (property in features[feature].getProperties()){
            if (String(property) === 'geometry'){}
            else{
                featureProps[feature].push([String(property),features[feature].getProperties()[property]])
//                    console.log(property);
//                    console.log(layer.getSource().getFeatures()[feature].getProperties()[property]);
            }
        };
        };
        //  Add Properties to feature list
        for (feature in copyFeatures){
            copyFeatures[feature]['properties']={};
            for (prop in featureProps[feature]){
                copyFeatures[feature]['properties'][featureProps[feature][prop][0]] = featureProps[feature][prop][1];
            };
        };
//        console.log(copyFeatures);
        copied = {
            'type': 'FeatureCollection',
            'crs': {
                'type': 'name',
                'properties': {
                    'name':'EPSG:4326'
                }
            },
            'features': copyFeatures
        };

        //  Establish the format as GeoJSON
        format = new ol.format.GeoJSON();

        //  Create new layer source for the layer receiving the features
        newSource = new ol.source.Vector({
            features: format.readFeatures(copied,
            {featureProjection:"EPSG:4326"})
        });

//        //  Add Properties to feature list because openlayers doesn't preserve custom property tags
//        for (feature in newSource.getFeatures()){
//            for (prop in featureProps[feature]){
//                newSource.getFeatures()[feature].set(String(featureProps[feature][prop][0]),featureProps[feature][prop][1])
//            };
//        };

        //  Find the layer color
        color = map.getLayers().item(mapIndex).getStyle().fill_.color_;

        //  Read features and color to string for sessionStorage and then store features and style
        jsonFeatures = JSON.stringify(copyFeatures);
        jsonStyle = JSON.stringify(color);

        sessionStorage.setItem(String(layerName + "_Features"),jsonFeatures);
        sessionStorage.setItem(String(layerName + "_Style"),jsonStyle);

        //  Set layer style to match
        newStyle = map.getLayers().item(mapIndex).getStyle();
        newStyle.fill_.color_ = color;
        newStyle.image_=new ol.style.Circle({
            radius: 4,
            fill: new ol.style.Fill({
              color: color
            })
        });
        newStyle.stroke_.color_ = color;

        map.getLayers().item(mapIndex).setStyle(newStyle);
        //  Set the save layer to the new source
        map.getLayers().item(mapIndex).setSource(newSource);

    }
    catch(err){
        console.log(err);
        color = map.getLayers().item(mapIndex).getStyle().fill_.color_;

        //  Read style to string for sessionStorage and store style
        jsonStyle = JSON.stringify(color);
        sessionStorage.setItem(String(layerName + "_Style"),jsonStyle);

        //  Set layer style to match
        newStyle = map.getLayers().item(mapIndex).getStyle();
        newStyle.fill_.color_ = color;
        newStyle.image_=new ol.style.Circle({
            radius: 4,
            fill: new ol.style.Fill({
              color: color
            })
        });
        newStyle.stroke_.color_ = color;

        map.getLayers().item(mapIndex).setStyle(newStyle);
    }

    layer.getSource().clear();
    delete map.getLayers().item(1).tag;
    layer.tethys_editable = false;
    layer.setVisible(false);

    exit_edit_mode('#attr-table input');
    $('#editSave').addClass("hidden");
    $('#editCancel').addClass("hidden");

    onClickShowAttrTable();
    //  Re-enable the layer select functionality in addition to the display of an attribute table
    initialize_listeners();
};

onClickCancelEdits = function(){
    var layerName;
    var map;
    var mapIndex;
    var layer;
    var format;
    var jsonStyle;
    var jsonFeatures;
    var savedStyle;
    var oldFeatures;
    var oldStyle;
    var oldSource;

    //  Initialize map object
    map = TETHYS_MAP_VIEW.getMap();

    //  Set the layer to the edit layer
    map = TETHYS_MAP_VIEW.getMap();
    for (i=0;i < map.getLayers().getArray().length;i++){
        if (map.getLayers().item(i).tethys_legend_title === "Drawing Layer"){
            layer = map.getLayers().item(i);
        }
    };

    //  Make sure that edit mode is turned on
    if (projectInfo['editMode'] === false){
        error_message("You are not in edit mode.");
        return;
    }

    layerName = map.getLayers().item(1).tag;

    //  Use the projectInfo for finding the mapIndex
    mapIndex = projectInfo.map.layers[layerName].TethysMapIndex;


    //  Return all layers to their original editable state based on ProjectInfo
    for (mapObj in projectInfo.map.layers){
        if (projectInfo.map.layers[mapObj].editable === true){
            map.getLayers().item(projectInfo.map.layers[mapObj].TethysMapIndex).tethys_editable = true;
        }
        else{
            map.getLayers().item(projectInfo.map.layers[mapObj].TethysMapIndex).tethys_editable = false;
        }
    };

    //  Retrieve info from the session storage to restore the layer state before any edits were made
    try{
        color = JSON.parse(sessionStorage[String(layerName + "_Style")]);
        //  Set drawing layer style to match the layer to be edited
        newStyle = map.getLayers().item(mapIndex).getStyle();
        newStyle.fill_.color_ = color;
        newStyle.image_=new ol.style.Circle({
            radius: 4,
            fill: new ol.style.Fill({
              color: color
            })
        });
        newStyle.stroke_.color_ = color;

        map.getLayers().item(mapIndex).setStyle(newStyle);

        //  Because we can't store the source directly, the features need to be read back into a new source.
        //  After reading the features string and parsing it back into JSON, the features are read into a new source.
        jsonFeatures = sessionStorage[String(layerName + "_Features")];
        oldFeatures = JSON.parse(jsonFeatures);

        oldCollection = {
            'type': 'FeatureCollection',
            'crs': {
                'type': 'name',
                'properties': {
                    'name':'EPSG:4326'
                }
            },
            'features': oldFeatures
        };

        //  Establish the format as GeoJSON
        format = new ol.format.GeoJSON();

        oldSource = new ol.source.Vector({
            features: format.readFeatures(oldCollection,
            {featureProjection:"EPSG:4326"})
        });

        //  Set drawing layer style to match the layer to be edited
//        map.getLayers().item(mapIndex).setStyle(oldStyle);

        //  Set the save layer to the new source
        map.getLayers().item(mapIndex).setSource(oldSource);

    }
    catch(err){
        console.log(err);
    }

    layer.getSource().clear();
    delete layer.tag;
    layer.tethys_editable = false;
    layer.setVisible(false);

    exit_edit_mode('#attr-table input');
    $('#editSave').addClass("hidden");
    $('#editCancel').addClass("hidden");

    //  Make sure to designate that the attributes table should not be read in for saving
    $('#attr-table').removeClass('edit');
    onClickShowAttrTable();
    //  Re-enable the layer select functionality
    initialize_listeners();
};

onClickShowAttrTable = function(e){
    //  Initialize the layer item variables, use a try/catch to make a button available as an option for layer editing.
    try{
        if (e){
            var clickedElement = e.trigger.context;
            var $lyrListItem = $(clickedElement).parent().parent();
        }
        else{
            var $lyrListItem = $('.ui-selected');
        }
    }
    catch(err){console.log(err);};
    if ($lyrListItem[0] === undefined){
        error_message("No layer selected");
        return;
    }
    var layerName = $lyrListItem.find('.layer-name').text().trim();
    var numLayers;
    var map;
    var mapIndex;
    var layer;
    var features;
    var copyFeatures=[];
    var featureProps=[];

    //  Use the projectInfo for finding the mapIndex and initialize map
    mapIndex = projectInfo.map.layers[layerName].TethysMapIndex;
    map = TETHYS_MAP_VIEW.getMap();
    layer = map.getLayers().item(mapIndex);

    try{
        features = layer.getSource().getFeatures();
        features.sort(function(a,b){
            return a.getProperties()['ID']-b.getProperties()['ID'];
        });
        for (feature in features){
            copyFeatures.push({
                'type': 'Feature',
                'geometry':{
                    'type': features[feature].getGeometry().getType(),
                    'coordinates': features[feature].getGeometry().getCoordinates(),
                }
            });
            //  Gather the properties for each element
            featureProps[feature] = [];
            for (property in features[feature].getProperties()){
                if (String(property) === 'geometry'){}
                else{
                    featureProps[feature].push([String(property),features[feature].getProperties()[property]])
//                    console.log(property);
                }
            };
        };
        //  Add Properties to feature list
        for (feature in copyFeatures){
            copyFeatures[feature]['properties']={};
            for (prop in featureProps[feature]){
                copyFeatures[feature]['properties'][featureProps[feature][prop][0]] = featureProps[feature][prop][1];
            };
        };
    }
    catch(err){
//        console.log(err);
    }
    if (copyFeatures.length === 0){
        $('#attr-table tbody').empty()
        $('#attr-table tbody').append("<tr><td align='center'>No Features on Selected Layer</td></tr>")
        $($lyrListItem).find('.feature-count').html('(0)')
        return
    }

    build_table(layerName,copyFeatures);
};

/*****************************************************************************
 *                           Utility Functions
 *****************************************************************************/

enter_edit_mode = function(layerType,attrTableId){
    //  Change projectInfo to reflect that the edit mode is active
    projectInfo['editMode'] = true;
    //  Show the Draw/Edit tools in the Map View Gizmo
    //  If the layer in question is a point layer, only turn on pertinent tools
    if (layerType === "point"){
        try{
            $('#tethys_delete').removeClass('hidden')}
        catch(err){}
        try{
            $('#tethys_move').removeClass('hidden')}
        catch(err){}
        try{
            $('#draw_Point').removeClass('hidden')}
        catch(err){}
    }
    else if (layerType === "line"){
        try{
            $('#tethys_modify').removeClass('hidden')}
        catch(err){}
        try{
            $('#tethys_delete').removeClass('hidden')}
        catch(err){}
        try{
            $('#tethys_move').removeClass('hidden')}
        catch(err){}
        try{
            $('#draw_LineString').removeClass('hidden')}
        catch(err){}
    }
    else if (layerType === "polygon"){
        try{
            $('#tethys_modify').removeClass('hidden')}
        catch(err){}
        try{
            $('#tethys_delete').removeClass('hidden')}
        catch(err){}
        try{
            $('#tethys_move').removeClass('hidden')}
        catch(err){}
        try{
            $('#draw_Box').removeClass('hidden')}
        catch(err){}
        try{
            $('#draw_Polygon').removeClass('hidden')}
        catch(err){}
    }
        //  If there is not a definition of the object type in the layer, turn them all on
    else {
        try{
            $('#tethys_modify').removeClass('hidden')}
        catch(err){}
        try{
            $('#tethys_delete').removeClass('hidden')}
        catch(err){}
        try{
            $('#tethys_move').removeClass('hidden')}
        catch(err){}
        try{
            $('#draw_Point').removeClass('hidden')}
        catch(err){}
        try{
            $('#draw_Box').removeClass('hidden')}
        catch(err){}
        try{
            $('#draw_Polygon').removeClass('hidden')}
        catch(err){}
        try{
            $('#draw_LineString').removeClass('hidden')}
        catch(err){}
    }
    $(attrTableId).prop("disabled",false)
};

exit_edit_mode = function(attrTableId){
    //  Change projectInfo to reflect that the edit mode is inactive
    projectInfo['editMode'] = false;
    //  Hide all of the Draw/Edit tools in the Map View Gizmo
    try{
        $('#tethys_modify').addClass('hidden')}
    catch(err){}
    try{
        $('#tethys_delete').addClass('hidden')}
    catch(err){}
    try{
        $('#tethys_move').addClass('hidden')}
    catch(err){}
    try{
        $('#draw_Point').addClass('hidden')}
    catch(err){}
    try{
        $('#draw_Box').addClass('hidden')}
    catch(err){}
    try{
        $('#draw_Polygon').addClass('hidden')}
    catch(err){}
    try{
        $('#draw_LineString').addClass('hidden')}
    catch(err){}
    try{
        $('#tethys_pan').find('div:first-child').click()}
    catch(err){}
    $(attrTableId).prop("disabled",true)
};

initialize_listeners = function(){
    //  Make layers highlight when clicked on
    $('.layer-name').parent().on('click',function(){
        $('.layer-name').parent().removeClass('ui-selected');
        $(this).addClass('ui-selected').trigger('select_change');
        onClickShowAttrTable();
    });
};

/*****************************************************************************
 *                           To be executed on load
 *****************************************************************************/

$(document).ready(function(){
    if (typeof TETHYS_MAP_VIEW !== 'undefined') {
        initializeJqueryVariables();
        initializeLayersContextMenus();
        readInitialLayers();
        addInitialEventListeners();
        initialize_listeners();
        exit_edit_mode('#attr-table input');

        $tocLayersList.sortable({
        placeholder: "ui-state-highlight",
        stop: drawLayersInListOrder
        });
    }
});

/*****************************************************************************
 *                              Public
 *****************************************************************************/

var TETHYS_TOC;

TETHYS_TOC =    {   projectInfo: projectInfo,
                    enter_edit_mode: enter_edit_mode,
                    exit_edit_mode: exit_edit_mode,
                    onClickEditLayer: onClickEditLayer,
                    onClickSaveEdits: onClickSaveEdits,
                    onClickShowAttrTable: onClickShowAttrTable,
                    add_layer:add_layer,
                    delete_layer:delete_layer,
                }
