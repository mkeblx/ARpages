/*
ARshim adds support for launching 3D models into a native AR Viewer plugin

Goes through page and finds content links, modifying to invoke Android app intent to Viewer
 */

/*
TODO:
-give visual indicator
-add check if device supports ARCore
---Android N + supported device
--if have ARViewer package installed?
--minimum Android version
-polyfill: add WebGL backup if no native support
-additional 'VR' mode: 3D model viewer
--rethink as XR Viewer + pages
-show browser overlay box when objects found
--like Video Assistant extension
*/

(function(){
'use strict';

var version = 0.2;

var ua = navigator.userAgent.toLowerCase();
var isAndroid = ua.indexOf('android') > -1;
var isMobile = ua.indexOf('mobile') > -1;
var isSI = (ua.indexOf('samsungbrowser') > -1 && isMobile);

function androidVersion() {
  var match = ua.match(/android\s([0-9\.]*)/);
  return match ? parseFloat(match[1]) : false;
}

// Android N +
function supportsARCore() {
  const ARCORE_VERSION_MIN = 7.0; // N
  var OSSupport = androidVersion() >= ARCORE_VERSION_MIN;
  var deviceValid = true; // TODO: fill out
  return OSSupport && deviceValid;
}

function init() {
  console.log('ARShim: v'+version);
  console.log('isSI: ' + isSI);
  console.log('android: ' + androidVersion());
  console.log('ARCore support: ' + supportsARCore());

  if (!supportsARCore()) {
    // console.log('Exiting processing... does not support Android/ARCore');
    //return;
  }
}

function process() {
  console.log('process');
  let modelLinks = [];
  let links = document.querySelectorAll('a');
  console.log(links);
  for (let i = 0; i < links.length; i++) {
    let link = links[i];
    let href = link.href.toLowerCase();
    if (href.includes('.gltf') || href.includes('.glb')) {
      modelLinks.push(link);
    }
  }
  console.log(modelLinks.length + ' models found');

  // modify links
  for (let i = 0; i < modelLinks.length; i++) {
    let el = modelLinks[i];

    var data = {};
    data.href = el.href; // getAttribute('href');
    // data.id = data.href.split('/').pop(); Poly
    data.scale = el.getAttribute('data-scale');

    var intentUrl;
    if (hasParam('webar')) {
      let params = {};
      if (data.scale)
        params['scale'] = data.scale;
      let url = createViewerUrl(data.href, params, false);
      intentUrl = createWebARIntentURI(url);
    } else {
      intentUrl = createARViewerIntentURI(data.href + '?scale=' + data.scale);
    }
    data.intentUrl = intentUrl;

    console.log(data);

    // TODO: move outside loop
    if (supportsARCore()) {
      el.setAttribute('href', intentUrl);
    } else if (hasParam('webar')) {
      el.setAttribute('href', createViewerUrl(data.href, { scale: data.scale }, true));
    } else {
      el.setAttribute('data-intent', intentUrl);
      el.onclick = function(){
          alert('On supported Android setup, will launch AR view');
          return false;
        };
    }
  }

  addXRButton();
}

function hasParam(key) {
  var url = new URL(window.location.href);
  return url.searchParams.has(key);
}

var site = 'https://mkeblx.github.io/gltfviewer/';
function createViewerUrl(modelUrl, params, relative) {
  var queryStringParts = [];
  queryStringParts.push( 'url=' + encodeURIComponent(modelUrl) );
  for (let key in params) {
    queryStringParts.push( key + '=' + encodeURIComponent(params[key]) );
  }
  url = site + '?' + queryStringParts.join('&');
  if (!relative) {
    url = site + url;
  }
  return url;
}


const ARVIEWER_PACKAGE = 'com.sec.android.app.sbrowser.xrview';
const ARVIEWER_SCHEME = 'xrview';
const POLY_DOMAIN = 'poly.google.com/view';

const WEBAR_PACKAGE = 'org.chromium.android_webview.shell';
const WEBAR_SCHEME = 'webar';

var useFallbackUrl = false;

// format:
// intent://scan/#Intent;scheme=zxing;package=com.google.zxing.client.android;end
// intent://scan/#Intent;scheme=zxing;package=com.google.zxing.client.android;S.browser_fallback_url=http%3A%2F%2Fzxing.org;end
function createIntentURI(url, scheme, _package) {
  var _url = url.replace(/^https?:\/\//,'');
  var uri = 'intent://'+_url+'#Intent;scheme='+scheme+';package='+_package+';end';
  if (useFallbackUrl) {
    var encodedUri = encodeURI(uri);
    uri += 'S.browser_fallback_url='+encodedUri;
  }
  return uri;
}

function createARViewerIntentURI(url) {
  return createIntentURI(url, ARVIEWER_SCHEME, ARVIEWER_PACKAGE);
}

// for WebARonARCore chromium build
// https://github.com/google-ar/WebARonARCore
function createWebARIntentURI(url) {
  return createIntentURI(url, WEBAR_SCHEME, WEBAR_PACKAGE);
}

function addXRButton() {
  let xrButton = document.createElement('div');
  xrButton.id = 'sxr-button';
  xrButton.innerHTML = 'AR';

  let style = document.createElement('style');
  style.innerHTML = `
    #sxr-button {
      width: 54px;
      height: 54px;
      font-size: 22px;
      font-weight: normal;
      background-color: #706cf5;
      text-align: center;
      padding-top: 14px;
      color: white;
      border-radius: 27px;
      box-shadow: 0px 2px 10px #333;
      position: fixed;
      bottom: 20px;
      right: 20px;
      display: none;
      z-index: 1000;
    }
    #sxr-button:hover {
      cursor: pointer;
      filter: brightness(110%);
;
    }
    #sxr-button.disabled {
      opacity: 0.8;
    }
    `;
  document.body.appendChild(style);

  let body = document. getElementsByTagName('body')[0];
  body.appendChild(xrButton);

  let modelLinks = [];
  let links = document.querySelectorAll('a');
  console.log(links);
  for (let i = 0; i < links.length; i++) {
    let link = links[i];
    let href = link.href.toLowerCase();
    if (href.includes('.gltf') || href.includes('.glb')) {
      modelLinks.push(link);
    }
  }
  console.log(modelLinks.length + ' models found');

  if (modelLinks.length) {
    let modelLink = modelLinks[0];

    setTimeout(function(){
      xrButton.style.display = 'block';
      console.log('XR button added to page');
    }, 4000);

    xrButton.addEventListener('click', function(e){
      let href = modelLink.href;
      if (modelLink.dataset.scale)
       href += '?'+'scale='+modelLink.dataset.scale;
      let intentUrl = createARViewerIntentURI(href);
      console.log('Go to: ' + intentUrl);
      console.log('Equal:', intentUrl == modelLink.dataset.intent);
      window.location.href = intentUrl;
    });
  } else {
    console.log('No GLTF model links found');
  }
}

window.createIntentURI = createIntentURI;
window.createWebARIntentURI = createWebARIntentURI;
window.createARViewerIntentURI = createARViewerIntentURI;

init();

window.addEventListener('load', process);

})();