class Ui {

	constructor() {

		this.el = document.querySelector('.ui');

		this.ui = {
			title1: this.el.querySelector('.title--1'),
			title2: this.el.querySelector('.title--2'),
			button: this.el.querySelector('.start'),
			overlay: this.el.querySelector('.ui-intro__overlay'),
			intro: this.el.querySelector('.ui-intro'),
			content: this.el.querySelector('.ui-content')
		};

	}
}

export default new Ui();
