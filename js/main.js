/* ========================================================================= */
/*	Preloader
/* ========================================================================= */

jQuery(window).load(function () {

    $("#preloader").fadeOut("slow");

});

/* ========================================================================= */
/*  Contact Us Form
/* ========================================================================= */

/* ========================================================================= */
/*  Welcome Section Slider (REMOVED: Replaced by Modern Luxury Hero)
/* ========================================================================= */



$(document).ready(function () {

    /* ========================================================================= */
    /*	Menu item highlighting
    /* ========================================================================= */

    jQuery('#nav').singlePageNav({
        offset: jQuery('#nav').outerHeight(),
        filter: ':not(.external)',
        speed: 2000,
        currentClass: 'current',
        easing: 'easeInOutExpo',
        updateHash: true,
        beforeStart: function () {
            console.log('begin scrolling');
        },
        onComplete: function () {
            console.log('done scrolling');
        }
    });

    $(window).scroll(function () {
        if ($(window).scrollTop() > 400) {
            $(".navbar-brand a").css("color", "#fff");
            $("#navigation").removeClass("animated-header");
        } else {
            $(".navbar-brand a").css("color", "inherit");
            $("#navigation").addClass("animated-header");
        }
    });

    /* ========================================================================= */
    /*	Fix Slider Height (REMOVED: Replaced by CSS vh units)
    /* ========================================================================= */



    $("#works, #testimonial").owlCarousel({
        navigation: true,
        pagination: false,
        slideSpeed: 700,
        paginationSpeed: 400,
        singleItem: true,
        navigationText: ["<i class='fa fa-angle-left fa-lg'></i>", "<i class='fa fa-angle-right fa-lg'></i>"]
    });


    /* ========================================================================= */
    /*	Featured Project Lightbox
    /* ========================================================================= */

    $(".fancybox").fancybox({
        padding: 0,

        openEffect: 'elastic',
        openSpeed: 650,

        closeEffect: 'elastic',
        closeSpeed: 550,

        closeClick: true,

        beforeShow: function () {
            this.title = $(this.element).attr('title');
            this.title = '<h3>' + this.title + '</h3>' + '<p>' + $(this.element).parents('.portfolio-item').find('img').attr('alt') + '</p>';
        },

        helpers: {
            title: {
                type: 'inside'
            },
            overlay: {
                css: {
                    'background': 'rgba(0,0,0,0.8)'
                }
            }
        }
    });

});


/* ==========  START GOOGLE MAP ========== */

// When the window has finished loading create our google map below
// google.maps.event.addDomListener(window, 'load', init);

// function init() {
// Basic options for a simple Google Map
// For more options see: https://developers.google.com/maps/documentation/javascript/reference#MapOptions

// var myLatLng = new google.maps.LatLng(22.402789, 91.822156);

// var mapOptions = {
//     zoom: 15,
//     center: myLatLng,
//     disableDefaultUI: true,
//     scrollwheel: false,
//     navigationControl: true,
//     mapTypeControl: false,
//     scaleControl: false,
//     draggable: true,

// How you would like to style the map. 
// This is where you would paste any style found on Snazzy Maps.
//     styles: [{
//         featureType: 'water',
//         stylers: [{
//             color: '#46bcec'
//         }, {
//             visibility: 'on'
//         }]
//     }, {
//         featureType: 'landscape',
//         stylers: [{
//             color: '#f2f2f2'
//         }]
//     }, {
//         featureType: 'road',
//         stylers: [{
//             saturation: -100
//         }, {
//             lightness: 45
//         }]
//     }, {
//         featureType: 'road.highway',
//         stylers: [{
//             visibility: 'simplified'
//         }]
//     }, {
//         featureType: 'road.arterial',
//         elementType: 'labels.icon',
//         stylers: [{
//             visibility: 'off'
//         }]
//     }, {
//         featureType: 'administrative',
//         elementType: 'labels.text.fill',
//         stylers: [{
//             color: '#444444'
//         }]
//     }, {
//         featureType: 'transit',
//         stylers: [{
//             visibility: 'off'
//         }]
//     }, {
//         featureType: 'poi',
//         stylers: [{
//             visibility: 'off'
//         }]
//     }]
// };

// Get the HTML DOM element that will contain your map 
// We are using a div with id="map" seen below in the <body>
// var mapElement = document.getElementById('map-canvas');

// Create the Google Map using our element and options defined above
// var map = new google.maps.Map(mapElement, mapOptions);

// Let's also add a marker while we're at it
//     var marker = new google.maps.Marker({
//         position: new google.maps.LatLng(22.402789, 91.822156),
//         map: map,
// 		icon: 'img/icons/map-marker.png',
//     });
// }

// ========== END GOOGLE MAP ========== //

/* ========================================================================= */
/*	Tenant Feedback Slider (Modern)
/* ========================================================================= */
$(function () {
    const slides = $('.feedback-slide');
    const dots = $('.feedback-dots .dot');
    let currentSlide = 0;
    let slideInterval;

    function showSlide(index) {
        slides.removeClass('active');
        dots.removeClass('active');

        slides.eq(index).addClass('active');
        dots.eq(index).addClass('active');
        currentSlide = index;
    }

    function nextSlide() {
        let next = (currentSlide + 1) % slides.length;
        showSlide(next);
    }

    function startSlider() {
        if (slides.length > 0) {
            slideInterval = setInterval(nextSlide, 5000);
        }
    }

    function resetSlider() {
        clearInterval(slideInterval);
        startSlider();
    }

    dots.on('click', function () {
        const index = $(this).index();
        showSlide(index);
        resetSlider();
    });

    // Initialize
    if (slides.length > 0) {
        showSlide(0);
        startSlider();
    }
});

