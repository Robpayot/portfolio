
var preloader = (function(){


	var queue = [],
		loaded = 0,
		percentageLoaded,

		completeSignal = Object.create(signal, {slots:{value:[], writable:true, enumerable:true, configurable:true}}),
		progressSignal = Object.create(signal, {slots:{value:[], writable:true, enumerable:true, configurable:true}}),

		addItemToQueue = function(item){
			item.percentLoaded = 0;
			queue.push(item);
		},

		addItemsToQueue = function(items){
			var itemsLength = items.length,
				i = 0,
				currentItem;

			for(; i < itemsLength; i++){
				currentItem = items[i];
				addItemToQueue(currentItem);
			}
		},

		getItemById = function(id){
			var ql = queue.length,
				i = 0,
				currentItem;

			for(; i < ql; i++){
				currentItem = queue[i];
				if(currentItem.id === id){
					return currentItem;
				}
			}

			return;
		},

		addLoadedData = function(id, data){
			var item = getItemById(id);

			item.data = data;

			loaded++;
			if(loaded === queue.length){
				completeSignal.emit();
			}
		},

		updateQueueProgress = function(){
			
			var ql = queue.length,
				i = 0,
				currentItem,
				tempPerLoaded = 0;

			for(; i < ql; i++){
				currentItem = queue[i];
				tempPerLoaded += currentItem.percentLoaded;
			}

			percentageLoaded = tempPerLoaded;
			progressSignal.emit(percentageLoaded);

		},

		loadStartHandler = function(e){
			
		},

		progressHandler = function(e){
			var loaded = 0,
				total = 0;
			if(e.lengthComputable){
				loaded = e.loaded;
				total = e.total;
			}
			getItemById(e.target.item.id).percentLoaded = Math.round((loaded/total))/queue.length;
			updateQueueProgress();
		},

		loadHandler = function(e){
			
		},

		loadEndHandler = function(e){
			var img,
				audio,
				json,
				id = e.target.item.id,
				data = e.target.response;

			if(e.target.status === 200){
				if(e.target.type === "img"){
					img = new Image();
					img.onload = function(e){
						// cleanup
						window.URL.revokeObjectURL(e.target.src);
						addLoadedData(id, img);
					};
					img.src = window.URL.createObjectURL(data);
				}else if(e.target.type === "audio"){
					audio = new Audio();
					audio.src = e.target.item.src;
					addLoadedData(id, audio);
				}else if(e.target.type === "json"){
					json = JSON.parse(data);
					addLoadedData(id, json);
				}else{
					addLoadedData(id, data);
				}
			}
				
		},

		errorHandler = function(e){
			
		},

		abortHandler = function(e){

		},

		load = function(item){
			
			var xhr = new XMLHttpRequest();
			xhr.item = item;

			xhr.addEventListener('loadstart', loadStartHandler, false);
			xhr.addEventListener('progress', progressHandler, false);
			xhr.addEventListener('load', loadHandler, false);
			xhr.addEventListener('loadend', loadEndHandler, false);
			xhr.addEventListener('error', errorHandler, false);
			xhr.addEventListener('abort', abortHandler, false);
			 
			xhr.open('GET', item.src);
			if(item.src.indexOf('.png') != -1 || item.src.indexOf('.jpg') != -1 || item.src.indexOf('.gif') != -1){
				xhr.type = 'img';
				xhr.responseType = 'blob';
			}else if(item.src.indexOf('.mp3') != -1 || item.src.indexOf('.ogg') != -1){
				xhr.type = 'audio';
				xhr.responseType = 'arraybuffer';
			}else if(item.src.indexOf('.json')){
				xhr.type = 'json';
			}
			xhr.send();

		},

		_end;

	return {
		add: function(item){
			var it = typeof item;

			if (it === 'object') {
				if (item) {
					if (item instanceof Array) {
						addItemsToQueue(item);
					}else{
						addItemToQueue(item);
					}
				}
			}
		},
		start: function(){
			var ql = queue.length,
				i = 0,
				currentItem;

			for(; i < ql; i++){
				currentItem = queue[i];
				load(currentItem);
			}
		},
		get: function(id){
			return getItemById(id).data;
		},
		completeSignal: completeSignal,
		progressSignal: progressSignal
	};

}());