/*!
 *  jQuery Redin PlugIn
 *  Responsive disabled input: Emulates mouse and keyboard events on disabled inputs.
 *  @author Rillke, 2014
 */


( function( $ ) {
	var mutationDOMEventSupported = ( function() {
		var p, retval;

		window.JqRedinMutationObserver = window.MutationObserver || window.WebKitMutationObserver;
		if ( JqRedinMutationObserver ) return true;

		function returnTrue() {
			retval = true;
		}

		try {
			p = document.createElement( 'p' );
			if ( p.attachEvent ) {
				p.attachEvent( 'onDOMAttrModified', returnTrue );
				p.attachEvent( 'onpropertychange', returnTrue );
			} else if ( p.addEventListener ) {
				p.addEventListener( 'DOMAttrModified', returnTrue, false );
			} else {
				// Not supported
				return false;
			}
			p.setAttribute( 'id', 'jqredin-testid' );
		} catch ( ex ) { /* browser is upset that we dared to ask him whether they would support */ }
		return !!retval;
	}() );

	$.widget( 'rillke.responsiveInput', {
		/**
		 *  Creates the widget
		 */
		_create: function() {
			var widget = this,
				$el = widget.element,
				elPosition = $el.css( 'position' ),
				$container = $( '<div>' )
				.addClass( 'jqredin-container' ),
				$overlay = $el.clone()
				.addClass( 'jqredin-overlay' )
				.removeAttr( 'disabled' ),
				positionProps = [ 'height', 'width', 'z-index', 'top', 'left', 'right', 'bottom', 'transform', 'transform-origin' ],
				events = 'click dblclick focusout hover mousedown mouseenter mouseleave mousemove mouseout mouseover mouseup mousewheel keydown keypress keyup input dragenter';

			if ( !$el.attr( 'disabled' ) ) {
				return;
			}
			// Store additional elements for later use
			widget.$container = $container;
			widget.$overlay = $overlay;

			// Copy position CSS from input to container
			$container.copyCSS( $el, positionProps );
			if ( elPosition !== 'static' ) {
				$container.css( 'position', elPosition );
			}

			// Reset position CSS on input and its clone (the overlay)
			$el.addClass( 'jqredin-input' );
			$overlay.addClass( 'jqredin-input' );

			// Run the DOM modification required
			$container.insertBefore( $el );
			$el.appendTo( $container );
			$overlay.appendTo( $container );

			// Bind events
			$overlay.on( events, function( event /* , arguments */ ) {
				$el.triggerHandler
					.apply( $el, [ event.type, Array.prototype.slice.call( arguments ) ] );
			} );

			/**
			 *  Processes a DOM mutation event
			 */
			function processEvent() {
				if ( !$el.attr( 'disabled' ) ) {
					$el.responsiveInput( 'destroy' );
				}
			}
			widget.processEvent = processEvent;

			/**
			 *  Last resort: Poll for changes
			 */
			function poll() {
				widget.pollId = setInterval( processEvent, 1000 );
			}

			// Self-destroy as soon as input is enabled
			if ( JqRedinMutationObserver ) {
				// DOM4
				widget.observer = new JqRedinMutationObserver( processEvent );
				// configuration of the observer
				var config = {
					attributes: true,
					attributeFilter: [ 'disabled' ]
				};

				// pass in the target node, as well as the observer options
				widget.observer.observe( $el[ 0 ], config );
			} else if ( $el[ 0 ].attachEvent && mutationDOMEventSupported ) {
				// IEs < 9
				$el[ 0 ].attachEvent( 'onpropertychange', processEvent );
				$el[ 0 ].attachEvent( 'onDOMAttrModified', processEvent );
			} else if ( $el[ 0 ].addEventListener && mutationDOMEventSupported ) {
				// IE 9 and most other major browsers
				$el[ 0 ].addEventListener( 'DOMAttrModified', processEvent, false );
			} else {
				poll();
			}
		},

		/**
		 *  Restores the previous state of the element
		 *  the widget function was called onto
		 */
		_destroy: function() {
			var widget = this,
				$el = widget.element,
				$container = widget.$container,
				observer = widget.observer,
				pollId = widget.pollId;

			if ( !widget.$container ) return;

			// Reset to original CSS
			$el.removeClass( 'jqredin-input' );
			$el.insertBefore( $container );
			$container.remove();

			// De-register or trash event listeners
			if ( observer ) {
				observer.disconnect();
				widget.observer = null;
			}
			if ( pollId && $.isNumeric( pollId ) ) {
				clearInterval( pollId );
			}
			if ( $el[ 0 ].attachEvent && mutationDOMEventSupported ) {
				// IEs < 9
				$el[ 0 ].detachEvent( 'onpropertychange', widget.processEvent );
				$el[ 0 ].detachEvent( 'onDOMAttrModified', widget.processEvent );
			} else if ( mutationDOMEventSupported ) {
				// IE 9 and most other major browsers
				$el[ 0 ].removeEventListener( 'DOMAttrModified', widget.processEvent, false );
			}
		}
	} );
}( jQuery ) );
