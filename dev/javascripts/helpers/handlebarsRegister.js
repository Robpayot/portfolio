import Handlebars from 'handlebars';
import { Device } from './Device';

Handlebars.registerHelper('math', (lvalue, operator, rvalue, options) => {
	lvalue = parseFloat(lvalue);
	rvalue = parseFloat(rvalue);

	return {
		'+': lvalue + rvalue,
		'-': lvalue - rvalue,
		'*': lvalue * rvalue,
		'/': lvalue / rvalue,
		'%': lvalue % rvalue
	}[operator];
});


Handlebars.registerHelper('isvideo', (string, options) => {

	if (/.mp4$/.test(string) === true) {
		return options.fn(this);
	} else {
		return options.inverse(this);
	}
});

Handlebars.registerHelper('islow', (options) => {

	if (Device.touch === true) {
		return options.fn(this);
	} else {
		return options.inverse(this);
	}
});


