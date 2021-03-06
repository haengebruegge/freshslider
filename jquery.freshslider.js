// jquery.freshslider v 1.2.4

(function ($) {

    'use strict';

    $.fn.freshslider = function (options) {
        var i;

        var slideshow = this;
        var slidesInner = slideshow.find('.slides-inner:first');
        var items = slidesInner.children('.slide-item');
        var itemsLength = items.length -1;
        var itemPos = {
            0: 0
        };

        var navTypes = ['arrows', 'bullets'];
        var animationTimer;
        var active = 0;
        var navBullets;
        var navArrows;

        var itemSlugs = [];

        var defaults = {
            isActiveClass: 'freshslider-active',
            animation: false,
            fadingSpeed: 400,
            timeout: 8000,
            autoSlide: false,
            cycle: false,
            navType: [navTypes[0]],
            navContainer: slideshow,
            history: window.history,
            historyOn: true,
            historyParam: 'slide',
            firstSlide: function () { return true; },
            lastSlide: function () { return true; },
            ready: function () { return true; }
        };

        var S = $.extend({}, defaults, options);

        var init = function () {
            // to check is plugin is active on this element
            slideshow.addClass(S.isActiveClass);

            _resize();

            // set slide by url parameters
            if (_isHistory()) {
                var param = $.url().param(S.historyParam);

                items.each(function (index) {
                    var data = $(items[index]).data();
                    if (data.id) {
                        itemSlugs.push(data.id);
                    } else {
                        itemSlugs.push('' + (index + 1));
                    }
                });

                if (param) {
                    /* need to use purljs, because on on intial load historyjs
                     * can not see url params. */
                    active = parseInt(itemSlugs.indexOf(param), 10);
                }

                if (active > itemsLength || active <= 0) {
                    active = 0;
                }

                _moveItem();
            } else {
                // set current slide to active
                $(items[active]).addClass('active');
            }

            // check if S.navType is string and and convert it to an array.
            if (typeof S.navType === 'string') {
                S.navType = [S.navType];
            }

            _createArrows();
            _createBullets();

            // reset height to prevent ugly page loading
            slidesInner.parent().css({
                height: 'auto',
                overflow: 'visible'
            });

            $(window).resize(function () {
                _resize();
            });

            // AUTOSLIDE
            setTimer();

            slidesInner.on('ready', items, function () {
                if (typeof S.ready === 'function') {
                    S.ready();
                }
            });
        };

        var timer = function () {
            if (active === itemsLength) {
                if (S.cycle) {
                    reset();
                } else {
                    clearTimeout(animationTimer);
                    return true;
                }
            } else {
                moveToNext();
            }

            animationTimer = window.setTimeout(timer, S.timeout);
        };

        //set timer - shorthand
        var setTimer = function () {
            // AUTOSLIDE
            if (S.autoSlide) {
                clearTimeout(animationTimer);
                animationTimer = window.setTimeout(timer, S.timeout);
            }
        };

        // slide to the previus item
        var moveToPrev = function (next, prev) {
            _prevItem();

            if (_isNavType(S.navType[0])) {
                _checkPrev(prev);
                _checkNext(next);
            }
        };

        // slide to the next item
        var moveToNext = function (next, prev) {
            _nextItem();

            if (_isNavType(S.navType[0])) {
                _checkPrev(prev);
                _checkNext(next);
            }
        };

        var reset = function () {
            active = 0;

            _move(itemPos[0]);

            _setBulletActive();
        };

        var _resize = function () {
            var width = slideshow.width();

            items.width(width);
            slideshow.children('.slides').css('width', width);
            slidesInner.css({
                'width': width * (itemsLength + 1),
                'margin-left': -(width * active)
            });

            // set the start position of each element by getting the width
            for (i = 1; i <= itemsLength; i++) {
                itemPos[i] = $(items[i]).width() + itemPos[i - 1];
            }
        };

        // moves to the previous item, neccessary for position calculation
        var _prevItem = function () {
            if ((active - 1) >= 0) {
                active = active - 1;

                if (active === 0 && typeof S.firstSlide === 'function') {
                    S.firstSlide();
                }
            } else {
                if (S.cycle) {
                    active = itemsLength;
                } else {
                    active = 0;
                }
            }

            _moveItem();
        };

        // moves to the next item, neccessary for position calculation
        var _nextItem = function () {
            if ((active + 1) <= itemsLength) {
                active = active + 1;

                if (active === itemsLength && typeof S.lastSlide === 'function') {
                    S.lastSlide();
                }
            } else {
                if (S.cycle) {
                    active = 0;
                } else {
                    active = itemsLength;
                }
            }

            _moveItem();
        };

        // common method to move a item
        var _moveItem = function () {
            _move(-itemPos[active]);

            var item = $(items[active]);

            var H = S.history;
            if (_isHistory()) {
                var slug = itemSlugs[active];
                var data = item.data();

                if (data.title) {
                    document.title = data.title
                        + slideshow.data('title-template');
                }

                H.pushState(
                    {'slide':slug},
                    document.title,
                    ['?', S.historyParam, '=', slug].join('')
                );
            }

            slidesInner.children('.slide-item.active').removeClass('active');
            item.addClass('active');

            _setBulletActive();
        };

        var _move = function (movement) {
            // ANIMATION
            if (S.animation) {
                slidesInner.stop(true, true).animate(
                    {'marginLeft': movement},
                    S.fadingSpeed,
                    S.animation
                );
            } else {
                slidesInner.css('marginLeft', movement);
            }
        };

        var _checkPrev = function () {
            if (active <= 0 && !S.cycle) {
                slideshow.addClass('nav-prev-hidden');
            } else {
                slideshow.removeClass('nav-prev-hidden');
            }
        };

        var _checkNext = function () {
            if (active >= itemsLength && !S.cycle) {
                slideshow.addClass('nav-next-hidden');
            } else {
                slideshow.removeClass('nav-next-hidden');
            }
        };

        var _isNavType = function (t) {
            if (S.navType.indexOf(t) > -1) {
                return true;
            }

            return false;
        };

        var _isHistory = function () {
            var isPurl = typeof $.url === 'function';
            if (S.historyOn && S.history.enabled && isPurl) {
                return true;
            }

            return false;
        };

        var _setBulletActive = function () {
            // set active bullet
            if (_isNavType(S.navType[1])) {
                var a = S.navContainer.find('.bullet');
                a.removeClass('active');
                $(a[active]).addClass('active');
            }
        };

        var _createArrows = function () {
            // ARROWS
            if (_isNavType(S.navType[0])) {
                navArrows = $('<ul class="slider-nav arrows"/>');

                var navArrowsItems = [];
                $.each(['prev', 'next'], function (key, name) {
                    navArrowsItems.push($('<li/>').append($('<a/>', {
                        'class': 'arrow ' + name,
                        'title': 'Slide to ' + name,
                        'text': name
                    })));
                });

                S.navContainer
                    .remove('.slider-nav.arrows')
                    .append(navArrows.append(navArrowsItems));

                var navPrev = navArrows.find('.prev');
                var navNext = navArrows.find('.next');

                _checkPrev(navPrev);
                _checkNext(navNext);

                navPrev.on('click', function () {
                    moveToPrev(navNext, navPrev);
                    setTimer();

                    return false;
                });

                navNext.on('click', function () {
                    moveToNext(navNext, navPrev);
                    setTimer();

                    return false;
                });
            }
        };

        var _createBullets = function () {
            // BULLETS
            if (_isNavType(S.navType[1])) {
                navBullets = $('<ol class="slider-nav bullets"/>');

                $.each(items, function (index) {
                    var text = 'Slide ' + (index + 1);
                    var bullet = $('<li />').append($('<a/>', {
                        'class': 'bullet',
                        'title': text,
                        'text': text,
                        'href': '?' + S.historyParam + '=' + (index + 1)
                    }));

                    bullet.appendTo(navBullets);
                });

                navBullets.on('click', 'a.bullet', function (e) {
                    e.preventDefault();

                    active = $(this).parent().index();
                    _moveItem();
                    setTimer();

                    return false;
                });

                navBullets.appendTo(
                    slideshow.find('.slider-nav-wrapper:first')
                );

                _setBulletActive();
            }
        };

        var _createThumbs = function () {
            // THUMBS
            if (_isNavType('thumbs')) {
                navThumbs = $('<ol class="slider-nav thumbs"/>');

                $.each(items, function (index) {
                    var thumb = $('<li />')
                        .append($('<a/>', {
                            'class': 'thumb',
                            'href': '?' + S.historyParam + '=' + (index + 1)
                        }))
                        .append($('<img />', {
                            'src': '' // path to the image
                        }));

                    thumb.appendTo(navThumbs);
                });

                navThumbs.on('click', 'a.thumb', function (e) {
                    e.preventDefault();

                    active = $(this).parent().index();
                    _moveItem();
                    setTimer();

                    return false;
                });

                navBullets.appendTo(
                    slideshow.find('.slider-nav-wrapper:first')
                );

                _setBulletActive();
            }
        };

        // start the machine...
        init();
    };

})(jQuery);
