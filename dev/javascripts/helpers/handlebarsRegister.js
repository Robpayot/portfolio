import Handlebars from 'handlebars';

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


