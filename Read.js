(function(window) {
	"use strict";

	/*jshint multistr: true */
	var ele = '<div class="__read" style="display:block;">\
			<div class="__read_bar progrecss">\
				<div class="__read_position">\
					<div class="__read_indicator"></div>\
					<div class="__read_display"></div>\
					<div class="__read_before"></div>\
					<div class="__read_letter"></div>\
					<div class="__read_loading">\
						<div class="__read_loading_rotation">&#8635;</div>\
					</div>\
				</div>\
				<div class="__read_config"></div>\
				<div class="__read_restart"></div>\
				<div class="__read_close_read"></div>\
			</div>\
			<div class="__read_settings">\
			</div>\
		</div>';

	var defaultOptions = {
		wpm: 300,
		slowStartCount: 5,
		sentenceDelay: 2.5,
		otherPuncDelay: 1.5,
		shortWordDelay: 1.3,
		longWordDelay: 1.4,
		numericDelay: 2.0
	};

	var whiteSpace = /[\n\r\s]/;

	function extend(ogObj, newObj) {
		var returnObj = {}
		for( var s in ogObj ) {
			returnObj[s] = ogObj[s];
		}
		for( s in newObj){
			returnObj[s] = newObj[s];
		}
		return returnObj;
	}

	function proxy(fn, context) {
		//return function(fn, context) {
			return function() {
				fn.apply(context, arguments);
			};
		//};
	}

	function Read ( options ) { //element, wpm ) {

		// Defaults
		this._parentElement = null;
		this._barElement = null;
		this._settingsElement = null;
		this._configElement = null;
		this._restartElement = null;
		this._displayElement = null;
		this._closeElement = null;

		this._speedElement = null;
		this._speedSliderElement = null;

		this._slowStartElement = null;
		this._slowStartCount = null;
		this._slowStartSliderElement = null;

		this._sentenceDelayElement = null;
		this._sentenceDelaySliderElement = null;

		this._puncDelayElement = null;
		this._puncDelaySliderElement = null;

		this._shortWordDelayElement = null;
		this._shortWordDelaySliderElement = null;

		this._longWordDelayElement = null;
		this._longWordDelaySliderElement = null;

		this._numericDelayElement = null;
		this._numericDelaySliderElement = null;

		this._currentWord = null;
		this._delay = 75;
		this._timer = null;
		this._isPlaying = false;
		this._isEnded = false;

		this._options = extend( defaultOptions, options );

		Read.enforceSingleton(this);

		// Configured
		//this.setWPM(this._options.wpm);
		this.setElement();
	}

	Read.enforceSingleton = function (inst) {
		if (Read.instance) {
			Read.instance.destroy();
			Read.instance = null;
		}
		Read.instance = inst;
	};

	var p = Read.prototype;

	p._display = function () {
		this._currentWord = this._block.getWord();
		if (this._currentWord) {
			this._showWord();

			var time = this._delay;

			if ( this._currentWord.hasPeriod ) time *= this._options.sentenceDelay;
			if ( this._currentWord.hasOtherPunc ) time *= this._options.otherPuncDelay;
			if ( this._currentWord.isShort ) time *= this._options.shortWordDelay;
			if ( this._currentWord.isLong ) time *= this._options.longWordDelay;
			if ( this._currentWord.isNumeric ) time *= this._options.numericDelay;

			this._slowStartCount = (this._slowStartCount - 1 ) || 1;
			time = time * this._slowStartCount;
				console.log(time);
			this._timer = setTimeout(proxy(this._next, this),time);
		} else {
			this.clearDisplay();
			this._isPlaying = false;
			this._isEnded = true;
			this._barElement.attr('data-progrecss', 100 );
		}
	};

	p._showWord = function () {
		if (this._displayElement) {
			var word = this._currentWord.val;

			var before = word.substr(0, this._currentWord.index);
			var letter = word.substr(this._currentWord.index, 1);

			// fake elements
			//var $before = this._options.element.find('.__read_before').html(before).css("opacity","0");
			//var $letter = this._options.element.find('.__read_letter').html(letter).css("opacity","0");
			var calc = 0;//$before.textWidth() + Math.round( $letter.textWidth() / 2 );

			if (!this._currentWord.val.match(whiteSpace)){
				this._displayElement.innerHTML = word;
			}
		} else {
			this._displayElement = document.getElementsByClassName('__read_display')[0];
			//this._showWord();
		}

		if (this._options.element && this._block) {
			this._barElement.attr('data-progrecss', parseInt(this._block.getProgress() * 100, 10) );
		}
	};

	p.toggleSettings = function () {
		if (this._configElement.hasClass('active')) {
			this.hideSettings();
		} else {
			this.showSettings();
		}
	};

	p.showSettings = function () {
		this._options.element.addClass('open');
		this._configElement.addClass('active');
	};

	p.hideSettings = function () {
		this._options.element.removeClass('open');
		this._configElement.removeClass('active');
	};

	p.destroy = function () {
		p.pause();
		this._speedElement.off ( "blur" );
		this._speedElement.off ( "keydown" );
		this._parentElement.find('.__read').remove();
		this._parentElement.css( "padding-top", "-=50" );
		this._configElement.off();
		this._restartElement.off();
		this._displayElement.off();
		this._closeElement.off();
		this._speedElement.off();
	};

	p.setText = function (val) {
		if (val) {
			this.pause();
			this.restart();
			this._block = new ReadBlock(val);
			this._currentWord = this._block.getWord();
		}
	};

	p._next = function() {
		console.log('moo');
		this._block.next();
		this._display();
	};

	p.setElement = function (val) {
		var e = document.createElement('div');
		e.innerHTML = ele;
		document.body.insertBefore(e, document.body.childNodes[0]);

		setTimeout( function() {
			this._displayElement = document.getElementsByClassName('__read_display')[0];
		}, 1000);

		//this._displayElement.on ( "touchend click", $.proxy(this.playPauseToggle, this) );

	};

	p.playPauseToggle = function () {
		if (this._isPlaying) {
			this.pause();
		} else {
			this.play();
		}
	};

	p.play = function () {
		if (this._block) {
			if (this._isEnded) {
				return;
			}
			if (this._options.slowStartCount) {
				this._slowStartCount = this._options.slowStartCount;
			}
			this._display();
			this._isPlaying = true;
		}
	};

	p.pause = function () {
		clearTimeout(this._timer);
		this._isPlaying = false;
	};

	p.restart = function () {
		if (this._block) {
			if (!this._isEnded) {
				this.pause();
			}
			if (this._options.slowStartCount) {
				this._slowStartCount = this._options.slowStartCount;
			}
			this._block.restart();
			this._currentWord = this._block.getWord();
			this._isEnded = false;
			this.play();
		}
	};

	window.Read = Read;

}(window) );
