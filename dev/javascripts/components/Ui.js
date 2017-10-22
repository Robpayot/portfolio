class Ui {

	constructor() {

		this.el = document.querySelector('.ui');

		this.ui = {
			intro: this.el.querySelector('.ui-intro'),
			content: this.el.querySelector('.ui-content'),
			// overlay: this.el.querySelector('.overlay')
		};

	}
}

export default new Ui();
