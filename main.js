(function(){

	var r; // Read Object
	var readOptions = {
		"wpm": 300,
		"slowStartCount": 5,
		"sentenceDelay": 2.5,
		"otherPuncDelay": 1.5,
		"shortWordDelay": 1.3,
		"longWordDelay": 1.4
	};

	function transferComplete() {
		if (this.status === 200) {
			playReadContent(this.responseText);
		} else {
			var text = '';
			var elements = $('p, li, h1, h2, h3, h4, h5, h6, span, pre');
			elements.each(function(index, element) {
				element = $(element);
				var elementText = element
					.clone()
					.children('sup')
					.remove()
					.end()
					.text()
					.trim();
				if (elementText.length >= 60)
					if (!(element.tagName === 'LI' && elementText.includes('    ')))
						text += " " + elementText;
			});
			playReadContent(text);
		}
	}
	function transferFailed(e) {
		console.log('Caught Exception: ' + e.description);
	}

	chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
		switch (request.functiontoInvoke) {
			case "readSelectedText":
				playReadContent( request.selectedText );
				break;
			case "readFullPage":
				try {
					var httpRequest = new XMLHttpRequest();
					httpRequest.open('GET', 'https://readparser.herokuapp.com/?url=' + document.URL, true);
					httpRequest.addEventListener("load", transferComplete);
					httpRequest.addEventListener("error", transferFailed);
					httpRequest.send();

				} catch(e) {
					transferFailed(e);
				}
				break;
			default:
				break;
		}
	});

	// $(document).on( 'blur', '.__read .__read_speed', function () {
	// 	var val = Math.min( 15000, Math.max( 0, parseInt(this.value,10)));
	// 	setReadOptions( {"wpm": val} );
	// });

	// $(document).on( 'blur', '.__read .__read_slow_start', function () {
	// 	var val = Math.min( 5, Math.max( 1, parseInt(this.value,10)));
	// 	setReadOptions( {"slowStartCount": val} );
	// });

	// $(document).on( 'blur', '.__read .__read_sentence_delay', function () {
	// 	var val = Math.min( 5, Math.max( 0, Number(this.value)));
	// 	setReadOptions( {"sentenceDelay": val} );
	// });

	// $(document).on( 'blur', '.__read .__read_punc_delay', function () {
	// 	var val = Math.min( 5, Math.max( 0, Number(this.value)));
	// 	setReadOptions( {"otherPuncDelay": val} );
	// });

	// $(document).on( 'blur', '.__read .__read_short_word_delay', function () {
	// 	var val = Math.min( 5, Math.max( 0, Number(this.value)));
	// 	setReadOptions( {"shortWordDelay": val} );
	// });

	// $(document).on( 'blur', '.__read .__read_long_word_delay', function () {
	// 	var val = Math.min( 5, Math.max( 0, Number(this.value)));
	// 	setReadOptions( {"longWordDelay": val} );
	// });

	function setReadOptions ( myOptions ) {
		readOptions = extend( readOptions, myOptions );
		chrome.storage.sync.clear(function () {
			chrome.storage.sync.set(readOptions, function() {
				//console.log('[READ] set:', readOptions);
			});
		});
	}

	function playReadContent ( text ) {
		chrome.storage.sync.get(null, function ( myOptions ) {
			readOptions = extend( readOptions, myOptions );
			r = new Read ( readOptions );
			r.setText(text);
			r.play();
		});
	}

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

})();
