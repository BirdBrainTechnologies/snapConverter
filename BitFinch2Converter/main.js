'use strict';


//the base project file for output
var starterProject;
//the suffix to add at the end of the filename
var output;
//The name of the resulting file download. Will be reset later.
var outputFileName = "newSnapProject.xml";
//Will the output be multi-device?
var multiDeviceOutput = false;
//Was the input file made for BlueBird or the Web app?
var currentSoftware;
//Should the output be for BlueBird or the Web app?
var softwareSelected;

//These new line characters are thrown away by the DOMParser
const NEWLINE = "&#xD;"
const PLACEHOLDER = "NEWLINEPLACEHOLDER"


/**
 * onFileChoice - Enable/disable the convert button based on whether or not a
 * file is specified.
 *
 * @param  {element} formInput Input element specifying file choice
 */
function onFileChoice(formInput) {
  console.log("onFileChoice " + formInput.id)
  let convertButton
  let convertFunction
  switch(formInput.id) {
    case "singleRobotProject":
      convertButton = document.getElementById("smConvert");
      convertFunction = singleToMulti;
      break;
    case "originalProject":
      convertButton = document.getElementById("softwareConvert");
      convertFunction = softwareConversion;
      break;
  }

  if (formInput.files[0] == null) {
    convertButton.removeEventListener('click', convertFunction);
    convertButton.style.backgroundColor = "#CACACA";
    convertButton.disabled = true;
  } else {
    convertButton.addEventListener('click', convertFunction);
    convertButton.disabled = false;
    convertButton.style.backgroundColor = "#FF9922";
  }
}

/**
 * singleToMulti - Start a single device to multi device conversion.
 *
 * @param  {event} e Button click event
 */
function singleToMulti(e) {
  console.log("singleToMulti")
  e.target.blur();
  output = "MULTI.xml"
  let input = document.getElementById("singleRobotProject")
  uploadFile(input)
}

/**
 * softwareConversion - Start a software conversion.
 *
 * @param  {event} e Button click event
 */
function softwareConversion(e) {
  console.log("softwareConversion")
  e.target.blur();
  output = "For"
  let input = document.getElementById("originalProject")
  uploadFile(input)
}

/**
 * uploadFile - Upload the user-specified file. When the file is loaded,
 * processFile will be called.
 *
 * @param  {element} input Input element to get the file from
 */
function uploadFile(input) {
  //Make sure the starter project from the last conversion will not be used.
  starterProject = null;

  // Create a reader object
  let reader = new FileReader();
  if (input.files.length) {
    let textFile = input.files[0];
    outputFileName = textFile.name.slice(0, -4) + output

    reader.readAsText(textFile);
    reader.addEventListener("load", processFile);
  } else {
    console.error("No file selected")
  }
}

/**
 * processFile - Handles the user's file once loaded.
 *
 * @param  {event} e Load event triggered by loading the user's file
 */
function processFile(e) {
  let inputContents = e.target.result;
  if ( !(inputContents && inputContents.length) ) {
    console.error("file has no contents to process");
    return;
  }

  // Determine the state of the input
  let usesFinch = (inputContents.match(/block-definition s="Finch/) != null) ? "Finch" : null
  let usesHummingbird = (inputContents.match(/block-definition s="Hummingbird/) != null) ? "Hummingbird" : null
  currentSoftware = (inputContents.match(/doApplyExtension/) != null) ? "WebApp" : "BlueBird"

  // Determine what the output should be
  let robotAmount = "Multi"
  softwareSelected = currentSoftware
  if (output != "MULTI.xml") { //If it is the software converter and not the single to multi converter
    softwareSelected = (currentSoftware == "WebApp") ? "BlueBird" : "WebApp"
    if (inputContents.match(/%&apos;devId&apos;/) == null && inputContents.match(/%'devId'/) == null) {
      robotAmount = "Single"
    }
    outputFileName = outputFileName + softwareSelected + ".xml"
    console.log(outputFileName)
  }
  multiDeviceOutput = (robotAmount == "Multi")

  switch(softwareSelected + usesFinch + usesHummingbird + robotAmount) {
    case "WebAppFinchnullSingle":
      starterProject = "WebFinchSingleDevice.xml";
    break;
    case "WebAppnullHummingbirdSingle":
      starterProject = "WebHummingbirdSingleDevice.xml";
    break;
    case "WebAppFinchnullMulti":
      starterProject = "WebFinchMultiDevice.xml";
    break;
    case "WebAppnullHummingbirdMulti":
      starterProject = "WebHummingbirdMultiDevice.xml";
    break;
    case "WebAppFinchHummingbirdMulti":
      starterProject = "WebMixedMultiDevice.xml";
    break;
    case "BlueBirdFinchnullSingle":
      starterProject = "FinchSingleDeviceStarterProject.xml";
    break;
    case "BlueBirdnullHummingbirdSingle":
      starterProject = "HummingbirdSingleDeviceStarterProject.xml";
    break;
    case "BlueBirdFinchnullMulti":
      starterProject = "FinchMultiDeviceStarterProject.xml";
    break;
    case "BlueBirdnullHummingbirdMulti":
      starterProject = "HummingbirdMultiDeviceStarterProject.xml";
    break;
    case "BlueBirdFinchHummingbirdMulti":
      starterProject = "MixedMultiDeviceStarterProject.xml";
    break;
    default:
      console.error("Invalid options: " + softwareSelected + " " + usesFinch + " " + usesHummingbird + " " + robotAmount)
  }

  console.log(starterProject)

  fetch('snapProjects/' + starterProject)
    .then(response => response.text())
    .then(starterContents => {

      let results = convert(inputContents, starterContents)
      returnXMLFile(results)

    }).catch(error => {
      console.error("Starter file load failed: " + error.message);
    })

}

/**
 * convert - Convert the text of the user selected file into the block version
 * requested.
 *
 * @param  {string} userFile  string contents of the user file
 * @param  {string} selectedStarter string contents of the blocks to use in output
 * @return {type}           description
 */
function convert(userFile, selectedStarter) {

  console.log("Converting... ")
  var userXML = parseXML(userFile);
  console.log(userXML)
  var selectedXML = parseXML(selectedStarter);
  var userBlocksNode = getBlocksNode(userXML);
  var userBlockDefs = getBlockDefArray(userBlocksNode);
  var starterBlocksNode = getBlocksNode(selectedXML);
  var starterBlockDefs = getBlockDefArray(starterBlocksNode);

  var starterBlocksUsed = [];
  var shouldAddBirdBrainSetup = false;

  //convert user block definitions into the new form
  Object.keys(userBlockDefs).forEach((blockKey, i) => {
    if (blockKey in starterBlockDefs) {
      userBlocksNode.replaceChild(starterBlockDefs[blockKey], userBlockDefs[blockKey])
      starterBlocksUsed.push(blockKey)
    } else if (blockKey == "BirdBrainSetup") {
      //The BirdBrain Setup block is only used in the old web app
      userBlocksNode.removeChild(userBlockDefs[blockKey])
    } else {
        console.error("could not find block with key " + blockKey)
    }
  })

  //add any block definitions that are missing
  Object.keys(starterBlockDefs).forEach((blockKey, i) => {
    if (!starterBlocksUsed.includes(blockKey)) {
      console.log("adding missing block " + blockKey)
      userBlocksNode.appendChild(starterBlockDefs[blockKey])
      /*if (blockKey == "BirdBrainSetup") {
        shouldAddBirdBrainSetup = true;
      }*/
    }
  })

  let blockDictionary = getBlockDictionary(starterBlockDefs)

  //change the block calls to the new calls
  var stageScriptsNode = getStageScriptsNode(userXML)
  var spritesNode = userXML.getElementsByTagName('sprites')[0]

  //Correct all of the calls to our custom blocks
  var projectNode = userXML.documentElement;
  var stageNode;
  var switchingFromSingleDevice = false;
  for (let i = 0; i < projectNode.childNodes.length; i++) {
    if (projectNode.childNodes[i].nodeName === 'stage') {
      stageNode = projectNode.childNodes[i]
    }
  }
  let customBlockCalls = stageNode.getElementsByTagName('custom-block')
  for (let i = 0; i < customBlockCalls.length; i++) {
    //console.log(customBlockCalls[i])
    let blockName = customBlockCalls[i].getAttribute('s').trim()
    blockName = blockName.replace(/%s/g, '%txt')
    let dictionaryEntry = blockDictionary[blockName]
    if (dictionaryEntry == null) {
      if (blockName == "BirdBrain Setup") {
        customBlockCalls[i].parentNode.removeChild(customBlockCalls[i])
      } else {
        console.error("could not find entry for " + blockName)
        let list = "Current list of block entries:\n"
        Object.keys(blockDictionary).forEach((item, i) => {
          list = list + "\t" + item + "\n"
        });
        console.log(list)
      }

    } else {
      if (blockName == dictionaryEntry.mdCall) {
        //console.log("found multiDeviceCall " + blockName)
        if (!multiDeviceOutput) {
          console.error("Switching from multi-device to single-device is not allowd.")
        }

      } else if (blockName == dictionaryEntry.sdCall) {
        //console.log("found singleDeviceCall " + blockName)
        if (multiDeviceOutput) {
          switchingFromSingleDevice = true
          customBlockCalls[i].setAttribute('s', dictionaryEntry.mdCall)
          let newNode = userXML.createElement("l")
          newNode.appendChild(userXML.createTextNode("A"))
          customBlockCalls[i].insertBefore(newNode, customBlockCalls[i].childNodes[0])
        }

      } else {
        console.error("found a dictionary entry, but no matching call name for " + blockName)
      }
    }

  }

  //Add missing scripts to the stage
  /*if (shouldAddBirdBrainSetup) {
    let newNode = parseXML(`<script x="152" y="13">
      <block s="receiveGo"></block>
      <custom-block s="BirdBrain Setup"></custom-block>
    </script>`)
    //console.log(newNode)
    stageScriptsNode.appendChild(newNode.children[0])
  }*/
  if (softwareSelected == "WebApp" && currentSoftware != "WebApp") {
    let newNode = parseXML(`<script x="152" y="13">
      <block s="receiveGo"></block>
      <block s="doApplyExtension">
        <l>src_load(url)</l>
        <list>
          <l>libraries/bbtSnapExtension.js</l>
        </list>
      </block>
    </script>`)
    console.log(newNode)
    stageScriptsNode.appendChild(newNode.children[0])
  }

  if (switchingFromSingleDevice) {
    let stopAllB = parseXML(`<script x="188" y="24">
      <block s="receiveInteraction">
        <l>
          <option>stopped</option>
        </l>
      </block>
      <custom-block s="stop all %txt">
        <l>B</l>
      </custom-block>
    </script>`)
    let stopAllC = parseXML(`<script x="347" y="19">
      <block s="receiveInteraction">
        <l>
          <option>stopped</option>
        </l>
      </block>
      <custom-block s="stop all %txt">
        <l>C</l>
      </custom-block>
    </script>`)
    stageScriptsNode.appendChild(stopAllB.children[0])
    stageScriptsNode.appendChild(stopAllC.children[0])
    //console.log(stageScriptsNode)
  }

  return userXML
}

/**
 * returnXMLFile - Takes the parsed xml file and returns it as a new file which
 * will automatically download.
 *
 * @param  {XML} xml xml to return
 */
function returnXMLFile(xml) {

  var outputXML = new XMLSerializer().serializeToString(xml);
  outputXML = outputXML.replace(new RegExp(PLACEHOLDER, "g"), NEWLINE)
  var a = document.createElement('a');

  // https://stackoverflow.com/questions/5143504/how-to-create-and-download-an-xml-file-on-the-fly-using-javascript
  var bb = new Blob([outputXML], {type: 'text/plain'});
  a.setAttribute('href', window.URL.createObjectURL(bb));
  console.log("Setting the download filename to " + outputFileName);
  a.setAttribute('download', outputFileName);
  a.dataset.downloadurl = ['text/plain', a.download, a.href].join(':');

  a.click();
  a.remove();
  console.log(outputFileName + " should have downloaded.")
}

/**
 * parseXML - Parses a string as xml and returns the xml object.
 *
 * @param  {string} text String of text to parse as xml
 * @return {XML}      xml object created from the text string
 */
function parseXML(text) {
  text = text.replace(/ & /g, " &amp; ")
  text = text.replace(/ && /g, " &amp;&amp; ")
  text = text.replace(new RegExp(NEWLINE, "g"), PLACEHOLDER)
  //console.log(text)

  var xml;
  //initial parse of xml
  if (window.DOMParser) { // Standard
    var tmp = new DOMParser();
    xml = tmp.parseFromString(text, 'text/xml');
  } else { // IE
    xml = new ActiveXObject('Microsoft.XMLDOM');
    xml.async = 'false';
    xml.loadXML(text);
  }
  return xml;
}

/**
 * getStageScriptsNode - Find and return the scripts node within the stage of
 * a given snap! project.
 *
 * @param  {XML} project The snap project to search
 * @return {node}         The stage scripts node found
 */
function getStageScriptsNode(project){
  //this is the highest level node in the snap xml, the project node
  var projectNode = project.documentElement;

  var scriptsNode;
  for (let i = 0; i < projectNode.childNodes.length; i++) {
    if (projectNode.childNodes[i].nodeName === 'stage') {
      for (let j = 0; j < projectNode.childNodes[i].childNodes.length; j++) {
        if (projectNode.childNodes[i].childNodes[j].nodeName === 'scripts') {
          scriptsNode = projectNode.childNodes[i].childNodes[j];
        }
      }
    }
  }
  return scriptsNode;
}

/**
 * getBlocksNode - Find and return the main blocks node of a snap! project.
 *
 * @param  {XML} project The snap! project to search
 * @return {node}         The blocks node found
 */
function getBlocksNode(project){
  //this is the highest level node in the snap xml, the project node
  var projectNode = project.documentElement;
  //now find the node with the block definitions. Should be the last blocks node.
  var blocksNode;
  for (let i = 0; i < projectNode.childNodes.length; i++) {
    if (projectNode.childNodes[i].nodeName === 'blocks') {
      blocksNode = projectNode.childNodes[i];
    }
  }
  return blocksNode;
}

/**
 * getBlockDefArray - Make and return an array of custom snap! block
 * definitions from a given blocks node.
 *
 * @param  {node} blocksNode The blocks node from a snap! project
 * @return {array}            Array of custom block definitions
 */
function getBlockDefArray(blocksNode) {
  var blockDefs = {};
  var children = blocksNode.childNodes; //each of these is a block-definition or #text

  for (let i = 0; i < children.length; i++) {
    if (children[i].nodeName === 'block-definition') {
      //isolate block-definitions as this is all we care about
      let blockName = children[i].getAttribute('s').trim()
      blockName = blockName.replace(/%\'DevId\'/, '')
      blockName = blockName.replace(/%\'devId\'/, '')
      blockName = blockName.replace(/\s/g, '')
      if (blockName == "micro:bitDisplay$nl%'r1c1'%'r1c2'%'r1c3'%'r1c4'%'r1c5'$nl%'r2c1'%'r2c2'%'r2c3'%'r2c4'%'r2c5'$nl%'r3c1'%'r3c2'%'r3c3'%'r3c4'%'r3c5'$nl%'r4c1'%'r4c2'%'r4c3'%'r4c4'%'r4c5'$nl%'r5c1'%'r5c2'%'r5c3'%'r5c4'%'r5c5'") {
        blockName = "micro:bitDisplay$nl%'11'%'12'%'13'%'14'%'15'$nl%'21'%'22'%'23'%'24'%'25'$nl%'31'%'32'%'33'%'34'%'35'$nl%'41'%'42'%'43'%'44'%'45'$nl%'51'%'52'%'53'%'54'%'55'"
      }

      blockDefs[blockName] = children[i];
    }
  }

  return blockDefs;
}

/**
 * getBlockDictionary - Make and return a more searchable dictionary of custom
 * block definitions from a block definition array.
 *
 * @param  {array} blockDefs Array of block definitions
 * @return {dictionary}           Block definition dictionary
 */
function getBlockDictionary(blockDefs) {
  let dictionary = {}
  Object.keys(blockDefs).forEach((item, i) => {
    let blockDef = blockDefs[item]
    let blockName = blockDef.getAttribute('s').trim()
    let inputs = blockDef.getElementsByTagName('input')
    for (let i = 0; i < inputs.length; i++) {
      let type = inputs[i].getAttribute('type')
      //console.log("input type " + type)
      blockName = blockName.replace(/%\'[a-zA-Z_0-9]*\'/, type)
      blockName = blockName.replace(/\$nl/, "%br")
    }

    let multiDeviceCall
    let singleDeviceCall
    if (multiDeviceOutput) {
      multiDeviceCall = blockName
      singleDeviceCall = blockName.replace(/ %txt/, '')
    } else {
      singleDeviceCall = blockName
    }

    //console.log("blockDef " + blockDef.getAttribute('s').trim() + " -> " + multiDeviceCall + " -> " + singleDeviceCall)
    let entry = {
      definition: blockDefs[item],
      sdCall: singleDeviceCall,
      mdCall: multiDeviceCall
    }
    dictionary[multiDeviceCall] = entry
    dictionary[singleDeviceCall] = entry
  });
  return dictionary
}
