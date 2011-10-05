/*
 * jQuery Ultimate Carousel 2.0
 * Creates a carousel from a set of elements, allowing for pagers.
 *
 * Based on:
 * jQuery Infinite Carousel Plugin (http://code.google.com/p/jquery-infinite-carousel)
 */
;(function($){
	$.fn.carousel = function(options)
	{
		// iterate through each item
		this.addClass('carousel').each(function(i){
			// create instance
			var inst = $(this);

			// create carousel data object if not set
			if (inst.data('carousel') == null)
			{
				inst.data('carousel', {
					options: $.fn.carousel.options,
					initialized: false,
					animating: false
				});
			}

			// create carousel data object minipulation
			var carousel = inst.data('carousel');

			// merge options for carousel object with that of the supplied options
			carousel.options = $.extend(true, carousel.options, (typeof options == 'undefined') ? {} : options);

			// set easing mode to default if easing mode is not available
			carousel.options.easing = $.isFunction($.easing[carousel.options.easing]) ? carousel.options.easing : $.fn.carousel.options.easing;

			// initialize carousel for instance
			$.fn.carousel.init(inst);
		});

		return this;
	}

	// initilize carousel, making any nescessary calculations and adding nescessary markup
	$.fn.carousel.init = function(inst)
	{
		// ensure inst is a jQuery object
		var inst = $(inst);

		// get carousel object for instance
		var carousel = inst.data('carousel');
		var options = carousel.options;

		// set the carousel's width and height
		carousel.width = (typeof carousel.width == 'number' && carousel.width > 0) ? carousel.width : parseInt(inst.width());

		// continue only if carousel's width is greater than 0
		if (carousel.width > 0 && !carousel.initialized)
		{
			// get all slides within instance
			var slides = inst.children();

			// set references for slides
			carousel.slides = {
				current: 1,
				count: slides.length,
				width: 0,
				height: 0,
				outerWidth: 0,
				outerHeight: 0,
				shown: 1,
				template: $(slides.get(0)).clone().addClass('empty').empty()
			};

			// iterate through each slide
			slides.each(function(i){
				// get the dimensions of the current slide
				var width = parseInt($(this).width());
				var height = parseInt($(this).height());
				var outerWidth = parseInt($(this).outerWidth(true));
				var outerHeight = parseInt($(this).outerHeight(true));

				// increase the width/height values of slides if the current slide's is greater
				carousel.slides.width = (width > carousel.slides.width) ? width : carousel.slides.width;
				carousel.slides.height = (height > carousel.slides.height) ? height : carousel.slides.height;

				// increase the outerWidth/outerHeight values of slides if the current slide's is greater
				carousel.slides.outerWidth = (outerWidth > carousel.slides.outerWidth) ? outerWidth : carousel.slides.outerWidth;
				carousel.slides.outerHeight = (outerHeight > carousel.slides.outerHeight) ? outerHeight : carousel.slides.outerHeight;
			});

			// if more than one slide may be shown, determine slides shown based on width of carousel and outerWidth of slides
			if (inst.width() > carousel.slides.outerWidth)
			{
				carousel.slides.shown = Math.floor(inst.width() / carousel.slides.outerWidth);
			}

			// set the height of the instance
			inst.height(carousel.slides.outerHeight);

			// set the width of the instance
			inst.width(carousel.width);

			// continue if the number of slides is greater than the number of slides shown
			if (carousel.slides.count > carousel.slides.shown)
			{
				// add the viewport division if it does not exist and set it's width explicitly
				if (inst.parent('div.carousel-viewport').length <= 0)
				{
					inst.wrap('<div class="carousel-viewport"></div>').parent('.carousel-viewport').width((carousel.slides.outerWidth * carousel.slides.shown) - (carousel.slides.outerWidth - carousel.slides.width));
				}

				// set the width and height of all slides
				slides.width(carousel.slides.width);
				slides.height(carousel.slides.height);

				// set the width and height of the slide template
				carousel.slides.template.width(carousel.slides.width).height(carousel.slides.height);

				// calculate the number of empty slides to create
				carousel.slides.empty = (carousel.slides.shown - (carousel.slides.count % carousel.slides.shown)) % carousel.slides.shown;

				// add number of empty slides needed to create 
				for (i = 0; i < carousel.slides.empty; i++)
				{
					inst.append(carousel.slides.template.clone());
				}

				// add duplicate slides for purposes of facilitating an infinite scroll
				for (i = 0; i < carousel.slides.shown; i++)
				{
					inst.append($(slides[i]).clone());
				}

				// calculate the new width of the carousel based on the number of slides now present
				carousel.width = inst.children().length * carousel.slides.outerWidth;

				// set the width of the instance
				inst.width(carousel.width);

				// add the carousel pager
				$.fn.carousel.pagerAdd(inst);

				// set carousel as initialized
				carousel.initialized = true;
			}
		}
	};

	// add pager for carousel
	$.fn.carousel.pagerAdd = function(inst)
	{
		// ensure inst is a jQuery object
		var inst = $(inst);

		// get carousel object for instance
		var carousel = inst.data('carousel');
		var options = carousel.options;

		// add the pager list if it should be shown and it doesn't already exist
		if (options.pager.show && inst.siblings('ul.carousel-pager').length <= 0)
		{
			// create pager list
			var pager = $('<ul class="carousel-pager"></ul>').width((carousel.slides.outerWidth * carousel.slides.shown) - (carousel.slides.outerWidth - carousel.slides.width)).bind('click', function(e){
				// set references to target and the target's parent
				target = $(e.target);
				parentEl = target.parent();

				// check if the target is an anchor
				if (target.is('a'))
				{
					// prevent the default click behavior
					e.preventDefault();

					var fromPager = false;

					// handle the click based on whether it is a page button or prev/next button
					if (parentEl.hasClass('prev'))
					{
						i = carousel.slides.current - carousel.slides.shown;
					}
					else if (parentEl.hasClass('next'))
					{
						i = carousel.slides.current + carousel.slides.shown;
					}
					else
					{
						var page = $('li:not(.prev, .next)', this).index(parentEl) + 1;

						i = (page * carousel.slides.shown) - (carousel.slides.shown - 1);

						fromPager = true;
					}

					$.fn.carousel.goTo(inst, i, fromPager);
				}
			});

			// create template for pager button
			var pagerTemplate = $('<li><a href="#"></a></li>');

			// calculate number of pages
			carousel.pages = Math.ceil(carousel.slides.count / carousel.slides.shown);

			// add page button for each page
			for (i = 1; i <= carousel.pages; i++)
			{
				// build the button
				var pageButton = pagerTemplate.clone().find('a').parent();

				// add active class to first pager button
				if (i == 1)
				{
					pageButton.addClass('active');
				}

				// add the button
				pager.append(pageButton);
			}

			// add previous button to pager
			if (options.pager.prevButton.show)
			{
				// build the button
				var pagerPrev = pagerTemplate.clone().addClass('prev').find('a').html(options.pager.prevButton.text).parent();

				if (options.pager.nexPrevPosition == 'after')
				{
					// add the button
					pager.append(pagerPrev);
				}
				else
				{
					// add the button
					pager.prepend(pagerPrev);
				}
			}

			// add next button to pager
			if (options.pager.nextButton.show)
			{
				// build the button
				var pagerNext = pagerTemplate.clone().addClass('next').find('a').html(options.pager.nextButton.text).parent();

				// add the button
				pager.append(pagerNext);
			}

			// add the pager
			if (options.pager.position == 'before')
			{
				inst.parent('.carousel-viewport').before(pager);
			}
			else
			{
				inst.parent('.carousel-viewport').after(pager);
			}

			// create reference to pager
			carousel.pager = inst.addClass('carousel-with-pager').parent('.carousel-viewport').siblings('ul.carousel-pager');
		}
	}

	// advance to a specific item within the carousel
	$.fn.carousel.goTo = function(inst, i, fromPager)
	{
		// define default fromPager value
		var fromPager = (typeof fromPager == 'undefined') ? false : fromPager;

		// ensure inst is a jQuery object
		var inst = $(inst);

		// get carousel object for instance
		var carousel = inst.data('carousel');
		var options = carousel.options;

		// set index to valid slide index
        var firstToLast = false;
        var lastToFirst = false;

		if (i > carousel.slides.count)
		{
			i = i - carousel.slides.count - carousel.slides.empty;
            lastToFirst = true;
		}
		else if (i <= 0)
		{
			i = i + carousel.slides.count + carousel.slides.empty;
            firstToLast = true;
		}

		// only animate if the carousel is not animating and the current slide is not the same as requested
		if (!(carousel.slides.current == i) && !carousel.animating)
		{
			var distance = {
				left: {
					slides: carousel.slides.current - i
				},
				right: {
					slides: carousel.slides.count + carousel.slides.empty + i - carousel.slides.current
				}
			}

			if (i > carousel.slides.current)
			{
				distance.left.slides = carousel.slides.count + carousel.slides.empty - i + carousel.slides.current;
				distance.right.slides = i - carousel.slides.current;
			}

			distance.left.pages = Math.ceil(distance.left.slides / carousel.slides.shown);
			distance.right.pages = Math.ceil(distance.right.slides / carousel.slides.shown);

			var currentPage = Math.ceil(carousel.slides.current / carousel.slides.shown);
			var goToPage = Math.ceil(i / carousel.slides.shown);
			var animateProperties = {};

			// animate right
			if (((goToPage > currentPage && distance.right.pages < carousel.pages) || (distance.right.pages == 1 && currentPage == carousel.pages && !fromPager) && !(firstToLast || (!firstToLast && !lastToFirst))) && !(currentPage == 1 && distance.left.pages == 1 && !fromPager && !(lastToFirst || (!firstToLast && !lastToFirst))))
			{	
				if (carousel.slides.current <= carousel.slides.shown)
				{
					var left = - (carousel.slides.outerWidth * (carousel.slides.current - 1));
				}

				var rightAnimate = '-=' + (carousel.slides.outerWidth * distance.right.slides);
				animateProperties = {left:rightAnimate}
			}
			// animate left
			else
			{
				if (carousel.slides.current <= carousel.slides.shown)
				{
					var left = - (carousel.slides.outerWidth * (carousel.slides.count + carousel.slides.empty + carousel.slides.current - 1));
				}

				var leftAnimate = '+=' + (carousel.slides.outerWidth * distance.left.slides);
				animateProperties = {left:leftAnimate}
			}

			// set initial state if left value is set
			if (typeof left != 'undefined')
			{
				inst.css('left', left + 'px');
			}

			// set the active pager item
			if (options.pager.show)
			{
				eq = Math.ceil(i / carousel.slides.shown) - 1;

				$('li:not(.prev, .next)', carousel.pager).removeClass('active').filter(':eq(' + eq + ')').addClass('active');
			}

			// set slider to animating
			carousel.animating = true;

			// call slideStart function
			carousel.options.slideStart(inst);

			// animate slider
			inst.animate(animateProperties, options.duration, options.easing, function(){
				// set slider to not animating
				carousel.animating = false;

				// call slideComplete function
				carousel.options.slideComplete(inst);
			});

			// set first slide reference
			carousel.slides.current = i;
		}
	};

	// set default options
	$.fn.carousel.options = {
		pager: {
			show: true,
			position: 'before',
			nexPrevPosition: '',
			prevButton: {
				show: true,
				text: 'Previous'
			},
			nextButton: {
				show: true,
				text: 'Next'
			}
		},
		slideStart: function(inst){},
		slideComplete: function(inst){},
		easing: 'swing',
		duration: 300
	};
})(jQuery);