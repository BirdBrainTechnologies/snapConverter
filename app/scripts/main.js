/*!
 *
 *  Web Starter Kit
 *  Copyright 2015 Google Inc. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *    https://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License
 *
 */
(function () {
  'use strict';

  //base64/utf utilities from:
  // https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#Solution_.232_.E2.80.93_rewriting_atob()_and_btoa()_using_TypedArrays_and_UTF-8
  function uint6ToB64(nUint6) {
    return nUint6 < 26 ?
    nUint6 + 65
      : nUint6 < 52 ?
    nUint6 + 71
      : nUint6 < 62 ?
    nUint6 - 4
      : nUint6 === 62 ?
      43
      : nUint6 === 63 ?
      47
      :
      65;
  }

  function base64EncArr(aBytes) {
    var nMod3 = 2, sB64Enc = '';
    for (var nLen = aBytes.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++) {
      nMod3 = nIdx % 3;
      if (nIdx > 0 && (nIdx * 4 / 3) % 76 === 0) {
        sB64Enc += '\r\n';
      }
      nUint24 |= aBytes[nIdx] << (16 >>> nMod3 & 24);
      if (nMod3 === 2 || aBytes.length - nIdx === 1) {
        sB64Enc += String.fromCharCode(uint6ToB64(nUint24 >>> 18 & 63), uint6ToB64(nUint24 >>> 12 & 63), uint6ToB64(nUint24 >>> 6 & 63), uint6ToB64(nUint24 & 63));
        nUint24 = 0;
      }
    }
    return sB64Enc.substr(0, sB64Enc.length - 2 + nMod3) + (nMod3 === 2 ? '' : nMod3 === 1 ? '=' : '==');
  }

  function strToUTF8Arr(sDOMStr) {
    var aBytes, nChr, nStrLen = sDOMStr.length, nArrLen = 0;
    /* mapping... */
    for (var nMapIdx = 0; nMapIdx < nStrLen; nMapIdx++) {
      nChr = sDOMStr.charCodeAt(nMapIdx);
      nArrLen += nChr < 0x80 ? 1 : nChr < 0x800 ? 2 : nChr < 0x10000 ? 3 : nChr < 0x200000 ? 4 : nChr < 0x4000000 ? 5 : 6;
    }
    aBytes = new Uint8Array(nArrLen);
    /* transcription... */
    for (var nIdx = 0, nChrIdx = 0; nIdx < nArrLen; nChrIdx++) {
      nChr = sDOMStr.charCodeAt(nChrIdx);
      if (nChr < 128) {
        /* one byte */
        aBytes[nIdx++] = nChr;
      } else if (nChr < 0x800) {
        /* two bytes */
        aBytes[nIdx++] = 192 + (nChr >>> 6);
        aBytes[nIdx++] = 128 + (nChr & 63);
      } else if (nChr < 0x10000) {
        /* three bytes */
        aBytes[nIdx++] = 224 + (nChr >>> 12);
        aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
        aBytes[nIdx++] = 128 + (nChr & 63);
      } else if (nChr < 0x200000) {
        /* four bytes */
        aBytes[nIdx++] = 240 + (nChr >>> 18);
        aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
        aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
        aBytes[nIdx++] = 128 + (nChr & 63);
      } else if (nChr < 0x4000000) {
        /* five bytes */
        aBytes[nIdx++] = 248 + (nChr >>> 24);
        aBytes[nIdx++] = 128 + (nChr >>> 18 & 63);
        aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
        aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
        aBytes[nIdx++] = 128 + (nChr & 63);
      } else /* if (nChr <= 0x7fffffff) */ {
        /* six bytes */
        aBytes[nIdx++] = 252 + (nChr >>> 30);
        aBytes[nIdx++] = 128 + (nChr >>> 24 & 63);
        aBytes[nIdx++] = 128 + (nChr >>> 18 & 63);
        aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
        aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
        aBytes[nIdx++] = 128 + (nChr & 63);
      }
    }
    return aBytes;
  }

  //end of utilities
  var isReady = false;
  var chromeBlocks = {};
  var httpBlocks = {};

  //begin making databases of block for chrome and http
  var chromeFileSrc;
  var httpFileSrc;
  $(function () {
    $.get('chromeHB.xml', function (data) {
      chromeFileSrc = data;
    });
    $.get('httpHB.xml', function (data) {
      httpFileSrc = data;
    });
    setTimeout(setUpBlocks, 1000);
  });
  //main function for setting up database of blocks
  var setUpBlocks = function () {
    if (chromeFileSrc === undefined || httpFileSrc === undefined) {
      setTimeout(setUpBlocks, 1000);
    }
    var xmlChrome = chromeFileSrc;
    var xmlHttp = httpFileSrc;

    //for chrome xml, we map name to block def
    //this is the highest level node in the snap xml, the project node
    var projectNode = xmlChrome.documentElement;
    var blocksNode;
    var i;
    for (i = 0; i < projectNode.childNodes.length; i++) {
      if (projectNode.childNodes[i].nodeName === 'blocks') {
        blocksNode = projectNode.childNodes[i];
        break;
      }
    }
    var children = blocksNode.childNodes; //each of these is a block-definition or #text
    for (i = 0; i < children.length; i++) {
      if (children[i].nodeName === 'block-definition') {
        //isolate block-definitions as this is all we care about
        chromeBlocks[children[i].getAttribute('s').trim()] = children[i];
      }
    }

    //do the same thing for xml
    var projectNode2 = xmlHttp.documentElement;
    var blocksNode2;
    for (i = 0; i < projectNode2.childNodes.length; i++) {
      if (projectNode2.childNodes[i].nodeName === 'blocks') {
        blocksNode2 = projectNode2.childNodes[i];
        break;
      }
    }
    var children2 = blocksNode2.childNodes; //each of these is a block-definition or #text
    for (i = 0; i < children2.length; i++) {
      if (children2[i].nodeName === 'block-definition') {
        //isolate block-definitions as this is all we care about
        httpBlocks[children2[i].getAttribute('s').trim()] = children2[i];
      }
    }
    isReady = true;
  };
  //done with setup stuff

  //input file
  var fileInput = $('#files');
  //button clicked to upload file
  var uploadButton = $('#upload');

  //when the button is clicked, read and load the file
  //on load, process the file
  uploadButton.on('click', function () {
    if (!window.FileReader) {
      alert('Your browser is not supported');
    }
    if (!isReady) {
      alert('Resources are still being loaded, please wait a moment and then try again');
    }
    var input = fileInput.get(0);
    // Create a reader object
    var reader = new FileReader();
    if (input.files.length) {
      var textFile = input.files[0];
      reader.readAsText(textFile);
      $(reader).on('load', processFile);
    }
    else {
      alert('Please upload a file before continuing');
    }
  });

  //takes a file, gets its contents, it to its new format
  function processFile(e) {
    var file = e.target.result;
    if (file && file.length) {
      convertXML(file);
    }
  }

  //this is a version of btoa that works on many more strings than the standard btoa
  function betterBtoa(inputString) {
    return base64EncArr(strToUTF8Arr(inputString));
  }

  //takes the parsed xml file and returns it as a new file export.xml
  function returnXMLFile(xml) {
    var outputXML = new XMLSerializer().serializeToString(xml);
    var a = document.getElementById('downloadLink');
    a.href = 'data:text;charset=utf-8;base64,' + betterBtoa(outputXML);
    a.style.display = 'inline';
  }

  //convert an httpBlock to a chrome block
  function httpToChrome(blockDefNode, parentNode) {
    var blockName = blockDefNode.getAttribute('s').trim();
    if (blockName in chromeBlocks) {
      parentNode.replaceChild(chromeBlocks[blockName], blockDefNode);
    }
  }

  //convert a chrome block to http block
  function chromeToHttp(blockDefNode, parentNode) {
    var blockName = blockDefNode.getAttribute('s').trim();
    if (blockName in httpBlocks) {
      parentNode.replaceChild(httpBlocks[blockName], blockDefNode);
    }
  }

  //takes a block definition node and converts it appropriately
  function convertBlock(blockDefNode, parent) {
    var startTypeNum = parseInt($('input[name="startType"]:checked').val());
    var endTypeNum = parseInt($('input[name="endType"]:checked').val());
    //the TypeNum variables represent what we're converting to/from
    //1 is http and 2 is chrome
    if (startTypeNum === endTypeNum) {
      //do nothing
    }
    else if (startTypeNum === 1 && endTypeNum === 2) {
      httpToChrome(blockDefNode, parent);
    }
    else if (startTypeNum === 2 && endTypeNum === 1) {
      chromeToHttp(blockDefNode, parent);
    }
    else {
      console.log('this shouldn\'t happen     start num: '  + startTypeNum + ' end num: ' + endTypeNum);
    }
  }

  //converts the uploaded to a new file
  function convertXML(data) {
    var xml;
    //initial parse of xml
    if (window.DOMParser) { // Standard
      var tmp = new DOMParser();
      xml = tmp.parseFromString(data, 'text/xml');
    } else { // IE
      xml = new ActiveXObject('Microsoft.XMLDOM');
      xml.async = 'false';
      xml.loadXML(data);
    }

    //this is the highest level node in the snap xml, the project node
    var projectNode = xml.documentElement;
    var blocksNode;
    var i;
    for (i = 0; i < projectNode.childNodes.length; i++) {
      if (projectNode.childNodes[i].nodeName === 'blocks') {
        blocksNode = projectNode.childNodes[i];
      }
    }
    var children = blocksNode.childNodes; //each of these is a block-definition or #text
    for (i = 0; i < children.length; i++) {
      if (children[i].nodeName === 'block-definition') {
        //isolate block-definitions as this is all we care about
        convertBlock(children[i], blocksNode);
      }
    }
    setTimeout(function () {
      returnXMLFile(xml);
    }, 100);
  }

})
();
