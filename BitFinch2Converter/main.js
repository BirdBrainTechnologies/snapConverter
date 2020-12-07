'use strict';

//button clicked to upload file
var finchBitUploadButton = document.getElementById("finchBitUpload");
finchBitUploadButton.addEventListener('click', finchBitUpload);

//the base project file for output
var starterProject;

var info = document.getElementById('convertionInfo')
var spinner = document.getElementById('spinner')
var downloadComplete = document.getElementById('fbDownloadComplete');
var finchBitInput = document.getElementById("fbFiles")

//The name of the resulting file download. Will be reset later.
var filename = "newSnapProject.xml";


/**
 * upload - when the button is clicked, read, load, and process the file.
 * This function is used for converting finch/bit files.
 */
function finchBitUpload() {

    downloadComplete.style.display = 'none'
    spinner.style.display = 'block'

    var softwareSelected = document.querySelector('input[name="software"]:checked').id;

    finchBitInput.files[0].text().then(inputContents => {
      //console.log(contents)
      let usesFinch = inputContents.match(/Finch/)
      let usesHummingbird = inputContents.match(/Hummingbird/)

      switch(softwareSelected + usesFinch + usesHummingbird) {
        case "WebAppFinchnull":
          starterProject = "PWAFinchMultiDevice.xml";
        break;
        case "WebAppnullHummingbird":
          starterProject = "PWAHummingbirdMultiDevice.xml";
        break;
        case "WebAppFinchHummingbird":
          starterProject = "PWAMixedMultiDevice.xml";
        break;
        case "BlueBirdFinchnull":
          starterProject = "FinchMultiDeviceStarterProject.xml";
        break;
        case "BlueBirdnullHummingbird":
          starterProject = "HummingbirdMultiDeviceStarterProject.xml";
        break;
        case "BlueBirdFinchHummingbird":
          starterProject = "MixedMultiDeviceStarterProject.xml";
        break;
        default:
          console.error("Invalid options: " + softwareSelected + " " + usesFinch + " " + usesHummingbird)
      }

      //console.log("starterProject " + starterProject)

      fetch('snapProjects/' + starterProject)
        .then(response => response.text())
        .then(starterContents => {
          //console.log("about to convert")
          let results = convert(inputContents, starterContents)
          //console.log("converted")
          let projectType;
          if (usesFinch && usesHummingbird) {
            projectType = "Finch and Hummingbird"
            filename = "MixedMultiDevice"
          } else if (usesFinch) {
            projectType = "Finch"
            filename = "FinchMultiDevice"
          } else if (usesHummingbird) {
            projectType = "Hummingbird"
            filename = "HummingbirdMultiDevice"
          }
          let softwareName = (softwareSelected == "BlueBird") ? "BlueBird Connector" : "Web App"
          info.innerHTML = "'" + finchBitInput.files[0].name + "' has been converted from a " + projectType + " project to a multi device project for the " + softwareName + "."
          filename += "For" + softwareSelected + ".xml"

          returnXMLFile(results)

        }).catch(error => {
          console.error("Starter file load failed: " + error.message);
        })

    }).catch(error => {
      console.error("user file read failed: " + error.message);
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
  //console.log(selectedStarter);
  console.log("Converting...")
  var userXML = parseXML(userFile);
  var selectedXML = parseXML(selectedStarter);
  //console.log("stuff parsed")
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
      //The BirdBrain Setup block is only used in the web app
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
      if (blockKey == "BirdBrainSetup") {
        shouldAddBirdBrainSetup = true;
      }
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
    let dictionaryEntry = blockDictionary[blockName]
    if (dictionaryEntry == null) {
      if (blockName == "BirdBrain Setup") {
        customBlockCalls[i].parentNode.removeChild(customBlockCalls[i])
      } else {
        console.error("could not find entry for " + blockName)
        Object.keys(blockDictionary).forEach((item, i) => {
          console.error(item)
        });
      }

    } else {
      if (blockName == dictionaryEntry.mdCall) {
        //Since we are currently converting everything to multi-device blocks, do nothing here.
        //console.log("found multiDeviceCall " + blockName)

      } else if (blockName == dictionaryEntry.sdCall) {
        //console.log("found singleDeviceCall " + blockName)
        switchingFromSingleDevice = true
        customBlockCalls[i].setAttribute('s', dictionaryEntry.mdCall)
        let newNode = userXML.createElement("l")
        newNode.appendChild(userXML.createTextNode("A"))
        customBlockCalls[i].insertBefore(newNode, customBlockCalls[i].childNodes[0])

      } else {
        console.error("found a dictionary entry, but no matching call name for " + blockName)
      }
    }

  }

  //Add missing scripts to the stage
  if (shouldAddBirdBrainSetup) {
    let newNode = parseXML(`<script x="152" y="13">
      <block s="receiveGo"></block>
      <custom-block s="BirdBrain Setup"></custom-block>
    </script>`)
    //console.log(newNode)
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

//takes the parsed xml file and returns it as a new file
function returnXMLFile(xml) {

  spinner.style.display = 'none'

  var outputXML = new XMLSerializer().serializeToString(xml);
  var a = document.getElementById('fbDownloadLink');

  // https://stackoverflow.com/questions/5143504/how-to-create-and-download-an-xml-file-on-the-fly-using-javascript
  var bb = new Blob([outputXML], {type: 'text/plain'});
  a.setAttribute('href', window.URL.createObjectURL(bb));
  console.log("Setting the download filename to " + filename);
  a.setAttribute('download', filename);
  a.dataset.downloadurl = ['text/plain', a.download, a.href].join(':');
  a.draggable = true;
  a.classList.add('dragout');

  finchBitUploadButton.blur()
  downloadComplete.style.display = 'block'
}

function parseXML(text) {
  text = text.replace(/ & /g, " &amp; ")
  text = text.replace(/ && /g, " &amp;&amp; ")

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

function getBlockDefArray(blocksNode) {
  var blockDefs = {};
  var children = blocksNode.childNodes; //each of these is a block-definition or #text

  for (let i = 0; i < children.length; i++) {
    if (children[i].nodeName === 'block-definition') {
      //isolate block-definitions as this is all we care about
      let blockName = children[i].getAttribute('s').trim()
      blockName = blockName.replace(/%\'devId\'/, '')
      blockName = blockName.replace(/\s/g, '')
      blockDefs[blockName] = children[i];
    }
  }
  //console.log(blockDefs.length);
  /*Object.keys(blockDefs).forEach((item, i) => {
    console.log(item)
    console.log(blockDefs[item])
  });*/

  return blockDefs;
}

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
    let multiDeviceCall = blockName
    let singleDeviceCall = blockName.replace(/ %txt/, '')
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


/**
 * onFileChoice - Show/hide the convert button based on whether or not a file
 * is specified.
 *
 * @param  {element} formInput Input element specifying file choice
 */
function onFileChoice(formInput) {

  let convertButton = document.getElementById("finchBitUpload");

  if (formInput.files[0] == null) {
    convertButton.style.display = 'none'
  } else {
    convertButton.style.display = 'block'
  }
}
