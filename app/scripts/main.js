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

  // Check to make sure service workers are supported in the current browser,
  // and that the current page is accessed from a secure origin. Using a
  // service worker from an insecure origin will trigger JS console errors. See
  // http://www.chromium.org/Home/chromium-security/prefer-secure-origins-for-powerful-new-features
  if ('serviceWorker' in navigator &&
    (window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname.indexOf('127.') === 0)) {
    navigator.serviceWorker.register('/service-worker.js', {
      scope: './'
    }).then(function (registration) {
      // Check to see if there's an updated version of service-worker.js with
      // new files to cache:
      // https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#service-worker-registration-update-method
      if (typeof registration.update === 'function') {
        registration.update();
      }

      // updatefound is fired if service-worker.js changes.
      registration.onupdatefound = function () {
        // updatefound is also fired the very first time the SW is installed,
        // and there's no need to prompt for a reload at that point.
        // So check here to see if the page is already controlled,
        // i.e. whether there's an existing service worker.
        if (navigator.serviceWorker.controller) {
          // The updatefound event implies that registration.installing is set:
          // https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#service-worker-container-updatefound-event
          var installingWorker = registration.installing;

          installingWorker.onstatechange = function () {
            switch (installingWorker.state) {
              case 'installed':
                // At this point, the old content will have been purged and the
                // fresh content will have been added to the cache.
                // It's the perfect time to display a "New content is
                // available; please refresh." message in the page's interface.
                break;

              case 'redundant':
                throw new Error('The installing service worker became redundant.');
            }
          };
        }
      };
    }).catch(function (e) {
      console.error('Error during service worker registration:', e);
    });
  }
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

  var chromeFileSrc;
  var httpFileSrc;
  $(function() {
    $.get('chromeHB.xml', function (data) {
      chromeFileSrc = data;
    });
    $.get('httpHB.xml', function (data) {
      httpFileSrc = data;
    });
    setTimeout(setUpBlocks, 1000);
  });

  var setUpBlocks = function() {
    if(chromeFileSrc === undefined || httpFileSrc === undefined){
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
        chromeBlocks[children[i].getAttribute("s").trim()] = children[i];
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
        httpBlocks[children2[i].getAttribute("s").trim()] = children2[i];
      }
    }
    isReady = true;
    console.log("Ready!");
  };



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
    if(!isReady){
      alert('Resources are still being loaded, please wait a moment and then try again')
    }
    var input = fileInput.get(0);
    // Create a reader object
    var reader = new FileReader();
    if (input.files.length) {
      var textFile = input.files[0];
      reader.readAsText(textFile);
      $(reader).on('load', processFile);
    } else {
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
    var a = document.body.appendChild(
      document.createElement('a')
    );
    a.download = 'export.xml';
    a.href = 'data:text;charset=utf-8;base64,' + betterBtoa(outputXML);
    a.innerHTML = 'Click here to download new project';
  }

  function httpToChrome(blockDefNode) {
    var blockName = blockDefNode.getAttribute("s").trim();
    return;
  }

  function chromeToHttp(blockDefNode) {
    var blockName = blockDefNode.getAttribute("s").trim();
    return;
  }

  //takes a block definition node and converts it appropriately
  function convertBlock(blockDefNode) {
    var startTypeNum = $('input[name="startType"]:checked').val();
    var endTypeNum = $('input[name="endType"]:checked').val();
    if (startTypeNum == endTypeNum) {
      return;
    } else if (startTypeNum === 1 && endTypeNum === 2) {
      httpToChrome(blockDefNode);
    } else if (endTypeNum === 2 && startTypeNum === 1) {
      chromeToHttp(blockDefNode);
    }
  }

  function textToDocument(data){
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
    return xml;
  }

  function convertXML(data) {
    var xml = textToDocument(data);

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
        convertBlock(children[i]);
        //console.log('child:' + children[i].nodeName); //block-definitions
        //console.log(children[i].getAttribute("s"));
      }
    }
    returnXMLFile(xml);
  }

})
();
