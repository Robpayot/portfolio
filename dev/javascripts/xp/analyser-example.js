/*
	Johan Karlsson (DonKarlssonSan)
	
	Read my blog post about Web Audio API:
	http://codepen.io/DonKarlssonSan/blog/fun-with-web-audio-api
*/
(function() {
		var AudioContext;
		var audio;
		var audioContext;
		var source;
		var analyser;

		var canvas = document.getElementById("theCanvas");
		var canvasContext = canvas.getContext("2d");
		var dataArray;
		var analyserMethod = "getByteTimeDomainData";
		var slider = document.getElementById("slider");
		var streamUrl;
		var isIdle = true;

		var canvasWidth = canvas.width;
		var canvasHeight = canvas.height;

		function initAudio(streamUrl) {
				AudioContext = window.AudioContext || window.webkitAudioContext;
				audio = new Audio();
				audio.crossOrigin = "anonymous";
				audioContext = new AudioContext();
				source = audioContext.createMediaElementSource(audio);
				source.connect(audioContext.destination);
				analyser = audioContext.createAnalyser();
				source.connect(analyser);
		};

		function get(url, callback) {
				var request = new XMLHttpRequest();
				request.onreadystatechange = function() {
						if (request.readyState === 4 && request.status === 200) {
								callback(request.responseText);
						}
				}

				request.open("GET", url, true);
				request.send(null);
		}

		var clientParameter = "client_id=3b2585ef4a5eff04935abe84aad5f3f3"

		// Basing everything on the track's permalink URL. That is what the user knows.
		// Makes it possible to use the text box for pasting any track URL.
		// The Outsider is a friend of mine. 
		// The majority of his tracks are on Mixcloud:
		// https://www.mixcloud.com/outsider_music/
		var trackPermalinkUrl = "https://soundcloud.com/the-outsider/the-outsider-death-by-melody";

		function findTrack() {
				get("https://api.soundcloud.com/resolve.json?url=" + trackPermalinkUrl + "&" + clientParameter,
						function(response) {
								var trackInfo = JSON.parse(response);
								slider.max = trackInfo.duration / 1000;
								document.getElementById("totalTime").innerHTML = millisecondsToHuman(trackInfo.duration);
								document.getElementById("artistUrl").href = trackInfo.user.permalink_url;
								document.getElementById("artistAvatar").src = trackInfo.user.avatar_url;
								document.getElementById("artistName").innerHTML = trackInfo.user.username;
								document.getElementById("trackUrl").href = trackInfo.permalink_url;
								if (trackInfo.artwork_url) {
										document.getElementById("trackArt").src = trackInfo.artwork_url;
								} else {
										document.getElementById("trackArt").src = "";
								}
								document.getElementById("trackName").innerHTML = trackInfo.title;
								streamUrl = trackInfo.stream_url + "?" + clientParameter;
						}
				);
		};

		function startIdleAnimation() {
				// Makes the sine wave height increase and decrease
				var amplitude = 100;
				// Makes the sine wave move to the left
				var phase = 0;
				var isIncreasing = false;

				function drawIdleAnimation() {
						canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);
						if (isIdle) {
								requestAnimationFrame(drawIdleAnimation);
						}
						canvasContext.beginPath();
						for (var x = 0; x < canvasWidth; x++) {
								canvasContext.lineTo(x, Math.sin((x + phase) / 50) * amplitude + 120);
						}
						canvasContext.stroke();
						phase++;
						if (amplitude > 100) {
								isIncreasing = false;
						} else if (amplitude < 1) {
								isIncreasing = true;
						}

						if (isIncreasing) {
								amplitude++;
						} else {
								amplitude--;
						}
				}

				drawIdleAnimation();
		}

		function startDrawing() {
				// Stop drawing idle animation
				isIdle = false;
				analyser.fftSize = 2048;
				var bufferLength = analyser.frequencyBinCount;
				console.log(bufferLength);
				dataArray = new Uint8Array(bufferLength);
				canvasContext.lineWidth = 1;
				canvasContext.strokeStyle = 'rgba(0, 0, 0, 1)';

				function drawAgain() {
						canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);
						requestAnimationFrame(drawAgain);

						analyser[analyserMethod](dataArray);
						for (var i = 0; i < bufferLength; i++) {
								canvasContext.beginPath();
								canvasContext.moveTo(i, 255);
								canvasContext.lineTo(i, 255 - dataArray[i]);
								canvasContext.closePath();
								canvasContext.stroke();
						}
				}

				drawAgain();
		}

		function startButton_Clicked() {
				audio.src = streamUrl;
				audio.play();
				slider.value = 0;
				// Using four seconds so the user can change the value of
				// the slider. Too short interval will cause the automatic
				// updating to steal the control from the user.
				setInterval(function() {
						slider.value = audio.currentTime;
				}, 4000);

				var currentTime = document.getElementById("currentTime");
				setInterval(function() {
						currentTime.innerHTML = millisecondsToHuman(audio.currentTime * 1000);
				}, 1000);

				startDrawing();
		}

		function jumpTo(here) {
				if (!audio.readyState) return false;
				audio.currentTime = here;
				//}
				//audio.fastSeek(here);
		};

		slider.addEventListener("change", function() {
				jumpTo(this.value);
		});

		function millisecondsToHuman(milliseconds) {
				var date = new Date(null);
				date.setMilliseconds(milliseconds);
				return date.toISOString().substr(11, 8);
		};
		document.getElementById("playButton").addEventListener("click", startButton_Clicked);

		document.getElementById("oscilloscopeButton").addEventListener("click", function() {
				analyserMethod = "getByteTimeDomainData";
				startDrawing();
		});

		document.getElementById("frequencyBarsButton").addEventListener("click", function() {
				analyserMethod = "getByteFrequencyData";
				startDrawing();
		});

		document.getElementById("findButton").addEventListener("click", function() {
				trackPermalinkUrl = document.getElementById("trackUrlSearch").value;
				findTrack();
		});

		startIdleAnimation();
		findTrack();
		initAudio();
})();
