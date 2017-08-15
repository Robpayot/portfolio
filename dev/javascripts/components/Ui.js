class Ui {

	constructor() {

		this.el = document.querySelector('.ui');

		this.ui = {
			title1: this.el.querySelector('.title--1'),
			title2: this.el.querySelector('.title--2'),
			button: this.el.querySelector('.button'),
			overlay: this.el.querySelector('.ui-intro__overlay')
		};

	}
}

export default new Ui();
