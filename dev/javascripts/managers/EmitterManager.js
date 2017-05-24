import Emitter from 'component-emitter';

class EmitterManager {

	constructor() {

		Emitter(this);
	}
}

export default new EmitterManager();
