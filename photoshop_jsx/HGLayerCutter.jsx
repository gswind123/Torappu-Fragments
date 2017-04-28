//--------------------------
//--Created By DarkMagicCK
//--Studio GameMaster
//This javascript is used for cut out all the layers
//You need to make all the layer or layer set name in order
//You can add an operation char before each name
//Suggest you to save another PSD file to apply this script
//+ to Merge layer set
//! to ignore this layer or layer set
//--------------------------

#target photoshop;
app.bringToFront();

var op_Mark = "@";
var op_Hide = "!";
var docRef;
var DirectoryPath;
var deltaX,deltaY;
var infoFile;

function checkHidden(name) {
  return name.indexOf(op_Hide) == 0;
}

// create smartobject from specified layer (default is active layer)
function createSmartObject(layer)
{
  var doc = app.activeDocument;
  var layer = layer != undefined ? layer : doc.activeLayer;

  if(doc.activeLayer != layer) doc.activeLayer = layer;

  try
  {
    var idnewPlacedLayer = stringIDToTypeID( "newPlacedLayer" );
    executeAction( idnewPlacedLayer, undefined, DialogModes.NO );
    return doc.activeLayer;
  }
  catch(e)
  {
    return undefined;
  }
}

function SaveFile(subDir, layer)
{
  var markIndex = layer.name.indexOf(op_Mark);
  if (markIndex < 0) { return; }

  //Check Directory Exists And Prepare For Save
  var savePath = DirectoryPath + "/" + subDir;
  var cFolder = new Folder(savePath);
  if(!cFolder.exists)
    cFolder.create();

  layer.name = layer.name.substring(0,markIndex);
  //var png = new File(savePath+"/"+layer.name+".png");
  var tempPNG = new File("~/cutter_tmp.png"); //Use for deal non latin charactors
  var pngSav = new ExportOptionsSaveForWeb();
  pngSav.format = SaveDocumentType.PNG;
  pngSav.PNG8 = false;

  layer.move(app.activeDocument.layers[0],ElementPlacement.PLACEBEFORE);

  for(var i=0;i<app.activeDocument.layers.length;i++)
  {
    if(app.activeDocument.layers[i]!=layer)
      app.activeDocument.layers[i].visible = false;
  }

  //Info File
  var pathCompo = removePathComponent(subDir+"/");
  infoFile.writeln(pathCompo + layer.name+"\t"+"DrawRect("+(layer.bounds[0].value+deltaX).toString() + "," + (layer.bounds[1].value+deltaY).toString() + ","
                      + (layer.bounds[2].value-layer.bounds[0].value).toString()+","+(layer.bounds[3].value-layer.bounds[1].value).toString()+")");

  app.activeDocument.trim(TrimType.TRANSPARENT);
  app.activeDocument.exportDocument(tempPNG, ExportType.SAVEFORWEB, pngSav);

  tempPNG = new File("~/cutter_tmp.png");
  tempPNG.copy(savePath + "/" + layer.name + ".png");
  tempPNG.remove();
}

function OperateLayer(subDir, layer)
{
  if(layer.name.length > 0)
  {
    if(layer.name.indexOf(op_Mark) && !checkHidden(layer.name)) {
      var actLayMem = docRef.activeLayer;
      var savedState = docRef.activeHistoryState;
      var tLayer = createSmartObject(layer);
      if(tLayer!=undefined)
        tLayer.rasterize(RasterizeType.ENTIRELAYER);
      SaveFile(subDir,tLayer);
      docRef.activeHistoryState = savedState;
      docRef.activeLaye = actLayMem;
    }
  }
}

function CheckHideOperationOnLayer(artLayer)
{
  if(artLayer.name.length>0)
  {
    var opCode = artLayer.name.substring(0,1);
    if(checkHidden(artLayer.name))
      artLayer.visible = false;
  }
}

function CheckHideOperationOnLayerSet(layerSet)
{
  for(var i=0;i<layerSet.artLayers.length;i++)
  {
    CheckHideOperationOnLayer(layerSet.artLayers[i]);
  }

  for(var i=0;i<layerSet.layerSets.length;i++)
  {
    if(layerSet.layerSets[i].name.length>0)
    {
      if(checkHidden(layerSet.layerSets[i].name))
        layerSet.layerSets[i].visible = false;
    }
    else
      CheckHideOperationOnLayerSet(layerSet.layerSets[i]);
  }
}

function OperateLayerSet(subDir, layerSet)
{
  if(layerSet.name.length>0)
  {
    if (checkHidden(layerSet.name)) {
      return;
    }
    var hasMark = layerSet.name.indexOf(op_Mark) >= 0;
    if(hasMark) {
      // Has mark, we need to merge them together.
      var actLayMem = docRef.activeLayer;
      var savedState = docRef.activeHistoryState;

      CheckHideOperationOnLayerSet(layerSet);

      var tLayer = layerSet.merge();
      SaveFile(subDir, tLayer);

      docRef.activeHistoryState = savedState;
      docRef.activeLaye = actLayMem;
    } else {
      for(var i=0;i<layerSet.artLayers.length;i++)
        OperateLayer(subDir, layerSet.artLayers[i]);

      for(var i=0;i<layerSet.layerSets.length;i++)
        OperateLayerSet(subDir, layerSet.layerSets[i]);
    }
  }
}

function removePathExtention(pathString)
{
  for(var i=pathString.length-1;i>=0;i--)
    if(pathString[i]==".")
      return pathString.substring(0,i+1);
  return "";
}

function removePathComponent(pathString)
{
  for(var i=0;i<pathString.length;i++)
    if(pathString[i]=="/")
      return pathString.substring(i+1,pathString.length+1);
  return "";
}

function getPathComponent(pathString)
{
  for(var i=pathString.length-1;i>=0;i--)
    if(pathString[i]=="/")
      return pathString.substring(i+1,pathString.length);
  return "";
}

function init()
{
  if (documents.length == 0){
    alert("Please open a file to operate.");
  }else{
    docRef = app.activeDocument;
    DirectoryPath = docRef.fullName.path;

    var actLayMem = docRef.activeLayer;
    var savedState = docRef.activeHistoryState;


    //Test Bounds

    for(var i=0;i<docRef.layers.length;i++)
    {
      var layerNotEmpty = docRef.layers[0];
      if(!(layerNotEmpty.bounds[0].value==0&&layerNotEmpty.bounds[1].value==0&&layerNotEmpty.bounds[2].value==0&&layerNotEmpty.bounds[3].value==0))
      {
        deltaX = layerNotEmpty.bounds[0].value;
        deltaY = layerNotEmpty.bounds[1].value;
        break;
      }
    }

    app.activeDocument.revealAll();

    //Bounds
    deltaX -= layerNotEmpty.bounds[0].value;
    deltaY -= layerNotEmpty.bounds[1].value;

    var totalLayerSet = app.activeDocument.layerSets.add();
    totalLayerSet.name = getPathComponent(File.decode(docRef.fullName.absoluteURI))+"_Sliced";
    totalLayerSet.move(app.activeDocument,ElementPlacement.PLACEATEND);

    while(docRef.artLayers.length>0)
      docRef.artLayers[0].move(totalLayerSet,ElementPlacement.INSIDE);

    var tempLayer = totalLayerSet.artLayers.add();
    while(docRef.layerSets.length>1)
      docRef.layerSets[0].move(tempLayer,ElementPlacement.PLACEAFTER);
    tempLayer.remove();

    //Info File
    infoFile = new File(DirectoryPath + "/" + totalLayerSet.name + "/" + getPathComponent(docRef.fullName.absoluteURI) + "_Info.hglc");
    infoFile.encoding = "UTF-8";

    var cFolder = new Folder(DirectoryPath + "/" + totalLayerSet.name);
    if(!cFolder.exists)
      cFolder.create();

    infoFile.open("w");

    OperateLayerSet (totalLayerSet.name, totalLayerSet);

    docRef.activeHistoryState = savedState;
    docRef.activeLaye = actLayMem;

    infoFile.close();

    alert("Cut Over!");
  }
}



init();