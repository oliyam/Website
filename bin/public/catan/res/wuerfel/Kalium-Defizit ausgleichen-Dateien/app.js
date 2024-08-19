$(document).ready(function(){
    $('.bxslider').bxSlider({
        slideWidth: 284,
        minSlides: 1,
        maxSlides: 3,
        slideMargin: 10,
        pager: false
    });





    fixMenu();
    // X = C (new width) * B (old height) / A (old width)
    window.onresize = function(event) {

        resize_videos();
        checkResize();

    };

    function resize_videos() {

        var setWidth = $('.ce_youtube.block').width(); // get ce_youtube block = width to be set
        if(setWidth > 500) setWidth = 500;
        var setHeight = (setWidth*500/600);

        $('.mejs-container').css('width', setWidth + 'px');
        $('.mejs-container').css('height', setHeight + 'px');
        $('.mejs-inner embed').attr('width', setWidth);
        $('.mejs-inner embed').attr('height', setHeight);


    }

    resize_videos();
});

function fixMenu() {


    if($('body').hasClass('mainpage') != true) {
        $('ul.level_2 li.is--active').parent().attr('style','display: block !important').parent().attr('style','display: block !important');
        $('ul.level_2 li.is--active').parent().find('li').attr('style','display: block !important');

        /* fix third level menu bug */

        $('ul.level_3 li.is--active').parent().parent().parent().attr('style','display: block !important').parent().attr('style','display: block !important');
        $('ul.level_3 li.is--active').parent().parent().parent().find('li').attr('style','display: block !important');

        /* fix third level menu bug */

        $('ul.level_4 li.is--active').parent().parent().parent().parent().parent().attr('style','display: block !important').parent().attr('style','display: block !important');
        $('ul.level_4 li.is--active').parent().parent().parent().parent().parent().find('li').attr('style','display: block !important');
    } else {
        if(currentLayout = 'desktop') {
            setTimeout(function () {
                $('.sidebar-main.is--left').css('display', 'none');
            }, 700);
        }
    }

}

var currentLayout = false;
function checkResize() {
    var currentWidth = document.body.clientWidth;

    if(currentWidth < 768) {
        if(currentLayout != 'mobile') {
            fixMenu();
            currentLayout = 'mobile';
        }
    } else {
        if(currentLayout != 'desktop') {
            fixMenu();
            currentLayout = 'desktop';
        }
    }

}

/* fix no is--active menu bug */
function isEmpty(str) {
    return (!str || 0 === str.length);
}
var checkFirstLevel = isEmpty($('ul.sidebar--navigation').find('li.is--active'));

if(checkFirstLevel) {
    $('ul.sidebar--navigation').find('li').attr('style','display: block !important')
} else {
}


$(document).ready(function() {

    // Show modal newsletter registration after 3 minutes
    setTimeout(function() {

        html = $('.newsletter--modal').html();

        if (getCookie('newsletter')) {
            return;
        }

        $.modal.open(html, {height: 285});

        setCookie('newsletter', 1);
    }, 180000);

    var cookieForwardTo  = 'https://www.drjacobs-shop.de/no-cookies.html';

    //enable cookies button
    $('.cp-enable').on('click', function() {
        setCookie('allowCookie', 1);
        $( ".cookie-bar" ).slideToggle( "slow" );
        $( ".cookie-overlay" ).remove();
    });

    //disable cookies button
    $('.cp-disable').on('click', function() {
        var loc = window.location;
        if (cookieForwardTo.search('http://') > -1 || cookieForwardTo.search('https://') > -1) {
            window.location = cookieForwardTo;
        } else {
            window.location = loc.protocol+"//"+loc.hostname+"/" + cookieForwardTo;
        }

    });


    /**
     * Checks if the user
     * is forwarded
     *
     * @returns {Boolean}
     */
    function isForwarded()
    {
        if (cookieForwardTo == window.location.href ||
            cookieForwardTo == window.location.pathname) {
            return true;
        }

        return false;
    }

    $('.evaluation-btn').on('click',
        function(event) {
            event.preventDefault();

            $('.evaluation-result').hide();
            $('.evaluation-result-top').hide();
            $('.evaluation-result-mid').hide();
            $('.evaluation-result-end').hide();

            var values = $('.evaluation-form').serializeArray();
            var score = 0;

            $.each(values, function () {
                score += parseInt(this.value);
            });

            $('.evaluation-score').first().text(score);
            $('.evaluation-result').show(500);

            if (score <= 9) {
                $('.evaluation-result-top').show(500);
                return;
            }

            if (score >= 10 && score <= 19)
            {
                $('.evaluation-result-mid').show(500);
                return;
            }

            if (score >= 20 && score <= 47) {
                $('.evaluation-result-end').show(500);
            }
        }
    );
});

function openSocialPopup(target)
{
    $.modal.open($('.'+target+'--popup').html(),{height:500});
}

function forwardSocialLink(target)
{
    var link = $('.shariff-button.'+target +' a:first-child').first();
    $.modal.close();
    //send feedback to server for logging here

    $.get( "IPLogger/log.php?kind=" + target , function( data ) {

    });

    if(target == 'mail') {
        window.location.href= link.attr("href");
    } else {
        link.click();
    }
}
