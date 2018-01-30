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

var version = 0.1;

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
  var OSSupport = androidVersion > ARCORE_VERSION_MIN;
  var deviceValid = true; // TODO: fill out
  return OSSupport && deviceValid;
}

function init() {
  console.log('ARShim: v'+version);
  console.log('isSI: ' + isSI);
  console.log('android: ' + androidVersion());
  console.log('ARCore support: ' + supportsARCore());

  // process
  // TODO: modify selector
  var els = document.querySelectorAll('a[data-model]');

  // modify links
  for (var i = 0; i < els.length; i++) {
    var el = els[i];

    var data = {};
    data.href = el.getAttribute('href');
    data.id = data.href.split('/').pop();
    data.scale = el.getAttribute('data-scale');
    data.intentUrl = createIntentURI();

    console.log(data);
  }

}

const ARVIEWER_PACKAGE = 'com.sec.android.app.sbrowser.arviewer';

// format:
// intent://scan/#Intent;scheme=zxing;package=com.google.zxing.client.android;end
// intent://scan/#Intent;scheme=zxing;package=com.google.zxing.client.android;S.browser_fallback_url=http%3A%2F%2Fzxing.org;end
function createIntentURI(package, uri, params) {
  return "intent://#Intent;package="+ARVIEWER_PACKAGE+';end';
}

window.onload = init;

})();