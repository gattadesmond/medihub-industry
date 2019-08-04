var htmlElement = document.documentElement;
var bodyElement = document.body;
var pageOverlay = document.getElementById("overlay");

var FOODY = {
  // _API: "https://publicapi.vienthonga.vn",
  // _URL: "https://vienthonga.vn"
};

var Layout = (function() {

  var setUserAgent = function() {

    var userAgent = navigator.userAgent || navigator.vendor || window.opera;
    // Windows Phone must come first because its UA also contains "Android"
    if (/windows phone/i.test(userAgent)) {
      bodyElement.classList.add("window-phone");
      return;
    }

    if (/android/i.test(userAgent)) {
      bodyElement.classList.add("android");
      return;
    }

    // iOS detection from: http://stackoverflow.com/a/9039885/177710
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      bodyElement.classList.add("ios");
      return;
    }
  };

  var viewportHeight = function() {
    // First we get the viewport height and we multiple it by 1% to get a value for a vh unit
    let vh = window.innerHeight * 0.01;
// Then we set the value in the --vh custom property to the root of the document
    document.documentElement.style.setProperty('--vh', `${vh}px`);


    // We listen to the resize event
    window.addEventListener('resize', () => {
      // We execute the same script as before
      let vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    });


  };


  var scrollToTop = function() {
    var scrollTop = $("#scrollToTop");

    $(window).on("scroll", function() {
      if ($(window).scrollTop() > 200) {
        scrollTop.addClass("active");
      } else {
        scrollTop.removeClass("active");
      }
    });

    scrollTop.click(function() {
      $("body, html").animate(
        {
          scrollTop: 0
        },
        500
      );
    });
  };

  return {
    init: function() {
      setUserAgent();
      scrollToTop();
    }
  };
})();

$(document).ready(function() {
  Layout.init();

});


