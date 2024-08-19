/*! Picturefill - v2.2.0 - 2014-10-30
* http://scottjehl.github.io/picturefill
* Copyright (c) 2014 https://github.com/scottjehl/picturefill/blob/master/Authors.txt; Licensed MIT */
/*! matchMedia() polyfill - Test a CSS media type/query in JS. Authors & copyright (c) 2012: Scott Jehl, Paul Irish, Nicholas Zakas, David Knight. Dual MIT/BSD license */

window.matchMedia || (window.matchMedia = function() {
	"use strict";

	// For browsers that support matchMedium api such as IE 9 and webkit
	var styleMedia = (window.styleMedia || window.media);

	// For those that don't support matchMedium
	if (!styleMedia) {
		var style       = document.createElement('style'),
			script      = document.getElementsByTagName('script')[0],
			info        = null;

		style.type  = 'text/css';
		style.id    = 'matchmediajs-test';

		script.parentNode.insertBefore(style, script);

		// 'style.currentStyle' is used by IE <= 8 and 'window.getComputedStyle' for all other browsers
		info = ('getComputedStyle' in window) && window.getComputedStyle(style, null) || style.currentStyle;

		styleMedia = {
			matchMedium: function(media) {
				var text = '@media ' + media + '{ #matchmediajs-test { width: 1px; } }';

				// 'style.styleSheet' is used by IE <= 8 and 'style.textContent' for all other browsers
				if (style.styleSheet) {
					style.styleSheet.cssText = text;
				} else {
					style.textContent = text;
				}

				// Test if media query is true or false
				return info.width === '1px';
			}
		};
	}

	return function(media) {
		return {
			matches: styleMedia.matchMedium(media || 'all'),
			media: media || 'all'
		};
	};
}());
/*! Picturefill - Responsive Images that work today.
*  Author: Scott Jehl, Filament Group, 2012 ( new proposal implemented by Shawn Jansepar )
*  License: MIT/GPLv2
*  Spec: http://picture.responsiveimages.org/
*/
(function( w, doc, image ) {
	// Enable strict mode
	"use strict";

	// If picture is supported, well, that's awesome. Let's get outta here...
	if ( w.HTMLPictureElement ) {
		w.picturefill = function() { };
		return;
	}

	// HTML shim|v it for old IE (IE9 will still need the HTML video tag workaround)
	doc.createElement( "picture" );

	// local object for method references and testing exposure
	var pf = {};

	// namespace
	pf.ns = "picturefill";

	// srcset support test
	(function() {
		pf.srcsetSupported = "srcset" in image;
		pf.sizesSupported = "sizes" in image;
	})();

	// just a string trim workaround
	pf.trim = function( str ) {
		return str.trim ? str.trim() : str.replace( /^\s+|\s+$/g, "" );
	};

	// just a string endsWith workaround
	pf.endsWith = function( str, suffix ) {
		return str.endsWith ? str.endsWith( suffix ) : str.indexOf( suffix, str.length - suffix.length ) !== -1;
	};

	/**
	 * Shortcut method for https://w3c.github.io/webappsec/specs/mixedcontent/#restricts-mixed-content ( for easy overriding in tests )
	 */
	pf.restrictsMixedContent = function() {
		return w.location.protocol === "https:";
	};
	/**
	 * Shortcut method for matchMedia ( for easy overriding in tests )
	 */

	pf.matchesMedia = function( media ) {
		return w.matchMedia && w.matchMedia( media ).matches;
	};

	// Shortcut method for `devicePixelRatio` ( for easy overriding in tests )
	pf.getDpr = function() {
		return ( w.devicePixelRatio || 1 );
	};

	/**
	 * Get width in css pixel value from a "length" value
	 * http://dev.w3.org/csswg/css-values-3/#length-value
	 */
	pf.getWidthFromLength = function( length ) {
		// If a length is specified and doesn’t contain a percentage, and it is greater than 0 or using `calc`, use it. Else, use the `100vw` default.
		length = length && length.indexOf( "%" ) > -1 === false && ( parseFloat( length ) > 0 || length.indexOf( "calc(" ) > -1 ) ? length : "100vw";

		/**
		 * If length is specified in  `vw` units, use `%` instead since the div we’re measuring
		 * is injected at the top of the document.
		 *
		 * TODO: maybe we should put this behind a feature test for `vw`?
		 */
		length = length.replace( "vw", "%" );

		// Create a cached element for getting length value widths
		if ( !pf.lengthEl ) {
			pf.lengthEl = doc.createElement( "div" );

			// Positioning styles help prevent padding/margin/width on `html` or `body` from throwing calculations off.
			pf.lengthEl.style.cssText = "border:0;display:block;font-size:1em;left:0;margin:0;padding:0;position:absolute;visibility:hidden";
		}

		pf.lengthEl.style.width = length;

		doc.body.appendChild(pf.lengthEl);

		// Add a class, so that everyone knows where this element comes from
		pf.lengthEl.className = "helper-from-picturefill-js";

		if ( pf.lengthEl.offsetWidth <= 0 ) {
			// Something has gone wrong. `calc()` is in use and unsupported, most likely. Default to `100vw` (`100%`, for broader support.):
			pf.lengthEl.style.width = doc.documentElement.offsetWidth + "px";
		}

		var offsetWidth = pf.lengthEl.offsetWidth;

		doc.body.removeChild( pf.lengthEl );

		return offsetWidth;
	};

	// container of supported mime types that one might need to qualify before using
	pf.types =  {};

	// Add support for standard mime types
	pf.types[ "image/jpeg" ] = true;
	pf.types[ "image/gif" ] = true;
	pf.types[ "image/png" ] = true;

	// test svg support
	pf.types[ "image/svg+xml" ] = doc.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#Image", "1.1");

	// test webp support, only when the markup calls for it
	pf.types[ "image/webp" ] = function() {
		// based on Modernizr's lossless img-webp test
		// note: asynchronous
		var type = "image/webp";

		image.onerror = function() {
			pf.types[ type ] = false;
			picturefill();
		};
		image.onload = function() {
			pf.types[ type ] = image.width === 1;
			picturefill();
		};
		image.src = "data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=";
	};

	/**
	 * Takes a source element and checks if its type attribute is present and if so, supported
	 * Note: for type tests that require a async logic,
	 * you can define them as a function that'll run only if that type needs to be tested. Just make the test function call picturefill again when it is complete.
	 * see the async webp test above for example
	 */
	pf.verifyTypeSupport = function( source ) {
		var type = source.getAttribute( "type" );
		// if type attribute exists, return test result, otherwise return true
		if ( type === null || type === "" ) {
			return true;
		} else {
			// if the type test is a function, run it and return "pending" status. The function will rerun picturefill on pending elements once finished.
			if ( typeof( pf.types[ type ] ) === "function" ) {
				pf.types[ type ]();
				return "pending";
			} else {
				return pf.types[ type ];
			}
		}
	};

	// Parses an individual `size` and returns the length, and optional media query
	pf.parseSize = function( sourceSizeStr ) {
		var match = /(\([^)]+\))?\s*(.+)/g.exec( sourceSizeStr );
		return {
			media: match && match[1],
			length: match && match[2]
		};
	};

	// Takes a string of sizes and returns the width in pixels as a number
	pf.findWidthFromSourceSize = function( sourceSizeListStr ) {
		// Split up source size list, ie ( max-width: 30em ) 100%, ( max-width: 50em ) 50%, 33%
		//                            or (min-width:30em) calc(30% - 15px)
		var sourceSizeList = pf.trim( sourceSizeListStr ).split( /\s*,\s*/ ),
			winningLength;

		for ( var i = 0, len = sourceSizeList.length; i < len; i++ ) {
			// Match <media-condition>? length, ie ( min-width: 50em ) 100%
			var sourceSize = sourceSizeList[ i ],
				// Split "( min-width: 50em ) 100%" into separate strings
				parsedSize = pf.parseSize( sourceSize ),
				length = parsedSize.length,
				media = parsedSize.media;

			if ( !length ) {
				continue;
			}
			if ( !media || pf.matchesMedia( media ) ) {
				// if there is no media query or it matches, choose this as our winning length
				// and end algorithm
				winningLength = length;
				break;
			}
		}

		// pass the length to a method that can properly determine length
		// in pixels based on these formats: http://dev.w3.org/csswg/css-values-3/#length-value
		return pf.getWidthFromLength( winningLength );
	};

	pf.parseSrcset = function( srcset ) {
		/**
		 * A lot of this was pulled from Boris Smus’ parser for the now-defunct WHATWG `srcset`
		 * https://github.com/borismus/srcset-polyfill/blob/master/js/srcset-info.js
		 *
		 * 1. Let input (`srcset`) be the value passed to this algorithm.
		 * 2. Let position be a pointer into input, initially pointing at the start of the string.
		 * 3. Let raw candidates be an initially empty ordered list of URLs with associated
		 *    unparsed descriptors. The order of entries in the list is the order in which entries
		 *    are added to the list.
		 */
		var candidates = [];

		while ( srcset !== "" ) {
			srcset = srcset.replace( /^\s+/g, "" );

			// 5. Collect a sequence of characters that are not space characters, and let that be url.
			var pos = srcset.search(/\s/g),
				url, descriptor = null;

			if ( pos !== -1 ) {
				url = srcset.slice( 0, pos );

				var last = url.slice(-1);

				// 6. If url ends with a U+002C COMMA character (,), remove that character from url
				// and let descriptors be the empty string. Otherwise, follow these substeps
				// 6.1. If url is empty, then jump to the step labeled descriptor parser.

				if ( last === "," || url === "" ) {
					url = url.replace( /,+$/, "" );
					descriptor = "";
				}
				srcset = srcset.slice( pos + 1 );

				// 6.2. Collect a sequence of characters that are not U+002C COMMA characters (,), and
				// let that be descriptors.
				if ( descriptor === null ) {
					var descpos = srcset.indexOf( "," );
					if ( descpos !== -1 ) {
						descriptor = srcset.slice( 0, descpos );
						srcset = srcset.slice( descpos + 1 );
					} else {
						descriptor = srcset;
						srcset = "";
					}
				}
			} else {
				url = srcset;
				srcset = "";
			}

			// 7. Add url to raw candidates, associated with descriptors.
			if ( url || descriptor ) {
				candidates.push({
					url: url,
					descriptor: descriptor
				});
			}
		}
		return candidates;
	};

	pf.parseDescriptor = function( descriptor, sizesattr ) {
		// 11. Descriptor parser: Let candidates be an initially empty source set. The order of entries in the list
		// is the order in which entries are added to the list.
		var sizes = sizesattr || "100vw",
			sizeDescriptor = descriptor && descriptor.replace( /(^\s+|\s+$)/g, "" ),
			widthInCssPixels = pf.findWidthFromSourceSize( sizes ),
			resCandidate;

			if ( sizeDescriptor ) {
				var splitDescriptor = sizeDescriptor.split(" ");

				for (var i = splitDescriptor.length - 1; i >= 0; i--) {
					var curr = splitDescriptor[ i ],
						lastchar = curr && curr.slice( curr.length - 1 );

					if ( ( lastchar === "h" || lastchar === "w" ) && !pf.sizesSupported ) {
						resCandidate = parseFloat( ( parseInt( curr, 10 ) / widthInCssPixels ) );
					} else if ( lastchar === "x" ) {
						var res = curr && parseFloat( curr, 10 );
						resCandidate = res && !isNaN( res ) ? res : 1;
					}
				}
			}
		return resCandidate || 1;
	};

	/**
	 * Takes a srcset in the form of url/
	 * ex. "images/pic-medium.png 1x, images/pic-medium-2x.png 2x" or
	 *     "images/pic-medium.png 400w, images/pic-medium-2x.png 800w" or
	 *     "images/pic-small.png"
	 * Get an array of image candidates in the form of
	 *      {url: "/foo/bar.png", resolution: 1}
	 * where resolution is http://dev.w3.org/csswg/css-values-3/#resolution-value
	 * If sizes is specified, resolution is calculated
	 */
	pf.getCandidatesFromSourceSet = function( srcset, sizes ) {
		var candidates = pf.parseSrcset( srcset ),
			formattedCandidates = [];

		for ( var i = 0, len = candidates.length; i < len; i++ ) {
			var candidate = candidates[ i ];

			formattedCandidates.push({
				url: candidate.url,
				resolution: pf.parseDescriptor( candidate.descriptor, sizes )
			});
		}
		return formattedCandidates;
	};

	/**
	 * if it's an img element and it has a srcset property,
	 * we need to remove the attribute so we can manipulate src
	 * (the property's existence infers native srcset support, and a srcset-supporting browser will prioritize srcset's value over our winning picture candidate)
	 * this moves srcset's value to memory for later use and removes the attr
	 */
	pf.dodgeSrcset = function( img ) {
		if ( img.srcset ) {
			img[ pf.ns ].srcset = img.srcset;
			img.removeAttribute( "srcset" );
		}
	};

	// Accept a source or img element and process its srcset and sizes attrs
	pf.processSourceSet = function( el ) {
		var srcset = el.getAttribute( "srcset" ),
			sizes = el.getAttribute( "sizes" ),
			candidates = [];

		// if it's an img element, use the cached srcset property (defined or not)
		if ( el.nodeName.toUpperCase() === "IMG" && el[ pf.ns ] && el[ pf.ns ].srcset ) {
			srcset = el[ pf.ns ].srcset;
		}

		if ( srcset ) {
			candidates = pf.getCandidatesFromSourceSet( srcset, sizes );
		}
		return candidates;
	};

	pf.applyBestCandidate = function( candidates, picImg ) {
		var candidate,
			length,
			bestCandidate;

		candidates.sort( pf.ascendingSort );

		length = candidates.length;
		bestCandidate = candidates[ length - 1 ];

		for ( var i = 0; i < length; i++ ) {
			candidate = candidates[ i ];
			if ( candidate.resolution >= pf.getDpr() ) {
				bestCandidate = candidate;
				break;
			}
		}

		if ( bestCandidate && !pf.endsWith( picImg.src, bestCandidate.url ) ) {
			if ( pf.restrictsMixedContent() && bestCandidate.url.substr(0, "http:".length).toLowerCase() === "http:" ) {
				if ( typeof console !== undefined ) {
					console.warn( "Blocked mixed content image " + bestCandidate.url );
				}
			} else {
				picImg.src = bestCandidate.url;
				// currentSrc attribute and property to match
				// http://picture.responsiveimages.org/#the-img-element
				picImg.currentSrc = picImg.src;

				var style = picImg.style || {},
					WebkitBackfaceVisibility = "webkitBackfaceVisibility" in style,
					currentZoom = style.zoom;

				if (WebkitBackfaceVisibility) { // See: https://github.com/scottjehl/picturefill/issues/332
					style.zoom = ".999";

					WebkitBackfaceVisibility = picImg.offsetWidth;

					style.zoom = currentZoom;
				}
			}
		}
	};

	pf.ascendingSort = function( a, b ) {
		return a.resolution - b.resolution;
	};

	/**
	 * In IE9, <source> elements get removed if they aren't children of
	 * video elements. Thus, we conditionally wrap source elements
	 * using <!--[if IE 9]><video style="display: none;"><![endif]-->
	 * and must account for that here by moving those source elements
	 * back into the picture element.
	 */
	pf.removeVideoShim = function( picture ) {
		var videos = picture.getElementsByTagName( "video" );
		if ( videos.length ) {
			var video = videos[ 0 ],
				vsources = video.getElementsByTagName( "source" );
			while ( vsources.length ) {
				picture.insertBefore( vsources[ 0 ], video );
			}
			// Remove the video element once we're finished removing its children
			video.parentNode.removeChild( video );
		}
	};

	/**
	 * Find all `img` elements, and add them to the candidate list if they have
	 * a `picture` parent, a `sizes` attribute in basic `srcset` supporting browsers,
	 * a `srcset` attribute at all, and they haven’t been evaluated already.
	 */
	pf.getAllElements = function() {
		var elems = [],
			imgs = doc.getElementsByTagName( "img" );

		for ( var h = 0, len = imgs.length; h < len; h++ ) {
			var currImg = imgs[ h ];

			if ( currImg.parentNode.nodeName.toUpperCase() === "PICTURE" ||
			( currImg.getAttribute( "srcset" ) !== null ) || currImg[ pf.ns ] && currImg[ pf.ns ].srcset !== null ) {
				elems.push( currImg );
			}
		}
		return elems;
	};

	pf.getMatch = function( img, picture ) {
		var sources = picture.childNodes,
			match;

		// Go through each child, and if they have media queries, evaluate them
		for ( var j = 0, slen = sources.length; j < slen; j++ ) {
			var source = sources[ j ];

			// ignore non-element nodes
			if ( source.nodeType !== 1 ) {
				continue;
			}

			// Hitting the `img` element that started everything stops the search for `sources`.
			// If no previous `source` matches, the `img` itself is evaluated later.
			if ( source === img ) {
				return match;
			}

			// ignore non-`source` nodes
			if ( source.nodeName.toUpperCase() !== "SOURCE" ) {
				continue;
			}
			// if it's a source element that has the `src` property set, throw a warning in the console
			if ( source.getAttribute( "src" ) !== null && typeof console !== undefined ) {
				console.warn("The `src` attribute is invalid on `picture` `source` element; instead, use `srcset`.");
			}

			var media = source.getAttribute( "media" );

			// if source does not have a srcset attribute, skip
			if ( !source.getAttribute( "srcset" ) ) {
				continue;
			}

			// if there's no media specified, OR w.matchMedia is supported
			if ( ( !media || pf.matchesMedia( media ) ) ) {
				var typeSupported = pf.verifyTypeSupport( source );

				if ( typeSupported === true ) {
					match = source;
					break;
				} else if ( typeSupported === "pending" ) {
					return false;
				}
			}
		}

		return match;
	};

	function picturefill( opt ) {
		var elements,
			element,
			parent,
			firstMatch,
			candidates,
			options = opt || {};

		elements = options.elements || pf.getAllElements();

		// Loop through all elements
		for ( var i = 0, plen = elements.length; i < plen; i++ ) {
			element = elements[ i ];
			parent = element.parentNode;
			firstMatch = undefined;
			candidates = undefined;

			// immediately skip non-`img` nodes
			if ( element.nodeName.toUpperCase() !== "IMG" ) {
				continue;
			}

			// expando for caching data on the img
			if ( !element[ pf.ns ] ) {
				element[ pf.ns ] = {};
			}

			// if the element has already been evaluated, skip it unless
			// `options.reevaluate` is set to true ( this, for example,
			// is set to true when running `picturefill` on `resize` ).
			if ( !options.reevaluate && element[ pf.ns ].evaluated ) {
				continue;
			}

			// if `img` is in a `picture` element
			if ( parent.nodeName.toUpperCase() === "PICTURE" ) {

				// IE9 video workaround
				pf.removeVideoShim( parent );

				// return the first match which might undefined
				// returns false if there is a pending source
				// TODO the return type here is brutal, cleanup
				firstMatch = pf.getMatch( element, parent );

				// if any sources are pending in this picture due to async type test(s)
				// remove the evaluated attr and skip for now ( the pending test will
				// rerun picturefill on this element when complete)
				if ( firstMatch === false ) {
					continue;
				}
			} else {
				firstMatch = undefined;
			}

			// Cache and remove `srcset` if present and we’re going to be doing `picture`/`srcset`/`sizes` polyfilling to it.
			if ( parent.nodeName.toUpperCase() === "PICTURE" ||
			( element.srcset && !pf.srcsetSupported ) ||
			( !pf.sizesSupported && ( element.srcset && element.srcset.indexOf("w") > -1 ) ) ) {
				pf.dodgeSrcset( element );
			}

			if ( firstMatch ) {
				candidates = pf.processSourceSet( firstMatch );
				pf.applyBestCandidate( candidates, element );
			} else {
				// No sources matched, so we’re down to processing the inner `img` as a source.
				candidates = pf.processSourceSet( element );

				if ( element.srcset === undefined || element[ pf.ns ].srcset ) {
					// Either `srcset` is completely unsupported, or we need to polyfill `sizes` functionality.
					pf.applyBestCandidate( candidates, element );
				} // Else, resolution-only `srcset` is supported natively.
			}

			// set evaluated to true to avoid unnecessary reparsing
			element[ pf.ns ].evaluated = true;
		}
	}

	/**
	 * Sets up picture polyfill by polling the document and running
	 * the polyfill every 250ms until the document is ready.
	 * Also attaches picturefill on resize
	 */
	function runPicturefill() {
		picturefill();
		var intervalId = setInterval( function() {
			// When the document has finished loading, stop checking for new images
			// https://github.com/ded/domready/blob/master/ready.js#L15
			picturefill();
			if ( /^loaded|^i|^c/.test( doc.readyState ) ) {
				clearInterval( intervalId );
				return;
			}
		}, 250 );

		function checkResize() {
			var resizeThrottle;

			if ( !w._picturefillWorking ) {
				w._picturefillWorking = true;
				w.clearTimeout( resizeThrottle );
				resizeThrottle = w.setTimeout( function() {
					picturefill({ reevaluate: true });
					w._picturefillWorking = false;
				}, 60 );
			}
		}

		if ( w.addEventListener ) {
			w.addEventListener( "resize", checkResize, false );
		} else if ( w.attachEvent ) {
			w.attachEvent( "onresize", checkResize );
		}
	}

	runPicturefill();

	/* expose methods for testing */
	picturefill._ = pf;

	/* expose picturefill */
	if ( typeof module === "object" && typeof module.exports === "object" ) {
		// CommonJS, just export
		module.exports = picturefill;
	} else if ( typeof define === "function" && define.amd ) {
		// AMD support
		define( function() { return picturefill; } );
	} else if ( typeof w === "object" ) {
		// If no AMD and we are in the browser, attach to window
		w.picturefill = picturefill;
	}

} )( this, this.document, new this.Image() );
/*!
 * jQuery Transit - CSS3 transitions and transformations
 * (c) 2011-2014 Rico Sta. Cruz
 * MIT Licensed.
 *
 * http://ricostacruz.com/jquery.transit
 * http://github.com/rstacruz/jquery.transit
 */

/* jshint expr: true */

;(function (root, factory) {

  if (typeof define === 'function' && define.amd) {
    define(['jquery'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('jquery'));
  } else {
    factory(root.jQuery);
  }

}(this, function($) {

  $.transit = {
    version: "0.9.12",

    // Map of $.css() keys to values for 'transitionProperty'.
    // See https://developer.mozilla.org/en/CSS/CSS_transitions#Properties_that_can_be_animated
    propertyMap: {
      marginLeft    : 'margin',
      marginRight   : 'margin',
      marginBottom  : 'margin',
      marginTop     : 'margin',
      paddingLeft   : 'padding',
      paddingRight  : 'padding',
      paddingBottom : 'padding',
      paddingTop    : 'padding'
    },

    // Will simply transition "instantly" if false
    enabled: true,

    // Set this to false if you don't want to use the transition end property.
    useTransitionEnd: false
  };

  var div = document.createElement('div');
  var support = {};

  // Helper function to get the proper vendor property name.
  // (`transition` => `WebkitTransition`)
  function getVendorPropertyName(prop) {
    // Handle unprefixed versions (FF16+, for example)
    if (prop in div.style) return prop;

    var prefixes = ['Moz', 'Webkit', 'O', 'ms'];
    var prop_ = prop.charAt(0).toUpperCase() + prop.substr(1);

    for (var i=0; i<prefixes.length; ++i) {
      var vendorProp = prefixes[i] + prop_;
      if (vendorProp in div.style) { return vendorProp; }
    }
  }

  // Helper function to check if transform3D is supported.
  // Should return true for Webkits and Firefox 10+.
  function checkTransform3dSupport() {
    div.style[support.transform] = '';
    div.style[support.transform] = 'rotateY(90deg)';
    return div.style[support.transform] !== '';
  }

  var isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;

  // Check for the browser's transitions support.
  support.transition      = getVendorPropertyName('transition');
  support.transitionDelay = getVendorPropertyName('transitionDelay');
  support.transform       = getVendorPropertyName('transform');
  support.transformOrigin = getVendorPropertyName('transformOrigin');
  support.filter          = getVendorPropertyName('Filter');
  support.transform3d     = checkTransform3dSupport();

  var eventNames = {
    'transition':       'transitionend',
    'MozTransition':    'transitionend',
    'OTransition':      'oTransitionEnd',
    'WebkitTransition': 'webkitTransitionEnd',
    'msTransition':     'MSTransitionEnd'
  };

  // Detect the 'transitionend' event needed.
  var transitionEnd = support.transitionEnd = eventNames[support.transition] || null;

  // Populate jQuery's `$.support` with the vendor prefixes we know.
  // As per [jQuery's cssHooks documentation](http://api.jquery.com/jQuery.cssHooks/),
  // we set $.support.transition to a string of the actual property name used.
  for (var key in support) {
    if (support.hasOwnProperty(key) && typeof $.support[key] === 'undefined') {
      $.support[key] = support[key];
    }
  }

  // Avoid memory leak in IE.
  div = null;

  // ## $.cssEase
  // List of easing aliases that you can use with `$.fn.transition`.
  $.cssEase = {
    '_default':       'ease',
    'in':             'ease-in',
    'out':            'ease-out',
    'in-out':         'ease-in-out',
    'snap':           'cubic-bezier(0,1,.5,1)',
    // Penner equations
    'easeInCubic':    'cubic-bezier(.550,.055,.675,.190)',
    'easeOutCubic':   'cubic-bezier(.215,.61,.355,1)',
    'easeInOutCubic': 'cubic-bezier(.645,.045,.355,1)',
    'easeInCirc':     'cubic-bezier(.6,.04,.98,.335)',
    'easeOutCirc':    'cubic-bezier(.075,.82,.165,1)',
    'easeInOutCirc':  'cubic-bezier(.785,.135,.15,.86)',
    'easeInExpo':     'cubic-bezier(.95,.05,.795,.035)',
    'easeOutExpo':    'cubic-bezier(.19,1,.22,1)',
    'easeInOutExpo':  'cubic-bezier(1,0,0,1)',
    'easeInQuad':     'cubic-bezier(.55,.085,.68,.53)',
    'easeOutQuad':    'cubic-bezier(.25,.46,.45,.94)',
    'easeInOutQuad':  'cubic-bezier(.455,.03,.515,.955)',
    'easeInQuart':    'cubic-bezier(.895,.03,.685,.22)',
    'easeOutQuart':   'cubic-bezier(.165,.84,.44,1)',
    'easeInOutQuart': 'cubic-bezier(.77,0,.175,1)',
    'easeInQuint':    'cubic-bezier(.755,.05,.855,.06)',
    'easeOutQuint':   'cubic-bezier(.23,1,.32,1)',
    'easeInOutQuint': 'cubic-bezier(.86,0,.07,1)',
    'easeInSine':     'cubic-bezier(.47,0,.745,.715)',
    'easeOutSine':    'cubic-bezier(.39,.575,.565,1)',
    'easeInOutSine':  'cubic-bezier(.445,.05,.55,.95)',
    'easeInBack':     'cubic-bezier(.6,-.28,.735,.045)',
    'easeOutBack':    'cubic-bezier(.175, .885,.32,1.275)',
    'easeInOutBack':  'cubic-bezier(.68,-.55,.265,1.55)'
  };

  // ## 'transform' CSS hook
  // Allows you to use the `transform` property in CSS.
  //
  //     $("#hello").css({ transform: "rotate(90deg)" });
  //
  //     $("#hello").css('transform');
  //     //=> { rotate: '90deg' }
  //
  $.cssHooks['transit:transform'] = {
    // The getter returns a `Transform` object.
    get: function(elem) {
      return $(elem).data('transform') || new Transform();
    },

    // The setter accepts a `Transform` object or a string.
    set: function(elem, v) {
      var value = v;

      if (!(value instanceof Transform)) {
        value = new Transform(value);
      }

      // We've seen the 3D version of Scale() not work in Chrome when the
      // element being scaled extends outside of the viewport.  Thus, we're
      // forcing Chrome to not use the 3d transforms as well.  Not sure if
      // translate is affectede, but not risking it.  Detection code from
      // http://davidwalsh.name/detecting-google-chrome-javascript
      if (support.transform === 'WebkitTransform' && !isChrome) {
        elem.style[support.transform] = value.toString(true);
      } else {
        elem.style[support.transform] = value.toString();
      }

      $(elem).data('transform', value);
    }
  };

  // Add a CSS hook for `.css({ transform: '...' })`.
  // In jQuery 1.8+, this will intentionally override the default `transform`
  // CSS hook so it'll play well with Transit. (see issue #62)
  $.cssHooks.transform = {
    set: $.cssHooks['transit:transform'].set
  };

  // ## 'filter' CSS hook
  // Allows you to use the `filter` property in CSS.
  //
  //     $("#hello").css({ filter: 'blur(10px)' });
  //
  $.cssHooks.filter = {
    get: function(elem) {
      return elem.style[support.filter];
    },
    set: function(elem, value) {
      elem.style[support.filter] = value;
    }
  };

  // jQuery 1.8+ supports prefix-free transitions, so these polyfills will not
  // be necessary.
  if ($.fn.jquery < "1.8") {
    // ## 'transformOrigin' CSS hook
    // Allows the use for `transformOrigin` to define where scaling and rotation
    // is pivoted.
    //
    //     $("#hello").css({ transformOrigin: '0 0' });
    //
    $.cssHooks.transformOrigin = {
      get: function(elem) {
        return elem.style[support.transformOrigin];
      },
      set: function(elem, value) {
        elem.style[support.transformOrigin] = value;
      }
    };

    // ## 'transition' CSS hook
    // Allows you to use the `transition` property in CSS.
    //
    //     $("#hello").css({ transition: 'all 0 ease 0' });
    //
    $.cssHooks.transition = {
      get: function(elem) {
        return elem.style[support.transition];
      },
      set: function(elem, value) {
        elem.style[support.transition] = value;
      }
    };
  }

  // ## Other CSS hooks
  // Allows you to rotate, scale and translate.
  registerCssHook('scale');
  registerCssHook('scaleX');
  registerCssHook('scaleY');
  registerCssHook('translate');
  registerCssHook('rotate');
  registerCssHook('rotateX');
  registerCssHook('rotateY');
  registerCssHook('rotate3d');
  registerCssHook('perspective');
  registerCssHook('skewX');
  registerCssHook('skewY');
  registerCssHook('x', true);
  registerCssHook('y', true);

  // ## Transform class
  // This is the main class of a transformation property that powers
  // `$.fn.css({ transform: '...' })`.
  //
  // This is, in essence, a dictionary object with key/values as `-transform`
  // properties.
  //
  //     var t = new Transform("rotate(90) scale(4)");
  //
  //     t.rotate             //=> "90deg"
  //     t.scale              //=> "4,4"
  //
  // Setters are accounted for.
  //
  //     t.set('rotate', 4)
  //     t.rotate             //=> "4deg"
  //
  // Convert it to a CSS string using the `toString()` and `toString(true)` (for WebKit)
  // functions.
  //
  //     t.toString()         //=> "rotate(90deg) scale(4,4)"
  //     t.toString(true)     //=> "rotate(90deg) scale3d(4,4,0)" (WebKit version)
  //
  function Transform(str) {
    if (typeof str === 'string') { this.parse(str); }
    return this;
  }

  Transform.prototype = {
    // ### setFromString()
    // Sets a property from a string.
    //
    //     t.setFromString('scale', '2,4');
    //     // Same as set('scale', '2', '4');
    //
    setFromString: function(prop, val) {
      var args =
        (typeof val === 'string')  ? val.split(',') :
        (val.constructor === Array) ? val :
        [ val ];

      args.unshift(prop);

      Transform.prototype.set.apply(this, args);
    },

    // ### set()
    // Sets a property.
    //
    //     t.set('scale', 2, 4);
    //
    set: function(prop) {
      var args = Array.prototype.slice.apply(arguments, [1]);
      if (this.setter[prop]) {
        this.setter[prop].apply(this, args);
      } else {
        this[prop] = args.join(',');
      }
    },

    get: function(prop) {
      if (this.getter[prop]) {
        return this.getter[prop].apply(this);
      } else {
        return this[prop] || 0;
      }
    },

    setter: {
      // ### rotate
      //
      //     .css({ rotate: 30 })
      //     .css({ rotate: "30" })
      //     .css({ rotate: "30deg" })
      //     .css({ rotate: "30deg" })
      //
      rotate: function(theta) {
        this.rotate = unit(theta, 'deg');
      },

      rotateX: function(theta) {
        this.rotateX = unit(theta, 'deg');
      },

      rotateY: function(theta) {
        this.rotateY = unit(theta, 'deg');
      },

      // ### scale
      //
      //     .css({ scale: 9 })      //=> "scale(9,9)"
      //     .css({ scale: '3,2' })  //=> "scale(3,2)"
      //
      scale: function(x, y) {
        if (y === undefined) { y = x; }
        this.scale = x + "," + y;
      },

      // ### skewX + skewY
      skewX: function(x) {
        this.skewX = unit(x, 'deg');
      },

      skewY: function(y) {
        this.skewY = unit(y, 'deg');
      },

      // ### perspectvie
      perspective: function(dist) {
        this.perspective = unit(dist, 'px');
      },

      // ### x / y
      // Translations. Notice how this keeps the other value.
      //
      //     .css({ x: 4 })       //=> "translate(4px, 0)"
      //     .css({ y: 10 })      //=> "translate(4px, 10px)"
      //
      x: function(x) {
        this.set('translate', x, null);
      },

      y: function(y) {
        this.set('translate', null, y);
      },

      // ### translate
      // Notice how this keeps the other value.
      //
      //     .css({ translate: '2, 5' })    //=> "translate(2px, 5px)"
      //
      translate: function(x, y) {
        if (this._translateX === undefined) { this._translateX = 0; }
        if (this._translateY === undefined) { this._translateY = 0; }

        if (x !== null && x !== undefined) { this._translateX = unit(x, 'px'); }
        if (y !== null && y !== undefined) { this._translateY = unit(y, 'px'); }

        this.translate = this._translateX + "," + this._translateY;
      }
    },

    getter: {
      x: function() {
        return this._translateX || 0;
      },

      y: function() {
        return this._translateY || 0;
      },

      scale: function() {
        var s = (this.scale || "1,1").split(',');
        if (s[0]) { s[0] = parseFloat(s[0]); }
        if (s[1]) { s[1] = parseFloat(s[1]); }

        // "2.5,2.5" => 2.5
        // "2.5,1" => [2.5,1]
        return (s[0] === s[1]) ? s[0] : s;
      },

      rotate3d: function() {
        var s = (this.rotate3d || "0,0,0,0deg").split(',');
        for (var i=0; i<=3; ++i) {
          if (s[i]) { s[i] = parseFloat(s[i]); }
        }
        if (s[3]) { s[3] = unit(s[3], 'deg'); }

        return s;
      }
    },

    // ### parse()
    // Parses from a string. Called on constructor.
    parse: function(str) {
      var self = this;
      str.replace(/([a-zA-Z0-9]+)\((.*?)\)/g, function(x, prop, val) {
        self.setFromString(prop, val);
      });
    },

    // ### toString()
    // Converts to a `transition` CSS property string. If `use3d` is given,
    // it converts to a `-webkit-transition` CSS property string instead.
    toString: function(use3d) {
      var re = [];

      for (var i in this) {
        if (this.hasOwnProperty(i)) {
          // Don't use 3D transformations if the browser can't support it.
          if ((!support.transform3d) && (
            (i === 'rotateX') ||
            (i === 'rotateY') ||
            (i === 'perspective') ||
            (i === 'transformOrigin'))) { continue; }

          if (i[0] !== '_') {
            if (use3d && (i === 'scale')) {
              re.push(i + "3d(" + this[i] + ",1)");
            } else if (use3d && (i === 'translate')) {
              re.push(i + "3d(" + this[i] + ",0)");
            } else {
              re.push(i + "(" + this[i] + ")");
            }
          }
        }
      }

      return re.join(" ");
    }
  };

  function callOrQueue(self, queue, fn) {
    if (queue === true) {
      self.queue(fn);
    } else if (queue) {
      self.queue(queue, fn);
    } else {
      self.each(function () {
                fn.call(this);
            });
    }
  }

  // ### getProperties(dict)
  // Returns properties (for `transition-property`) for dictionary `props`. The
  // value of `props` is what you would expect in `$.css(...)`.
  function getProperties(props) {
    var re = [];

    $.each(props, function(key) {
      key = $.camelCase(key); // Convert "text-align" => "textAlign"
      key = $.transit.propertyMap[key] || $.cssProps[key] || key;
      key = uncamel(key); // Convert back to dasherized

      // Get vendor specify propertie
      if (support[key])
        key = uncamel(support[key]);

      if ($.inArray(key, re) === -1) { re.push(key); }
    });

    return re;
  }

  // ### getTransition()
  // Returns the transition string to be used for the `transition` CSS property.
  //
  // Example:
  //
  //     getTransition({ opacity: 1, rotate: 30 }, 500, 'ease');
  //     //=> 'opacity 500ms ease, -webkit-transform 500ms ease'
  //
  function getTransition(properties, duration, easing, delay) {
    // Get the CSS properties needed.
    var props = getProperties(properties);

    // Account for aliases (`in` => `ease-in`).
    if ($.cssEase[easing]) { easing = $.cssEase[easing]; }

    // Build the duration/easing/delay attributes for it.
    var attribs = '' + toMS(duration) + ' ' + easing;
    if (parseInt(delay, 10) > 0) { attribs += ' ' + toMS(delay); }

    // For more properties, add them this way:
    // "margin 200ms ease, padding 200ms ease, ..."
    var transitions = [];
    $.each(props, function(i, name) {
      transitions.push(name + ' ' + attribs);
    });

    return transitions.join(', ');
  }

  // ## $.fn.transition
  // Works like $.fn.animate(), but uses CSS transitions.
  //
  //     $("...").transition({ opacity: 0.1, scale: 0.3 });
  //
  //     // Specific duration
  //     $("...").transition({ opacity: 0.1, scale: 0.3 }, 500);
  //
  //     // With duration and easing
  //     $("...").transition({ opacity: 0.1, scale: 0.3 }, 500, 'in');
  //
  //     // With callback
  //     $("...").transition({ opacity: 0.1, scale: 0.3 }, function() { ... });
  //
  //     // With everything
  //     $("...").transition({ opacity: 0.1, scale: 0.3 }, 500, 'in', function() { ... });
  //
  //     // Alternate syntax
  //     $("...").transition({
  //       opacity: 0.1,
  //       duration: 200,
  //       delay: 40,
  //       easing: 'in',
  //       complete: function() { /* ... */ }
  //      });
  //
  $.fn.transition = $.fn.transit = function(properties, duration, easing, callback) {
    var self  = this;
    var delay = 0;
    var queue = true;

    var theseProperties = $.extend(true, {}, properties);

    // Account for `.transition(properties, callback)`.
    if (typeof duration === 'function') {
      callback = duration;
      duration = undefined;
    }

    // Account for `.transition(properties, options)`.
    if (typeof duration === 'object') {
      easing = duration.easing;
      delay = duration.delay || 0;
      queue = typeof duration.queue === "undefined" ? true : duration.queue;
      callback = duration.complete;
      duration = duration.duration;
    }

    // Account for `.transition(properties, duration, callback)`.
    if (typeof easing === 'function') {
      callback = easing;
      easing = undefined;
    }

    // Alternate syntax.
    if (typeof theseProperties.easing !== 'undefined') {
      easing = theseProperties.easing;
      delete theseProperties.easing;
    }

    if (typeof theseProperties.duration !== 'undefined') {
      duration = theseProperties.duration;
      delete theseProperties.duration;
    }

    if (typeof theseProperties.complete !== 'undefined') {
      callback = theseProperties.complete;
      delete theseProperties.complete;
    }

    if (typeof theseProperties.queue !== 'undefined') {
      queue = theseProperties.queue;
      delete theseProperties.queue;
    }

    if (typeof theseProperties.delay !== 'undefined') {
      delay = theseProperties.delay;
      delete theseProperties.delay;
    }

    // Set defaults. (`400` duration, `ease` easing)
    if (typeof duration === 'undefined') { duration = $.fx.speeds._default; }
    if (typeof easing === 'undefined')   { easing = $.cssEase._default; }

    duration = toMS(duration);

    // Build the `transition` property.
    var transitionValue = getTransition(theseProperties, duration, easing, delay);

    // Compute delay until callback.
    // If this becomes 0, don't bother setting the transition property.
    var work = $.transit.enabled && support.transition;
    var i = work ? (parseInt(duration, 10) + parseInt(delay, 10)) : 0;

    // If there's nothing to do...
    if (i === 0) {
      var fn = function(next) {
        self.css(theseProperties);
        if (callback) { callback.apply(self); }
        if (next) { next(); }
      };

      callOrQueue(self, queue, fn);
      return self;
    }

    // Save the old transitions of each element so we can restore it later.
    var oldTransitions = {};

    var run = function(nextCall) {
      var bound = false;

      // Prepare the callback.
      var cb = function() {
        if (bound) { self.unbind(transitionEnd, cb); }

        if (i > 0) {
          self.each(function() {
            this.style[support.transition] = (oldTransitions[this] || null);
          });
        }

        if (typeof callback === 'function') { callback.apply(self); }
        if (typeof nextCall === 'function') { nextCall(); }
      };

      if ((i > 0) && (transitionEnd) && ($.transit.useTransitionEnd)) {
        // Use the 'transitionend' event if it's available.
        bound = true;
        self.bind(transitionEnd, cb);
      } else {
        // Fallback to timers if the 'transitionend' event isn't supported.
        window.setTimeout(cb, i);
      }

      // Apply transitions.
      self.each(function() {
        if (i > 0) {
          this.style[support.transition] = transitionValue;
        }
        $(this).css(theseProperties);
      });
    };

    // Defer running. This allows the browser to paint any pending CSS it hasn't
    // painted yet before doing the transitions.
    var deferredRun = function(next) {
        this.offsetWidth; // force a repaint
        run(next);
    };

    // Use jQuery's fx queue.
    callOrQueue(self, queue, deferredRun);

    // Chainability.
    return this;
  };

  function registerCssHook(prop, isPixels) {
    // For certain properties, the 'px' should not be implied.
    if (!isPixels) { $.cssNumber[prop] = true; }

    $.transit.propertyMap[prop] = support.transform;

    $.cssHooks[prop] = {
      get: function(elem) {
        var t = $(elem).css('transit:transform');
        return t.get(prop);
      },

      set: function(elem, value) {
        var t = $(elem).css('transit:transform');
        t.setFromString(prop, value);

        $(elem).css({ 'transit:transform': t });
      }
    };

  }

  // ### uncamel(str)
  // Converts a camelcase string to a dasherized string.
  // (`marginLeft` => `margin-left`)
  function uncamel(str) {
    return str.replace(/([A-Z])/g, function(letter) { return '-' + letter.toLowerCase(); });
  }

  // ### unit(number, unit)
  // Ensures that number `number` has a unit. If no unit is found, assume the
  // default is `unit`.
  //
  //     unit(2, 'px')          //=> "2px"
  //     unit("30deg", 'rad')   //=> "30deg"
  //
  function unit(i, units) {
    if ((typeof i === "string") && (!i.match(/^[\-0-9\.]+$/))) {
      return i;
    } else {
      return "" + i + units;
    }
  }

  // ### toMS(duration)
  // Converts given `duration` to a millisecond string.
  //
  // toMS('fast') => $.fx.speeds[i] => "200ms"
  // toMS('normal') //=> $.fx.speeds._default => "400ms"
  // toMS(10) //=> '10ms'
  // toMS('100ms') //=> '100ms'  
  //
  function toMS(duration) {
    var i = duration;

    // Allow string durations like 'fast' and 'slow', without overriding numeric values.
    if (typeof i === 'string' && (!i.match(/^[\-0-9\.]+/))) { i = $.fx.speeds[i] || $.fx.speeds._default; }

    return unit(i, 'ms');
  }

  // Export some functions for testable-ness.
  $.transit.getTransitionValue = getTransition;

  return $;
}));
// jquery.event.move
//
// 1.3.6
//
// Stephen Band
//
// Triggers 'movestart', 'move' and 'moveend' events after
// mousemoves following a mousedown cross a distance threshold,
// similar to the native 'dragstart', 'drag' and 'dragend' events.
// Move events are throttled to animation frames. Move event objects
// have the properties:
//
// pageX:
// pageY:   Page coordinates of pointer.
// startX:
// startY:  Page coordinates of pointer at movestart.
// distX:
// distY:  Distance the pointer has moved since movestart.
// deltaX:
// deltaY:  Distance the finger has moved since last event.
// velocityX:
// velocityY:  Average velocity over last few events.


(function (module) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], module);
	} else {
		// Browser globals
		module(jQuery);
	}
})(function(jQuery, undefined){

	var // Number of pixels a pressed pointer travels before movestart
	    // event is fired.
	    threshold = 6,
	
	    add = jQuery.event.add,
	
	    remove = jQuery.event.remove,

	    // Just sugar, so we can have arguments in the same order as
	    // add and remove.
	    trigger = function(node, type, data) {
	    	jQuery.event.trigger(type, data, node);
	    },

	    // Shim for requestAnimationFrame, falling back to timer. See:
	    // see http://paulirish.com/2011/requestanimationframe-for-smart-animating/
	    requestFrame = (function(){
	    	return (
	    		window.requestAnimationFrame ||
	    		window.webkitRequestAnimationFrame ||
	    		window.mozRequestAnimationFrame ||
	    		window.oRequestAnimationFrame ||
	    		window.msRequestAnimationFrame ||
	    		function(fn, element){
	    			return window.setTimeout(function(){
	    				fn();
	    			}, 25);
	    		}
	    	);
	    })(),
	    
	    ignoreTags = {
	    	textarea: true,
	    	input: true,
	    	select: true,
	    	button: true
	    },
	    
	    mouseevents = {
	    	move: 'mousemove',
	    	cancel: 'mouseup dragstart',
	    	end: 'mouseup'
	    },
	    
	    touchevents = {
	    	move: 'touchmove',
	    	cancel: 'touchend',
	    	end: 'touchend'
	    };


	// Constructors
	
	function Timer(fn){
		var callback = fn,
		    active = false,
		    running = false;
		
		function trigger(time) {
			if (active){
				callback();
				requestFrame(trigger);
				running = true;
				active = false;
			}
			else {
				running = false;
			}
		}
		
		this.kick = function(fn) {
			active = true;
			if (!running) { trigger(); }
		};
		
		this.end = function(fn) {
			var cb = callback;
			
			if (!fn) { return; }
			
			// If the timer is not running, simply call the end callback.
			if (!running) {
				fn();
			}
			// If the timer is running, and has been kicked lately, then
			// queue up the current callback and the end callback, otherwise
			// just the end callback.
			else {
				callback = active ?
					function(){ cb(); fn(); } : 
					fn ;
				
				active = true;
			}
		};
	}


	// Functions
	
	function returnTrue() {
		return true;
	}
	
	function returnFalse() {
		return false;
	}
	
	function preventDefault(e) {
		e.preventDefault();
	}
	
	function preventIgnoreTags(e) {
		// Don't prevent interaction with form elements.
		if (ignoreTags[ e.target.tagName.toLowerCase() ]) { return; }
		
		e.preventDefault();
	}

	function isLeftButton(e) {
		// Ignore mousedowns on any button other than the left (or primary)
		// mouse button, or when a modifier key is pressed.
		return (e.which === 1 && !e.ctrlKey && !e.altKey);
	}

	function identifiedTouch(touchList, id) {
		var i, l;

		if (touchList.identifiedTouch) {
			return touchList.identifiedTouch(id);
		}
		
		// touchList.identifiedTouch() does not exist in
		// webkit yet… we must do the search ourselves...
		
		i = -1;
		l = touchList.length;
		
		while (++i < l) {
			if (touchList[i].identifier === id) {
				return touchList[i];
			}
		}
	}

	function changedTouch(e, event) {
		var touch = identifiedTouch(e.changedTouches, event.identifier);

		// This isn't the touch you're looking for.
		if (!touch) { return; }

		// Chrome Android (at least) includes touches that have not
		// changed in e.changedTouches. That's a bit annoying. Check
		// that this touch has changed.
		if (touch.pageX === event.pageX && touch.pageY === event.pageY) { return; }

		return touch;
	}


	// Handlers that decide when the first movestart is triggered
	
	function mousedown(e){
		var data;

		if (!isLeftButton(e)) { return; }

		data = {
			target: e.target,
			startX: e.pageX,
			startY: e.pageY,
			timeStamp: e.timeStamp
		};

		add(document, mouseevents.move, mousemove, data);
		add(document, mouseevents.cancel, mouseend, data);
	}

	function mousemove(e){
		var data = e.data;

		checkThreshold(e, data, e, removeMouse);
	}

	function mouseend(e) {
		removeMouse();
	}

	function removeMouse() {
		remove(document, mouseevents.move, mousemove);
		remove(document, mouseevents.cancel, mouseend);
	}

	function touchstart(e) {
		var touch, template;

		// Don't get in the way of interaction with form elements.
		if (ignoreTags[ e.target.tagName.toLowerCase() ]) { return; }

		touch = e.changedTouches[0];
		
		// iOS live updates the touch objects whereas Android gives us copies.
		// That means we can't trust the touchstart object to stay the same,
		// so we must copy the data. This object acts as a template for
		// movestart, move and moveend event objects.
		template = {
			target: touch.target,
			startX: touch.pageX,
			startY: touch.pageY,
			timeStamp: e.timeStamp,
			identifier: touch.identifier
		};

		// Use the touch identifier as a namespace, so that we can later
		// remove handlers pertaining only to this touch.
		add(document, touchevents.move + '.' + touch.identifier, touchmove, template);
		add(document, touchevents.cancel + '.' + touch.identifier, touchend, template);
	}

	function touchmove(e){
		var data = e.data,
		    touch = changedTouch(e, data);

		if (!touch) { return; }

		checkThreshold(e, data, touch, removeTouch);
	}

	function touchend(e) {
		var template = e.data,
		    touch = identifiedTouch(e.changedTouches, template.identifier);

		if (!touch) { return; }

		removeTouch(template.identifier);
	}

	function removeTouch(identifier) {
		remove(document, '.' + identifier, touchmove);
		remove(document, '.' + identifier, touchend);
	}


	// Logic for deciding when to trigger a movestart.

	function checkThreshold(e, template, touch, fn) {
		var distX = touch.pageX - template.startX,
		    distY = touch.pageY - template.startY;

		// Do nothing if the threshold has not been crossed.
		if ((distX * distX) + (distY * distY) < (threshold * threshold)) { return; }

		triggerStart(e, template, touch, distX, distY, fn);
	}

	function handled() {
		// this._handled should return false once, and after return true.
		this._handled = returnTrue;
		return false;
	}

	function flagAsHandled(e) {
		e._handled();
	}

	function triggerStart(e, template, touch, distX, distY, fn) {
		var node = template.target,
		    touches, time;

		touches = e.targetTouches;
		time = e.timeStamp - template.timeStamp;

		// Create a movestart object with some special properties that
		// are passed only to the movestart handlers.
		template.type = 'movestart';
		template.distX = distX;
		template.distY = distY;
		template.deltaX = distX;
		template.deltaY = distY;
		template.pageX = touch.pageX;
		template.pageY = touch.pageY;
		template.velocityX = distX / time;
		template.velocityY = distY / time;
		template.targetTouches = touches;
		template.finger = touches ?
			touches.length :
			1 ;

		// The _handled method is fired to tell the default movestart
		// handler that one of the move events is bound.
		template._handled = handled;
			
		// Pass the touchmove event so it can be prevented if or when
		// movestart is handled.
		template._preventTouchmoveDefault = function() {
			e.preventDefault();
		};

		// Trigger the movestart event.
		trigger(template.target, template);

		// Unbind handlers that tracked the touch or mouse up till now.
		fn(template.identifier);
	}


	// Handlers that control what happens following a movestart

	function activeMousemove(e) {
		var timer = e.data.timer;

		e.data.touch = e;
		e.data.timeStamp = e.timeStamp;
		timer.kick();
	}

	function activeMouseend(e) {
		var event = e.data.event,
		    timer = e.data.timer;
		
		removeActiveMouse();

		endEvent(event, timer, function() {
			// Unbind the click suppressor, waiting until after mouseup
			// has been handled.
			setTimeout(function(){
				remove(event.target, 'click', returnFalse);
			}, 0);
		});
	}

	function removeActiveMouse(event) {
		remove(document, mouseevents.move, activeMousemove);
		remove(document, mouseevents.end, activeMouseend);
	}

	function activeTouchmove(e) {
		var event = e.data.event,
		    timer = e.data.timer,
		    touch = changedTouch(e, event);

		if (!touch) { return; }

		// Stop the interface from gesturing
		e.preventDefault();

		event.targetTouches = e.targetTouches;
		e.data.touch = touch;
		e.data.timeStamp = e.timeStamp;
		timer.kick();
	}

	function activeTouchend(e) {
		var event = e.data.event,
		    timer = e.data.timer,
		    touch = identifiedTouch(e.changedTouches, event.identifier);

		// This isn't the touch you're looking for.
		if (!touch) { return; }

		removeActiveTouch(event);
		endEvent(event, timer);
	}

	function removeActiveTouch(event) {
		remove(document, '.' + event.identifier, activeTouchmove);
		remove(document, '.' + event.identifier, activeTouchend);
	}


	// Logic for triggering move and moveend events

	function updateEvent(event, touch, timeStamp, timer) {
		var time = timeStamp - event.timeStamp;

		event.type = 'move';
		event.distX =  touch.pageX - event.startX;
		event.distY =  touch.pageY - event.startY;
		event.deltaX = touch.pageX - event.pageX;
		event.deltaY = touch.pageY - event.pageY;
		
		// Average the velocity of the last few events using a decay
		// curve to even out spurious jumps in values.
		event.velocityX = 0.3 * event.velocityX + 0.7 * event.deltaX / time;
		event.velocityY = 0.3 * event.velocityY + 0.7 * event.deltaY / time;
		event.pageX =  touch.pageX;
		event.pageY =  touch.pageY;
	}

	function endEvent(event, timer, fn) {
		timer.end(function(){
			event.type = 'moveend';

			trigger(event.target, event);
			
			return fn && fn();
		});
	}


	// jQuery special event definition

	function setup(data, namespaces, eventHandle) {
		// Stop the node from being dragged
		//add(this, 'dragstart.move drag.move', preventDefault);
		
		// Prevent text selection and touch interface scrolling
		//add(this, 'mousedown.move', preventIgnoreTags);
		
		// Tell movestart default handler that we've handled this
		add(this, 'movestart.move', flagAsHandled);

		// Don't bind to the DOM. For speed.
		return true;
	}
	
	function teardown(namespaces) {
		remove(this, 'dragstart drag', preventDefault);
		remove(this, 'mousedown touchstart', preventIgnoreTags);
		remove(this, 'movestart', flagAsHandled);
		
		// Don't bind to the DOM. For speed.
		return true;
	}
	
	function addMethod(handleObj) {
		// We're not interested in preventing defaults for handlers that
		// come from internal move or moveend bindings
		if (handleObj.namespace === "move" || handleObj.namespace === "moveend") {
			return;
		}
		
		// Stop the node from being dragged
		add(this, 'dragstart.' + handleObj.guid + ' drag.' + handleObj.guid, preventDefault, undefined, handleObj.selector);
		
		// Prevent text selection and touch interface scrolling
		add(this, 'mousedown.' + handleObj.guid, preventIgnoreTags, undefined, handleObj.selector);
	}
	
	function removeMethod(handleObj) {
		if (handleObj.namespace === "move" || handleObj.namespace === "moveend") {
			return;
		}
		
		remove(this, 'dragstart.' + handleObj.guid + ' drag.' + handleObj.guid);
		remove(this, 'mousedown.' + handleObj.guid);
	}
	
	jQuery.event.special.movestart = {
		setup: setup,
		teardown: teardown,
		add: addMethod,
		remove: removeMethod,

		_default: function(e) {
			var event, data;
			
			// If no move events were bound to any ancestors of this
			// target, high tail it out of here.
			if (!e._handled()) { return; }

			function update(time) {
				updateEvent(event, data.touch, data.timeStamp);
				trigger(e.target, event);
			}

			event = {
				target: e.target,
				startX: e.startX,
				startY: e.startY,
				pageX: e.pageX,
				pageY: e.pageY,
				distX: e.distX,
				distY: e.distY,
				deltaX: e.deltaX,
				deltaY: e.deltaY,
				velocityX: e.velocityX,
				velocityY: e.velocityY,
				timeStamp: e.timeStamp,
				identifier: e.identifier,
				targetTouches: e.targetTouches,
				finger: e.finger
			};

			data = {
				event: event,
				timer: new Timer(update),
				touch: undefined,
				timeStamp: undefined
			};
			
			if (e.identifier === undefined) {
				// We're dealing with a mouse
				// Stop clicks from propagating during a move
				add(e.target, 'click', returnFalse);
				add(document, mouseevents.move, activeMousemove, data);
				add(document, mouseevents.end, activeMouseend, data);
			}
			else {
				// We're dealing with a touch. Stop touchmove doing
				// anything defaulty.
				e._preventTouchmoveDefault();
				add(document, touchevents.move + '.' + e.identifier, activeTouchmove, data);
				add(document, touchevents.end + '.' + e.identifier, activeTouchend, data);
			}
		}
	};

	jQuery.event.special.move = {
		setup: function() {
			// Bind a noop to movestart. Why? It's the movestart
			// setup that decides whether other move events are fired.
			add(this, 'movestart.move', jQuery.noop);
		},
		
		teardown: function() {
			remove(this, 'movestart.move', jQuery.noop);
		}
	};
	
	jQuery.event.special.moveend = {
		setup: function() {
			// Bind a noop to movestart. Why? It's the movestart
			// setup that decides whether other move events are fired.
			add(this, 'movestart.moveend', jQuery.noop);
		},
		
		teardown: function() {
			remove(this, 'movestart.moveend', jQuery.noop);
		}
	};

	add(document, 'mousedown.move', mousedown);
	add(document, 'touchstart.move', touchstart);

	// Make jQuery copy touch event properties over to the jQuery event
	// object, if they are not already listed. But only do the ones we
	// really need. IE7/8 do not have Array#indexOf(), but nor do they
	// have touch events, so let's assume we can ignore them.
	if (typeof Array.prototype.indexOf === 'function') {
		(function(jQuery, undefined){
			var props = ["changedTouches", "targetTouches"],
			    l = props.length;
			
			while (l--) {
				if (jQuery.event.props.indexOf(props[l]) === -1) {
					jQuery.event.props.push(props[l]);
				}
			}
		})(jQuery);
	};
});
// jQuery.event.swipe
// 0.5
// Stephen Band

// Dependencies
// jQuery.event.move 1.2

// One of swipeleft, swiperight, swipeup or swipedown is triggered on
// moveend, when the move has covered a threshold ratio of the dimension
// of the target node, or has gone really fast. Threshold and velocity
// sensitivity changed with:
//
// jQuery.event.special.swipe.settings.threshold
// jQuery.event.special.swipe.settings.sensitivity

(function (thisModule) {
	if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], thisModule);
    } else if ((typeof module !== "undefined" && module !== null) && module.exports) {
        module.exports = thisModule;
	} else {
		// Browser globals
        thisModule(jQuery);
	}
})(function(jQuery, undefined){
	var add = jQuery.event.add,
	   
	    remove = jQuery.event.remove,

	    // Just sugar, so we can have arguments in the same order as
	    // add and remove.
	    trigger = function(node, type, data) {
	    	jQuery.event.trigger(type, data, node);
	    },

	    settings = {
	    	// Ratio of distance over target finger must travel to be
	    	// considered a swipe.
	    	threshold: 0.4,
	    	// Faster fingers can travel shorter distances to be considered
	    	// swipes. 'sensitivity' controls how much. Bigger is shorter.
	    	sensitivity: 6
	    };

	function moveend(e) {
		var w, h, event;

		w = e.currentTarget.offsetWidth;
		h = e.currentTarget.offsetHeight;

		// Copy over some useful properties from the move event
		event = {
			distX: e.distX,
			distY: e.distY,
			velocityX: e.velocityX,
			velocityY: e.velocityY,
			finger: e.finger
		};

		// Find out which of the four directions was swiped
		if (e.distX > e.distY) {
			if (e.distX > -e.distY) {
				if (e.distX/w > settings.threshold || e.velocityX * e.distX/w * settings.sensitivity > 1) {
					event.type = 'swiperight';
					trigger(e.currentTarget, event);
				}
			}
			else {
				if (-e.distY/h > settings.threshold || e.velocityY * e.distY/w * settings.sensitivity > 1) {
					event.type = 'swipeup';
					trigger(e.currentTarget, event);
				}
			}
		}
		else {
			if (e.distX > -e.distY) {
				if (e.distY/h > settings.threshold || e.velocityY * e.distY/w * settings.sensitivity > 1) {
					event.type = 'swipedown';
					trigger(e.currentTarget, event);
				}
			}
			else {
				if (-e.distX/w > settings.threshold || e.velocityX * e.distX/w * settings.sensitivity > 1) {
					event.type = 'swipeleft';
					trigger(e.currentTarget, event);
				}
			}
		}
	}

	function getData(node) {
		var data = jQuery.data(node, 'event_swipe');
		
		if (!data) {
			data = { count: 0 };
			jQuery.data(node, 'event_swipe', data);
		}
		
		return data;
	}

	jQuery.event.special.swipe =
	jQuery.event.special.swipeleft =
	jQuery.event.special.swiperight =
	jQuery.event.special.swipeup =
	jQuery.event.special.swipedown = {
		setup: function( data, namespaces, eventHandle ) {
			var data = getData(this);

			// If another swipe event is already setup, don't setup again.
			if (data.count++ > 0) { return; }

			add(this, 'moveend', moveend);

			return true;
		},

		teardown: function() {
			var data = getData(this);

			// If another swipe event is still setup, don't teardown.
			if (--data.count > 0) { return; }

			remove(this, 'moveend', moveend);

			return true;
		},

		settings: settings
	};
});
/*!
 * Masonry PACKAGED v3.1.5
 * Cascading grid layout library
 * http://masonry.desandro.com
 * MIT License
 * by David DeSandro
 */

!function(a){function b(){}function c(a){function c(b){b.prototype.option||(b.prototype.option=function(b){a.isPlainObject(b)&&(this.options=a.extend(!0,this.options,b))})}function e(b,c){a.fn[b]=function(e){if("string"==typeof e){for(var g=d.call(arguments,1),h=0,i=this.length;i>h;h++){var j=this[h],k=a.data(j,b);if(k)if(a.isFunction(k[e])&&"_"!==e.charAt(0)){var l=k[e].apply(k,g);if(void 0!==l)return l}else f("no such method '"+e+"' for "+b+" instance");else f("cannot call methods on "+b+" prior to initialization; attempted to call '"+e+"'")}return this}return this.each(function(){var d=a.data(this,b);d?(d.option(e),d._init()):(d=new c(this,e),a.data(this,b,d))})}}if(a){var f="undefined"==typeof console?b:function(a){console.error(a)};return a.bridget=function(a,b){c(b),e(a,b)},a.bridget}}var d=Array.prototype.slice;"function"==typeof define&&define.amd?define("jquery-bridget/jquery.bridget",["jquery"],c):c(a.jQuery)}(window),function(a){function b(b){var c=a.event;return c.target=c.target||c.srcElement||b,c}var c=document.documentElement,d=function(){};c.addEventListener?d=function(a,b,c){a.addEventListener(b,c,!1)}:c.attachEvent&&(d=function(a,c,d){a[c+d]=d.handleEvent?function(){var c=b(a);d.handleEvent.call(d,c)}:function(){var c=b(a);d.call(a,c)},a.attachEvent("on"+c,a[c+d])});var e=function(){};c.removeEventListener?e=function(a,b,c){a.removeEventListener(b,c,!1)}:c.detachEvent&&(e=function(a,b,c){a.detachEvent("on"+b,a[b+c]);try{delete a[b+c]}catch(d){a[b+c]=void 0}});var f={bind:d,unbind:e};"function"==typeof define&&define.amd?define("eventie/eventie",f):"object"==typeof exports?module.exports=f:a.eventie=f}(this),function(a){function b(a){"function"==typeof a&&(b.isReady?a():f.push(a))}function c(a){var c="readystatechange"===a.type&&"complete"!==e.readyState;if(!b.isReady&&!c){b.isReady=!0;for(var d=0,g=f.length;g>d;d++){var h=f[d];h()}}}function d(d){return d.bind(e,"DOMContentLoaded",c),d.bind(e,"readystatechange",c),d.bind(a,"load",c),b}var e=a.document,f=[];b.isReady=!1,"function"==typeof define&&define.amd?(b.isReady="function"==typeof requirejs,define("doc-ready/doc-ready",["eventie/eventie"],d)):a.docReady=d(a.eventie)}(this),function(){function a(){}function b(a,b){for(var c=a.length;c--;)if(a[c].listener===b)return c;return-1}function c(a){return function(){return this[a].apply(this,arguments)}}var d=a.prototype,e=this,f=e.EventEmitter;d.getListeners=function(a){var b,c,d=this._getEvents();if(a instanceof RegExp){b={};for(c in d)d.hasOwnProperty(c)&&a.test(c)&&(b[c]=d[c])}else b=d[a]||(d[a]=[]);return b},d.flattenListeners=function(a){var b,c=[];for(b=0;b<a.length;b+=1)c.push(a[b].listener);return c},d.getListenersAsObject=function(a){var b,c=this.getListeners(a);return c instanceof Array&&(b={},b[a]=c),b||c},d.addListener=function(a,c){var d,e=this.getListenersAsObject(a),f="object"==typeof c;for(d in e)e.hasOwnProperty(d)&&-1===b(e[d],c)&&e[d].push(f?c:{listener:c,once:!1});return this},d.on=c("addListener"),d.addOnceListener=function(a,b){return this.addListener(a,{listener:b,once:!0})},d.once=c("addOnceListener"),d.defineEvent=function(a){return this.getListeners(a),this},d.defineEvents=function(a){for(var b=0;b<a.length;b+=1)this.defineEvent(a[b]);return this},d.removeListener=function(a,c){var d,e,f=this.getListenersAsObject(a);for(e in f)f.hasOwnProperty(e)&&(d=b(f[e],c),-1!==d&&f[e].splice(d,1));return this},d.off=c("removeListener"),d.addListeners=function(a,b){return this.manipulateListeners(!1,a,b)},d.removeListeners=function(a,b){return this.manipulateListeners(!0,a,b)},d.manipulateListeners=function(a,b,c){var d,e,f=a?this.removeListener:this.addListener,g=a?this.removeListeners:this.addListeners;if("object"!=typeof b||b instanceof RegExp)for(d=c.length;d--;)f.call(this,b,c[d]);else for(d in b)b.hasOwnProperty(d)&&(e=b[d])&&("function"==typeof e?f.call(this,d,e):g.call(this,d,e));return this},d.removeEvent=function(a){var b,c=typeof a,d=this._getEvents();if("string"===c)delete d[a];else if(a instanceof RegExp)for(b in d)d.hasOwnProperty(b)&&a.test(b)&&delete d[b];else delete this._events;return this},d.removeAllListeners=c("removeEvent"),d.emitEvent=function(a,b){var c,d,e,f,g=this.getListenersAsObject(a);for(e in g)if(g.hasOwnProperty(e))for(d=g[e].length;d--;)c=g[e][d],c.once===!0&&this.removeListener(a,c.listener),f=c.listener.apply(this,b||[]),f===this._getOnceReturnValue()&&this.removeListener(a,c.listener);return this},d.trigger=c("emitEvent"),d.emit=function(a){var b=Array.prototype.slice.call(arguments,1);return this.emitEvent(a,b)},d.setOnceReturnValue=function(a){return this._onceReturnValue=a,this},d._getOnceReturnValue=function(){return this.hasOwnProperty("_onceReturnValue")?this._onceReturnValue:!0},d._getEvents=function(){return this._events||(this._events={})},a.noConflict=function(){return e.EventEmitter=f,a},"function"==typeof define&&define.amd?define("eventEmitter/EventEmitter",[],function(){return a}):"object"==typeof module&&module.exports?module.exports=a:this.EventEmitter=a}.call(this),function(a){function b(a){if(a){if("string"==typeof d[a])return a;a=a.charAt(0).toUpperCase()+a.slice(1);for(var b,e=0,f=c.length;f>e;e++)if(b=c[e]+a,"string"==typeof d[b])return b}}var c="Webkit Moz ms Ms O".split(" "),d=document.documentElement.style;"function"==typeof define&&define.amd?define("get-style-property/get-style-property",[],function(){return b}):"object"==typeof exports?module.exports=b:a.getStyleProperty=b}(window),function(a){function b(a){var b=parseFloat(a),c=-1===a.indexOf("%")&&!isNaN(b);return c&&b}function c(){for(var a={width:0,height:0,innerWidth:0,innerHeight:0,outerWidth:0,outerHeight:0},b=0,c=g.length;c>b;b++){var d=g[b];a[d]=0}return a}function d(a){function d(a){if("string"==typeof a&&(a=document.querySelector(a)),a&&"object"==typeof a&&a.nodeType){var d=f(a);if("none"===d.display)return c();var e={};e.width=a.offsetWidth,e.height=a.offsetHeight;for(var k=e.isBorderBox=!(!j||!d[j]||"border-box"!==d[j]),l=0,m=g.length;m>l;l++){var n=g[l],o=d[n];o=h(a,o);var p=parseFloat(o);e[n]=isNaN(p)?0:p}var q=e.paddingLeft+e.paddingRight,r=e.paddingTop+e.paddingBottom,s=e.marginLeft+e.marginRight,t=e.marginTop+e.marginBottom,u=e.borderLeftWidth+e.borderRightWidth,v=e.borderTopWidth+e.borderBottomWidth,w=k&&i,x=b(d.width);x!==!1&&(e.width=x+(w?0:q+u));var y=b(d.height);return y!==!1&&(e.height=y+(w?0:r+v)),e.innerWidth=e.width-(q+u),e.innerHeight=e.height-(r+v),e.outerWidth=e.width+s,e.outerHeight=e.height+t,e}}function h(a,b){if(e||-1===b.indexOf("%"))return b;var c=a.style,d=c.left,f=a.runtimeStyle,g=f&&f.left;return g&&(f.left=a.currentStyle.left),c.left=b,b=c.pixelLeft,c.left=d,g&&(f.left=g),b}var i,j=a("boxSizing");return function(){if(j){var a=document.createElement("div");a.style.width="200px",a.style.padding="1px 2px 3px 4px",a.style.borderStyle="solid",a.style.borderWidth="1px 2px 3px 4px",a.style[j]="border-box";var c=document.body||document.documentElement;c.appendChild(a);var d=f(a);i=200===b(d.width),c.removeChild(a)}}(),d}var e=a.getComputedStyle,f=e?function(a){return e(a,null)}:function(a){return a.currentStyle},g=["paddingLeft","paddingRight","paddingTop","paddingBottom","marginLeft","marginRight","marginTop","marginBottom","borderLeftWidth","borderRightWidth","borderTopWidth","borderBottomWidth"];"function"==typeof define&&define.amd?define("get-size/get-size",["get-style-property/get-style-property"],d):"object"==typeof exports?module.exports=d(require("get-style-property")):a.getSize=d(a.getStyleProperty)}(window),function(a,b){function c(a,b){return a[h](b)}function d(a){if(!a.parentNode){var b=document.createDocumentFragment();b.appendChild(a)}}function e(a,b){d(a);for(var c=a.parentNode.querySelectorAll(b),e=0,f=c.length;f>e;e++)if(c[e]===a)return!0;return!1}function f(a,b){return d(a),c(a,b)}var g,h=function(){if(b.matchesSelector)return"matchesSelector";for(var a=["webkit","moz","ms","o"],c=0,d=a.length;d>c;c++){var e=a[c],f=e+"MatchesSelector";if(b[f])return f}}();if(h){var i=document.createElement("div"),j=c(i,"div");g=j?c:f}else g=e;"function"==typeof define&&define.amd?define("matches-selector/matches-selector",[],function(){return g}):window.matchesSelector=g}(this,Element.prototype),function(a){function b(a,b){for(var c in b)a[c]=b[c];return a}function c(a){for(var b in a)return!1;return b=null,!0}function d(a){return a.replace(/([A-Z])/g,function(a){return"-"+a.toLowerCase()})}function e(a,e,f){function h(a,b){a&&(this.element=a,this.layout=b,this.position={x:0,y:0},this._create())}var i=f("transition"),j=f("transform"),k=i&&j,l=!!f("perspective"),m={WebkitTransition:"webkitTransitionEnd",MozTransition:"transitionend",OTransition:"otransitionend",transition:"transitionend"}[i],n=["transform","transition","transitionDuration","transitionProperty"],o=function(){for(var a={},b=0,c=n.length;c>b;b++){var d=n[b],e=f(d);e&&e!==d&&(a[d]=e)}return a}();b(h.prototype,a.prototype),h.prototype._create=function(){this._transn={ingProperties:{},clean:{},onEnd:{}},this.css({position:"absolute"})},h.prototype.handleEvent=function(a){var b="on"+a.type;this[b]&&this[b](a)},h.prototype.getSize=function(){this.size=e(this.element)},h.prototype.css=function(a){var b=this.element.style;for(var c in a){var d=o[c]||c;b[d]=a[c]}},h.prototype.getPosition=function(){var a=g(this.element),b=this.layout.options,c=b.isOriginLeft,d=b.isOriginTop,e=parseInt(a[c?"left":"right"],10),f=parseInt(a[d?"top":"bottom"],10);e=isNaN(e)?0:e,f=isNaN(f)?0:f;var h=this.layout.size;e-=c?h.paddingLeft:h.paddingRight,f-=d?h.paddingTop:h.paddingBottom,this.position.x=e,this.position.y=f},h.prototype.layoutPosition=function(){var a=this.layout.size,b=this.layout.options,c={};b.isOriginLeft?(c.left=this.position.x+a.paddingLeft+"px",c.right=""):(c.right=this.position.x+a.paddingRight+"px",c.left=""),b.isOriginTop?(c.top=this.position.y+a.paddingTop+"px",c.bottom=""):(c.bottom=this.position.y+a.paddingBottom+"px",c.top=""),this.css(c),this.emitEvent("layout",[this])};var p=l?function(a,b){return"translate3d("+a+"px, "+b+"px, 0)"}:function(a,b){return"translate("+a+"px, "+b+"px)"};h.prototype._transitionTo=function(a,b){this.getPosition();var c=this.position.x,d=this.position.y,e=parseInt(a,10),f=parseInt(b,10),g=e===this.position.x&&f===this.position.y;if(this.setPosition(a,b),g&&!this.isTransitioning)return void this.layoutPosition();var h=a-c,i=b-d,j={},k=this.layout.options;h=k.isOriginLeft?h:-h,i=k.isOriginTop?i:-i,j.transform=p(h,i),this.transition({to:j,onTransitionEnd:{transform:this.layoutPosition},isCleaning:!0})},h.prototype.goTo=function(a,b){this.setPosition(a,b),this.layoutPosition()},h.prototype.moveTo=k?h.prototype._transitionTo:h.prototype.goTo,h.prototype.setPosition=function(a,b){this.position.x=parseInt(a,10),this.position.y=parseInt(b,10)},h.prototype._nonTransition=function(a){this.css(a.to),a.isCleaning&&this._removeStyles(a.to);for(var b in a.onTransitionEnd)a.onTransitionEnd[b].call(this)},h.prototype._transition=function(a){if(!parseFloat(this.layout.options.transitionDuration))return void this._nonTransition(a);var b=this._transn;for(var c in a.onTransitionEnd)b.onEnd[c]=a.onTransitionEnd[c];for(c in a.to)b.ingProperties[c]=!0,a.isCleaning&&(b.clean[c]=!0);if(a.from){this.css(a.from);var d=this.element.offsetHeight;d=null}this.enableTransition(a.to),this.css(a.to),this.isTransitioning=!0};var q=j&&d(j)+",opacity";h.prototype.enableTransition=function(){this.isTransitioning||(this.css({transitionProperty:q,transitionDuration:this.layout.options.transitionDuration}),this.element.addEventListener(m,this,!1))},h.prototype.transition=h.prototype[i?"_transition":"_nonTransition"],h.prototype.onwebkitTransitionEnd=function(a){this.ontransitionend(a)},h.prototype.onotransitionend=function(a){this.ontransitionend(a)};var r={"-webkit-transform":"transform","-moz-transform":"transform","-o-transform":"transform"};h.prototype.ontransitionend=function(a){if(a.target===this.element){var b=this._transn,d=r[a.propertyName]||a.propertyName;if(delete b.ingProperties[d],c(b.ingProperties)&&this.disableTransition(),d in b.clean&&(this.element.style[a.propertyName]="",delete b.clean[d]),d in b.onEnd){var e=b.onEnd[d];e.call(this),delete b.onEnd[d]}this.emitEvent("transitionEnd",[this])}},h.prototype.disableTransition=function(){this.removeTransitionStyles(),this.element.removeEventListener(m,this,!1),this.isTransitioning=!1},h.prototype._removeStyles=function(a){var b={};for(var c in a)b[c]="";this.css(b)};var s={transitionProperty:"",transitionDuration:""};return h.prototype.removeTransitionStyles=function(){this.css(s)},h.prototype.removeElem=function(){this.element.parentNode.removeChild(this.element),this.emitEvent("remove",[this])},h.prototype.remove=function(){if(!i||!parseFloat(this.layout.options.transitionDuration))return void this.removeElem();var a=this;this.on("transitionEnd",function(){return a.removeElem(),!0}),this.hide()},h.prototype.reveal=function(){delete this.isHidden,this.css({display:""});var a=this.layout.options;this.transition({from:a.hiddenStyle,to:a.visibleStyle,isCleaning:!0})},h.prototype.hide=function(){this.isHidden=!0,this.css({display:""});var a=this.layout.options;this.transition({from:a.visibleStyle,to:a.hiddenStyle,isCleaning:!0,onTransitionEnd:{opacity:function(){this.isHidden&&this.css({display:"none"})}}})},h.prototype.destroy=function(){this.css({position:"",left:"",right:"",top:"",bottom:"",transition:"",transform:""})},h}var f=a.getComputedStyle,g=f?function(a){return f(a,null)}:function(a){return a.currentStyle};"function"==typeof define&&define.amd?define("outlayer/item",["eventEmitter/EventEmitter","get-size/get-size","get-style-property/get-style-property"],e):(a.Outlayer={},a.Outlayer.Item=e(a.EventEmitter,a.getSize,a.getStyleProperty))}(window),function(a){function b(a,b){for(var c in b)a[c]=b[c];return a}function c(a){return"[object Array]"===l.call(a)}function d(a){var b=[];if(c(a))b=a;else if(a&&"number"==typeof a.length)for(var d=0,e=a.length;e>d;d++)b.push(a[d]);else b.push(a);return b}function e(a,b){var c=n(b,a);-1!==c&&b.splice(c,1)}function f(a){return a.replace(/(.)([A-Z])/g,function(a,b,c){return b+"-"+c}).toLowerCase()}function g(c,g,l,n,o,p){function q(a,c){if("string"==typeof a&&(a=h.querySelector(a)),!a||!m(a))return void(i&&i.error("Bad "+this.constructor.namespace+" element: "+a));this.element=a,this.options=b({},this.constructor.defaults),this.option(c);var d=++r;this.element.outlayerGUID=d,s[d]=this,this._create(),this.options.isInitLayout&&this.layout()}var r=0,s={};return q.namespace="outlayer",q.Item=p,q.defaults={containerStyle:{position:"relative"},isInitLayout:!0,isOriginLeft:!0,isOriginTop:!0,isResizeBound:!0,isResizingContainer:!0,transitionDuration:"0.4s",hiddenStyle:{opacity:0,transform:"scale(0.001)"},visibleStyle:{opacity:1,transform:"scale(1)"}},b(q.prototype,l.prototype),q.prototype.option=function(a){b(this.options,a)},q.prototype._create=function(){this.reloadItems(),this.stamps=[],this.stamp(this.options.stamp),b(this.element.style,this.options.containerStyle),this.options.isResizeBound&&this.bindResize()},q.prototype.reloadItems=function(){this.items=this._itemize(this.element.children)},q.prototype._itemize=function(a){for(var b=this._filterFindItemElements(a),c=this.constructor.Item,d=[],e=0,f=b.length;f>e;e++){var g=b[e],h=new c(g,this);d.push(h)}return d},q.prototype._filterFindItemElements=function(a){a=d(a);for(var b=this.options.itemSelector,c=[],e=0,f=a.length;f>e;e++){var g=a[e];if(m(g))if(b){o(g,b)&&c.push(g);for(var h=g.querySelectorAll(b),i=0,j=h.length;j>i;i++)c.push(h[i])}else c.push(g)}return c},q.prototype.getItemElements=function(){for(var a=[],b=0,c=this.items.length;c>b;b++)a.push(this.items[b].element);return a},q.prototype.layout=function(){this._resetLayout(),this._manageStamps();var a=void 0!==this.options.isLayoutInstant?this.options.isLayoutInstant:!this._isLayoutInited;this.layoutItems(this.items,a),this._isLayoutInited=!0},q.prototype._init=q.prototype.layout,q.prototype._resetLayout=function(){this.getSize()},q.prototype.getSize=function(){this.size=n(this.element)},q.prototype._getMeasurement=function(a,b){var c,d=this.options[a];d?("string"==typeof d?c=this.element.querySelector(d):m(d)&&(c=d),this[a]=c?n(c)[b]:d):this[a]=0},q.prototype.layoutItems=function(a,b){a=this._getItemsForLayout(a),this._layoutItems(a,b),this._postLayout()},q.prototype._getItemsForLayout=function(a){for(var b=[],c=0,d=a.length;d>c;c++){var e=a[c];e.isIgnored||b.push(e)}return b},q.prototype._layoutItems=function(a,b){function c(){d.emitEvent("layoutComplete",[d,a])}var d=this;if(!a||!a.length)return void c();this._itemsOn(a,"layout",c);for(var e=[],f=0,g=a.length;g>f;f++){var h=a[f],i=this._getItemLayoutPosition(h);i.item=h,i.isInstant=b||h.isLayoutInstant,e.push(i)}this._processLayoutQueue(e)},q.prototype._getItemLayoutPosition=function(){return{x:0,y:0}},q.prototype._processLayoutQueue=function(a){for(var b=0,c=a.length;c>b;b++){var d=a[b];this._positionItem(d.item,d.x,d.y,d.isInstant)}},q.prototype._positionItem=function(a,b,c,d){d?a.goTo(b,c):a.moveTo(b,c)},q.prototype._postLayout=function(){this.resizeContainer()},q.prototype.resizeContainer=function(){if(this.options.isResizingContainer){var a=this._getContainerSize();a&&(this._setContainerMeasure(a.width,!0),this._setContainerMeasure(a.height,!1))}},q.prototype._getContainerSize=k,q.prototype._setContainerMeasure=function(a,b){if(void 0!==a){var c=this.size;c.isBorderBox&&(a+=b?c.paddingLeft+c.paddingRight+c.borderLeftWidth+c.borderRightWidth:c.paddingBottom+c.paddingTop+c.borderTopWidth+c.borderBottomWidth),a=Math.max(a,0),this.element.style[b?"width":"height"]=a+"px"}},q.prototype._itemsOn=function(a,b,c){function d(){return e++,e===f&&c.call(g),!0}for(var e=0,f=a.length,g=this,h=0,i=a.length;i>h;h++){var j=a[h];j.on(b,d)}},q.prototype.ignore=function(a){var b=this.getItem(a);b&&(b.isIgnored=!0)},q.prototype.unignore=function(a){var b=this.getItem(a);b&&delete b.isIgnored},q.prototype.stamp=function(a){if(a=this._find(a)){this.stamps=this.stamps.concat(a);for(var b=0,c=a.length;c>b;b++){var d=a[b];this.ignore(d)}}},q.prototype.unstamp=function(a){if(a=this._find(a))for(var b=0,c=a.length;c>b;b++){var d=a[b];e(d,this.stamps),this.unignore(d)}},q.prototype._find=function(a){return a?("string"==typeof a&&(a=this.element.querySelectorAll(a)),a=d(a)):void 0},q.prototype._manageStamps=function(){if(this.stamps&&this.stamps.length){this._getBoundingRect();for(var a=0,b=this.stamps.length;b>a;a++){var c=this.stamps[a];this._manageStamp(c)}}},q.prototype._getBoundingRect=function(){var a=this.element.getBoundingClientRect(),b=this.size;this._boundingRect={left:a.left+b.paddingLeft+b.borderLeftWidth,top:a.top+b.paddingTop+b.borderTopWidth,right:a.right-(b.paddingRight+b.borderRightWidth),bottom:a.bottom-(b.paddingBottom+b.borderBottomWidth)}},q.prototype._manageStamp=k,q.prototype._getElementOffset=function(a){var b=a.getBoundingClientRect(),c=this._boundingRect,d=n(a),e={left:b.left-c.left-d.marginLeft,top:b.top-c.top-d.marginTop,right:c.right-b.right-d.marginRight,bottom:c.bottom-b.bottom-d.marginBottom};return e},q.prototype.handleEvent=function(a){var b="on"+a.type;this[b]&&this[b](a)},q.prototype.bindResize=function(){this.isResizeBound||(c.bind(a,"resize",this),this.isResizeBound=!0)},q.prototype.unbindResize=function(){this.isResizeBound&&c.unbind(a,"resize",this),this.isResizeBound=!1},q.prototype.onresize=function(){function a(){b.resize(),delete b.resizeTimeout}this.resizeTimeout&&clearTimeout(this.resizeTimeout);var b=this;this.resizeTimeout=setTimeout(a,100)},q.prototype.resize=function(){this.isResizeBound&&this.needsResizeLayout()&&this.layout()},q.prototype.needsResizeLayout=function(){var a=n(this.element),b=this.size&&a;return b&&a.innerWidth!==this.size.innerWidth},q.prototype.addItems=function(a){var b=this._itemize(a);return b.length&&(this.items=this.items.concat(b)),b},q.prototype.appended=function(a){var b=this.addItems(a);b.length&&(this.layoutItems(b,!0),this.reveal(b))},q.prototype.prepended=function(a){var b=this._itemize(a);if(b.length){var c=this.items.slice(0);this.items=b.concat(c),this._resetLayout(),this._manageStamps(),this.layoutItems(b,!0),this.reveal(b),this.layoutItems(c)}},q.prototype.reveal=function(a){var b=a&&a.length;if(b)for(var c=0;b>c;c++){var d=a[c];d.reveal()}},q.prototype.hide=function(a){var b=a&&a.length;if(b)for(var c=0;b>c;c++){var d=a[c];d.hide()}},q.prototype.getItem=function(a){for(var b=0,c=this.items.length;c>b;b++){var d=this.items[b];if(d.element===a)return d}},q.prototype.getItems=function(a){if(a&&a.length){for(var b=[],c=0,d=a.length;d>c;c++){var e=a[c],f=this.getItem(e);f&&b.push(f)}return b}},q.prototype.remove=function(a){a=d(a);var b=this.getItems(a);if(b&&b.length){this._itemsOn(b,"remove",function(){this.emitEvent("removeComplete",[this,b])});for(var c=0,f=b.length;f>c;c++){var g=b[c];g.remove(),e(g,this.items)}}},q.prototype.destroy=function(){var a=this.element.style;a.height="",a.position="",a.width="";for(var b=0,c=this.items.length;c>b;b++){var d=this.items[b];d.destroy()}this.unbindResize(),delete this.element.outlayerGUID,j&&j.removeData(this.element,this.constructor.namespace)},q.data=function(a){var b=a&&a.outlayerGUID;return b&&s[b]},q.create=function(a,c){function d(){q.apply(this,arguments)}return Object.create?d.prototype=Object.create(q.prototype):b(d.prototype,q.prototype),d.prototype.constructor=d,d.defaults=b({},q.defaults),b(d.defaults,c),d.prototype.settings={},d.namespace=a,d.data=q.data,d.Item=function(){p.apply(this,arguments)},d.Item.prototype=new p,g(function(){for(var b=f(a),c=h.querySelectorAll(".js-"+b),e="data-"+b+"-options",g=0,k=c.length;k>g;g++){var l,m=c[g],n=m.getAttribute(e);try{l=n&&JSON.parse(n)}catch(o){i&&i.error("Error parsing "+e+" on "+m.nodeName.toLowerCase()+(m.id?"#"+m.id:"")+": "+o);continue}var p=new d(m,l);j&&j.data(m,a,p)}}),j&&j.bridget&&j.bridget(a,d),d},q.Item=p,q}var h=a.document,i=a.console,j=a.jQuery,k=function(){},l=Object.prototype.toString,m="object"==typeof HTMLElement?function(a){return a instanceof HTMLElement}:function(a){return a&&"object"==typeof a&&1===a.nodeType&&"string"==typeof a.nodeName},n=Array.prototype.indexOf?function(a,b){return a.indexOf(b)}:function(a,b){for(var c=0,d=a.length;d>c;c++)if(a[c]===b)return c;return-1};"function"==typeof define&&define.amd?define("outlayer/outlayer",["eventie/eventie","doc-ready/doc-ready","eventEmitter/EventEmitter","get-size/get-size","matches-selector/matches-selector","./item"],g):a.Outlayer=g(a.eventie,a.docReady,a.EventEmitter,a.getSize,a.matchesSelector,a.Outlayer.Item)}(window),function(a){function b(a,b){var d=a.create("masonry");return d.prototype._resetLayout=function(){this.getSize(),this._getMeasurement("columnWidth","outerWidth"),this._getMeasurement("gutter","outerWidth"),this.measureColumns();var a=this.cols;for(this.colYs=[];a--;)this.colYs.push(0);this.maxY=0},d.prototype.measureColumns=function(){if(this.getContainerWidth(),!this.columnWidth){var a=this.items[0],c=a&&a.element;this.columnWidth=c&&b(c).outerWidth||this.containerWidth}this.columnWidth+=this.gutter,this.cols=Math.floor((this.containerWidth+this.gutter)/this.columnWidth),this.cols=Math.max(this.cols,1)},d.prototype.getContainerWidth=function(){var a=this.options.isFitWidth?this.element.parentNode:this.element,c=b(a);this.containerWidth=c&&c.innerWidth},d.prototype._getItemLayoutPosition=function(a){a.getSize();var b=a.size.outerWidth%this.columnWidth,d=b&&1>b?"round":"ceil",e=Math[d](a.size.outerWidth/this.columnWidth);e=Math.min(e,this.cols);for(var f=this._getColGroup(e),g=Math.min.apply(Math,f),h=c(f,g),i={x:this.columnWidth*h,y:g},j=g+a.size.outerHeight,k=this.cols+1-f.length,l=0;k>l;l++)this.colYs[h+l]=j;return i},d.prototype._getColGroup=function(a){if(2>a)return this.colYs;for(var b=[],c=this.cols+1-a,d=0;c>d;d++){var e=this.colYs.slice(d,d+a);b[d]=Math.max.apply(Math,e)}return b},d.prototype._manageStamp=function(a){var c=b(a),d=this._getElementOffset(a),e=this.options.isOriginLeft?d.left:d.right,f=e+c.outerWidth,g=Math.floor(e/this.columnWidth);g=Math.max(0,g);var h=Math.floor(f/this.columnWidth);h-=f%this.columnWidth?0:1,h=Math.min(this.cols-1,h);for(var i=(this.options.isOriginTop?d.top:d.bottom)+c.outerHeight,j=g;h>=j;j++)this.colYs[j]=Math.max(i,this.colYs[j])},d.prototype._getContainerSize=function(){this.maxY=Math.max.apply(Math,this.colYs);var a={height:this.maxY};return this.options.isFitWidth&&(a.width=this._getContainerFitWidth()),a},d.prototype._getContainerFitWidth=function(){for(var a=0,b=this.cols;--b&&0===this.colYs[b];)a++;return(this.cols-a)*this.columnWidth-this.gutter},d.prototype.needsResizeLayout=function(){var a=this.containerWidth;return this.getContainerWidth(),a!==this.containerWidth},d}var c=Array.prototype.indexOf?function(a,b){return a.indexOf(b)}:function(a,b){for(var c=0,d=a.length;d>c;c++){var e=a[c];if(e===b)return c}return-1};"function"==typeof define&&define.amd?define(["outlayer/outlayer","get-size/get-size"],b):a.Masonry=b(a.Outlayer,a.getSize)}(window);/*
 selectivizr v1.0.2 - (c) Keith Clark, freely distributable under the terms
 of the MIT license.

 selectivizr.com
 */
/*

 Notes about this source
 -----------------------

 * The #DEBUG_START and #DEBUG_END comments are used to mark blocks of code
 that will be removed prior to building a final release version (using a
 pre-compression script)


 References:
 -----------

 * CSS Syntax          : http://www.w3.org/TR/2003/WD-css3-syntax-20030813/#style
 * Selectors           : http://www.w3.org/TR/css3-selectors/#selectors
 * IE Compatability    : http://msdn.microsoft.com/en-us/library/cc351024(VS.85).aspx
 * W3C Selector Tests  : http://www.w3.org/Style/CSS/Test/CSS3/Selectors/current/html/tests/

 */

(function(win) {

    // If browser isn't IE, then stop execution! This handles the script
    // being loaded by non IE browsers because the developer didn't use
    // conditional comments.
    if (/*@cc_on!@*/true) return;

    // =========================== Init Objects ============================

    var doc = document;
    var root = doc.documentElement;
    var xhr = getXHRObject();
    var ieVersion = /MSIE (\d+)/.exec(navigator.userAgent)[1];

    // If were not in standards mode, IE is too old / new or we can't create
    // an XMLHttpRequest object then we should get out now.
    if (doc.compatMode != 'CSS1Compat' || ieVersion<6 || ieVersion>8 || !xhr) {
        return;
    }


    // ========================= Common Objects ============================

    // Compatiable selector engines in order of CSS3 support. Note: '*' is
    // a placholder for the object key name. (basically, crude compression)
    var selectorEngines = {
        "NW"								: "*.Dom.select",
        "MooTools"							: "$$",
        "DOMAssistant"						: "*.$",
        "Prototype"							: "$$",
        "YAHOO"								: "*.util.Selector.query",
        "Sizzle"							: "*",
        "jQuery"							: "*",
        "dojo"								: "*.query"
    };

    var selectorMethod;
    var enabledWatchers 					= [];     // array of :enabled/:disabled elements to poll
    var ie6PatchID 							= 0;      // used to solve ie6's multiple class bug
    var patchIE6MultipleClasses				= true;   // if true adds class bloat to ie6
    var namespace 							= "slvzr";

    // Stylesheet parsing regexp's
    var RE_COMMENT							= /(\/\*[^*]*\*+([^\/][^*]*\*+)*\/)\s*/g;
    var RE_IMPORT							= /@import\s*(?:(?:(?:url\(\s*(['"]?)(.*)\1)\s*\))|(?:(['"])(.*)\3))[^;]*;/g;
    var RE_ASSET_URL 						= /\burl\(\s*(["']?)(?!data:)([^"')]+)\1\s*\)/g;
    var RE_PSEUDO_STRUCTURAL				= /^:(empty|(first|last|only|nth(-last)?)-(child|of-type))$/;
    var RE_PSEUDO_ELEMENTS					= /:(:first-(?:line|letter))/g;
    var RE_SELECTOR_GROUP					= /(^|})\s*([^\{]*?[\[:][^{]+)/g;
    var RE_SELECTOR_PARSE					= /([ +~>])|(:[a-z-]+(?:\(.*?\)+)?)|(\[.*?\])/g;
    var RE_LIBRARY_INCOMPATIBLE_PSEUDOS		= /(:not\()?:(hover|enabled|disabled|focus|checked|target|active|visited|first-line|first-letter)\)?/g;
    var RE_PATCH_CLASS_NAME_REPLACE			= /[^\w-]/g;

    // HTML UI element regexp's
    var RE_INPUT_ELEMENTS					= /^(INPUT|SELECT|TEXTAREA|BUTTON)$/;
    var RE_INPUT_CHECKABLE_TYPES			= /^(checkbox|radio)$/;

    // Broken attribute selector implementations (IE7/8 native [^=""], [$=""] and [*=""])
    var BROKEN_ATTR_IMPLEMENTATIONS			= ieVersion>6 ? /[\$\^*]=(['"])\1/ : null;

    // Whitespace normalization regexp's
    var RE_TIDY_TRAILING_WHITESPACE			= /([(\[+~])\s+/g;
    var RE_TIDY_LEADING_WHITESPACE			= /\s+([)\]+~])/g;
    var RE_TIDY_CONSECUTIVE_WHITESPACE		= /\s+/g;
    var RE_TIDY_TRIM_WHITESPACE				= /^\s*((?:[\S\s]*\S)?)\s*$/;

    // String constants
    var EMPTY_STRING						= "";
    var SPACE_STRING						= " ";
    var PLACEHOLDER_STRING					= "$1";

    // =========================== Patching ================================

    // --[ patchStyleSheet() ]----------------------------------------------
    // Scans the passed cssText for selectors that require emulation and
    // creates one or more patches for each matched selector.
    function patchStyleSheet( cssText ) {
        return cssText.replace(RE_PSEUDO_ELEMENTS, PLACEHOLDER_STRING).
            replace(RE_SELECTOR_GROUP, function(m, prefix, selectorText) {
                var selectorGroups = selectorText.split(",");
                for (var c = 0, cs = selectorGroups.length; c < cs; c++) {
                    var selector = normalizeSelectorWhitespace(selectorGroups[c]) + SPACE_STRING;
                    var patches = [];
                    selectorGroups[c] = selector.replace(RE_SELECTOR_PARSE,
                        function(match, combinator, pseudo, attribute, index) {
                            if (combinator) {
                                if (patches.length>0) {
                                    applyPatches( selector.substring(0, index), patches );
                                    patches = [];
                                }
                                return combinator;
                            }
                            else {
                                var patch = (pseudo) ? patchPseudoClass( pseudo ) : patchAttribute( attribute );
                                if (patch) {
                                    patches.push(patch);
                                    return "." + patch.className;
                                }
                                return match;
                            }
                        }
                    );
                }
                return prefix + selectorGroups.join(",");
            });
    };

    // --[ patchAttribute() ]-----------------------------------------------
    // returns a patch for an attribute selector.
    function patchAttribute( attr ) {
        return (!BROKEN_ATTR_IMPLEMENTATIONS || BROKEN_ATTR_IMPLEMENTATIONS.test(attr)) ?
        { className: createClassName(attr), applyClass: true } : null;
    };

    // --[ patchPseudoClass() ]---------------------------------------------
    // returns a patch for a pseudo-class
    function patchPseudoClass( pseudo ) {

        var applyClass = true;
        var className = createClassName(pseudo.slice(1));
        var isNegated = pseudo.substring(0, 5) == ":not(";
        var activateEventName;
        var deactivateEventName;

        // if negated, remove :not()
        if (isNegated) {
            pseudo = pseudo.slice(5, -1);
        }

        // bracket contents are irrelevant - remove them
        var bracketIndex = pseudo.indexOf("(")
        if (bracketIndex > -1) {
            pseudo = pseudo.substring(0, bracketIndex);
        }

        // check we're still dealing with a pseudo-class
        if (pseudo.charAt(0) == ":") {
            switch (pseudo.slice(1)) {

                case "root":
                    applyClass = function(e) {
                        return isNegated ? e != root : e == root;
                    }
                    break;

                case "target":
                    // :target is only supported in IE8
                    if (ieVersion == 8) {
                        applyClass = function(e) {
                            var handler = function() {
                                var hash = location.hash;
                                var hashID = hash.slice(1);
                                return isNegated ? (hash == EMPTY_STRING || e.id != hashID) : (hash != EMPTY_STRING && e.id == hashID);
                            };
                            addEvent( win, "hashchange", function() {
                                toggleElementClass(e, className, handler());
                            })
                            return handler();
                        }
                        break;
                    }
                    return false;

                case "checked":
                    applyClass = function(e) {
                        if (RE_INPUT_CHECKABLE_TYPES.test(e.type)) {
                            addEvent( e, "propertychange", function() {
                                if (event.propertyName == "checked") {
                                    toggleElementClass( e, className, e.checked !== isNegated );
                                }
                            })
                        }
                        return e.checked !== isNegated;
                    }
                    break;

                case "disabled":
                    isNegated = !isNegated;

                case "enabled":
                    applyClass = function(e) {
                        if (RE_INPUT_ELEMENTS.test(e.tagName)) {
                            addEvent( e, "propertychange", function() {
                                if (event.propertyName == "$disabled") {
                                    toggleElementClass( e, className, e.$disabled === isNegated );
                                }
                            });
                            enabledWatchers.push(e);
                            e.$disabled = e.disabled;
                            return e.disabled === isNegated;
                        }
                        return pseudo == ":enabled" ? isNegated : !isNegated;
                    }
                    break;

                case "focus":
                    activateEventName = "focus";
                    deactivateEventName = "blur";

                case "hover":
                    if (!activateEventName) {
                        activateEventName = "mouseenter";
                        deactivateEventName = "mouseleave";
                    }
                    applyClass = function(e) {
                        addEvent( e, isNegated ? deactivateEventName : activateEventName, function() {
                            toggleElementClass( e, className, true );
                        })
                        addEvent( e, isNegated ? activateEventName : deactivateEventName, function() {
                            toggleElementClass( e, className, false );
                        })
                        return isNegated;
                    }
                    break;

                // everything else
                default:
                    // If we don't support this pseudo-class don't create
                    // a patch for it
                    if (!RE_PSEUDO_STRUCTURAL.test(pseudo)) {
                        return false;
                    }
                    break;
            }
        }
        return { className: className, applyClass: applyClass };
    };

    // --[ applyPatches() ]-------------------------------------------------
    // uses the passed selector text to find DOM nodes and patch them
    function applyPatches(selectorText, patches) {
        var elms;

        // Although some selector libraries can find :checked :enabled etc.
        // we need to find all elements that could have that state because
        // it can be changed by the user.
        var domSelectorText = selectorText.replace(RE_LIBRARY_INCOMPATIBLE_PSEUDOS, EMPTY_STRING);

        // If the dom selector equates to an empty string or ends with
        // whitespace then we need to append a universal selector (*) to it.
        if (domSelectorText == EMPTY_STRING || domSelectorText.charAt(domSelectorText.length - 1) == SPACE_STRING) {
            domSelectorText += "*";
        }

        // Ensure we catch errors from the selector library
        try {
            elms = selectorMethod( domSelectorText );
        } catch (ex) {
            // #DEBUG_START
            log( "Selector '" + selectorText + "' threw exception '" + ex + "'" );
            // #DEBUG_END
        }


        if (elms) {
            for (var d = 0, dl = elms.length; d < dl; d++) {
                var elm = elms[d];
                var cssClasses = elm.className;
                for (var f = 0, fl = patches.length; f < fl; f++) {
                    var patch = patches[f];

                    if (!hasPatch(elm, patch)) {
                        if (patch.applyClass && (patch.applyClass === true || patch.applyClass(elm) === true)) {
                            cssClasses = toggleClass(cssClasses, patch.className, true );
                        }
                    }
                }
                elm.className = cssClasses;
            }
        }
    };

    // --[ hasPatch() ]-----------------------------------------------------
    // checks for the exsistence of a patch on an element
    function hasPatch( elm, patch ) {
        return new RegExp("(^|\\s)" + patch.className + "(\\s|$)").test(elm.className);
    };


    // =========================== Utility =================================

    function createClassName( className ) {
        return namespace + "-" + ((ieVersion == 6 && patchIE6MultipleClasses) ?
            ie6PatchID++
            :
            className.replace(RE_PATCH_CLASS_NAME_REPLACE, function(a) { return a.charCodeAt(0) }));
    };

    // --[ log() ]----------------------------------------------------------
    // #DEBUG_START
    function log( message ) {
        if (win.console) {
            win.console.log(message);
        }
    };
    // #DEBUG_END

    // --[ trim() ]---------------------------------------------------------
    // removes leading, trailing whitespace from a string
    function trim( text ) {
        return text.replace(RE_TIDY_TRIM_WHITESPACE, PLACEHOLDER_STRING);
    };

    // --[ normalizeWhitespace() ]------------------------------------------
    // removes leading, trailing and consecutive whitespace from a string
    function normalizeWhitespace( text ) {
        return trim(text).replace(RE_TIDY_CONSECUTIVE_WHITESPACE, SPACE_STRING);
    };

    // --[ normalizeSelectorWhitespace() ]----------------------------------
    // tidies whitespace around selector brackets and combinators
    function normalizeSelectorWhitespace( selectorText ) {
        return normalizeWhitespace(selectorText.
                replace(RE_TIDY_TRAILING_WHITESPACE, PLACEHOLDER_STRING).
                replace(RE_TIDY_LEADING_WHITESPACE, PLACEHOLDER_STRING)
        );
    };

    // --[ toggleElementClass() ]-------------------------------------------
    // toggles a single className on an element
    function toggleElementClass( elm, className, on ) {
        var oldClassName = elm.className;
        var newClassName = toggleClass(oldClassName, className, on);
        if (newClassName != oldClassName) {
            elm.className = newClassName;
            elm.parentNode.className += EMPTY_STRING;
        }
    };

    // --[ toggleClass() ]--------------------------------------------------
    // adds / removes a className from a string of classNames. Used to
    // manage multiple class changes without forcing a DOM redraw
    function toggleClass( classList, className, on ) {
        var re = RegExp("(^|\\s)" + className + "(\\s|$)");
        var classExists = re.test(classList);
        if (on) {
            return classExists ? classList : classList + SPACE_STRING + className;
        } else {
            return classExists ? trim(classList.replace(re, PLACEHOLDER_STRING)) : classList;
        }
    };

    // --[ addEvent() ]-----------------------------------------------------
    function addEvent(elm, eventName, eventHandler) {
        elm.attachEvent("on" + eventName, eventHandler);
    };

    // --[ getXHRObject() ]-------------------------------------------------
    function getXHRObject()
    {
        if (win.XMLHttpRequest) {
            return new XMLHttpRequest;
        }
        try	{
            return new ActiveXObject('Microsoft.XMLHTTP');
        } catch(e) {
            return null;
        }
    };

    // --[ loadStyleSheet() ]-----------------------------------------------
    function loadStyleSheet( url ) {
        xhr.open("GET", url, false);
        xhr.send();
        return (xhr.status==200) ? xhr.responseText : EMPTY_STRING;
    };

    // --[ resolveUrl() ]---------------------------------------------------
    // Converts a URL fragment to a fully qualified URL using the specified
    // context URL. Returns null if same-origin policy is broken
    function resolveUrl( url, contextUrl ) {

        function getProtocolAndHost( url ) {
            return url.substring(0, url.indexOf("/", 8));
        };

        // absolute path
        if (/^https?:\/\//i.test(url)) {
            return getProtocolAndHost(contextUrl) == getProtocolAndHost(url) ? url : null;
        }

        // root-relative path
        if (url.charAt(0)=="/")	{
            return getProtocolAndHost(contextUrl) + url;
        }

        // relative path
        var contextUrlPath = contextUrl.split(/[?#]/)[0]; // ignore query string in the contextUrl
        if (url.charAt(0) != "?" && contextUrlPath.charAt(contextUrlPath.length - 1) != "/") {
            contextUrlPath = contextUrlPath.substring(0, contextUrlPath.lastIndexOf("/") + 1);
        }

        return contextUrlPath + url;
    };

    // --[ parseStyleSheet() ]----------------------------------------------
    // Downloads the stylesheet specified by the URL, removes it's comments
    // and recursivly replaces @import rules with their contents, ultimately
    // returning the full cssText.
    function parseStyleSheet( url ) {
        if (url) {
            return loadStyleSheet(url).replace(RE_COMMENT, EMPTY_STRING).
                replace(RE_IMPORT, function( match, quoteChar, importUrl, quoteChar2, importUrl2 ) {
                    return parseStyleSheet(resolveUrl(importUrl || importUrl2, url));
                }).
                replace(RE_ASSET_URL, function( match, quoteChar, assetUrl ) {
                    quoteChar = quoteChar || EMPTY_STRING;
                    return " url(" + quoteChar + resolveUrl(assetUrl, url) + quoteChar + ") ";
                });
        }
        return EMPTY_STRING;
    };

    // --[ init() ]---------------------------------------------------------
    function init() {
        // honour the <base> tag
        var url, stylesheet;
        var baseTags = doc.getElementsByTagName("BASE");
        var baseUrl = (baseTags.length > 0) ? baseTags[0].href : doc.location.href;

        /* Note: This code prevents IE from freezing / crashing when using
         @font-face .eot files but it modifies the <head> tag and could
         trigger the IE stylesheet limit. It will also cause FOUC issues.
         If you choose to use it, make sure you comment out the for loop
         directly below this comment.

         var head = doc.getElementsByTagName("head")[0];
         for (var c=doc.styleSheets.length-1; c>=0; c--) {
         stylesheet = doc.styleSheets[c]
         head.appendChild(doc.createElement("style"))
         var patchedStylesheet = doc.styleSheets[doc.styleSheets.length-1];

         if (stylesheet.href != EMPTY_STRING) {
         url = resolveUrl(stylesheet.href, baseUrl)
         if (url) {
         patchedStylesheet.cssText = patchStyleSheet( parseStyleSheet( url ) )
         stylesheet.disabled = true
         setTimeout( function () {
         stylesheet.owningElement.parentNode.removeChild(stylesheet.owningElement)
         })
         }
         }
         }
         */

        for (var c = 0; c < doc.styleSheets.length; c++) {
            stylesheet = doc.styleSheets[c]
            if (stylesheet.href != EMPTY_STRING) {
                url = resolveUrl(stylesheet.href, baseUrl);
                if (url) {
                    stylesheet.cssText = patchStyleSheet( parseStyleSheet( url ) );
                }
            }
        }

        // :enabled & :disabled polling script (since we can't hook
        // onpropertychange event when an element is disabled)
        if (enabledWatchers.length > 0) {
            setInterval( function() {
                for (var c = 0, cl = enabledWatchers.length; c < cl; c++) {
                    var e = enabledWatchers[c];
                    if (e.disabled !== e.$disabled) {
                        if (e.disabled) {
                            e.disabled = false;
                            e.$disabled = true;
                            e.disabled = true;
                        }
                        else {
                            e.$disabled = e.disabled;
                        }
                    }
                }
            },250)
        }
    };

    // Bind selectivizr to the ContentLoaded event.
    ContentLoaded(win, function() {
        // Determine the "best fit" selector engine
        for (var engine in selectorEngines) {
            var members, member, context = win;
            if (win[engine]) {
                members = selectorEngines[engine].replace("*", engine).split(".");
                while ((member = members.shift()) && (context = context[member])) {}
                if (typeof context == "function") {
                    selectorMethod = context;
                    init();
                    return;
                }
            }
        }
    });


    /*!
     * ContentLoaded.js by Diego Perini, modified for IE<9 only (to save space)
     *
     * Author: Diego Perini (diego.perini at gmail.com)
     * Summary: cross-browser wrapper for DOMContentLoaded
     * Updated: 20101020
     * License: MIT
     * Version: 1.2
     *
     * URL:
     * http://javascript.nwbox.com/ContentLoaded/
     * http://javascript.nwbox.com/ContentLoaded/MIT-LICENSE
     *
     */

    // @w window reference
    // @f function reference
    function ContentLoaded(win, fn) {

        var done = false, top = true,
            init = function(e) {
                if (e.type == "readystatechange" && doc.readyState != "complete") return;
                (e.type == "load" ? win : doc).detachEvent("on" + e.type, init, false);
                if (!done && (done = true)) fn.call(win, e.type || e);
            },
            poll = function() {
                try { root.doScroll("left"); } catch(e) { setTimeout(poll, 50); return; }
                init('poll');
            };

        if (doc.readyState == "complete") fn.call(win, EMPTY_STRING);
        else {
            if (doc.createEventObject && root.doScroll) {
                try { top = !win.frameElement; } catch(e) { }
                if (top) poll();
            }
            addEvent(doc,"readystatechange", init);
            addEvent(win,"load", init);
        }
    };
})(this);

/*! http://mths.be/placeholder v2.0.8 by @mathias */
;(function(window, document, $) {

    // Opera Mini v7 doesn’t support placeholder although its DOM seems to indicate so
    var isOperaMini = Object.prototype.toString.call(window.operamini) == '[object OperaMini]';
    var isInputSupported = 'placeholder' in document.createElement('input') && !isOperaMini;
    var isTextareaSupported = 'placeholder' in document.createElement('textarea') && !isOperaMini;
    var prototype = $.fn;
    var valHooks = $.valHooks;
    var propHooks = $.propHooks;
    var hooks;
    var placeholder;

    if (isInputSupported && isTextareaSupported) {

        placeholder = prototype.placeholder = function() {
            return this;
        };

        placeholder.input = placeholder.textarea = true;

    } else {

        placeholder = prototype.placeholder = function() {
            var $this = this;
            $this
                .filter((isInputSupported ? 'textarea' : ':input') + '[placeholder]')
                .not('.placeholder')
                .bind({
                    'focus.placeholder': clearPlaceholder,
                    'blur.placeholder': setPlaceholder
                })
                .data('placeholder-enabled', true)
                .trigger('blur.placeholder');
            return $this;
        };

        placeholder.input = isInputSupported;
        placeholder.textarea = isTextareaSupported;

        hooks = {
            'get': function(element) {
                var $element = $(element);

                var $passwordInput = $element.data('placeholder-password');
                if ($passwordInput) {
                    return $passwordInput[0].value;
                }

                return $element.data('placeholder-enabled') && $element.hasClass('placeholder') ? '' : element.value;
            },
            'set': function(element, value) {
                var $element = $(element);

                var $passwordInput = $element.data('placeholder-password');
                if ($passwordInput) {
                    return $passwordInput[0].value = value;
                }

                if (!$element.data('placeholder-enabled')) {
                    return element.value = value;
                }
                if (value == '') {
                    element.value = value;
                    // Issue #56: Setting the placeholder causes problems if the element continues to have focus.
                    if (element != safeActiveElement()) {
                        // We can't use `triggerHandler` here because of dummy text/password inputs :(
                        setPlaceholder.call(element);
                    }
                } else if ($element.hasClass('placeholder')) {
                    clearPlaceholder.call(element, true, value) || (element.value = value);
                } else {
                    element.value = value;
                }
                // `set` can not return `undefined`; see http://jsapi.info/jquery/1.7.1/val#L2363
                return $element;
            }
        };

        if (!isInputSupported) {
            valHooks.input = hooks;
            propHooks.value = hooks;
        }
        if (!isTextareaSupported) {
            valHooks.textarea = hooks;
            propHooks.value = hooks;
        }

        $(function() {
            // Look for forms
            $(document).delegate('form', 'submit.placeholder', function() {
                // Clear the placeholder values so they don't get submitted
                var $inputs = $('.placeholder', this).each(clearPlaceholder);
                setTimeout(function() {
                    $inputs.each(setPlaceholder);
                }, 10);
            });
        });

        // Clear placeholder values upon page reload
        $(window).bind('beforeunload.placeholder', function() {
            $('.placeholder').each(function() {
                this.value = '';
            });
        });

    }

    function args(elem) {
        // Return an object of element attributes
        var newAttrs = {};
        var rinlinejQuery = /^jQuery\d+$/;
        $.each(elem.attributes, function(i, attr) {
            if (attr.specified && !rinlinejQuery.test(attr.name)) {
                newAttrs[attr.name] = attr.value;
            }
        });
        return newAttrs;
    }

    function clearPlaceholder(event, value) {
        var input = this;
        var $input = $(input);
        if (input.value == $input.attr('placeholder') && $input.hasClass('placeholder')) {
            if ($input.data('placeholder-password')) {
                $input = $input.hide().next().show().attr('id', $input.removeAttr('id').data('placeholder-id'));
                // If `clearPlaceholder` was called from `$.valHooks.input.set`
                if (event === true) {
                    return $input[0].value = value;
                }
                $input.focus();
            } else {
                input.value = '';
                $input.removeClass('placeholder');
                input == safeActiveElement() && input.select();
            }
        }
    }

    function setPlaceholder() {
        var $replacement;
        var input = this;
        var $input = $(input);
        var id = this.id;
        if (input.value == '') {
            if (input.type == 'password') {
                if (!$input.data('placeholder-textinput')) {
                    try {
                        $replacement = $input.clone().attr({ 'type': 'text' });
                    } catch(e) {
                        $replacement = $('<input>').attr($.extend(args(this), { 'type': 'text' }));
                    }
                    $replacement
                        .removeAttr('name')
                        .data({
                            'placeholder-password': $input,
                            'placeholder-id': id
                        })
                        .bind('focus.placeholder', clearPlaceholder);
                    $input
                        .data({
                            'placeholder-textinput': $replacement,
                            'placeholder-id': id
                        })
                        .before($replacement);
                }
                $input = $input.removeAttr('id').hide().prev().attr('id', id).show();
                // Note: `$input[0] != input` now!
            }
            $input.addClass('placeholder');
            $input[0].value = $input.attr('placeholder');
        } else {
            $input.removeClass('placeholder');
        }
    }

    function safeActiveElement() {
        // Avoid IE9 `document.activeElement` of death
        // https://github.com/mathiasbynens/jquery-placeholder/pull/99
        try {
            return document.activeElement;
        } catch (exception) {}
    }

}(this, document, jQuery));

/*! Respond.js v1.4.2: min/max-width media query polyfill
 * Copyright 2014 Scott Jehl
 * Licensed under MIT
 * http://j.mp/respondjs */

/*! matchMedia() polyfill - Test a CSS media type/query in JS. Authors & copyright (c) 2012: Scott Jehl, Paul Irish, Nicholas Zakas. Dual MIT/BSD license */
/*! NOTE: If you're already including a window.matchMedia polyfill via Modernizr or otherwise, you don't need this part */
(function(w) {
    "use strict";
    w.matchMedia = w.matchMedia || function(doc, undefined) {
        var bool, docElem = doc.documentElement, refNode = docElem.firstElementChild || docElem.firstChild, fakeBody = doc.createElement("body"), div = doc.createElement("div");
        div.id = "mq-test-1";
        div.style.cssText = "position:absolute;top:-100em";
        fakeBody.style.background = "none";
        fakeBody.appendChild(div);
        return function(q) {
            div.innerHTML = '&shy;<style media="' + q + '"> #mq-test-1 { width: 42px; }</style>';
            docElem.insertBefore(fakeBody, refNode);
            bool = div.offsetWidth === 42;
            docElem.removeChild(fakeBody);
            return {
                matches: bool,
                media: q
            };
        };
    }(w.document);
})(this);

/*! matchMedia() polyfill addListener/removeListener extension. Author & copyright (c) 2012: Scott Jehl. Dual MIT/BSD license */
(function(w) {
    "use strict";
    if (w.matchMedia && w.matchMedia("all").addListener) {
        return false;
    }
    var localMatchMedia = w.matchMedia, hasMediaQueries = localMatchMedia("only all").matches, isListening = false, timeoutID = 0, queries = [], handleChange = function(evt) {
        w.clearTimeout(timeoutID);
        timeoutID = w.setTimeout(function() {
            for (var i = 0, il = queries.length; i < il; i++) {
                var mql = queries[i].mql, listeners = queries[i].listeners || [], matches = localMatchMedia(mql.media).matches;
                if (matches !== mql.matches) {
                    mql.matches = matches;
                    for (var j = 0, jl = listeners.length; j < jl; j++) {
                        listeners[j].call(w, mql);
                    }
                }
            }
        }, 30);
    };
    w.matchMedia = function(media) {
        var mql = localMatchMedia(media), listeners = [], index = 0;
        mql.addListener = function(listener) {
            if (!hasMediaQueries) {
                return;
            }
            if (!isListening) {
                isListening = true;
                w.addEventListener("resize", handleChange, true);
            }
            if (index === 0) {
                index = queries.push({
                    mql: mql,
                    listeners: listeners
                });
            }
            listeners.push(listener);
        };
        mql.removeListener = function(listener) {
            for (var i = 0, il = listeners.length; i < il; i++) {
                if (listeners[i] === listener) {
                    listeners.splice(i, 1);
                }
            }
        };
        return mql;
    };
})(this);

(function(w) {
    "use strict";
    var respond = {};
    w.respond = respond;
    respond.update = function() {};
    var requestQueue = [], xmlHttp = function() {
        var xmlhttpmethod = false;
        try {
            xmlhttpmethod = new w.XMLHttpRequest();
        } catch (e) {
            xmlhttpmethod = new w.ActiveXObject("Microsoft.XMLHTTP");
        }
        return function() {
            return xmlhttpmethod;
        };
    }(), ajax = function(url, callback) {
        var req = xmlHttp();
        if (!req) {
            return;
        }
        req.open("GET", url, true);
        req.onreadystatechange = function() {
            if (req.readyState !== 4 || req.status !== 200 && req.status !== 304) {
                return;
            }
            callback(req.responseText);
        };
        if (req.readyState === 4) {
            return;
        }
        req.send(null);
    }, isUnsupportedMediaQuery = function(query) {
        return query.replace(respond.regex.minmaxwh, "").match(respond.regex.other);
    };
    respond.ajax = ajax;
    respond.queue = requestQueue;
    respond.unsupportedmq = isUnsupportedMediaQuery;
    respond.regex = {
        media: /@media[^\{]+\{([^\{\}]*\{[^\}\{]*\})+/gi,
        keyframes: /@(?:\-(?:o|moz|webkit)\-)?keyframes[^\{]+\{(?:[^\{\}]*\{[^\}\{]*\})+[^\}]*\}/gi,
        comments: /\/\*[^*]*\*+([^/][^*]*\*+)*\//gi,
        urls: /(url\()['"]?([^\/\)'"][^:\)'"]+)['"]?(\))/g,
        findStyles: /@media *([^\{]+)\{([\S\s]+?)$/,
        only: /(only\s+)?([a-zA-Z]+)\s?/,
        minw: /\(\s*min\-width\s*:\s*(\s*[0-9\.]+)(px|em)\s*\)/,
        maxw: /\(\s*max\-width\s*:\s*(\s*[0-9\.]+)(px|em)\s*\)/,
        minmaxwh: /\(\s*m(in|ax)\-(height|width)\s*:\s*(\s*[0-9\.]+)(px|em)\s*\)/gi,
        other: /\([^\)]*\)/g
    };
    respond.mediaQueriesSupported = w.matchMedia && w.matchMedia("only all") !== null && w.matchMedia("only all").matches;
    if (respond.mediaQueriesSupported) {
        return;
    }
    var doc = w.document, docElem = doc.documentElement, mediastyles = [], rules = [], appendedEls = [], parsedSheets = {}, resizeThrottle = 30, head = doc.getElementsByTagName("head")[0] || docElem, base = doc.getElementsByTagName("base")[0], links = head.getElementsByTagName("link"), lastCall, resizeDefer, eminpx, getEmValue = function() {
        var ret, div = doc.createElement("div"), body = doc.body, originalHTMLFontSize = docElem.style.fontSize, originalBodyFontSize = body && body.style.fontSize, fakeUsed = false;
        div.style.cssText = "position:absolute;font-size:1em;width:1em";
        if (!body) {
            body = fakeUsed = doc.createElement("body");
            body.style.background = "none";
        }
        docElem.style.fontSize = "100%";
        body.style.fontSize = "100%";
        body.appendChild(div);
        if (fakeUsed) {
            docElem.insertBefore(body, docElem.firstChild);
        }
        ret = div.offsetWidth;
        if (fakeUsed) {
            docElem.removeChild(body);
        } else {
            body.removeChild(div);
        }
        docElem.style.fontSize = originalHTMLFontSize;
        if (originalBodyFontSize) {
            body.style.fontSize = originalBodyFontSize;
        }
        ret = eminpx = parseFloat(ret);
        return ret;
    }, applyMedia = function(fromResize) {
        var name = "clientWidth", docElemProp = docElem[name], currWidth = doc.compatMode === "CSS1Compat" && docElemProp || doc.body[name] || docElemProp, styleBlocks = {}, lastLink = links[links.length - 1], now = new Date().getTime();
        if (fromResize && lastCall && now - lastCall < resizeThrottle) {
            w.clearTimeout(resizeDefer);
            resizeDefer = w.setTimeout(applyMedia, resizeThrottle);
            return;
        } else {
            lastCall = now;
        }
        for (var i in mediastyles) {
            if (mediastyles.hasOwnProperty(i)) {
                var thisstyle = mediastyles[i], min = thisstyle.minw, max = thisstyle.maxw, minnull = min === null, maxnull = max === null, em = "em";
                if (!!min) {
                    min = parseFloat(min) * (min.indexOf(em) > -1 ? eminpx || getEmValue() : 1);
                }
                if (!!max) {
                    max = parseFloat(max) * (max.indexOf(em) > -1 ? eminpx || getEmValue() : 1);
                }
                if (!thisstyle.hasquery || (!minnull || !maxnull) && (minnull || currWidth >= min) && (maxnull || currWidth <= max)) {
                    if (!styleBlocks[thisstyle.media]) {
                        styleBlocks[thisstyle.media] = [];
                    }
                    styleBlocks[thisstyle.media].push(rules[thisstyle.rules]);
                }
            }
        }
        for (var j in appendedEls) {
            if (appendedEls.hasOwnProperty(j)) {
                if (appendedEls[j] && appendedEls[j].parentNode === head) {
                    head.removeChild(appendedEls[j]);
                }
            }
        }
        appendedEls.length = 0;
        for (var k in styleBlocks) {
            if (styleBlocks.hasOwnProperty(k)) {
                var ss = doc.createElement("style"), css = styleBlocks[k].join("\n");
                ss.type = "text/css";
                ss.media = k;
                head.insertBefore(ss, lastLink.nextSibling);
                if (ss.styleSheet) {
                    ss.styleSheet.cssText = css;
                } else {
                    ss.appendChild(doc.createTextNode(css));
                }
                appendedEls.push(ss);
            }
        }
    }, translate = function(styles, href, media) {
        var qs = styles.replace(respond.regex.comments, "").replace(respond.regex.keyframes, "").match(respond.regex.media), ql = qs && qs.length || 0;
        href = href.substring(0, href.lastIndexOf("/"));
        var repUrls = function(css) {
            return css.replace(respond.regex.urls, "$1" + href + "$2$3");
        }, useMedia = !ql && media;
        if (href.length) {
            href += "/";
        }
        if (useMedia) {
            ql = 1;
        }
        for (var i = 0; i < ql; i++) {
            var fullq, thisq, eachq, eql;
            if (useMedia) {
                fullq = media;
                rules.push(repUrls(styles));
            } else {
                fullq = qs[i].match(respond.regex.findStyles) && RegExp.$1;
                rules.push(RegExp.$2 && repUrls(RegExp.$2));
            }
            eachq = fullq.split(",");
            eql = eachq.length;
            for (var j = 0; j < eql; j++) {
                thisq = eachq[j];
                if (isUnsupportedMediaQuery(thisq)) {
                    continue;
                }
                mediastyles.push({
                    media: thisq.split("(")[0].match(respond.regex.only) && RegExp.$2 || "all",
                    rules: rules.length - 1,
                    hasquery: thisq.indexOf("(") > -1,
                    minw: thisq.match(respond.regex.minw) && parseFloat(RegExp.$1) + (RegExp.$2 || ""),
                    maxw: thisq.match(respond.regex.maxw) && parseFloat(RegExp.$1) + (RegExp.$2 || "")
                });
            }
        }
        applyMedia();
    }, makeRequests = function() {
        if (requestQueue.length) {
            var thisRequest = requestQueue.shift();
            ajax(thisRequest.href, function(styles) {
                translate(styles, thisRequest.href, thisRequest.media);
                parsedSheets[thisRequest.href] = true;
                w.setTimeout(function() {
                    makeRequests();
                }, 0);
            });
        }
    }, ripCSS = function() {
        for (var i = 0; i < links.length; i++) {
            var sheet = links[i], href = sheet.href, media = sheet.media, isCSS = sheet.rel && sheet.rel.toLowerCase() === "stylesheet";
            if (!!href && isCSS && !parsedSheets[href]) {
                if (sheet.styleSheet && sheet.styleSheet.rawCssText) {
                    translate(sheet.styleSheet.rawCssText, href, media);
                    parsedSheets[href] = true;
                } else {
                    if (!/^([a-zA-Z:]*\/\/)/.test(href) && !base || href.replace(RegExp.$1, "").split("/")[0] === w.location.host) {
                        if (href.substring(0, 2) === "//") {
                            href = w.location.protocol + href;
                        }
                        requestQueue.push({
                            href: href,
                            media: media
                        });
                    }
                }
            }
        }
        makeRequests();
    };
    ripCSS();
    respond.update = ripCSS;
    respond.getEmValue = getEmValue;
    function callMedia() {
        applyMedia(true);
    }
    if (w.addEventListener) {
        w.addEventListener("resize", callMedia, false);
    } else if (w.attachEvent) {
        w.attachEvent("onresize", callMedia);
    }
})(this);;(function ($) {

    /*! Tiny Pub/Sub - v0.7.0 - 2013-01-29
     * https://github.com/cowboy/jquery-tiny-pubsub
     * Copyright (c) 2014 "Cowboy" Ben Alman; Licensed MIT */
    var o = $({});
    $.subscribe = function () {
        o.on.apply(o, arguments);
    };

    $.unsubscribe = function () {
        o.off.apply(o, arguments);
    };

    $.publish = function () {
        o.trigger.apply(o, arguments);
    };
}(jQuery));

;(function ($, window) {
    'use strict';

    var numberRegex = /^\-?\d*\.?\d*$/,
        objectRegex = /^[\[\{]/;

    /**
     * Tries to deserialize the given string value and returns the right
     * value if its successful.
     *
     * @private
     * @method deserializeValue
     * @param {String} value
     * @returns {String|Boolean|Number|Object|Array|null}
     */
    function deserializeValue(value) {
        try {
            return !value ? value : value === 'true' || (
                value === 'false' ? false
                    : value === 'null' ? null
                    : numberRegex.test(value) ? +value
                    : objectRegex.test(value) ? $.parseJSON(value)
                    : value
            )
        } catch (e) {
            return value;
        }
    }

    /**
     * Constructor method of the PluginBase class. This method will try to
     * call the ```init```-method, where you can place your custom initialization of the plugin.
     *
     * @class PluginBase
     * @constructor
     * @param {String} name - Plugin name that is used for the events suffixes.
     * @param {HTMLElement} element - Element which should be used for the plugin.
     * @param {Object} options - The user settings, which overrides the default settings
     */
    function PluginBase(name, element, options) {
        var me = this;

        /**
         * @property {String} _name - Name of the Plugin
         * @private
         */
        me._name = name;

        /**
         * @property {jQuery} $el - Plugin element wrapped by jQuery
         */
        me.$el = $(element);

        /**
         * @property {Object} opts - Merged plugin options
         */
        me.opts = $.extend({}, me.defaults || {}, options);

        /**
         * @property {string} eventSuffix - Suffix which will be appended to the eventType to get namespaced events
         */
        me.eventSuffix = '.' + name;

        /**
         * @property {Array} _events Registered events listeners. See {@link PluginBase._on} for registration
         * @private
         */
        me._events = [];

        // Create new selector for the plugin
        $.expr[':']['plugin-' + name.toLowerCase()] = function (elem) {
            return !!$.data(elem, 'plugin_' + name);
        };

        // Call the init method of the plugin
        me.init();

        /** @deprecated - will be removed in 5.1 */
        $.publish('plugin/' + name + '/init', [ me ]);

        $.publish('plugin/' + name + '/onInit', me);
    }

    PluginBase.prototype = {

        /**
         * Template function for the plugin initialisation.
         * Must be overridden for custom initialisation logic or an error will be thrown.
         *
         * @public
         * @method init
         */
        init: function () {
            throw new Error('Plugin ' + this.getName() + ' has to have an init function!');
        },

        /**
         * Template function for the plugin destruction.
         * Should be overridden for custom destruction code.
         *
         * @public
         * @method destroy
         */
        destroy: function () {

            if (typeof console !== 'undefined' && typeof console.warn === 'function') {
                console.warn('Plugin ' + this.getName() + ' should have a custom destroy method!');
            }

            this._destroy();
        },

        /**
         * Template function to update the plugin.
         * This function will be called when the breakpoint has changed but the configurations are the same.
         *
         * @public
         * @method update
         */
        update: function () {

        },

        /**
         * Destroys the plugin on the {@link HTMLElement}. It removes the instance of the plugin
         * which is bounded to the {@link jQuery} element.
         *
         * If the plugin author has used the {@link PluginBase._on} method, the added event listeners
         * will automatically be cleared.
         *
         * @private
         * @method _destroy
         * @returns {PluginBase}
         */
        _destroy: function () {
            var me = this,
                name = me.getName();

            $.each(me._events, function (i, obj) {
                obj.el.off(obj.event);
            });

            // remove all references of extern plugins
            $.each(me.opts, function (o) {
                delete me.opts[o];
            });

            me.$el.removeData('plugin_' + name);

            if (me.alias) {
                me.$el.removeData('plugin_' + me.alias);
            }

            /** @deprecated - will be removed in 5.1 */
            $.publish('plugin/' + name + '/destroy', [ me ]);

            $.publish('plugin/' + name + '/onDestroy', me);

            return me;
        },

        /**
         * Wrapper method for {@link jQuery.on}, which registers in the event in the {@link PluginBase._events} array,
         * so the listeners can automatically be removed using the {@link PluginBase._destroy} method.
         *
         * @params {jQuery} Element, which should be used to add the listener
         * @params {String} Event type, you want to register.
         * @returns {PluginBase}
         */
        _on: function () {
            var me = this,
                $el = $(arguments[0]),
                event = me.getEventName(arguments[1]),
                args = Array.prototype.slice.call(arguments, 2);

            me._events.push({ 'el': $el, 'event': event });
            args.unshift(event);
            $el.on.apply($el, args);

            /** @deprecated - will be removed in 5.1 */
            $.publish('plugin/' + me._name + '/on', [ $el, event ]);

            $.publish('plugin/' + me._name + '/onRegisterEvent', [ $el, event ]);

            return me;
        },

        /**
         * Wrapper method for {@link jQuery.off}, which removes the event listener from the {@link PluginBase._events}
         * array.
         *
         * @param {jQuery} element - Element, which contains the listener
         * @param {String} event - Name of the event to remove.
         * @returns {PluginBase}
         * @private
         */
        _off: function (element, event) {
            var me = this,
                events = me._events,
                pluginEvent = me.getEventName(event),
                eventIds = [],
                $element = $(element),
                filteredEvents = $.grep(events, function (obj, index) {
                    eventIds.push(index);
                    return typeof obj !== 'undefined' && pluginEvent === obj.event && $element[0] === obj.el[0];
                });

            $.each(filteredEvents, function (event) {
                $element.off.call($element, event.event);
            });

            $.each(eventIds, function (id) {
                if (!events[id]) {
                    return;
                }
                delete events[id];
            });

            /** @deprecated - will be removed in 5.1 */
            $.publish('plugin/' + me._name + '/off', [ $element, pluginEvent ]);

            $.publish('plugin/' + me._name + '/onRemoveEvent', [ $element, event ]);

            return me;
        },

        /**
         * Returns the name of the plugin.
         * @returns {PluginBase._name|String}
         */
        getName: function () {
            return this._name;
        },

        /**
         * Returns the event name with the event suffix appended.
         * @param {String} event - Event name
         * @returns {String}
         */
        getEventName: function (event) {
            var suffix = this.eventSuffix,
                parts = event.split(' '),
                len = parts.length,
                i = 0;

            for (; i < len; i++) {
                parts[i] += suffix;
            }

            return parts.join(' ');
        },

        /**
         * Returns the element which registered the plugin.
         * @returns {PluginBase.$el}
         */
        getElement: function () {
            return this.$el;
        },

        /**
         * Returns the options of the plugin. The method returns a copy of the options object and not a reference.
         * @returns {Object}
         */
        getOptions: function () {
            return $.extend({}, this.opts);
        },

        /**
         * Returns the value of a single option.
         * @param {String} key - Option key.
         * @returns {mixed}
         */
        getOption: function (key) {
            return this.opts[key];
        },

        /**
         * Sets a plugin option. Deep linking of the options are now supported.
         * @param {String} key - Option key
         * @param {mixed} value - Option value
         * @returns {PluginBase}
         */
        setOption: function (key, value) {
            var me = this;

            me.opts[key] = value;

            return me;
        },

        /**
         * Fetches the configured options based on the {@link PluginBase.$el}.
         *
         * @param {Boolean} shouldDeserialize
         * @returns {mixed} configuration
         */
        applyDataAttributes: function (shouldDeserialize) {
            var me = this, attr;

            $.each(me.opts, function (key) {
                attr = me.$el.attr('data-' + key);

                if (typeof attr === 'undefined') {
                    return true;
                }

                me.opts[key] = shouldDeserialize !== false ? deserializeValue(attr) : attr;

                return true;
            });

            $.publish('plugin/' + me._name + '/onDataAttributes', [ me.$el, me.opts ]);

            return me.opts;
        }
    };

    // Expose the private PluginBase constructor to global jQuery object
    $.PluginBase = PluginBase;

    // Object.create support test, and fallback for browsers without it
    if (typeof Object.create !== 'function') {
        Object.create = function (o) {
            function F() { }
            F.prototype = o;
            return new F();
        };
    }

    /**
     * Creates a new jQuery plugin based on the {@link PluginBase} object prototype. The plugin will
     * automatically created in {@link jQuery.fn} namespace and will initialized on the fly.
     *
     * The {@link PluginBase} object supports an automatically destruction of the registered events. To
     * do so, please use the {@link PluginBase._on} method to create event listeners.
     *
     * @param {String} name - Name of the plugin
     * @param {Object|Function} plugin - Plugin implementation
     * @returns {void}
     *
     * @example
     * // Register your plugin
     * $.plugin('yourName', {
     *    defaults: { key: 'value' },
     *
     *    init: function() {
     *        // ...initialization code
     *    },
     *
     *    destroy: function() {
     *      // ...your destruction code
     *
     *      // Use the force! Use the internal destroy method.
     *      me._destroy();
     *    }
     * });
     *
     * // Call the plugin
     * $('.test').yourName();
     */
    $.plugin = function (name, plugin) {
        var alias = plugin.alias,
            pluginFn = function (options) {
                return this.each(function () {
                    var element = this,
                        pluginData = $.data(element, 'plugin_' + alias) || $.data(element, 'plugin_' + name);

                    if (!pluginData) {
                        if (typeof plugin === 'function') {
                            pluginData = new plugin();
                        } else {
                            var Plugin = function () {
                                PluginBase.call(this, name, element, options);
                            };

                            Plugin.prototype = $.extend(Object.create(PluginBase.prototype), { constructor: Plugin }, plugin);
                            pluginData = new Plugin();
                        }

                        $.data(element, 'plugin_' + name, pluginData);

                        if (alias) {
                            $.data(element, 'plugin_' + alias, pluginData);
                        }
                    }
                });
            };

        window.PluginsCollection = window.PluginsCollection || {};
        window.PluginsCollection[name] = plugin;

        $.fn[name] = pluginFn;

        if (alias) {
            window.PluginsCollection[alias] = plugin;

            if (!$.fn[alias]) {
                $.fn[alias] = pluginFn;
            }
        }
    };

    /**
     * Provides the ability to overwrite jQuery plugins which are built on top of the {@link PluginBase} class. All of
     * our jQuery plugins (or to be more technical about it, the prototypes of our plugins) are registered in the object
     * {@link window.PluginsCollection} which can be accessed from anywhere in your storefront.
     *
     * Please keep in mind that the method overwrites the plugin in jQuery's plugin namespace {@link jQuery.fn} as well,
     * but you still have the ability to access the overwritten method(s) using the ```superclass``` object property.
     *
     * @example How to overwrite the ```showResult```-method in the "search" plugin.
     * $.overridePlugin('search', {
     *    showResult: function(response) {
     *        //.. do something with the response
     *    }
     * });
     *
     * @example Call the original method without modifications
     * $.overridePlugin('search', {
     *    showResult: function(response) {
     *        this.superclass.showResult.apply(this, arguments);
     *    }
     * });
     */
    $.overridePlugin = function (pluginName, override) {
        var overridePlugin = window.PluginsCollection[pluginName],
            alias;

        if (typeof overridePlugin !== 'object' || typeof override !== 'object') {
            return false;
        }

        alias = overridePlugin.alias;

        $.fn[pluginName] = function (options) {
            return this.each(function () {
                var element = this,
                    pluginData = $.data(element, 'plugin_' + alias) || $.data(element, 'plugin_' + pluginName);

                if (!pluginData) {
                    var Plugin = function () {
                        PluginBase.call(this, pluginName, element, options);
                    };

                    Plugin.prototype = $.extend(Object.create(PluginBase.prototype), { constructor: Plugin, superclass: overridePlugin }, overridePlugin, override);
                    pluginData = new Plugin();

                    $.data(element, 'plugin_' + pluginName, pluginData);

                    if (alias) {
                        $.data(element, 'plugin_' + pluginName, pluginData);
                    }
                }
            });
        };
    };
})(jQuery, window);
/**
 * Global state manager
 *
 * The state manager helps to master different behaviors for different screen sizes.
 * It provides you with the ability to register different states that are handled
 * by breakpoints.
 *
 * Those Breakpoints are defined by entering and exiting points (in pixels)
 * based on the viewport width.
 * By entering the breakpoint range, the enter functions of the registered
 * listeners are called.
 * But when the defined points are exceeded, the registered listeners exit
 * functions will be called.
 *
 * That way you can register callbacks that will be called on entering / exiting the defined state.
 *
 * The manager provides you multiple helper methods and polyfills which help you
 * master responsive design.
 *
 * @example Initialize the StateManager
 * ```
 *     StateManager.init([{
 *         state: 'xs',
 *         enter: '0em',
 *         exit: '47.5em'
 *      }, {
 *         state: 'm',
 *         enter: '47.5em',
 *         exit: '64em'
 *      }]);
 * ```
 *
 * @example Register breakpoint listeners
 * ```
 *     StateManager.registerListener([{
 *        state: 'xs',
 *        enter: function() { console.log('onEnter'); },
 *        exit: function() { console.log('onExit'); }
 *     }]);
 * ```
 *
 * @example Wildcard support
 * ```
 *     StateManager.registerListener([{
 *         state: '*',
 *         enter: function() { console.log('onGlobalEnter'); },
 *         exit: function() { console.log('onGlobalExit'); }
 *     }]);
 * ```
 *
 * @example StateManager Events
 * In this example we are adding an event listener for the 'resize' event.
 * This event will be called independent of the original window resize event,
 * because the resize will be compared in a requestAnimationFrame loop.
 *
 * ```
 *     StateManager.on('resize', function () {
 *         console.log('onResize');
 *     });
 *
 *     StateManager.once('resize', function () {
 *         console.log('This resize event will only be called once');
 *     });
 * ```
 *
 * @example StateManager plugin support
 * In this example we register the plugin 'pluginName' on the element
 * matching the '.my-selector' selector.
 * You can also define view ports in which the plugin will be available.
 * When switching the view ports and the configuration isn't changed for
 * that state, only the 'update' function of the plugin will be called.
 *
 * ```
 *     // The plugin will be available on all view port states.
 *     // Uses the default configuration
 *
 *     StateManager.addPlugin('.my-selector', 'pluginName');
 *
 *     // The plugin will only be available for the 'xs' state.
 *     // Uses the default configuration.
 *
 *     StateManager.addPlugin('.my-selector', 'pluginName', 'xs');
 *
 *     // The plugin will only be available for the 'l' and 'xl' state.
 *     // Uses the default configuration.
 *
 *     StateManager.addPlugin('.my-selector', 'pluginName', ['l', 'xl']);
 *
 *     // The plugin will only be available for the 'xs' and 's' state.
 *     // For those two states, the passed config will be used.
 *
 *     StateManager.addPlugin('.my-selector', 'pluginName', {
 *         'configA': 'valueA',
 *         'configB': 'valueB',
 *         'configFoo': 'valueBar'
 *     }, ['xs', 's']);
 *
 *     // The plugin is available on all view port states.
 *     // We override the 'foo' config only for the 'm' state.
 *
 *     StateManager.addPlugin('.my-selector', 'pluginName', { 'foo': 'bar' })
 *                .addPlugin('.my-selector', 'pluginName', { 'foo': 'baz' }, 'm');
 * ```
 */
;(function ($, window, document) {
    'use strict';

    var $html = $('html'),
        vendorPropertyDiv = document.createElement('div'),
        vendorPrefixes = ['webkit', 'moz', 'ms', 'o'];

    /**
     * @class EventEmitter
     * @constructor
     */
    function EventEmitter() {
        var me = this;

        /**
         * @private
         * @property _events
         * @type {Object}
         */
        me._events = {};
    }

    EventEmitter.prototype = {

        constructor: EventEmitter,

        name: 'EventEmitter',

        /**
         * @public
         * @chainable
         * @method on
         * @param {String} eventName
         * @param {Function} callback
         * @param {*} context
         * @returns {EventEmitter}
         */
        on: function (eventName, callback, context) {
            var me = this,
                events = me._events || (me._events = {}),
                event = events[eventName] || (events[eventName] = []);

            event.push({
                callback: callback,
                context: context || me
            });

            return me;
        },

        /**
         * @public
         * @chainable
         * @method once
         * @param {String} eventName
         * @param {Function} callback
         * @param {*} context
         * @returns {EventEmitter}
         */
        once: function (eventName, callback, context) {
            var me = this,
                once = function () {
                    me.off(eventName, once, context);
                    callback.apply(me, arguments);
                };

            return me.on(eventName, once, context);
        },

        /**
         * @public
         * @chainable
         * @method off
         * @param {String} eventName
         * @param {Function} callback
         * @param {*} context
         * @returns {EventEmitter}
         */
        off: function (eventName, callback, context) {
            var me = this,
                events = me._events || (me._events = {}),
                eventNames = eventName ? [eventName] : Object.keys(events),
                eventList,
                event,
                name,
                len,
                i, j;

            for (i = 0, len = eventNames.length; i < len; i++) {
                name = eventNames[i];
                eventList = events[name];

                /**
                 * Return instead of continue because only the one passed
                 * event name can be wrong / not available.
                 */
                if (!eventList) {
                    return me;
                }

                if (!callback && !context) {
                    eventList.length = 0;
                    delete events[name];
                    continue;
                }

                for (j = eventList.length - 1; j >= 0; j--) {
                    event = eventList[j];

                    // Check if the callback and the context (if passed) is the same
                    if ((callback && callback !== event.callback) || (context && context !== event.context)) {
                        continue;
                    }

                    eventList.splice(j, 1);
                }
            }

            return me;
        },

        /**
         * @public
         * @chainable
         * @method trigger
         * @param {String} eventName
         * @returns {EventEmitter}
         */
        trigger: function (eventName) {
            var me = this,
                events = me._events || (me._events = {}),
                eventList = events[eventName],
                event,
                args,
                a1, a2, a3,
                len, i;

            if (!eventList) {
                return me;
            }

            args = Array.prototype.slice.call(arguments, 1);
            len = eventList.length;
            i = -1;

            if (args.length <= 3) {
                a1 = args[0];
                a2 = args[1];
                a3 = args[2];
            }

            /**
             * Using switch to improve the performance of listener calls
             * .call() has a much greater performance than .apply() on
             * many parameters.
             */
            switch (args.length) {
                case 0:
                    while (++i < len) (event = eventList[i]).callback.call(event.context);
                    return me;
                case 1:
                    while (++i < len) (event = eventList[i]).callback.call(event.context, a1);
                    return me;
                case 2:
                    while (++i < len) (event = eventList[i]).callback.call(event.context, a1, a2);
                    return me;
                case 3:
                    while (++i < len) (event = eventList[i]).callback.call(event.context, a1, a2, a3);
                    return me;
                default:
                    while (++i < len) (event = eventList[i]).callback.apply(event.context, args);
                    return me;
            }
        },

        /**
         * @public
         * @method destroy
         */
        destroy: function () {
            this.off();
        }
    };

    /**
     * @public
     * @static
     * @class StateManager
     * @extends {EventEmitter}
     * @type {Object}
     */
    window.StateManager = $.extend(Object.create(EventEmitter.prototype), {

        /**
         * Collection of all registered breakpoints
         *
         * @private
         * @property _breakpoints
         * @type {Array}
         */
        _breakpoints: [],

        /**
         * Collection of all registered listeners
         *
         * @private
         * @property _listeners
         * @type {Array}
         */
        _listeners: [],

        /**
         * Collection of all added plugin configurations
         *
         * @private
         * @property _plugins
         * @type {Object}
         */
        _plugins: {},

        /**
         * Collection of all plugins that should be initialized when the DOM is ready
         *
         * @private
         * @property _pluginQueue
         * @type {Object}
         */
        _pluginQueue: {},

        /**
         * Flag whether the queued plugins were initialized or not
         *
         * @private
         * @property _pluginsInitialized
         * @type {Boolean}
         */
        _pluginsInitialized: false,

        /**
         * Current breakpoint type
         *
         * @private
         * @property _currentState
         * @type {String}
         */
        _currentState: '',

        /**
         * Previous breakpoint type
         *
         * @private
         * @property _previousState
         * @type {String}
         */
        _previousState: '',

        /**
         * Last calculated viewport width.
         *
         * @private
         * @property _viewportWidth
         * @type {Number}
         */
        _viewportWidth: 0,

        /**
         * Cache for all previous gathered vendor properties.
         *
         * @private
         * @property _vendorPropertyCache
         * @type {Object}
         */
        _vendorPropertyCache: {},

        /**
         * Initializes the StateManager with the incoming breakpoint
         * declaration and starts the listing of the resize of the browser window.
         *
         * @public
         * @chainable
         * @method init
         * @param {Object|Array} breakpoints - User defined breakpoints.
         * @returns {StateManager}
         */
        init: function (breakpoints) {
            var me = this;

            me._viewportWidth = me.getViewportWidth();

            me._baseFontSize = parseInt($html.css('font-size'));

            me.registerBreakpoint(breakpoints);

            me._checkResize();
            me._browserDetection();
            me._setDeviceCookie();

            $($.proxy(me.initQueuedPlugins, me, true));

            return me;
        },

        /**
         * Adds a breakpoint to check against, after the {@link StateManager.init} was called.
         *
         * @public
         * @chainable
         * @method registerBreakpoint
         * @param {Array|Object} breakpoint.
         * @returns {StateManager}
         */
        registerBreakpoint: function (breakpoint) {
            var me = this,
                breakpoints = breakpoint instanceof Array ? breakpoint : Array.prototype.slice.call(arguments),
                len = breakpoints.length,
                i = 0;

            for (; i < len; i++) {
                me._addBreakpoint(breakpoints[i]);
            }

            return me;
        },

        /**
         * Adds a breakpoint to check against, after the {@link StateManager.init} was called.
         *
         * @private
         * @chainable
         * @method _addBreakpoint
         * @param {Object} breakpoint.
         */
        _addBreakpoint: function (breakpoint) {
            var me = this,
                breakpoints = me._breakpoints,
                existingBreakpoint,
                state = breakpoint.state,
                enter = me._convertRemValue(breakpoint.enter),
                exit = me._convertRemValue(breakpoint.exit),
                len = breakpoints.length,
                i = 0;

            breakpoint.enter = enter;
            breakpoint.exit = exit;

            for (; i < len; i++) {
                existingBreakpoint = breakpoints[i];

                if (existingBreakpoint.state === state) {
                    throw new Error('Multiple breakpoints of state "' + state + '" detected.');
                }

                if (existingBreakpoint.enter <= exit && enter <= existingBreakpoint.exit) {
                    throw new Error('Breakpoint range of state "' + state + '" overlaps state "' + existingBreakpoint.state + '".');
                }
            }

            breakpoints.push(breakpoint);

            me._plugins[state] = {};
            me._checkBreakpoint(breakpoint, me._viewportWidth);

            return me;
        },

        _convertRemValue: function(remValue) {
            var me = this,
                baseFontSize = me._baseFontSize;

            return remValue * baseFontSize;
        },

        /**
         * Removes breakpoint by state and removes the generated getter method for the state.
         *
         * @public
         * @chainable
         * @method removeBreakpoint
         * @param {String} state State which should be removed
         * @returns {StateManager}
         */
        removeBreakpoint: function (state) {
            var me = this,
                breakpoints = me._breakpoints,
                len = breakpoints.length,
                i = 0;

            if (typeof state !== 'string') {
                return me;
            }

            for (; i < len; i++) {
                if (state !== breakpoints[i].state) {
                    continue;
                }

                breakpoints.splice(i, 1);

                return me._removeStatePlugins(state);
            }

            return me;
        },

        /**
         * @protected
         * @chainable
         * @method _removeStatePlugins
         * @param {String} state
         * @returns {StateManager}
         */
        _removeStatePlugins: function (state) {
            var me = this,
                plugins = me._plugins[state],
                selectors = Object.keys(plugins),
                selectorLen = selectors.length,
                pluginNames,
                pluginLen,
                i, j;

            for (i = 0; i < selectorLen; i++) {
                pluginNames = Object.keys(plugins[selectors[i]]);

                for (j = 0, pluginLen = pluginNames.length; j < pluginLen; j++) {
                    me.destroyPlugin(selectors[i], pluginNames[j]);
                }
            }

            delete plugins[state];

            return me;
        },

        /**
         * Registers one or multiple event listeners to the StateManager,
         * so they will be fired when the state matches the current active
         * state..
         *
         * @public
         * @chainable
         * @method registerListener
         * @param {Object|Array} listener
         * @returns {StateManager}
         */
        registerListener: function (listener) {
            var me = this,
                listenerArr = listener instanceof Array ? listener : Array.prototype.slice.call(arguments),
                len = listenerArr.length,
                i = 0;

            for (; i < len; i++) {
                me._addListener(listenerArr[i]);
            }

            return me;
        },

        /**
         * @private
         * @chainable
         * @method _addListener
         * @param {Object} listener.
         */
        _addListener: function (listener) {
            var me = this,
                listeners = me._listeners,
                enterFn = listener.enter;

            listeners.push(listener);

            if ((listener.state === me._currentState || listener.state === '*') && typeof enterFn === 'function') {
                enterFn({
                    'exiting': me._previousState,
                    'entering': me._currentState
                });
            }

            return me;
        },

        /**
         * @public
         * @chainable
         * @method addPlugin
         * @param {String} selector
         * @param {String} pluginName
         * @param {Object|Array|String} config
         * @param {Array|String} viewport
         * @returns {StateManager}
         */
        addPlugin: function (selector, pluginName, config, viewport) {
            var me = this,
                pluginsInitialized = me._pluginsInitialized,
                breakpoints = me._breakpoints,
                currentState = me._currentState,
                len,
                i;

            // If the third parameter are the viewport states
            if (typeof config === 'string' || config instanceof Array) {
                viewport = config;
                config = {};
            }

            if (typeof viewport === 'string') {
                viewport = [viewport];
            }

            if (!(viewport instanceof Array)) {
                viewport = [];

                for (i = 0, len = breakpoints.length; i < len; i++) {
                    viewport.push(breakpoints[i].state);
                }
            }

            for (i = 0, len = viewport.length; i < len; i++) {
                me._addPluginOption(viewport[i], selector, pluginName, config);

                if (currentState !== viewport[i]) {
                    continue;
                }

                if (pluginsInitialized) {
                    me._initPlugin(selector, pluginName);
                    continue;
                }

                me.addPluginToQueue(selector, pluginName);
            }

            return me;
        },

        /**
         * @public
         * @chainable
         * @method removePlugin
         * @param {String} selector
         * @param {String} pluginName
         * @param {Array|String} viewport
         * @returns {StateManager}
         */
        removePlugin: function (selector, pluginName, viewport) {
            var me = this,
                breakpoints = me._breakpoints,
                plugins = me._plugins,
                state,
                sel,
                len,
                i;

            if (typeof viewport === 'string') {
                viewport = [viewport];
            }

            if (!(viewport instanceof Array)) {
                viewport = [];

                for (i = 0, len = breakpoints.length; i < len; i++) {
                    viewport.push(breakpoints[i].state);
                }
            }

            for (i = 0, len = viewport.length; i < len; i++) {
                if (!(state = plugins[viewport[i]])) {
                    continue;
                }

                if (!(sel = state[selector])) {
                    continue;
                }

                delete sel[pluginName];
            }

            if (!me._pluginsInitialized) {
                me.removePluginFromQueue(selector, pluginName);
            }

            return me;
        },

        /**
         * @public
         * @chainable
         * @method updatePlugin
         * @param {String} selector
         * @param {String} pluginName
         * @returns {StateManager}
         */
        updatePlugin: function (selector, pluginName) {
            var me = this,
                state = me._currentState,
                pluginConfigs = me._plugins[state][selector] || {},
                pluginNames = (typeof pluginName === 'string') ? [pluginName] : Object.keys(pluginConfigs),
                len = pluginNames.length,
                i = 0;

            for (; i < len; i++) {
                me._initPlugin(selector, pluginNames[i]);
            }

            return me;
        },

        /**
         * @private
         * @method _addPluginOption
         * @param {String} state
         * @param {String} selector
         * @param {String} pluginName
         * @param {Object} config
         */
        _addPluginOption: function (state, selector, pluginName, config) {
            var me = this,
                plugins = me._plugins,
                selectors = plugins[state] || (plugins[state] = {}),
                configs = selectors[selector] || (selectors[selector] = {}),
                pluginConfig = configs[pluginName];

            configs[pluginName] = $.extend(pluginConfig || {}, config);
        },

        /**
         * @private
         * @method _initPlugin
         * @param {String} selector
         * @param {String} pluginName
         */
        _initPlugin: function (selector, pluginName) {
            var me = this,
                $el = $(selector);

            if ($el.length > 1) {
                $.each($el, function () {
                    me._initSinglePlugin($(this), selector, pluginName);
                });
                return;
            }

            me._initSinglePlugin($el, selector, pluginName);
        },

        /**
         * @public
         * @method addPluginToQueue
         * @param {String} selector
         * @param {String} pluginName
         */
        addPluginToQueue: function (selector, pluginName) {
            var me = this,
                queue = me._pluginQueue,
                pluginNames = queue[selector] || (queue[selector] = []);

            if (pluginNames.indexOf(pluginName) === -1) {
                pluginNames.push(pluginName);
            }
        },

        /**
         * @public
         * @method removePluginFromQueue
         * @param {String} selector
         * @param {String} pluginName
         */
        removePluginFromQueue: function (selector, pluginName) {
            var me = this,
                queue = me._pluginQueue,
                pluginNames = queue[selector],
                index;

            if (pluginNames && (index = pluginNames.indexOf(pluginName)) !== -1) {
                pluginNames.splice(index, 1);
            }
        },

        /**
         * @public
         * @method initQueuedPlugins
         * @param {Boolean} clearQueue
         */
        initQueuedPlugins: function (clearQueue) {
            var me = this,
                queue = me._pluginQueue,
                selectors = Object.keys(queue),
                selectorLen = selectors.length,
                i = 0,
                selector,
                plugins,
                pluginLen,
                j;

            for (; i < selectorLen; i++) {
                selector = selectors[i];
                plugins = queue[selector];

                for (j = 0, pluginLen = plugins.length; j < pluginLen; j++) {
                    me._initPlugin(selector, plugins[j]);
                }

                if (clearQueue !== false) {
                    delete queue[selector];
                }
            }

            me._pluginsInitialized = true;
        },

        /**
         * @private
         * @method _initSinglePlugin
         * @param {Object} element
         * @param {String} selector
         * @param {String} pluginName
         */
        _initSinglePlugin: function (element, selector, pluginName) {
            var me = this,
                currentConfig = me._getPluginConfig(me._currentState, selector, pluginName),
                plugin = element.data('plugin_' + pluginName);

            if (!plugin) {
                element[pluginName](currentConfig);
                return;
            }

            if (JSON.stringify(currentConfig) === JSON.stringify(me._getPluginConfig(me._previousState, selector, pluginName))) {
                if (typeof plugin.update === 'function') {
                    plugin.update.call(plugin, me._currentState, me._previousState);
                }
                return;
            }

            me.destroyPlugin(element, pluginName);

            element[pluginName](currentConfig);
        },

        /**
         * @private
         * @method _getPluginConfig
         * @param {String} state
         * @param {String} selector
         * @param {String} plugin
         */
        _getPluginConfig: function (state, selector, plugin) {
            var selectors = this._plugins[state] || {},
                pluginConfigs = selectors[selector] || {};

            return pluginConfigs[plugin] || {};
        },

        /**
         * @private
         * @method _checkResize
         */
        _checkResize: function () {
            var me = this,
                width = me.getViewportWidth();

            if (width !== me._viewportWidth) {
                me._checkBreakpoints(width);
                me.trigger('resize', width);
                me._setDeviceCookie();
            }

            me._viewportWidth = width;

            me.requestAnimationFrame(me._checkResize.bind(me));
        },

        /**
         * @private
         * @method _checkBreakpoints
         * @param {Number} width
         */
        _checkBreakpoints: function (width) {
            var me = this,
                checkWidth = width || me.getViewportWidth(),
                breakpoints = me._breakpoints,
                len = breakpoints.length,
                i = 0;

            for (; i < len; i++) {
                me._checkBreakpoint(breakpoints[i], checkWidth);
            }

            return me;
        },

        /**
         * @private
         * @method _checkBreakpoint
         * @param {Object} breakpoint
         * @param {Number} width
         */
        _checkBreakpoint: function (breakpoint, width) {
            var me = this,
                checkWidth = width || me.getViewportWidth(),
                enterWidth = ~~(breakpoint.enter),
                exitWidth = ~~(breakpoint.exit),
                state = breakpoint.state;

            if (state !== me._currentState && checkWidth >= enterWidth && checkWidth <= exitWidth) {
                me._changeBreakpoint(state);
            }
        },

        /**
         * @private
         * @chainable
         * @method _changeBreakpoint
         * @param {String} state
         * @returns {StateManager}
         */
        _changeBreakpoint: function (state) {
            var me = this,
                previousState = me._previousState = me._currentState,
                currentState = me._currentState = state;

            return me
                .trigger('exitBreakpoint', previousState)
                .trigger('changeBreakpoint', {
                    'entering': currentState,
                    'exiting': previousState
                })
                .trigger('enterBreakpoint', currentState)
                ._switchListener(previousState, currentState)
                ._switchPlugins(previousState, currentState);
        },

        /**
         * @private
         * @chainable
         * @method _switchListener
         * @param {String} fromState
         * @param {String} toState
         * @returns {StateManager}
         */
        _switchListener: function (fromState, toState) {
            var me = this,
                previousListeners = me._getBreakpointListeners(fromState),
                currentListeners = me._getBreakpointListeners(toState),
                eventObj = {
                    'exiting': fromState,
                    'entering': toState
                },
                callFn,
                len,
                i;

            for (i = 0, len = previousListeners.length; i < len; i++) {
                if (typeof (callFn = previousListeners[i].exit) === 'function') {
                    callFn(eventObj);
                }
            }

            for (i = 0, len = currentListeners.length; i < len; i++) {
                if (typeof (callFn = currentListeners[i].enter) === 'function') {
                    callFn(eventObj);
                }
            }

            return me;
        },

        /**
         * @private
         * @method _getBreakpointListeners
         * @param {String} state
         * @returns {Array}
         */
        _getBreakpointListeners: function (state) {
            var me = this,
                listeners = me._listeners,
                breakpointListeners = [],
                len = listeners.length,
                i = 0,
                listenerType;

            for (; i < len; i++) {
                if ((listenerType = listeners[i].state) === state || listenerType === '*') {
                    breakpointListeners.push(listeners[i]);
                }
            }

            return breakpointListeners;
        },

        /**
         * @private
         * @chainable
         * @method _switchPlugins
         * @param {String} fromState
         * @param {String} toState
         * @returns {StateManager}
         */
        _switchPlugins: function (fromState, toState) {
            var me = this,
                plugins = me._plugins,
                fromSelectors = plugins[fromState] || {},
                fromKeys = Object.keys(fromSelectors),
                selector,
                oldPluginConfigs,
                newPluginConfigs,
                configKeys,
                pluginName,
                pluginConfig,
                plugin,
                $el,
                toSelectors = plugins[toState] || {},
                toKeys = Object.keys(toSelectors),
                lenKeys, lenConfig, lenEl,
                x, y, z;

            for (x = 0, lenKeys = fromKeys.length; x < lenKeys; x++) {
                selector = fromKeys[x];
                oldPluginConfigs = fromSelectors[selector];
                $el = $(selector);

                if (!oldPluginConfigs || !(lenEl = $el.length)) {
                    continue;
                }

                newPluginConfigs = toSelectors[selector];
                configKeys = Object.keys(oldPluginConfigs);

                for (y = 0, lenConfig = configKeys.length; y < lenConfig; y++) {
                    pluginName = configKeys[y];

                    // When no new state config is available, destroy the old plugin
                    if (!newPluginConfigs || !(pluginConfig = newPluginConfigs[pluginName])) {
                        me.destroyPlugin($el, pluginName);
                        continue;
                    }

                    if (JSON.stringify(newPluginConfigs[pluginName]) === JSON.stringify(oldPluginConfigs[pluginName])) {
                        for (z = 0; z < lenEl; z++) {
                            if (!(plugin = $($el[z]).data('plugin_' + pluginName))) {
                                continue;
                            }

                            if (typeof plugin.update === 'function') {
                                plugin.update.call(plugin, fromState, toState);
                            }
                        }
                        continue;
                    }

                    me.destroyPlugin($el, pluginName);
                }
            }

            for (x = 0, lenKeys = toKeys.length; x < lenKeys; x++) {
                selector = toKeys[x];
                newPluginConfigs = toSelectors[selector];
                $el = $(selector);

                if (!newPluginConfigs || !$el.length) {
                    continue;
                }

                configKeys = Object.keys(newPluginConfigs);

                for (y = 0, lenConfig = configKeys.length; y < lenConfig; y++) {
                    pluginName = configKeys[y];

                    if (!$el.data('plugin_' + pluginName)) {
                        $el[pluginName](newPluginConfigs[pluginName]);
                    }
                }
            }

            return me;
        },

        /**
         * @public
         * @method destroyPlugin
         * @param {String|jQuery} selector
         * @param {String} pluginName
         */
        destroyPlugin: function (selector, pluginName) {
            var $el = (typeof selector === 'string') ? $(selector) : selector,
                name = 'plugin_' + pluginName,
                len = $el.length,
                i = 0,
                $currentEl,
                plugin,
                alias;

            if (!len) {
                return;
            }

            for (; i < len; i++) {
                $currentEl = $($el[i]);

                if ((plugin = $currentEl.data(name))) {
                    if (alias = plugin.alias) {
                        $currentEl.removeData('plugin_' + alias);
                    }

                    plugin.destroy();
                    $currentEl.removeData(name);
                }
            }
        },

        /**
         * Returns the current viewport width.
         *
         * @public
         * @method getViewportWidth
         * @returns {Number} The width of the viewport in pixels.
         */
        getViewportWidth: function () {
            var width = window.innerWidth;

            if (typeof width === 'number') {
                return width;
            }

            return (width = document.documentElement.clientWidth) !== 0 ? width : document.body.clientWidth;
        },

        /**
         * Returns the current viewport height.
         *
         * @public
         * @method getViewportHeight
         * @returns {Number} The height of the viewport in pixels.
         */
        getViewportHeight: function () {
            var height = window.innerHeight;

            if (typeof height === 'number') {
                return height;
            }

            return (height = document.documentElement.clientHeight) !== 0 ? height : document.body.clientHeight;
        },

        /**
         * Returns the current active state.
         *
         * @public
         * @method getPrevious
         * @returns {String} previous breakpoint state
         */
        getPreviousState: function () {
            return this._previousState;
        },

        /**
         * Returns whether or not the previous active type is the passed one.
         *
         * @public
         * @method getPrevious
         * @param {String|Array} state
         * @returns {Boolean}
         */
        isPreviousState: function (state) {
            var states = state instanceof Array ? state : Array.prototype.slice.call(arguments),
                previousState = this._previousState,
                len = states.length,
                i = 0;

            for (; i < len; i++) {
                if (previousState === states[i]) {
                    return true;
                }
            }

            return false;
        },

        /**
         * Returns the current active state.
         *
         * @public
         * @method getCurrent
         * @returns {String} current breakpoint state
         */
        getCurrentState: function () {
            return this._currentState;
        },

        /**
         * Returns whether or not the current active state is the passed one.
         *
         * @public
         * @method isCurrent
         * @param {String | Array} state
         * @returns {Boolean}
         */
        isCurrentState: function (state) {
            var states = state instanceof Array ? state : Array.prototype.slice.call(arguments),
                currentState = this._currentState,
                len = states.length,
                i = 0;

            for (; i < len; i++) {
                if (currentState === states[i]) {
                    return true;
                }
            }

            return false;
        },

        /**
         * Checks if the device is currently running in portrait mode.
         *
         * @public
         * @method isPortraitMode
         * @returns {Boolean} Whether or not the device is in portrait mode
         */
        isPortraitMode: function () {
            return !!this.matchMedia('(orientation: portrait)').matches;
        },

        /**
         * Checks if the device is currently running in landscape mode.
         *
         * @public
         * @method isLandscapeMode
         * @returns {Boolean} Whether or not the device is in landscape mode
         */
        isLandscapeMode: function () {
            return !!this.matchMedia('(orientation: landscape)').matches;
        },

        /**
         * Gets the device pixel ratio. All retina displays should return a value > 1, all standard
         * displays like a desktop monitor will return 1.
         *
         * @public
         * @method getDevicePixelRatio
         * @returns {Number} The device pixel ratio.
         */
        getDevicePixelRatio: function () {
            return window.devicePixelRatio || 1;
        },

        /**
         * Returns if the current user agent is matching the browser test.
         *
         * @param browser
         * @returns {boolean}
         */
        isBrowser: function(browser) {
            var regEx = new RegExp(browser.toLowerCase(), 'i');
            return this._checkUserAgent(regEx);
        },

        /**
         * Checks the user agent against the given regexp.
         *
         * @param regEx
         * @returns {boolean}
         * @private
         */
        _checkUserAgent: function(regEx) {
            return !!navigator.userAgent.toLowerCase().match(regEx);
        },

        /**
         * Detects the browser type and adds specific css classes to the html tag.
         *
         * @private
         */
        _browserDetection: function() {
            var me = this,
                detections = {};

            detections['is--opera']     = me._checkUserAgent(/opera/);
            detections['is--chrome']    = me._checkUserAgent(/\bchrome\b/);
            detections['is--firefox']   = me._checkUserAgent(/firefox/);
            detections['is--webkit']    = me._checkUserAgent(/webkit/);
            detections['is--safari']    = !detections['is--chrome'] && me._checkUserAgent(/safari/);
            detections['is--ie']        = !detections['is--opera'] && (me._checkUserAgent(/msie/) || me._checkUserAgent(/trident\/7/));
            detections['is--ie-touch']  = detections['is--ie'] && me._checkUserAgent(/touch/);
            detections['is--gecko']     = !detections['is--webkit'] && me._checkUserAgent(/gecko/);

            $.each(detections, function(key, value) {
                if (value) $html.addClass(key);
            });
        },

        _getCurrentDevice: function() {
            var me = this,
                devices = {
                    'xs': 'mobile',
                    's' : 'mobile',
                    'm' : 'tablet',
                    'l' : 'tablet',
                    'xl': 'desktop'
                };

            return devices[me.getCurrentState()] || 'desktop';
        },

        _setDeviceCookie: function() {
            var me = this,
                device = me._getCurrentDevice();

            document.cookie = 'x-ua-device=' + device + '; path=/';
        },

        /**
         * First calculates the scroll bar width and height of the browser
         * and saves it to a object that can be accessed.
         *
         * @private
         * @property _scrollBarSize
         * @type {Object}
         */
        _scrollBarSize: (function () {
            var $el = $('<div>', {
                    css: {
                        width: 100,
                        height: 100,
                        overflow: 'scroll',
                        position: 'absolute',
                        top: -9999
                    }
                }),
                el = $el[0],
                width,
                height;

            $('body').append($el);

            width = el.offsetWidth - el.clientWidth;
            height = el.offsetHeight - el.clientHeight;

            $($el).remove();

            return {
                width: width,
                height: height
            };
        }()),

        /**
         * Returns an object containing the width and height of the default
         * scroll bar sizes.
         *
         * @public
         * @method getScrollBarSize
         * @returns {Object} The width/height pair of the scroll bar size.
         */
        getScrollBarSize: function () {
            return $.extend({}, this._scrollBarSize);
        },

        /**
         * Returns the default scroll bar width of the browser.
         *
         * @public
         * @method getScrollBarWidth
         * @returns {Number} Width of the default browser scroll bar.
         */
        getScrollBarWidth: function () {
            return this._scrollBarSize.width;
        },

        /**
         * Returns the default scroll bar width of the browser.
         *
         * @public
         * @method getScrollBarHeight
         * @returns {Number} Height of the default browser scroll bar.
         */
        getScrollBarHeight: function () {
            return this._scrollBarSize.height;
        },

        /**
         * matchMedia() polyfill
         * Test a CSS media type/query in JS.
         * Authors & copyright (c) 2012: Scott Jehl, Paul Irish, Nicholas Zakas, David Knight.
         * Dual MIT/BSD license
         *
         * @public
         * @method matchMedia
         * @param {String} media
         */
        matchMedia: (function () {
            // For browsers that support matchMedium api such as IE 9 and webkit
            var styleMedia = (window.styleMedia || window.media);

            // For those that don't support matchMedium
            if (!styleMedia) {
                var style = document.createElement('style'),
                    script = document.getElementsByTagName('script')[0],
                    info = null;

                style.type = 'text/css';
                style.id = 'matchmediajs-test';

                script.parentNode.insertBefore(style, script);

                // 'style.currentStyle' is used by IE <= 8 and 'window.getComputedStyle' for all other browsers
                info = ('getComputedStyle' in window) && window.getComputedStyle(style, null) || style.currentStyle;

                styleMedia = {
                    matchMedium: function (media) {
                        var text = '@media ' + media + '{ #matchmediajs-test { width: 1px; } }';

                        // 'style.styleSheet' is used by IE <= 8 and 'style.textContent' for all other browsers
                        if (style.styleSheet) {
                            style.styleSheet.cssText = text;
                        } else {
                            style.textContent = text;
                        }

                        // Test if media query is true or false
                        return info.width === '1px';
                    }
                };
            }

            return function (media) {
                return {
                    matches: styleMedia.matchMedium(media || 'all'),
                    media: media || 'all'
                };
            };
        }()),

        /**
         * requestAnimationFrame() polyfill
         *
         * @public
         * @method requestAnimationFrame
         * @param {Function} callback
         * @returns {Number}
         */
        requestAnimationFrame: (function () {
            var raf = window.requestAnimationFrame,
                i = vendorPrefixes.length,
                lastTime = 0;

            while (!raf && i) {
                raf = window[vendorPrefixes[i--] + 'RequestAnimationFrame'];
            }

            return raf || function (callback) {
                var currTime = +(new Date()),
                    timeToCall = Math.max(0, 16 - (currTime - lastTime)),
                    id = window.setTimeout(function () {
                        callback(currTime + timeToCall);
                    }, timeToCall);

                lastTime = currTime + timeToCall;

                return id;
            };
        }()).bind(window),

        /**
         * cancelAnimationFrame() polyfill
         *
         * @public
         * @method cancelAnimationFrame
         * @param {Number} id
         */
        cancelAnimationFrame: (function () {
            var caf = window.cancelAnimationFrame,
                i = vendorPrefixes.length,
                fnName;

            while (!caf && i) {
                fnName = vendorPrefixes[i--];
                caf = window[fnName + 'CancelAnimationFrame'] || window[fnName + 'CancelRequestAnimationFrame'];
            }

            return caf || window.clearTimeout;
        }()).bind(window),

        /**
         * Tests the given CSS style property on an empty div with all vendor
         * properties. If it fails and the softError flag was not set, it
         * returns null, otherwise the given property.
         *
         * @example
         *
         * // New chrome version
         * StateManager.getVendorProperty('transform'); => 'transform'
         *
         * // IE9
         * StateManager.getVendorProperty('transform'); => 'msTransform'
         *
         * // Property not supported, without soft error flag
         * StateManager.getVendorProperty('animation'); => null
         *
         * // Property not supported, with soft error flag
         * StateManager.getVendorProperty('animation', true); => 'animate'
         *
         * @public
         * @method getVendorProperty
         * @param {String} property
         * @param {Boolean} softError
         */
        getVendorProperty: function (property, softError) {
            var cache = this._vendorPropertyCache,
                style = vendorPropertyDiv.style;

            if (cache[property]) {
                return cache[property];
            }

            if (property in style) {
                return (cache[property] = property);
            }

            var prop = property.charAt(0).toUpperCase() + property.substr(1),
                len = vendorPrefixes.length,
                i = 0,
                vendorProp;

            for (; i < len; i++) {
                vendorProp = vendorPrefixes[i] + prop;

                if (vendorProp in style) {
                    return (cache[property] = vendorProp);
                }
            }

            return (cache[property] = (softError ? property : null));
        }
    });

})(jQuery, window, document);
;(function (window, document) {
    'use strict';

    /**
     * Global storage manager
     *
     * The storage manager provides a unified way to store items in the localStorage and sessionStorage.
     * It uses a polyfill that uses cookies as a fallback when no localStorage or sessionStore is available or working.
     *
     * @example
     *
     * Saving an item to localStorage:
     *
     * StorageManager.setItem('local', 'key', 'value');
     *
     * Retrieving it:
     *
     * var item = StorageManager.getItem('local', 'key'); // item === 'value'
     *
     * Basically you can use every method of the Storage interface (http://www.w3.org/TR/webstorage/#the-storage-interface)
     * But notice that you have to pass the storage type ('local' | 'session') in the first parameter for every call.
     *
     * @example
     *
     * Getting the localStorage/sessionStorage (polyfill) object
     *
     * var localStorage = StorageManager.getStorage('local');
     * var sessionStorage = StorageManager.getStorage('session');
     *
     * You can also use its shorthands:
     *
     * var localStorage = StorageManager.getLocalStorage();
     * var sessionStorage = StorageManager.getSessionStorage();
     */
    window.StorageManager = (function () {

        /**
         * The polyfill for localStorage and sessionStorage.
         * Uses cookies for storing items.
         *
         * @class StoragePolyFill
         * @constructor
         * @param {String} type
         * @returns {Object}
         */
        function StoragePolyFill(type) {
            /**
             * Creates a cookie with a given name, its values as a string (e.g. JSON) and expiration in days
             *
             * @param {String} name
             * @param {String} value
             * @param {Number} days
             */
            function createCookie(name, value, days) {
                var date,
                    expires = '';

                if (days) {
                    date = new Date();
                    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                    expires = '; expires=' + date.toGMTString();
                }

                value = encodeURI(value);

                document.cookie = name + '=' + value + expires + '; path=/';
            }

            /**
             * Searches for a cookie by the given name and returns its values.
             *
             * @param name
             * @returns {String|null}
             */
            function readCookie(name) {
                var nameEq = name + '=',
                    cookies = document.cookie.split(';'),
                    cookie,
                    len = cookies.length,
                    i = 0;

                for (; i < len; i++) {
                    cookie = cookies[i];

                    while (cookie.charAt(0) == ' ') {
                        cookie = cookie.substring(1, cookie.length);
                    }

                    if (cookie.indexOf(nameEq) == 0) {
                        return decodeURI(cookie.substring(nameEq.length, cookie.length));
                    }
                }
                return null;
            }

            /**
             * Turns the passed data object into a string via JSON.stringify() and sets it into its proper cookie.
             *
             * @param {Object} data
             */
            function setData(data) {
                data = JSON.stringify(data);
                if (type == 'session') {
                    createCookie('sessionStorage', data, 0);
                } else {
                    createCookie('localStorage', data, 365);
                }
            }

            /**
             * clears the whole data set of a storage cookie.
             */
            function clearData() {
                if (type == 'session') {
                    createCookie('sessionStorage', '', 0);
                } else {
                    createCookie('localStorage', '', 365);
                }
            }

            /**
             * Returns the data set of a storage cookie.
             *
             * @returns {Object}
             */
            function getData() {
                var data = (type == 'session') ? readCookie('sessionStorage') : readCookie('localStorage');

                return data ? JSON.parse(data) : { };
            }

            var data = getData();

            /**
             * Returns an object to expose public functions and hides privates.
             */
            return {
                /**
                 * data set length.
                 *
                 * @public
                 * @property length
                 * @type {Number}
                 */
                length: 0,

                /**
                 * Clears the whole data set.
                 *
                 * @public
                 * @method clear
                 */
                clear: function () {
                    var me = this,
                        p;

                    for(p in data) {
                        if (!data.hasOwnProperty(p)) {
                            continue;
                        }
                        delete data[p];
                    }

                    me.length = 0;

                    clearData();
                },

                /**
                 * Returns the data item by the given key or null if the item was not found.
                 *
                 * @param key
                 * @returns {String|null}
                 */
                getItem: function (key) {
                    return typeof data[key] === 'undefined' ? null : data[key];
                },

                /**
                 * Returns the data item key of the given index.
                 *
                 * @param {Number} index
                 * @returns {String}
                 */
                key: function (index) {
                    var i = 0,
                        p;

                    for (p in data) {
                        if (!data.hasOwnProperty(p)) {
                            continue;
                        }

                        if (i === index) {
                            return p;
                        }

                        i++;
                    }

                    return null;
                },

                /**
                 * Removes an item by the given key.
                 *
                 * @param {String} key
                 */
                removeItem: function (key) {
                    var me = this;

                    if (data.hasOwnProperty(key)) {
                        me.length--;
                    }

                    delete data[key];

                    setData(data);
                },

                /**
                 * Sets the value of a storage item.
                 *
                 * @param {String} key
                 * @param {String} value
                 */
                setItem: function (key, value) {
                    var me = this;

                    if (!data.hasOwnProperty(key)) {
                        me.length++;
                    }

                    data[key] = value + ''; // forces the value to a string

                    setData(data);
                }
            };
        }

        var localStorageSupported = (typeof window.localStorage !== 'undefined'),
            sessionStorageSupported = (typeof window.sessionStorage !== 'undefined'),
            storage = {
                local: localStorageSupported ? window.localStorage : new StoragePolyFill('local'),
                session: sessionStorageSupported ? window.sessionStorage : new StoragePolyFill('session')
            },
            p;

        // test for safari's "QUOTA_EXCEEDED_ERR: DOM Exception 22" issue.
        for (p in storage) {
            if (!storage.hasOwnProperty(p)) {
                continue;
            }

            try {
                storage[p].setItem('storage', '');
                storage[p].removeItem('storage');
            }
            catch (err) {
                storage[p] = new StoragePolyFill(p);
            }
        }

        // Just return the public API instead of all available functions
        return {
            /**
             * Returns the storage object/polyfill of the given type.
             *
             * @returns {Storage|StoragePolyFill}
             */
            getStorage: function (type) {
                return storage[type];
            },

            /**
             * Returns the sessionStorage object/polyfill.
             *
             * @returns {Storage|StoragePolyFill}
             */
            getSessionStorage: function () {
                return this.getStorage('session');
            },

            /**
             * Returns the localStorage object/polyfill.
             *
             * @returns {Storage|StoragePolyFill}
             */
            getLocalStorage: function () {
                return this.getStorage('local');
            },

            /**
             * Calls the clear() method of the storage from the given type.
             *
             * @param {String} type
             */
            clear: function (type) {
                this.getStorage(type).clear();
            },

            /**
             * Calls the getItem() method of the storage from the given type.
             *
             * @param {String} type
             * @param {String} key
             * @returns {String}
             */
            getItem: function (type, key) {
                return this.getStorage(type).getItem(key);
            },

            /**
             * Calls the key() method of the storage from the given type.
             *
             * @param {String} type
             * @param {Number|String} i
             * @returns {String}
             */
            key: function (type, i) {
                return this.getStorage(type).key(i);
            },

            /**
             * Calls the removeItem() method of the storage from the given type.
             *
             * @param {String} type
             * @param {String} key
             */
            removeItem: function (type, key) {
                this.getStorage(type).removeItem(key);
            },

            /**
             * Calls the setItem() method of the storage from the given type.
             *
             * @param {String} type
             * @param {String} key
             * @param {String} value
             */
            setItem: function (type, key, value) {
                this.getStorage(type).setItem(key, value);
            }
        };
    })();
})(window, document);;(function ($) {
    'use strict';

    var $html = $('html');

    /**
     * Off canvas menu plugin
     *
     * The plugin provides an lightweight way to use an off canvas pattern for all kind of content. The content
     * needs to be positioned off canvas using CSS3 `transform`. All the rest will be handled by the plugin.
     *
     * @example Simple usage
     * ```
     *     <a href="#" data-offcanvas="true">Menu</a>
     * ```
     *
     * @example Show the menu on the right side
     * ```
     *     <a href="#" data-offcanvas="true" data-direction="fromRight">Menu</a>
     * ```
     *
     * @ToDo: Implement swipe gesture control. The old swipe gesture was removed due to a scrolling bug.
     */
    $.plugin('swOffcanvasMenu', {

        alias: 'offcanvasMenu',

        /**
         * Plugin default options.
         * Get merged automatically with the user configuration.
         */
        defaults: {

            /**
             * Selector for the content wrapper
             *
             * @property wrapSelector
             * @type {String}
             */
            'wrapSelector': '.page-wrap',

            /**
             * Whether or not the wrapper should be moved.
             *
             * @property moveWrapper
             * @type {Boolean}
             */
            'moveWrapper': false,

            /**
             * Selector of the off-canvas element
             *
             * @property offCanvasSelector
             * @type {String}
             */
            'offCanvasSelector': '.sidebar-main',

            /**
             * Selector for an additional button to close the menu
             *
             * @property closeButtonSelector
             * @type {String}
             */
            'closeButtonSelector': '.entry--close-off-canvas',

            /**
             * Animation direction, `fromLeft` (default) and `fromRight` are possible
             *
             * @property direction
             * @type {String}
             */
            'direction': 'fromLeft',

            /**
             * Additional class for the off-canvas menu for necessary styling
             *
             * @property offCanvasElementCls
             * @type {String}
             */
            'offCanvasElementCls': 'off-canvas',

            /**
             * Class which should be added when the menu will be opened on the left side
             *
             * @property leftMenuCls
             * @type {String}
             */
            'leftMenuCls': 'is--left',

            /**
             * Class which should be added when the menu will be opened on the right side
             *
             * @property rightMenuCls
             * @type {String}
             */
            'rightMenuCls': 'is--right',

            /**
             * Class which indicates if the off-canvas menu is visible
             *
             * @property activeMenuCls
             * @type {String}
             */
            'activeMenuCls': 'is--active',

            /**
             * Class which indicates if the off-canvas menu is visible
             *
             * @property openClass
             * @type {String}
             */
            'openClass': 'is--open',

            /**
             * Flag whether to show the offcanvas menu in full screen or not.
             *
             * @property fullscreen
             * @type {Boolean}
             */
            'fullscreen': false,

            /**
             * Class which sets the canvas to full screen
             *
             * @property fullscreenCls
             * @type {String}
             */
            'fullscreenCls': 'is--full-screen',

            /**
             * When this flag is set to true, the off canvas menu
             * will pop open instead of sliding.
             *
             * @property disableTransitions
             * @type {Boolean}
             */
            'disableTransitions': false,

            /**
             * The class that will be applied to the off canvas menu
             * to disable the transition property.
             *
             * @property disableTransitionCls
             * @type {String}
             */
            'disableTransitionCls': 'no--transitions',

            /**
             * The mode in which the off canvas menu should be showing.
             *
             * 'local': The given 'offCanvasSelector' will be used as the off canvas menu.
             *
             * 'ajax': The given 'offCanvasSelector' will be used as an URL to
             *         load the content via AJAX.
             *
             * @type {String}
             */
            'mode': 'local',

            /**
             * The URL that will be called when the menu is in 'ajax' mode.
             *
             * @type {String}
             */
            'ajaxURL': ''
        },

        /**
         * Initializes the plugin, sets up event listeners and adds the necessary
         * classes to get the plugin up and running.
         *
         * @public
         * @method init
         */
        init: function () {
            var me = this,
                opts = me.opts,
                themeConfig = window.themeConfig,
                $offCanvas;

            opts.moveWrapper = opts.moveWrapper || !!(themeConfig && !~~themeConfig.offcanvasOverlayPage);

            me.applyDataAttributes();

            // Cache the necessary elements
            me.$pageWrap = $(opts.wrapSelector);

            me.isOpened = false;

            if (opts.mode === 'ajax') {
                $offCanvas = me.$offCanvas = $('<div>', {
                    'class': opts.offCanvasElementCls
                }).appendTo('body');
            } else {
                $offCanvas = me.$offCanvas = $(opts.offCanvasSelector);
                $offCanvas.addClass(opts.offCanvasElementCls);
            }

            $offCanvas.addClass((opts.direction === 'fromLeft') ? opts.leftMenuCls : opts.rightMenuCls);
            $offCanvas.addClass(opts.disableTransitionCls);

            if (!opts.disableTransitions) {
                $offCanvas.removeClass(opts.disableTransitionCls);
            }

            if (opts.fullscreen) {
                $offCanvas.addClass(opts.fullscreenCls);
            }

            // Add active class with a timeout to properly register the disable transition class.
            setTimeout(function () {
                $offCanvas.addClass(opts.activeMenuCls);
            }, 0);

            me.registerEventListeners();
        },

        /**
         * Registers all necessary event listeners for the plugin to proper operate.
         *
         * @public
         * @method onClickElement
         */
        registerEventListeners: function () {
            var me = this,
                opts = me.opts;

            // Button click
            me._on(me.$el, 'click', $.proxy(me.onClickElement, me));

            // Allow the user to close the off canvas menu
            me.$offCanvas.on(me.getEventName('click'), opts.closeButtonSelector, $.proxy(me.onClickCloseButton, me));

            $.subscribe('plugin/swOffcanvasMenu/onBeforeOpenMenu', $.proxy(me.onBeforeOpenMenu, me));

            $.publish('plugin/swOffcanvasMenu/onRegisterEvents', me);
        },

        /**
         * Called when a off canvas menu opens.
         * Closes all other off canvas menus if its not the opening menu instance.
         *
         * @param {jQuery.Event} event
         * @param {PluginBase} plugin
         */
        onBeforeOpenMenu: function (event, plugin) {
            var me = this;

            if (plugin !== me) {
                me.closeMenu();
            }
        },

        /**
         * Called when the plugin element was clicked on.
         * Opens the off canvas menu, if the clicked element is not inside
         * the off canvas menu, prevent its default behaviour.
         *
         * @public
         * @method onClickElement
         * @param {jQuery.Event} event
         */
        onClickElement: function (event) {
            var me = this;

            if (!$.contains(me.$offCanvas[0], (event.target || event.currentTarget))) {
                event.preventDefault();
            }

            me.openMenu();

            $.publish('plugin/swOffcanvasMenu/onClickElement', [me, event]);
        },

        /**
         * Called when the body was clicked on.
         * Closes the off canvas menu.
         *
         * @public
         * @method onClickBody
         * @param {jQuery.Event} event
         */
        onClickCloseButton: function (event) {
            var me = this;

            event.preventDefault();
            event.stopPropagation();

            me.closeMenu();

            $.publish('plugin/swOffcanvasMenu/onClickCloseButton', [me, event]);
        },

        /**
         * Opens the off-canvas menu based on the direction.
         * Also closes all other off-canvas menus.
         *
         * @public
         * @method openMenu
         */
        openMenu: function () {
            var me = this,
                opts = me.opts,
                fromLeft = opts.direction === 'fromLeft',
                menuWidth = me.$offCanvas.outerWidth(),
                plugin;

            if (me.isOpened) {
                return;
            }
            me.isOpened = true;

            /** @deprecated - will be removed in 5.1 */
            $.publish('plugin/offcanvasMenu/beforeOpenMenu', me);

            $.publish('plugin/swOffcanvasMenu/onBeforeOpenMenu', me);

            $html.addClass('no--scroll');

            $.overlay.open({
                onClose: $.proxy(me.closeMenu, me)
            });

            if (opts.moveWrapper) {
                if (opts.direction === 'fromRight') {
                    menuWidth *= -1;
                }

                me.$pageWrap.css('left', menuWidth);
            }

            me.$offCanvas.addClass(opts.openClass);

            /** @deprecated - will be removed in 5.1 */
            $.publish('plugin/offCanvasMenu/openMenu', me);

            $.publish('plugin/swOffcanvasMenu/onOpenMenu', me);

            if (opts.mode === 'ajax' && opts.ajaxURL) {
                $.ajax({
                    url: opts.ajaxURL,
                    success: function (result) {
                        me.$offCanvas.html(result);
                    }
                });
            }
        },

        /**
         * Closes the menu and slides the content wrapper
         * back to the normal position.
         *
         * @public
         * @method closeMenu
         */
        closeMenu: function () {
            var me = this,
                opts = me.opts;

            if (!me.isOpened) {
                return;
            }
            me.isOpened = false;

            $.overlay.close();

            // Disable scrolling on body
            $html.removeClass('no--scroll');

            if (opts.moveWrapper) {
                me.$pageWrap.css('left', 0);
            }

            me.$offCanvas.removeClass(opts.openClass);

            /** @deprecated - will be removed in 5.1 */
            $.publish('plugin/offCanvasMenu/closeMenu', me);

            $.publish('plugin/swOffcanvasMenu/onCloseMenu', me);
        },

        /**
         * Destroys the initialized plugin completely, so all event listeners will
         * be removed and the plugin data, which is stored in-memory referenced to
         * the DOM node.
         *
         * @public
         * @method destroy
         */
        destroy: function () {
            var me = this,
                opts = me.opts;

            me.closeMenu();

            me.$offCanvas.removeClass(opts.offCanvasElementCls)
                .removeClass(opts.activeMenuCls)
                .removeClass(opts.openClass)
                .removeAttr('style');

            if (opts.moveWrapper) {
                me.$pageWrap.removeAttr('style');
            }

            me.$el.off(me.getEventName('click'), opts.closeButtonSelector);

            $.unsubscribe('plugin/swOffcanvasMenu/onBeforeOpenMenu', $.proxy(me.onBeforeOpenMenu, me));

            me._destroy();
        }
    });
})(jQuery);
;(function ($, StateManager, window) {
    'use strict';

    var msPointerEnabled = window.navigator.msPointerEnabled,
        $body = $('body');

    /**
     * Shopware Search Plugin.
     *
     * The plugin controlling the search field behaviour in all possible states
     */
    $.plugin('swSearch', {

        alias: 'search',

        defaults: {

            /**
             * Class which will be added when the drop down was triggered
             *
             * @type {String}
             */
            activeCls: 'is--active',

            /**
             * Class which will be used for generating search results
             *
             * @type {String}
             */
            searchFieldSelector: '.main-search--field',

            /**
             * Selector for the search result list.
             *
             * @type {String}
             */
            resultsSelector: '.main-search--results',

            /**
             * Selector for the link in a result entry.
             *
             * @type {String}
             */
            resultLinkSelector: '.search-result--link',

            /**
             * Selector for a single result entry.
             *
             * @type {String}
             */
            resultItemSelector: '.result--item',

            /**
             * Selector for the ajax loading indicator.
             *
             * @type {String}
             */
            loadingIndicatorSelector: '.form--ajax-loader',

            /**
             * Selector for the main header element.
             * On mobile viewport the header get an active class when the
             * search bar is opened for additional styling.
             *
             * @type {String}
             */
            headerSelector: '.header-main',

            /**
             * Gets added when the search bar is active on mobile viewport.
             * Handles additional styling.
             *
             * @type {String}
             */
            activeHeaderClass: 'is--active-searchfield',

            /**
             * Selector for the ajax loading indicator.
             *
             * @type {String}
             */
            triggerSelector: '.entry--trigger',

            /**
             * The URL used for the search request.
             * This option has to be set or an error will be thrown.
             *
             * @type {String}
             */
            requestUrl: '',

            /**
             * Flag whether or not the keyboard navigation is enabled
             *
             * @type {Boolean}
             */
            keyBoardNavigation: true,

            /**
             * Whether or not the active class is set by default
             *
             * @type {String}
             */
            activeOnStart: false,

            /**
             * Minimum amount of characters needed to trigger the search request
             *
             * @type {Number}
             */
            minLength: 3,

            /**
             * Time in milliseconds to wait after each key down event before
             * before starting the search request.
             * If a key was pressed in this time, the last request will be aborted.
             *
             * @type {Number}
             */
            searchDelay: 250,

            /**
             * The speed of all animations.
             *
             * @type {String|Number}
             */
            animationSpeed: 200,

            /**
             * The kay mapping for navigation the search results via keyboard.
             *
             * @type {Object}
             */
            keyMap: {
                'UP': 38,
                'DOWN': 40,
                'ENTER': 13
            }
        },

        /**
         * Initializes the plugin
         *
         * @public
         * @method init
         */
        init: function () {
            var me = this,
                $el = me.$el,
                opts = me.opts;

            me.applyDataAttributes();

            /**
             * The URL to which the search term will send via AJAX
             *
             * @public
             * @property requestURL
             * @type {String}
             */
            me.requestURL = '/de/';

            if (!me.requestURL) {
                throw new Error('Parameter "requestUrl" needs to be set.');
            }

            /**
            * Converts the url to a protocol relative url, so we don't need to manually
            * check the used http protocol. See the example from paul irish to get an idea
            * how it should work:
            *    `http://www.paulirish.com/2010/the-protocol-relative-url/`
            *    `http://blog.httpwatch.com/2010/02/10/using-protocol-relative-urls-to-switch-between-http-and-https/`
            *
            * @param {String} url - the url which needs to be converted
            * @returns {String} converted string
            */
            var convertUrlToRelativeUrl = function(url) {
                url = url.replace('https:', '');
                url = url.replace('http:', '');

                return url;
            };

            me.requestURL = convertUrlToRelativeUrl(me.requestURL);

            /**
             * The search field itself.
             *
             * @public
             * @property $searchfield
             * @type {jQuery}
             */
            me.$searchField = $el.find(opts.searchFieldSelector);

            /**
             * The list in which the top results will be shown
             *
             * @public
             * @property $results
             * @type {jQuery}
             */
            me.$results = $el.find(opts.resultsSelector);

            /**
             * The loading indicator thats inside the search
             *
             * @public
             * @property $loader
             * @type {jQuery}
             */
            me.$loader = $el.find(opts.loadingIndicatorSelector);

            /**
             * The button to toggle the search field on mobile viewport
             *
             * @public
             * @property $toggleSearchBtn
             * @type {jQuery}
             */
            me.$toggleSearchBtn = $el.find(opts.triggerSelector);

            /**
             * The shop header to add a new class after opening
             *
             * @public
             * @property $mainHeader
             * @type {jQuery}
             */
            me.$mainHeader = $(opts.headerSelector);

            /**
             * The last search term that was entered in the search field.
             *
             * @public
             * @property lastSearchTerm
             * @type {String}
             */
            me.lastSearchTerm = '';

            /**
             * Timeout ID of the key up event.
             * The timeout is used to buffer fast key events.
             *
             * @public
             * @property keyupTimeout
             * @type {Number}
             */
            me.keyupTimeout = 0;

            me.registerListeners();
        },

        /**
         * Registers all necessary events for the plugin.
         *
         * @public
         * @method registerListeners
         */
        registerListeners: function () {
            var me = this,
                opts = me.opts,
                $searchField = me.$searchField;

            me._on($searchField, 'keyup', $.proxy(me.onKeyUp, me));
            me._on($searchField, 'keydown', $.proxy(me.onKeyDown, me));
            me._on(me.$toggleSearchBtn, 'click', $.proxy(me.onClickSearchEntry, me));

            if (msPointerEnabled) {
                me.$results.on('click', opts.resultLinkSelector, function (event) {
                    window.location.href = $(event.currentTarget).attr('href');
                });
            }

            StateManager.registerListener({
                state: 'xs',
                enter: function () {
                    if (opts.activeOnStart) {
                        me.openMobileSearch();
                    }
                },
                exit: function () {
                    me.closeMobileSearch();
                }
            });

            StateManager.registerListener({
                state: 's',
                enter: function () {
                    if (opts.activeOnStart) {
                        me.openMobileSearch();
                    }
                },
                exit: function () {
                    me.closeMobileSearch();
                }
            });
            StateManager.registerListener({
                state: 'm',
                enter: function () {
                    if (opts.activeOnStart) {
                        me.openMobileSearch();
                    }
                },
                exit: function () {
                    me.closeMobileSearch();
                }
            });

            StateManager.registerListener({
                state: 'l',
                enter: function () {
                    if (opts.activeOnStart) {
                        me.openMobileSearch();
                    }
                },
                exit: function () {
                    me.closeMobileSearch();
                }
            });


            $.publish('plugin/swSearch/onRegisterEvents', me);
        },

        /**
         * Event handler method which will be fired when the user presses a key when
         * focusing the field.
         *
         * @public
         * @method onKeyDown
         * @param {jQuery.Event} event
         */
        onKeyDown: function (event) {
            var me = this,
                opts = me.opts,
                keyMap = opts.keyMap,
                keyCode = event.which,
                navKeyPressed = opts.keyBoardNavigation && (keyCode === keyMap.UP || keyCode === keyMap.DOWN || keyCode === keyMap.ENTER);

            /** @deprecated - will be removed in 5.1 */
            $.publish('plugin/search/onKeyDown', [ me, event ]);

            $.publish('plugin/swSearch/onKeyDown', [me, event]);

            if (navKeyPressed && me.$results.hasClass(opts.activeCls)) {
                me.onKeyboardNavigation(keyCode);
                event.preventDefault();
                return false;
            }

            return true;
        },

        /**
         * Will be called when a key was released on the search field.
         *
         * @public
         * @method onKeyUp
         * @param {jQuery.Event} event
         */
        onKeyUp: function (event) {
            var me = this,
                opts = me.opts,
                term = me.$searchField.val() + '',
                timeout = me.keyupTimeout;

            /** @deprecated - will be removed in 5.1 */
            $.publish('plugin/search/onKeyUp', [ me, event ]);

            $.publish('plugin/swSearch/onKeyUp', [me, event]);

            if (timeout) {
                window.clearTimeout(timeout);
            }

            if (term.length < opts.minLength) {
                me.lastSearchTerm = '';
                me.closeResult();
                return;
            }

            if (term === me.lastSearchTerm) {
                return;
            }

            me.keyupTimeout = window.setTimeout($.proxy(me.triggerSearchRequest, me, term), opts.searchDelay);
        },

        /**
         * Triggers an AJAX request with the given search term.
         *
         * @public
         * @method triggerSearchRequest
         * @param {String} searchTerm
         */
        triggerSearchRequest: function (searchTerm) {
            var me = this;

            me.$loader.fadeIn(me.opts.animationSpeed);

            me.lastSearchTerm = $.trim(searchTerm);

            /** @deprecated - will be removed in 5.1 */
            $.publish('plugin/search/onSearchRequest', [ me, searchTerm ]);

            $.publish('plugin/swSearch/onSearchRequest', [me, searchTerm]);

            $.ajax({
                'url': me.requestURL,
                'data': {
                    'search': me.lastSearchTerm
                },
                'success': function (response) {
                    me.showResult(response);

                    /** @deprecated - will be removed in 5.1 */
                    $.publish('plugin/search/onSearchResponse', [ me, searchTerm, response ]);

                    $.publish('plugin/swSearch/onSearchResponse', [me, searchTerm, response]);
                }
            });
        },

        /**
         * Clears the result list and appends the given (AJAX) response to it.
         *
         * @public
         * @method showResult
         * @param {String} response
         */
        showResult: function (response) {
            var me = this,
                opts = me.opts;

            me.$loader.fadeOut(opts.animationSpeed);
            me.$results.empty().html(response).addClass(opts.activeCls).show();

            if (!StateManager.isCurrentState('xs') && !StateManager.isCurrentState('m') && !StateManager.isCurrentState('s') && !StateManager.isCurrentState('l'))  {
                $body.on(me.getEventName('click touchstart'), $.proxy(me.onClickBody, me));
            }

            picturefill();

            /** @deprecated - will be removed in 5.1 */
            $.publish('plugin/search/onShowResult', me);

            $.publish('plugin/swSearch/onShowResult', me);
        },

        /**
         * Closes the result list and removes all its items.
         *
         * @public
         * @method closeResult
         */
        closeResult: function () {
            var me = this;

            me.$results.removeClass(me.opts.activeCls).hide().empty();

            /** @deprecated - will be removed in 5.1 */
            $.publish('plugin/search/onCloseResult', me);

            $.publish('plugin/swSearch/onCloseResult', me);
        },

        /**
         * Called when the body was clicked after the search field went active.
         * Closes the search field and results.
         *
         * @public
         * @method onClickBody
         * @param {jQuery.Event} event
         */
        onClickBody: function (event) {
            var me = this,
                target = event.target,
                pluginEl = me.$el[0],
                resultsEl = me.$results[0];

            if (target === pluginEl || target === resultsEl || $.contains(pluginEl, target) || $.contains(resultsEl, target)) {
                return;
            }

            $body.off(me.getEventName('click touchstart'));

            me.closeMobileSearch();
        },

        /**
         * Adds support to navigate using the keyboard.
         *
         * @public
         * @method onKeyboardNavigation
         * @param {Number} keyCode
         */
        onKeyboardNavigation: function (keyCode) {
            var me = this,
                opts = me.opts,
                keyMap = opts.keyMap,
                $results = me.$results,
                activeClass = opts.activeCls,
                $selected = $results.find('.' + activeClass),
                $resultItems,
                $nextSibling,
                firstLast;

            /** @deprecated - will be removed in 5.1 */
            $.publish('plugin/search/onKeyboardNavigation', [ me, keyCode ]);

            $.publish('plugin/swSearch/onKeyboardNavigation', [me, keyCode]);

            if (keyCode === keyMap.UP || keyCode === keyMap.DOWN) {
                $resultItems = $results.find(opts.resultItemSelector);
                firstLast = (keyCode === keyMap.DOWN) ? 'first' : 'last';

                if (!$selected.length) {
                    $resultItems[firstLast]().addClass(activeClass);
                    return;
                }

                $resultItems.removeClass(activeClass);

                $nextSibling = $selected[(keyCode === keyMap.DOWN) ? 'next' : 'prev']();

                if ($nextSibling.length) {
                    $nextSibling.addClass(activeClass);
                    return;
                }

                $selected.siblings()[firstLast]().addClass(activeClass);
            }

            if (keyCode === keyMap.ENTER) {
                if ($selected.length) {
                    window.location.href = $selected.find(opts.resultLinkSelector).attr('href');
                    return;
                }

                me.$parent.submit();
            }
        },

        /**
         * onClickSearchTrigger event for displaying and hiding
         * the search field
         *
         * @public
         * @method onClickSearchEntry
         * @param event
         */
        onClickSearchEntry: function (event) {
            var me = this,
                $el = me.$el,
                opts = me.opts;

            /** @deprecated - will be removed in 5.1 */
            $.publish('plugin/search/onClickSearchEntry', [ me, event ]);

            $.publish('plugin/swSearch/onClickSearchEntry', [me, event]);

            if (!StateManager.isCurrentState('xs') && !StateManager.isCurrentState('s') && !StateManager.isCurrentState('m') && !StateManager.isCurrentState('l')) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            $el.hasClass(opts.activeCls) ? me.closeMobileSearch() : me.openMobileSearch();
        },

        /**
         * Opens the mobile search bar and focuses it.
         *
         * @public
         * @method openMobileSearch
         */
        openMobileSearch: function () {
            var me = this,
                $el = me.$el,
                opts = me.opts,
                activeCls = opts.activeCls;

            $body.on(me.getEventName('click touchstart'), $.proxy(me.onClickBody, me));

            $el.addClass(activeCls);
            me.$toggleSearchBtn.addClass(activeCls);
            me.$mainHeader.addClass(opts.activeHeaderClass);

            me.$searchField.focus();

            /** @deprecated - will be removed in 5.1 */
            $.publish('plugin/search/onOpenMobileSearch', [ me ]);

            $.publish('plugin/swSearch/onOpenMobileSearch', me);
        },

        /**
         * Closes the mobile search bar and removes its focus.
         *
         * @public
         * @method closeMobileSearch
         */
        closeMobileSearch: function () {
            var me = this,
                $el = me.$el,
                opts = me.opts,
                activeCls = opts.activeCls;

            $el.removeClass(activeCls);
            me.$toggleSearchBtn.removeClass(activeCls);
            me.$mainHeader.removeClass(opts.activeHeaderClass);

            me.$searchField.blur();

            /** @deprecated - will be removed in 5.1 */
            $.publish('plugin/search/onCloseMobileSearch', [ me ]);

            $.publish('plugin/swSearch/onCloseMobileSearch', me);

            me.closeResult();
        },

        /**
         * Destroys the plugin and removes registered events.
         *
         * @public
         * @method destroy
         */
        destroy: function () {
            var me = this;

            me.closeMobileSearch();

            $body.off(me.getEventName('click touchstart'));

            me._destroy();
        }
    });
})(jQuery, StateManager, window);
;(function ($) {
    'use strict';

    /**
     * Shopware Collapse Panel Plugin.
     */
    $.plugin('swCollapsePanel', {

        alias: 'collapsePanel',

        /**
         * Default options for the collapse panel plugin.
         *
         * @public
         * @property defaults
         * @type {Object}
         */
        defaults: {

            /**
             * The selector of the target element which should be collapsed.
             *
             * @type {String|HTMLElement}
             */
            collapseTarget: false,

            /**
             * Selector for the content sibling when no collapseTargetCls was passed.
             *
             * @type {String}
             */
            contentSiblingSelector: '.collapse--content',

            /**
             * Additional class which will be added to the collapse target.
             *
             * @type {String}
             */
            collapseTargetCls: 'js--collapse-target',

            /**
             * The class which triggers the collapsed state.
             *
             * @type {String}
             */
            collapsedStateCls: 'is--collapsed',

            /**
             * The class for the active state of the trigger element.
             *
             * @type {String}
             */
            activeTriggerCls: 'is--active',

            /**
             * Decide if sibling collapse panels should be closed when the target is collapsed.
             *
             * @type {Boolean}
             */
            closeSiblings: false,

            /**
             * The speed of the collapse animation in ms.
             *
             * @type {Number}
             */
            animationSpeed: 400
        },

        /**
         * Default plugin initialisation function.
         * Sets all needed properties, adds classes
         * and registers all needed event listeners.
         *
         * @public
         * @method init
         */
        init: function () {
            var me = this,
                opts = me.opts;

            me.applyDataAttributes();

            if (opts.collapseTarget) {
                me.$targetEl = $(opts.collapseTarget);
            } else {
                me.$targetEl = me.$el.next(opts.contentSiblingSelector);
            }

            me.$targetEl.addClass(opts.collapseTargetCls);

            me.registerEvents();
        },

        /**
         * Registers all necessary event handlers.
         *
         * @public
         * @method registerEvents
         */
        registerEvents: function () {
            var me = this;

            me._on(me.$el, 'click', function (e) {
                e.preventDefault();
                me.toggleCollapse();
            });

            $.publish('plugin/swCollapsePanel/onRegisterEvents', me);
        },

        /**
         * Toggles the collapse state of the element.
         *
         * @public
         * @method toggleCollapse
         */
        toggleCollapse: function () {
            var me = this;

            if (me.$targetEl.hasClass(me.opts.collapsedStateCls)) {
                me.closePanel();
            } else {
                me.openPanel();
            }

            $.publish('plugin/swCollapsePanel/onToggleCollapse', me);
        },

        /**
         * Opens the panel by sliding it down.
         *
         * @public
         * @method openPanel
         */
        openPanel: function () {
            var me = this,
                opts = me.opts,
                $targetEl = me.$targetEl,
                siblings = $('.' + opts.collapseTargetCls).not($targetEl);

            me.$el.addClass(opts.activeTriggerCls);

            $targetEl.slideDown(opts.animationSpeed, function () {
                /** @deprecated - will be removed in 5.1 */
                $.publish('plugin/collapsePanel/onOpen', me );

                $.publish('plugin/swCollapsePanel/onOpen', me);
            }).addClass(opts.collapsedStateCls);

            if (opts.closeSiblings) {
                siblings.slideUp(opts.animationSpeed, function () {
                    siblings.removeClass(opts.collapsedStateCls);
                });
            }

            $.each($targetEl.find('.product-slider'), function(index, item) {
                $(item).data('plugin_swProductSlider').update();
            });

            $.publish('plugin/swCollapsePanel/onOpenPanel', me);
        },

        /**
         * Closes the panel by sliding it up.
         *
         * @public
         * @method openPanel
         */
        closePanel: function () {
            var me = this,
                opts = me.opts;

            me.$el.removeClass(opts.activeTriggerCls);
            me.$targetEl.slideUp(opts.animationSpeed, function() {
                /** @deprecated - will be removed in 5.1 */
                $.publish('plugin/collapsePanel/onClose', me);

                $.publish('plugin/swCollapsePanel/onClose', me);
            }).removeClass(opts.collapsedStateCls);

            $.publish('plugin/swCollapsePanel/onClosePanel', me);
        },

        /**
         * Destroys the initialized plugin completely, so all event listeners will
         * be removed and the plugin data, which is stored in-memory referenced to
         * the DOM node.
         *
         * @public
         * @method destroy
         */
        destroy: function () {
            var me = this,
                opts = me.opts;

            me.$el.removeClass(opts.activeTriggerCls);
            me.$targetEl.removeClass(opts.collapsedStateCls)
                .removeClass(opts.collapseTargetCls)
                .removeAttr('style');

            me._destroy();
        }
    });
})(jQuery);
;(function($) {
    'use strict';

    /**
     * Shopware Auto Submit Plugin
     *
     * @example
     *
     * HTML:
     *
     * <form method="GET" action="URL">
     *     <input type="checkbox" name="item1" value="1" data-auto-submit="true" />
     *     <input type="radio" name="item2" value="2" data-auto-submit="true" />
     *     <select name="item3" data-auto-submit="true">
     *         <option value="opt1" selected="selected">My option 1</option>
     *         <option value="opt2">My option 2</option>
     *         <option value="opt3">My option 3</option>
     *     </select>
     * </form>
     *
     * JS:
     *
     * $('form *[data-auto-submit="true"]').autoSubmit();
     *
     * If you now change either an input or an option in the select, the form will be submitted.
     *
     */
    $.plugin('swAutoSubmit', {

        alias: 'autoSubmit',

        defaults: {

            /**
             * Decide if loading indicator is shown until the form is submitted.
             *
             * @property loadingindicator
             * @type {Boolean}
             */
            'loadingindicator': true
        },

        /**
         * Default plugin initialisation function.
         * Registers an event listener on the change event.
         * When it's triggered, the parent form will be submitted.
         *
         * @public
         * @method init
         */
        init: function () {
            var me = this;

            me.applyDataAttributes();

            me.$form = $(me.$el.parents('form')[0]);

            // Will be automatically removed when destroy() is called.
            me._on(me.$el, 'change', $.proxy(me.onChangeSelection, me));

            $.publish('plugin/swAutoSubmit/onRegisterEvents', me);
        },

        onChangeSelection: function () {
            var me = this;

            if(me.opts.loadingindicator) {
                $.loadingIndicator.open({
                    closeOnClick: false
                });
            }

            me.$form.submit();
        }
    });
})(jQuery);;(function ($, window) {
    'use strict';

    var emptyFn = function () {},
        $html = $('html');

    /**
     * Shopware Modal Module
     *
     * The modalbox is "session based".
     * That means, that an .open() call will completely override the settings of the previous .open() calls.
     *
     * @example
     *
     * Simple content / text:
     *
     * $.modal.open('Hello World', {
     *     title: 'My title'
     * });
     *
     * Ajax loading:
     *
     * $.modal.open('account/ajax_login', {
     *     mode: 'ajax'
     * });
     *
     * Iframe example / YouTube Video:
     *
     * $.modal.open('http://www.youtube.com/embed/5dxVfU-yerQ', {
     *     mode: 'iframe'
     * });
     *
     * To close the modal box simply call:
     *
     * $.modal.close();
     *
     * @type {Object}
     */
    $.modal = {
        /**
         * The complete template wrapped in jQuery.
         *
         * @private
         * @property _$modalBox
         * @type {jQuery}
         */
        _$modalBox: null,

        /**
         * Container for the title wrapped in jQuery.
         *
         * @private
         * @property _$header
         * @type {jQuery}
         */
        _$header: null,

        /**
         * The title element wrapped in jQuery.
         *
         * @private
         * @property _$title
         * @type {jQuery}
         */
        _$title: null,

        /**
         * The content element wrapped in jQuery.
         *
         * @private
         * @property _$content
         * @type {jQuery}
         */
        _$content: null,

        /**
         * The close button wrapped in jQuery.
         *
         * @private
         * @property _$closeButton
         * @type {jQuery}
         */
        _$closeButton: null,

        /**
         * Default options of a opening session.
         *
         * @public
         * @property defaults
         * @type {jQuery}
         */
        defaults: {
            /**
             * The mode in which the lightbox should be showing.
             *
             * 'local':
             *
             * The given content is either text or HTML.
             *
             * 'ajax':
             *
             * The given content is the URL from what it should load the HTML.
             *
             * 'iframe':
             *
             * The given content is the source URL of the iframe.
             *
             * @type {String}
             */
            mode: 'local',

            /**
             * Sizing mode of the modal box.
             *
             * 'auto':
             *
             * Will set the given width as max-width so the container can shrink.
             * Fullscreen mode on small mobile devices.
             *
             * 'fixed':
             *
             * Will use the width and height as static sizes and will not change to fullscreen mode.
             *
             * 'content':
             *
             * Will use the height of its content instead of a given height.
             * The 'height' option will be ignored when set.
             *
             * 'full':
             *
             * Will set the modalbox to fullscreen.
             *
             * @type {String}
             */
            sizing: 'auto',

            /**
             * The width of the modal box window.
             *
             * @type {Number}
             */
            width: 600,

            /**
             * The height of the modal box window.
             *
             * @type {Number}
             */
            height: 600,

            /**
             * Whether or not the overlay should be shown.
             *
             * @type {Boolean}
             */
            overlay: true,

            /**
             * Whether or not the modal box should be closed when the user clicks on the overlay.
             *
             * @type {Boolean}
             */
            closeOnOverlay: true,

            /**
             * Whether or not the closing button should be shown.
             *
             * @type {Boolean}
             */
            showCloseButton: true,

            /**
             * Speed for every CSS transition animation
             *
             * @type {Number}
             */
            animationSpeed: 500,

            /**
             * The window title of the modal box.
             * If empty, the header will be hidden.
             *
             * @type {String}
             */
            title: '',

            /**
             * Will be overridden by the current URL when the mode is 'ajax' or 'iframe'.
             * Can be accessed by the options object.
             *
             * @type {String}
             */
            src: '',

            /**
             * Array of key codes the modal box can be closed.
             *
             * @type {Array}
             */
            closeKeys: [27],

            /**
             * Whether or not it is possible to close the modal box by the keyboard.
             *
             * @type {Boolean}
             */
            keyboardClosing: true,

            /**
             * Function which will be called when the modal box is closing.
             *
             * @type {Function}
             */
            onClose: emptyFn,

            /**
             * Whether or not the picturefill function will be called when setting content.
             *
             * @type {Boolean}
             */
            updateImages: false,

            /**
             * Class that will be added to the modalbox.
             *
             * @type {String}
             */
            additionalClass: ''
        },

        /**
         * The current merged options of the last .open() call.
         *
         * @public
         * @property options
         * @type {Object}
         */
        options: {},

        /**
         * Opens the modal box.
         * Sets the given content and applies the given options to the current session.
         * If given, the overlay options will be passed in its .open() call.
         *
         * @public
         * @method open
         * @param {String|jQuery|HTMLElement} content
         * @param {Object} options
         */
        open: function (content, options) {
            var me = this,
                $modalBox = me._$modalBox,
                opts;

            me.options = opts = $.extend({}, me.defaults, options);

            if (opts.overlay) {
                $.overlay.open($.extend({}, {
                    closeOnClick: opts.closeOnOverlay,
                    onClose: $.proxy(me.onOverlayClose, me)
                }));
            }

            if (!$modalBox) {
                me.initModalBox();
                me.registerEvents();

                $modalBox = me._$modalBox;
            }

            me._$closeButton.toggle(opts.showCloseButton);

            $modalBox.toggleClass('sizing--auto', opts.sizing === 'auto');
            $modalBox.toggleClass('sizing--fixed', opts.sizing === 'fixed');
            $modalBox.toggleClass('sizing--content', opts.sizing === 'content');
            $modalBox.toggleClass('no--header', opts.title.length === 0);

            $modalBox.addClass(opts.additionalClass);

            if (opts.sizing === 'content') {
                opts.height = 'auto';
            } else {
                $modalBox.css('top', 0);
            }

            me.setWidth(opts.width);
            me.setHeight(opts.height);
            me.setTitle(opts.title);

            // set display to block instead of .show() for browser compatibility
            $modalBox.css('display', 'block');

            switch (opts.mode) {
                case 'ajax':
                    $.ajax(content, {
                        data: {
                            isXHR: 1
                        },
                        success: function (result) {
                            me.setContent(result);
                            $.publish('plugin/modal/onOpenAjax', me);
                        }
                    });
                    me.options.src = content;
                    break;
                case 'iframe':
                    me.setContent('<iframe class="content--iframe" src="' + content + '" width="100%" height="100%"></iframe>');
                    me.options.src = content;
                    break;
                default:
                    me.setContent(content);
                    break;
            }

            me.setTransition({
                opacity: 1
            }, me.options.animationSpeed, 'linear');

            $html.addClass('no--scroll');

            $.publish('plugin/modal/onOpen', me);

            return me;
        },

        /**
         * Closes the modal box and the overlay if its enabled.
         * if the fading is completed, the content will be removed.
         *
         * @public
         * @method close
         */
        close: function () {
            var me = this,
                opts = me.options,
                $modalBox = me._$modalBox;

            if (opts.overlay) {
                $.overlay.close();
            }

            $html.removeClass('no--scroll');

            if ($modalBox !== null) {
                me.setTransition({
                    opacity: 0
                }, opts.animationSpeed, 'linear', function () {
                    $modalBox.removeClass(opts.additionalClass);

                    // set display to none instead of .hide() for browser compatibility
                    $modalBox.css('display', 'none');

                    opts.onClose.call(me);

                    me._$content.empty();
                });
            }

            $.publish('plugin/modal/onClose', me);

            return me;
        },

        /**
         * Sets the title of the modal box.
         *
         * @public
         * @method setTransition
         * @param {Object} css
         * @param {Number} duration
         * @param {String} animation
         * @param {Function} callback
         */
        setTransition: function (css, duration, animation, callback) {
            var me = this,
                $modalBox = me._$modalBox,
                opts = $.extend({
                    animation: 'ease',
                    duration: me.options.animationSpeed
                }, {
                    animation: animation,
                    duration: duration
                });

            if (!$.support.transition) {
                $modalBox.stop(true).animate(css, opts.duration, opts.animation, callback);
                return;
            }

            $modalBox.stop(true).transition(css, opts.duration, opts.animation, callback);

            $.publish('plugin/modal/onSetTransition', [me, css, opts]);
        },

        /**
         * Sets the title of the modal box.
         *
         * @public
         * @method setTitle
         * @param {String} title
         */
        setTitle: function (title) {
            var me = this;

            me._$title.html(title);

            $.publish('plugin/modal/onSetTitle', [me, title]);
        },

        /**
         * Sets the content of the modal box.
         *
         * @public
         * @method setContent
         * @param {String|jQuery|HTMLElement} content
         */
        setContent: function (content) {
            var me = this,
                opts = me.options;

            me._$content.html(content);

            if (opts.sizing === 'content') {
                // initial centering
                me.center();

                // centering again to fix some styling/positioning issues
                window.setTimeout(me.center.bind(me), 25);
            }

            if (opts.updateImages) {
                picturefill();
            }

            $.publish('plugin/modal/onSetContent', me);
        },

        /**
         * Sets the width of the modal box.
         * If a string was passed containing a only number, it will be parsed as a pixel value.
         *
         * @public
         * @method setWidth
         * @param {Number|String} width
         */
        setWidth: function (width) {
            var me = this;

            me._$modalBox.css('width', (typeof width === 'string' && !(/^\d+$/.test(width))) ? width : parseInt(width, 10));

            $.publish('plugin/modal/onSetWidth', me);
        },

        /**
         * Sets the height of the modal box.
         * If a string was passed containing a only number, it will be parsed as a pixel value.
         *
         * @public
         * @method setHeight
         * @param {Number|String} height
         */
        setHeight: function (height) {
            var me = this;

            me._$modalBox.css('height', (typeof height === 'string' && !(/^\d+$/.test(height))) ? height : parseInt(height, 10));

            $.publish('plugin/modal/onSetHeight', me);
        },

        /**
         * Creates the modal box and all its elements.
         * Appends it to the body.
         *
         * @public
         * @method initModalBox
         */
        initModalBox: function () {
            var me = this;

            me._$modalBox = $('<div>', {
                'class': 'js--modal'
            });

            me._$header = $('<div>', {
                'class': 'header'
            }).appendTo(me._$modalBox);

            me._$title = $('<div>', {
                'class': 'title'
            }).appendTo(me._$header);

            me._$content = $('<div>', {
                'class': 'content'
            }).appendTo(me._$modalBox);

            me._$closeButton = $('<div>', {
                'class': 'btn icon--cross is--small btn--grey modal--close'
            }).appendTo(me._$modalBox);

            $('body').append(me._$modalBox);

            $.publish('plugin/modal/onInit', me);
        },

        /**
         * Registers all needed event listeners.
         *
         * @public
         * @method registerEvents
         */
        registerEvents: function () {
            var me = this,
                $window = $(window);

            me._$closeButton.on('click.modal touchstart.modal', $.proxy(me.close, me));

            $window.on('keydown.modal', $.proxy(me.onKeyDown, me));
            StateManager.on('resize', me.onWindowResize, me);

            StateManager.registerListener({
                state: 'xs',
                enter: function() {
                    me._$modalBox.addClass('is--fullscreen');
                },
                exit: function () {
                    me._$modalBox.removeClass('is--fullscreen');
                }
            });

            $.publish('plugin/modal/onRegisterEvents', me);
        },

        /**
         * Called when a key was pressed.
         * Closes the modal box when the keyCode is mapped to a close key.
         *
         * @public
         * @method onKeyDown
         */
        onKeyDown: function (event) {
            var me = this,
                keyCode = event.which,
                keys = me.options.closeKeys,
                len = keys.length,
                i = 0;

            if (!me.options.keyboardClosing) {
                return;
            }

            for (; i < len; i++) {
                if (keys[i] === keyCode) {
                    me.close();
                }
            }

            $.publish('plugin/modal/onKeyDown', [me, event, keyCode]);
        },

        /**
         * Called when the window was resized.
         * Centers the modal box when the sizing is set to 'content'.
         *
         * @public
         * @method onWindowResize
         */
        onWindowResize: function (event) {
            var me = this;

            if (me.options.sizing === 'content') {
                me.center();
            }

            $.publish('plugin/modal/onWindowResize', [me, event]);
        },

        /**
         * Sets the top position of the modal box to center it to the screen
         *
         * @public
         * @method centerModalBox
         */
        center: function () {
            var me = this,
                $modalBox = me._$modalBox;

            $modalBox.css('top', ($(window).height() - $modalBox.height()) / 2);

            $.publish('plugin/modal/onCenter', me);
        },

        /**
         * Called when the overlay was clicked.
         * Closes the modalbox when the 'closeOnOverlay' option is active.
         *
         * @public
         * @method onOverlayClose
         */
        onOverlayClose: function () {
            var me = this;

            if (!me.options.closeOnOverlay) {
                return;
            }

            me.close();

            $.publish('plugin/modal/onOverlayClick', me);
        },

        /**
         * Removes the current modalbox element from the DOM and destroys its items.
         * Also clears the options.
         *
         * @public
         * @method destroy
         */
        destroy: function () {
            var me = this,
                p;

            me._$modalBox.remove();

            me._$modalBox = null;
            me._$header = null;
            me._$title = null;
            me._$content = null;
            me._$closeButton = null;

            for (p in me.options) {
                if (!me.options.hasOwnProperty(p)) {
                    continue;
                }
                delete me.options[p];
            }

            StateManager.off('resize', me.onWindowResize, me);
        }
    };

    /**
     * Shopware Modalbox Plugin
     *
     * This plugin opens a offcanvas menu on click.
     * The content of the offcanvas can either be passed to the plugin
     * or the target element will be used as the content.
     */
    $.plugin('swModalbox', {

        alias: 'modalbox',

        defaults: {

            /**
             * Selector for the target when clicked on.
             * If no selector is passed, the element itself will be used.
             * When no content was passed, the target will be used as the content.
             *
             * @property targetSelector
             * @type {String}
             */
            targetSelector: '',

            /**
             * Optional content for the modal box.
             *
             * @property content
             * @type {String}
             */
            content: '',

            /**
             * Fetch mode for the modal box
             *
             * @property mode
             * @type {String}
             */
            mode: 'local'
        },

        /**
         * Initializes the plugin, applies addition data attributes and
         * registers events for clicking the target element.
         *
         * @public
         * @method init
         */
        init: function () {
            var me = this,
                opts;

            me.opts = $.extend({}, Object.create($.modal.defaults), me.opts);

            me.applyDataAttributes();

            opts = me.opts;

            me.$target = opts.targetSelector && (me.$target = me.$el.find(opts.targetSelector)).length ? me.$target : me.$el;

            me._isOpened = false;

            me._on(me.$target, 'click', $.proxy(me.onClick, me));

            $.subscribe('plugin/modal/onClose', $.proxy(me.onClose, me));

            $.publish('plugin/modalbox/onRegisterEvents', me);
        },

        /**
         * This method will be called when the target element was clicked.
         * Opens the actual modal box and uses the provided content.
         *
         * @public
         * @method onClick
         * @param {jQuery.Event} event
         */
        onClick: function (event) {
            event.preventDefault();

            var me = this;

            $.modal.open(me.opts.content || (me.opts.mode !== 'local' ? me.$target.attr('href') : me.$target), me.opts);

            me._isOpened = true;

            $.publish('plugin/modalbox/onClick', [me, event]);
        },

        /**
         * This method will be called when the plugin specific modal box was closed.
         *
         * @public
         * @method onClick
         */
        onClose: function () {
            var me = this;

            me._isOpened = false;

            $.publish('plugin/modalbox/onClose', me);
        },

        /**
         * This method closes the modal box when its opened, destroys
         * the plugin and removes all registered events
         *
         * @public
         * @method destroy
         */
        destroy: function () {
            var me = this;

            if (me._isOpened) {
                $.modal.close();
            }

            $.unsubscribe('plugin/modal/onClose', $.proxy(me.onClose, me));

            me._destroy();
        }
    });
})(jQuery, window);

;(function ($, window, document, undefined) {
    "use strict";

    $.plugin('swSelectboxReplacement', {

        alias: 'selectboxReplacement',

        /** @property {Object} Default settings for the plugin **/
        defaults: {

            /** @property {String} Basic class name for the plugin. */
            'baseCls': 'js--fancy-select',

            /** @property {String} Focus class. */
            'focusCls': 'js--is--focused',

            /** @property {String} Text / html content for the trigger field. */
            'triggerText': '<i class="icon--arrow-down"></i>',

            /** @property {String} Class which indicates that the field is disabled. */
            'disabledCls': 'is--disabled',

            /** @property {String} Class which indicates that the field has an error. */
            'errorCls': 'has--error',

            /** @property {boolean} Truthy to set all the classes on the parent element to the wrapper element. */
            'compatibility': true,

            /** @property {String} Additional css class for styling purpose */
            'class': ''
        },

        /**
         * Initializes the plugin
         *
         * @returns {Plugin}
         */
        init: function () {
            var me = this;

            // Update the plugin configuration with the HTML5 data-attributes
            me.applyDataAttributes();

            me.$wrapEl = me.createTemplate(me.$el);
            me.registerEventListeners();

            // Disable the select box
            if (me.$el.attr('disabled') !== undefined) {
                me.setDisabled();
            }

            // Support marking the field as error
            if (me.$el.hasClass(me.opts.errorCls)) {
                me.setError();
            }

            // Set the compatibility classes
            if (me.opts.compatibility) {
                me._setCompatibilityClasses();
            }

            return me;
        },

        /**
         * Creates the neccessary DOM structure and wraps the {@link me.$el} into the newly created
         * structure.
         * @param {jQuery} $el - HTMLElement which fires the plugin.
         * @returns {jQuery} wrapEl - jQuery object of the newly created structure
         */
        createTemplate: function ($el) {
            var me = this,
                wrapEl;

            // We need to use the array syntax here due to the fact that ```class``` is a reserved keyword in IE and Safari
            wrapEl = me._formatString('<div class="{0}"></div>', me.opts.baseCls + ' ' + me.opts['class']);
            wrapEl = $el.wrap(wrapEl).parents('.' + me.opts.baseCls);

            me.$textEl = $('<div>', { 'class': me.opts.baseCls + '-text' }).appendTo(wrapEl);
            me.$triggerEl =$('<div>', { 'class': me.opts.baseCls + '-trigger', 'html': me.opts.triggerText }).appendTo(wrapEl);

            me.selected = me.$el.find(':selected');
            me.$textEl.html(me.selected.html());

            $.publish('plugin/swSelectboxReplacement/onCreateTemplate', [me, wrapEl]);

            return wrapEl;
        },

        /**
         * Disables the select box
         * @returns {jQuery|Plugin.$el|*|PluginBase.$el}
         */
        setDisabled: function () {
            var me = this;

            me.$wrapEl.addClass(me.opts.disabledCls);
            me.$el.attr('disabled', 'disabled');

            $.publish('plugin/swSelectboxReplacement/onSetDisabled', me);

            return me.$el;
        },

        /**
         * Enables the select box
         * @returns {jQuery|Plugin.$el|*|PluginBase.$el}
         */
        setEnabled: function () {
            var me = this;

            me.$wrapEl.removeClass(me.opts.disabledCls);
            me.$el.removeAttr('disabled');

            $.publish('plugin/swSelectboxReplacement/onSetEnabled', me);

            return me.$el;
        },

        /**
         * Marks the field as error.
         * @returns {jQuery}
         */
        setError: function () {
            var me = this;

            me.$wrapEl.addClass(me.opts.errorCls);

            $.publish('plugin/swSelectboxReplacement/onSetError', me);

            return me.$wrapEl;
        },

        /**
         * Removes the error mark of the field.
         * @returns {jQuery}
         */
        removeError: function () {
            var me = this;

            me.$wrapEl.removeClass(me.opts.errorCls);

            $.publish('plugin/swSelectboxReplacement/onRemoveError', me);

            return me.$wrapEl;
        },

        /**
         * Wrapper method for jQuery's ```val``` method.
         * @returns {jQuery}
         */
        val: function() {
            var me = this, val;

            val = me.$el.val.apply(me.$el, arguments);

            if(typeof arguments[0] !== 'function') {
                me.setSelectedOnTextElement();
            }

            $.publish('plugin/swSelectboxReplacement/onSetVal', me);

            return val;
        },

        /**
         * Wrapper method for jQuery's ```show``` method.
         * @returns {jQuery}
         */
        show: function() {
            var me = this;

            me.$wrapEl.show.apply(me.$wrapEl, arguments);

            $.publish('plugin/swSelectboxReplacement/onShow', me);

            return me.$wrapEl;
        },

        /**
         * Wrapper method for jQuery's ```hide``` method.
         * @returns {jQuery}
         */
        hide: function() {
            var me = this;

            me.$wrapEl.hide.apply(me.$wrapEl, arguments);

            $.publish('plugin/swSelectboxReplacement/onHide', me);

            return me.$wrapEl;
        },

        /**
         * Registers the neccessary event listeners for the plugin.
         *
         * @returns {boolean}
         */
        registerEventListeners: function () {
            var me = this;

            me._on(me.$el, 'change', $.proxy(me.onChange, me));
            me._on(me.$el, 'keyup', $.proxy(me.onKeyUp, me));
            me._on(me.$el, 'focus', $.proxy(me.onFocus, me));
            me._on(me.$el, 'blur', $.proxy(me.onBlur, me));

            $.publish('plugin/swSelectboxReplacement/onRegisterEvents', me);

            return true;
        },

        /**
         * Helper method which reads out the selected entry from the "select" element
         * and writes it into the text element which is visible to the user.
         *
         * @returns {String} selected entry from the "select" element
         */
        setSelectedOnTextElement: function () {
            var me = this;

            me.selected = me.$el.find(':selected');
            me.$textEl.html(me.selected.html());

            $.publish('plugin/swSelectboxReplacement/onSetSelected', [me, me.selected]);

            return me.selected;
        },

        /**
         * Event listener method which will be fired when the user
         * changes the value of the select box.
         *
         * @event `change`
         * @param {Object} event - jQuery event eOpts
         * @returns {void}
         */
        onChange: function () {
            var me = this;

            me.setSelectedOnTextElement();

            $.publish('plugin/swSelectboxReplacement/onChange', me);
        },

        /**
         * Event listener which fires on key up on the "select" element.
         *
         * Checks if the user presses the up or down key to update the
         * text element with the currently selected entry in the select box.
         *
         * @event `keyup`
         * @param {Object} event - jQuery event eOpts
         * @returns {boolean}
         */
        onKeyUp: function (event) {
            var me = this;

            // 38 = up arrow, 40 = down arrow
            if(event.which === 38 || event.which === 40) {
                me.setSelectedOnTextElement();
            }

            $.publish('plugin/swSelectboxReplacement/onKeyUp', me);

            return false;
        },

        /**
         * Event listener which fires on focus on the "select" element.
         *
         * Just adds a class for styling purpose.
         *
         * @returns {void}
         */
        onFocus: function () {
            var me = this;

            me.$wrapEl.addClass(me.opts.focusCls);

            $.publish('plugin/swSelectboxReplacement/onFocus', me);
        },

        /**
         * Event listener which fires on blur on the "select" element.
         *
         * Just removes a class which was set for styling purpose.
         *
         * @returns {void}
         */
        onBlur: function () {
            var me = this;

            me.$wrapEl.removeClass(me.opts.focusCls);

            $.publish('plugin/swSelectboxReplacement/onBlur', me);
        },

        /**
         * Applies all the classes from the ```field--select``` parent element to the {@link me.$wrapEl}.
         *
         * @returns {boolean}
         * @private
         */
        _setCompatibilityClasses: function () {
            var me = this,
                $el = me.$el,
                $parent = $el.parents('.field--select'),
                classList;

            if(!$parent || !$parent.length) {
                return false;
            }
            classList = $parent.attr('class').split(/\s+/);
            $.each(classList, function () {
                me.$wrapEl.addClass(this);
            });

            return true;
        },

        /**
         * Allows you to define a tokenized string and pass an arbitrary number of arguments to replace the tokens.
         * Each token must be unique, and must increment in the format {0}, {1}, etc.
         *
         * @example Sample usage
         *    me._formatString('<div class="{0}">Text</div>', 'test');
         *
         * @param {String} str - The tokenized string to be formatted.
         * @returns {String} The formatted string
         * @private
         */
        _formatString: function (str) {
            var i = 1,
                len = arguments.length;

            for (; i < len; i++) {
                str = str.replace('{' + (i - 1) + '}', arguments[i]);
            }
            return str;
        }
    });
})(jQuery, window, document);
/**
 * Shopware Overlay Module.
 *
 * Displays/Hides a fullscreen overlay with a certain color and opacity.
 *
 * @example
 *
 * Open th overlay:
 *
 * $.overlay.open({
     *     color: '#FF0000' //red
     *     opacity: 0.5
     * });
 *
 * Closing the overlay:
 *
 * $.overlay.close();
 *
 * @type {Object}
 */
;(function ($) {
    'use strict';

    var $overlay = $('<div>', {
            'class': 'js--overlay'
        }).appendTo('body'),

        isOpen = false,

        openClass = 'is--open',

        closableClass = 'is--closable',

        events = ['click', 'touchstart', 'MSPointerDown'].join('.overlay') + '.overlay',

        /**
         *
         * {
         *     // Whether or not the overlay should be closable by click.
         *     closeOnClick: {Boolean},
         *
         *     // Function that gets called every time the user clicks on the overlay.
         *     onClick: {Function},
         *
         *     // Function that gets called only when the overlay is closable and the user clicks on it.
         *     onClose: {Function}
         * }
         *
         * @param options
         */
        openOverlay = function (options) {
            if (isOpen) {
                updateOverlay(options);
                return;
            }
            isOpen = true;

            $overlay.addClass(openClass);

            if (options && options.closeOnClick !== false) {
                $overlay.addClass(closableClass);
            }

            $overlay.on(events, $.proxy(onOverlayClick, this, options));
        },

        closeOverlay = function () {
            if (!isOpen) {
                return;
            }
            isOpen = false;

            $overlay.removeClass(openClass + ' ' + closableClass);

            $overlay.off(events);
        },

        onOverlayClick = function (options) {
            if (options) {
                if (typeof options.onClick === 'function') {
                    options.onClick.call($overlay);
                }

                if (options.closeOnClick === false) {
                    return;
                }

                if (typeof options.onClose === 'function' && options.onClose.call($overlay) === false) {
                    return;
                }
            }

            closeOverlay();
        },

        updateOverlay = function (options) {
            $overlay.toggleClass(closableClass, options.closeOnClick !== false);

            $overlay.off(events);

            $overlay.on(events, $.proxy(onOverlayClick, this, options));
        };

    $overlay.on('mousewheel DOMMouseScroll', function (event) {
        event.preventDefault();
    });

    $.overlay = {
        open: openOverlay,

        close: closeOverlay,

        isOpen: function () {
            return isOpen;
        },

        getElement: function () {
            return $overlay;
        }
    };

})(jQuery);
;(function($) {
    'use strict';

    $.plugin('swFormPolyfill', {

        alias: 'formPolyfill',

        defaults: {
            eventType: 'click'
        },

        /**
         * Initializes the plugin and sets up all necessary event listeners.
         */
        init: function() {
            var me = this;

            // If the browser supports the feature, we don't need to take action
            if(!me.isIE()) {
                return false;
            }

            me.applyDataAttributes();
            me.registerEvents();
        },

        /**
         * Registers all necessary event listener.
         */
        registerEvents: function() {
            var me = this;

            me._on(me.$el, me.opts.eventType, $.proxy(me.onSubmitForm, this));

            $.publish('plugin/swFormPolyfill/onRegisterEvents', me);
        },

        /**
         * Checks if we're dealing with the internet explorer.
         *
         * @private
         * @returns {Boolean} Truthy, if the browser supports it, otherwise false.
         */
        isIE: function() {
            var myNav = navigator.userAgent.toLowerCase();
            return myNav.indexOf('msie') != -1 || !!navigator.userAgent.match(/Trident.*rv[ :]*11\./);
        },

        /**
         * Event listener method which is necessary when the browser
         * doesn't support the ```form``` attribute on ```input``` elements.
         * @returns {boolean}
         */
        onSubmitForm: function() {
            var me = this,
                id = '#' + me.$el.attr('form'),
                $form = $(id);

            // We can't find the form
            if(!$form.length) {
                return false;
            }

            $form.submit();

            $.publish('plugin/swFormPolyfill/onSubmitForm', [me, $form]);
        },

        /**
         * Destroy method of the plugin.
         * Removes attached event listener.
         */
        destroy: function() {
            var me = this;

            me._destroy();
        }
    });
})(jQuery);;(function ($) {
    'use strict';

    /**
     * Shopware Menu Scroller Plugin
     */
    $.plugin('swOffcanvasButton', {

        alias: 'offcanvasButton',

        /**
         * Default options for the offcanvas button plugin
         *
         * @public
         * @property defaults
         * @type {Object}
         */
        defaults: {

            /**
             * CSS selector for the element listing
             *
             * @type {String}
             */
            pluginClass: 'js--off-canvas-button',

            /**
             * CSS class which will be added to the wrapper / this.$el
             *
             * @type {String}
             */
            contentSelector: '.offcanvas--content',

            /**
             * Selector for the closing button
             *
             * @type {String}
             */
            closeButtonSelector: '.close--off-canvas',

            /**
             * CSS class which will be added to the listing
             *
             * @type {Boolean}
             */
            fullscreen: true
        },

        /**
         * Default plugin initialisation function.
         * Sets all needed properties, creates the slider template
         * and registers all needed event listeners.
         *
         * @public
         * @method init
         */
        init: function () {
            var me = this,
                $el = me.$el,
                opts = me.opts;

            me.applyDataAttributes();

            $el.addClass(opts.pluginClass);

            $el.swOffcanvasMenu({
                'direction': 'fromRight',
                'offCanvasSelector': $el.find(opts.contentSelector),
                'fullscreen': opts.fullscreen,
                'closeButtonSelector': opts.closeButtonSelector
            });
        },

        /**
         * Removed all listeners, classes and values from this plugin.
         *
         * @public
         * @method destroy
         */
        destroy: function () {
            var me = this,
                $el = me.$el,
                plugin = $el.data('plugin_swOffcanvasMenu');

            if (plugin) {
                plugin.destroy();
            }

            $el.removeClass(me.opts.pluginClass);

            me._destroy();
        }
    });
}(jQuery));;(function ($, Modernizr) {
    'use strict';

    /**
     * Sub Category Navigation plugin
     *
     * The plugin provides an category slider inside the off canvas menu. The categories and sub categories
     * could be fetched by ajax calls and uses a CSS3 `transitions` to slide in or out. The main sidebar will not
     * be overwritten. The categories slider plugin uses two overlays to interact.
     *
     * @example usage
     * ```
     *    <div data-subcategory-nav="true"
     *      data-mainCategoryId="{$Shop->get('parentID')}"
     *      data-categoryId="{$sCategoryContent.id}"
     *      data-fetchUrl="{url module=widgets controller=listing action=getCategory categoryId={$sCategoryContent.id}}"></div>
     *
     *    $('*[data-subcategory-nav="true"]').swSubCategoryNav();
     * ```
     */
    $.plugin('swSubCategoryNav', {

        alias: 'subCategoryNav',

        defaults: {

            /**
             * Whether or not the plugin is enabled or not.
             *
             * @property enabled
             * @type {Boolean}
             */
            'enabled': true,

            /**
             * Event name(s) used for registering the events to navigate
             *
             * @property eventName
             * @type {String}
             */
            'eventName': 'click',

            /**
             * Selector for a single navigation
             *
             * @property sidebarCategorySelector
             * @type {String}
             */
            'sidebarCategorySelector': '.sidebar--navigation',

            /**
             * Selector for the back buttons.
             *
             * @property backwardsSelector
             * @type {String}
             */
            'backwardsSelector': '.link--go-back',

            /**
             * Selector for the forward buttons.
             *
             * @property forwardSelector
             * @type {String}
             */
            'forwardsSelector': '.link--go-forward',

            /**
             * Selector for the main menu buttons.
             *
             * @property mainMenuSelector
             * @type {String}
             */
            'mainMenuSelector': '.link--go-main',

            /**
             * Selector for the wrapper of the sidebar navigation.
             * This wrapper will contain the main menu.
             *
             * @property sidebarWrapperSelector
             * @type {String}
             */
            'sidebarWrapperSelector': '.sidebar--categories-wrapper',

            /**
             * ID of the root category ID of the current shop.
             * This is used to determine if the user switches to the main
             * menu when clicking on a back button.
             *
             * @property mainCategoryId
             * @type {Number}
             */
            'mainCategoryId': null,

            /**
             * Category ID of the current page.
             * When this and fetchUrl is set, the correct slide will be loaded.
             *
             * @property categoryId
             * @type {Number}
             */
            'categoryId': null,

            /**
             * URL to get the current navigation slide.
             * When this and categoryID is set, the correct slide will be loaded.
             *
             * @property fetchUrl
             * @type {String}
             */
            'fetchUrl': '',

            /**
             * Selector for a overlay navigation slide.
             *
             * @property overlaySelector
             * @type {String}
             */
            'overlaySelector': '.offcanvas--overlay',

            /**
             * Selector for the whole sidebar itself.
             *
             * @property sidebarMainSelector
             * @type {String}
             */
            'sidebarMainSelector': '.sidebar-main',

            /**
             * Selector for the mobile navigation.
             *
             * @property mobileNavigationSelector
             * @type {String}
             */
            'mobileNavigationSelector': '.navigation--smartphone',

            /**
             * Loading class for the ajax calls.
             * This class will be used for a loading item.
             * This item will be appended to the clicked navigation item.
             *
             * @property loadingClass
             * @type {String}
             */
            'loadingClass': 'sidebar--ajax-loader',

            /**
             * Class that determines the existing slides to remove
             * them if no longer needed.
             *
             * @property backSlideClass
             * @type {String}
             */
            'backSlideClass': 'background',

            /**
             * Selector for the right navigation icon.
             * This icon will be hidden and replaced with the loading icon.
             *
             * @property iconRightSelector
             * @type {String}
             */
            'iconRightSelector': '.is--icon-right',

            /**
             * Class that will be appended to the main sidebar to
             * disable the scrolling functionality.
             *
             * @property disableScrollingClass
             * @type {String}
             */
            'disableScrollingClass': 'is--inactive',

            /**
             * Speed of the slide animations in milliseconds.
             *
             * @property animationSpeedIn
             * @type {Number}
             */
            'animationSpeedIn': 450,

            /**
             * Speed of the slide animations in milliseconds.
             *
             * @property animationSpeedOut
             * @type {Number}
             */
            'animationSpeedOut': 300,

            /**
             * Easing function for sliding a slide into the viewport.
             *
             * @property easingIn
             * @type {String}
             */
            'easingIn': 'cubic-bezier(.3,0,.15,1)',

            /**
             * Easing function for sliding a slide out of the viewport.
             *
             * @property easingOut
             * @type {String}
             */
            'easingOut': 'cubic-bezier(.02, .01, .47, 1)',

            /**
             * The animation easing used when transitions are not supported.
             *
             * @property easingFallback
             * @type {String}
             */
            'easingFallback': 'swing'
        },

        /**
         * Default plugin initialisation function.
         * Handle all logic and events for the category slider
         *
         * @public
         * @method init
         */
        init: function () {
            var me = this,
                transitionSupport = Modernizr.csstransitions,
                opts;

            // Overwrite plugin configuration with user configuration
            me.applyDataAttributes();

            opts = me.opts;

            // return, if no main category available
            if (!opts.enabled || !opts.mainCategoryId) {
                return;
            }

            /**
             * Reference of the main sidebar element.
             *
             * @private
             * @property $sidebar
             * @type {jQuery}
             */
            me.$sidebar = $(opts.sidebarMainSelector);

            /**
             * Wrapper of the navigation lists in the main navigation.
             *
             * @private
             * @property $sidebarWrapper
             * @type {jQuery}
             */
            me.$sidebarWrapper = $(opts.sidebarWrapperSelector);

            /**
             * Wrapper of the offcanvas animation
             *
             * @private
             * @property $navigation
             * @type {jQuery}
             */
            me.$navigation = $(opts.mobileNavigationSelector);
            me.$navigation.show();

            /**
             * Loading icon element that will be appended to the
             * clicked element on loading.
             *
             * @private
             * @property $loadingIcon
             * @type {jQuery}
             */
            me.$loadingIcon = $('<div>', {
                'class': opts.loadingClass
            });

            /**
             * Function used in jQuery based on CSS transition support.
             *
             * @private
             * @property slideFunction
             * @type {String}
             */
            me.slideFunction = transitionSupport ? 'transition' : 'animate';

            /**
             * Easing used for the slide in.
             *
             * @private
             * @property easingEffectIn
             * @type {String}
             */
            me.easingEffectIn = transitionSupport ? opts.easingIn : opts.easingFallback;

            /**
             * Easing used for the slide out.
             *
             * @private
             * @property easingEffectOut
             * @type {String}
             */
            me.easingEffectOut = transitionSupport ? opts.easingOut : opts.easingFallback;

            /**
             * Flag to determine whether or not a slide is in a current
             * animation or if an ajax call is still loading.
             *
             * @private
             * @property inProgress
             * @type {Boolean}
             */
            me.inProgress = false;

            // remove sub level unordered lists
            $(opts.sidebarCategorySelector + ' ul').not('.navigation--level-high').css('display', 'none');

            me.addEventListener();

            // fetch menu by category id if actual category is not the main category
            if (!opts.categoryId || !opts.fetchUrl || (opts.mainCategoryId == opts.categoryId)) {
                return;
            }

            $.get(opts.fetchUrl, function (template) {

                me.$sidebarWrapper.css('display', 'none');

                // me.$sidebar.addClass(opts.disableScrollingClass).append(template);

                // add background class
                $(opts.overlaySelector).addClass(opts.backSlideClass);
            });
        },

        /**
         * Registers all needed event listeners.
         *
         * @public
         * @method addEventListener
         */
        addEventListener: function () {
            var me = this,
                opts = me.opts,
                $sidebar = me.$sidebar,
                eventName = opts.eventName;

            $sidebar.on(me.getEventName(eventName), opts.backwardsSelector, $.proxy(me.onClickBackButton, me));

            $sidebar.on(me.getEventName(eventName), opts.forwardsSelector, $.proxy(me.onClickForwardButton, me));

            $sidebar.on(me.getEventName(eventName), opts.mainMenuSelector, $.proxy(me.onClickMainMenuButton, me));

            $.publish('plugin/swSubCategoryNav/onRegisterEvents', me);
        },

        /**
         * Called when clicked on a back button.
         * Loads the overlay based on the parent id and fetch url.
         * When the no fetch url is available or the parent id is the same
         * as the main menu one, the slideToMainMenu function will be called.
         *
         * @public
         * @method onClickBackButton
         * @param {Object} event
         */
        onClickBackButton: function (event) {
            event.preventDefault();

            var me = this,
                $target = $(event.target),
                url = $target.attr('href'),
                parentId = ~~$target.attr('data-parentId');

            if (me.inProgress) {
                return;
            }

            me.inProgress = true;

            $.publish('plugin/swSubCategoryNav/onClickBackButton', [me, event]);

            // decide if there is a parent group or main sidebar
            if (!url || parentId === me.opts.mainCategoryId) {
                me.slideToMainMenu();
                return;
            }

            me.loadTemplate(url, me.slideOut, $target);
        },

        /**
         * Called when clicked on a forward button.
         * Loads the overlay based on the category id and fetch url.
         *
         * @public
         * @method onClickForwardButton
         * @param {Object} event
         */
        onClickForwardButton: function (event) {
            event.preventDefault();

            var me = this,
                $target = $(event.currentTarget),
                url = $target.attr('data-fetchUrl');

            if (me.inProgress) {
                return;
            }

            me.inProgress = true;

            $.publish('plugin/swSubCategoryNav/onClickForwardButton', [me, event]);

            // Disable scrolling on main menu
            //me.$sidebar.addClass(me.opts.disableScrollingClass);

            me.loadTemplate(url, me.slideIn, $target);
        },

        /**
         * Called when clicked on a main menu button.
         * Calls the slideToMainMenu function.
         *
         * @public
         * @method onClickMainMenuButton
         * @param {Object} event
         */
        onClickMainMenuButton: function (event) {
            event.preventDefault();

            var me = this;

            if (me.inProgress) {
                return;
            }

            me.inProgress = true;

            $.publish('plugin/swSubCategoryNav/onClickMainMenuButton', [me, event]);

            me.slideToMainMenu();
        },

        /**
         * loads a template via ajax call
         *
         * @public
         * @method loadTemplate
         * @param {String} url
         * @param {Function} callback
         * @param {jQuery} $loadingTarget
         */
        loadTemplate: function (url, callback, $loadingTarget) {
            var me = this;

            $.publish('plugin/swSubCategoryNav/onLoadTemplateBefore', me);

            if (!$loadingTarget) {
                $.get(url, function (template) {
                    $.publish('plugin/swSubCategoryNav/onLoadTemplate', me);

                    callback.call(me, template)
                });
                return;
            }

            $loadingTarget.find(me.opts.iconRightSelector).fadeOut('fast');

            $loadingTarget.append(me.$loadingIcon);

            me.$loadingIcon.fadeIn();

            $.get(url, function (template) {
                me.$loadingIcon.hide();

                $.publish('plugin/swSubCategoryNav/onLoadTemplate', me);

                callback.call(me, template);
            });
        },

        /**
         * Sliding out the first level overlay and removes the slided overlay.
         *
         * @public
         * @method slideOut
         * @param {String} template
         */
        slideOut: function (template) {
            var me = this,
                opts = me.opts,
                $overlays,
                $slide;

            $.publish('plugin/swSubCategoryNav/onSlideOutBefore', me);

            me.$sidebar.append(template);

            // get all overlays
            $overlays = $(opts.overlaySelector);

            // flip background classes
            $overlays.toggleClass(opts.backSlideClass);

            $slide = $overlays.not('.' + opts.backSlideClass);

            $slide[me.slideFunction]({ 'left': 280 }, opts.animationSpeedOut, me.easingEffectOut, function () {
                $slide.remove();

                me.inProgress = false;

                $.publish('plugin/swSubCategoryNav/onSlideOut', me);
            });
        },

        /**
         * Slides a given template/slide into the viewport of the sidebar.
         * After the sliding animation is finished,
         * the previous slide will be removed.
         *
         * @public
         * @method slideIn
         * @param {String} template
         */
        slideIn: function (template) {
            var me = this,
                opts = me.opts,
                $overlays,
                $slide,
                $el;

            $.publish('plugin/swSubCategoryNav/onSlideInBefore', me);

            // hide main menu
            me.$sidebar.scrollTop(0);

            me.$sidebar.append(template);

            $overlays = $(opts.overlaySelector);

            $slide = $overlays.not('.' + opts.backSlideClass).css({
                'left': 280,
                'display': 'block'
            });

            $slide[me.slideFunction]({ 'left': 0 }, opts.animationSpeedIn, me.easingEffectIn, function () {
                // remove background layer
                $overlays.each(function (i, el) {
                    $el = $(el);

                    if ($el.hasClass(opts.backSlideClass)) {
                        $el.remove();
                    }
                });

                $slide.addClass(opts.backSlideClass);

                // hide main menu
                me.$sidebarWrapper.css('display', 'none');

                me.$navigation.hide().show(0);

                $slide.addClass(opts.backSlideClass);

                me.inProgress = false;

                $.publish('plugin/swSubCategoryNav/onSlideIn', me);
            });
        },

        /**
         * Slides all overlays out of the viewport and removes them.
         * That way the main menu will be uncovered.
         *
         * @public
         * @method slideToMainMenu
         */
        slideToMainMenu: function () {
            var me = this,
                opts = me.opts,
                $overlay = $(opts.overlaySelector);

            $.publish('plugin/swSubCategoryNav/onSlideToMainMenuBefore', me);

            // make the main menu visible
            me.$sidebarWrapper.css('display', 'block');

            // fade in arrow icons
            me.$sidebarWrapper.find(me.opts.iconRightSelector).fadeIn('slow');

            $overlay[me.slideFunction]({ 'left': 280 }, opts.animationSpeedOut, me.easingEffectOut, function () {
                $overlay.remove();

                // enable scrolling on main menu
                //me.$sidebar.removeClass(opts.disableScrollingClass);

                me.inProgress = false;

                $.publish('plugin/swSubCategoryNav/onSlideToMainMenu', me);
            });
        },

        /**
         * Destroys the plugin by removing all events and references
         * of the plugin.
         * Resets all changed CSS properties to default.
         *
         * @public
         * @method destroy
         */
        destroy: function () {
            var me = this,
                opts = me.opts,
                $sidebar = me.$sidebar,
                $sidebarWrapper = me.$sidebarWrapper;

            if ($sidebar) {
                $sidebar.off(me.getEventName(opts.eventName), '**');
            }

            me.$navigation.hide();

            // make category children visible
            $(opts.sidebarCategorySelector + ' ul').not('.navigation--level-high').css('display', 'block');

            // force sidebar to be shown
            if ($sidebarWrapper) {
                me.$sidebarWrapper.css('display', 'block');
            }

            // clear overlay
            $(opts.overlaySelector).remove();

            me._destroy();
        }
    });
}(jQuery, Modernizr));;(function($, window, undefined) {
    'use strict';

    /**
     * Simple plugin which replaces the button with a loading indicator to prevent multiple clicks on the
     * same button.
     *
     * @example
     * <button type="submit" data-preloader-button="true">Submit me!</button>
     */
    $.plugin('swPreloaderButton', {

        alias: 'preloaderButton',

        /** @object Default configuration */
        defaults: {

            /** @string CSS class for the loading indicator */
            loaderCls: 'js--loading',

            /** @boolean Truthy, if the button is attached to a form which needs to be valid before submitting  */
            checkFormIsValid: true
        },

        /**
         * Initializes the plugin
         */
        init: function() {
            var me = this;

            me.applyDataAttributes();

            me.opts.checkFormIsValid = me.checkForValiditySupport();

            me._on(me.$el, 'click', $.proxy(me.onShowPreloader, me));

            $.publish('plugin/swPreloaderButton/onRegisterEvents', me);
        },

        /**
         * Checks if the browser supports HTML5 form validation
         * on form elements.
         *
         * @returns {boolean}
         */
        checkForValiditySupport: function() {
            var me = this,
                element = document.createElement('input'),
                valid = (typeof element.validity === 'object');

            $.publish('plugin/swPreloaderButton/onCheckForValiditySupport', [me, valid]);

            return valid;
        },

        /**
         * Event handler method which will be called when the user clicks on the
         * associated element.
         */
        onShowPreloader: function() {
            var me = this;

            if(me.opts.checkFormIsValid) {
                var $form = $('#' + me.$el.attr('form')) || me.$el.parents('form');

                if (!$form.length || !$form[0].checkValidity()) {
                    return;
                }
            }

            //... we have to use a timeout, otherwise the element will not be inserted in the page.
            window.setTimeout(function() {
                me.$el.html(me.$el.text() + '<div class="' + me.opts.loaderCls + '"></div>').attr('disabled', 'disabled');

                $.publish('plugin/swPreloaderButton/onShowPreloader', me);
            }, 25);
        }
    });
})(jQuery, window);;(function ($) {

    /**
     * Shopware Offcanvas HTML Panel
     *
     * This plugin displays the given content inside an off canvas menu
     *
     * @example
     *
     * HTML Structure
     *
     * <div class="teaser--text-long">Off Canvas Content</div>
     * <div class="teaser--text-short is--hidden">
     *      Short Description with the
     *
     *      <a href="" class="text--offcanvas-link">Off canvas trigger element</a>
     * </div>
     *
     * <div class="teaser--text-offcanvas is--hidden">
     *      <a href="" class="close--off-canvas"><i class="icon--arrow-left"></i> Close window</a>
     * </div>
     *
     * <div class="offcanvas--content">This content will be displayed inside the off canvas menu.</div>
     *
     *
     * jQuery Initializing for all viewports
     *
     * StateManager.addPlugin('.category--teaser', 'swOffcanvasHtmlPanel');
     *
     * jQuery Initializing for some states
     *
     * StateManager.addPlugin('.category--teaser', 'swOffcanvasHtmlPanel', ['xs', 's']);
     *
     */
    $.plugin('swOffcanvasHtmlPanel', {

        alias: 'offcanvasHtmlPanel',

        defaults: {
            /**
             * Offcanvas Content which will be displayed in the off canvas menu
             *
             * @property offcanvasContent
             * @type {String}
             */
            'offcanvasContent': '.teaser--text-long',

            /**
             * Short description which will be displayed if viewport match plugin configuration
             *
             * @property shortDescription
             * @type {String}
             */
            'shortDescription': '.teaser--text-short',

            /**
             * Off canvas trigger element
             *
             * @property offcanvasTrigger
             * @type {String}
             */
            'offcanvasTrigger': '.text--offcanvas-link',

            /**
             * off canvas container
             *
             * @property offCanvasSelector
             * @type {String}
             */
            'offCanvasSelector': '.teaser--text-offcanvas',

            /**
             * off canvas close button
             *
             * @property offCanvasCloseSelector
             * @type {String}
             */
            'offCanvasCloseSelector': '.close--off-canvas',

            /**
             * off canvas direction type
             * @type {String} (fromLeft | fromRight)
             */
            'offCanvasDirection': 'fromRight',

            /**
             * hidden class for hiding long description
             *
             * @property hiddenCls
             * @type {String}
             */
            'hiddenCls': 'is--hidden'
        },

        /**
         * Initializes the plugin and register its events
         *
         * @public
         * @method init
         */
        init: function () {
            var me = this,
                opts = me.opts,
                $el = me.$el;

            me.applyDataAttributes();

            me._$shortText = $el.find(opts.shortDescription).removeClass(opts.hiddenCls);
            me._$longText = $el.find(opts.offcanvasContent).addClass(opts.hiddenCls);
            me._$offCanvas = $el.find(opts.offCanvasSelector).removeClass(opts.hiddenCls);
            me._$offcanvasTrigger = $el.find(opts.offcanvasTrigger);

            me._$offcanvasTrigger.swOffcanvasMenu({
                'offCanvasSelector': opts.offCanvasSelector,
                'closeButtonSelector': opts.offCanvasCloseSelector,
                'direction': opts.offCanvasDirection
            });
        },

        /**
         * This method removes all plugin specific classes
         * and removes all registered events
         *
         * @public
         * @method destroy
         */
        destroy: function () {
            var me = this,
                hiddenClass = me.opts.hiddenCls,
                plugin = me._$offcanvasTrigger.data('plugin_swOffcanvasMenu');

            // redesign content to old structure
            me._$longText.removeClass(hiddenClass);
            me._$shortText.addClass(hiddenClass);

            // hide offcanvas menu
            me._$offCanvas.addClass(hiddenClass);

            if (plugin) {
                plugin.destroy();
            }

            me._destroy();
        }
    });
})(jQuery);(function($, window) {

    window.StateManager.init([
        {
            state: 'xs',
            enter: 0,
            exit: 29.9375   // 479px
        },
        {
            state: 's',
            enter: 30,      // 480px
            exit: 47.9375   // 767px
        },
        {
            state: 'm',
            enter: 48,      // 768px
            exit: 63.9375   // 1023px
        },
        {
            state: 'l',
            enter: 64,      // 1024px
            exit: 78.6875   // 1259px
        },
        {
            state: 'xl',
            enter: 78.75,   // 1260px
            exit: 322.5     // 5160px
        }
    ]);

    window.StateManager

        // OffCanvas menu
        .addPlugin('*[data-offcanvas="true"]', 'swOffcanvasMenu', ['xs', 's'])

        // Search field
        .addPlugin('*[data-search="true"]', 'swSearch')

        // Scroll plugin
        //.addPlugin('.btn--password, .btn--email', 'swScrollAnimate', ['xs', 's', 'm'])

        // Collapse panel
        .addPlugin('.btn--password, .btn--email', 'swCollapsePanel', ['l', 'xl'])

        // Slide panel
        .addPlugin('.footer--column .column--headline', 'swCollapsePanel', {
            contentSiblingSelector: '.column--content'
        }, ['xs', 's'])

        // Collapse panel
        .addPlugin('#new-customer-action', 'swCollapsePanel', ['xs', 's'])

        // Image slider
        //.addPlugin('*[data-image-slider="true"]', 'swImageSlider', { touchControls: true })

        // Image zoom
        //.addPlugin('.product--image-zoom', 'swImageZoom', 'xl')

        // Collapse panel
        //.addPlugin('.blog-filter--trigger', 'swCollapsePanel', ['xs', 's', 'm', 'l'])

        // Off canvas HTML Panel
        .addPlugin('.category--teaser .hero--text', 'swOffcanvasHtmlPanel', ['xs', 's'])

        // Default product slider
        //.addPlugin('*[data-product-slider="true"]', 'swProductSlider')

        // Product slider for premium items
        //.addPlugin('.premium-product--content', 'swProductSlider')


        .addPlugin('input[type="submit"][form], button[form]', 'swFormPolyfill')
        .addPlugin('select:not([data-no-fancy-select="true"])', 'swSelectboxReplacement')

        // Deferred loading of the captcha
        //.addPlugin('div.captcha--placeholder[data-src]', 'swCaptcha')
       // .addPlugin('*[data-modalbox="true"]', 'swModalbox')

        .addPlugin('*[data-subcategory-nav="true"]', 'swSubCategoryNav', ['xs', 's']);

    $(function($) {

        // Lightbox auto trigger
        $('*[data-lightbox="true"]').on('click.lightbox', function (event) {
            var $el = $(this),
                target = ($el.is('[data-lightbox-target]')) ? $el.attr('data-lightbox-target') : $el.attr('href');

            event.preventDefault();

            if (target.length) {
                $.lightbox.open(target);
            }
        });

        // Start up the placeholder polyfill, see ```jquery.ie-fixes.js```
        $('input, textarea').placeholder();

        $('.add-voucher--checkbox').on('change', function (event) {
            var method = (!$(this).is(':checked')) ? 'addClass' : 'removeClass';
            event.preventDefault();

            $('.add-voucher--panel')[method]('is--hidden');
        });

        $('.table--shipping-costs-trigger').on('click touchstart', function (event) {

            event.preventDefault();

            var $this = $(this),
                $next = $this.next(),
                method = ($next.hasClass('is--hidden')) ? 'removeClass' : 'addClass';

            $next[method]('is--hidden');
        });

        // Ajax cart amount display
        function cartRefresh() {
            var ajaxCartRefresh = window.controller.ajax_cart_refresh,
                $cartAmount = $('.cart--amount'),
                $cartQuantity = $('.cart--quantity');

            if (!ajaxCartRefresh.length) {
                return;
            }

            $.ajax({
                'url': ajaxCartRefresh,
                'dataType': 'jsonp',
                'success': function (response) {
                    var cart = JSON.parse(response);

                    if(!cart.amount || !cart.quantity) {
                        return;
                    }

                    $cartAmount.html(cart.amount);
                    $cartQuantity.html(cart.quantity).removeClass('is--hidden');

                    if(cart.quantity == 0) {
                        $cartQuantity.addClass('is--hidden');
                    }
                }
            });
        }

        //$.subscribe('plugin/swAddArticle/onAddArticle', cartRefresh);
        //$.subscribe('plugin/swCollapseCart/onRemoveArticleFinished', cartRefresh);

        //$('.is--ctl-detail .reset--configuration').on('click', function () {
         //   $.loadingIndicator.open({
         //       closeOnClick: false
         ///   });
       // });
    });
})(jQuery, window);