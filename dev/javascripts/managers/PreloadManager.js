import 'preload-js';
const queue = new window.createjs.LoadQueue(true);
queue.setMaxConnections(60);
queue.maintainScriptOrder = false;

export default queue;
