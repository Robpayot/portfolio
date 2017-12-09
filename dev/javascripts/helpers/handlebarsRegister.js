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
