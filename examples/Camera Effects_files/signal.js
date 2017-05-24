var signal = {
	connect: function(){
		this.slots.push(arguments);
	},
	emit: function(){
		var slotsLength = this.slots.length,
			i;
		for(i = 0; i < slotsLength; i++){
			this.slots[i][0].apply(this.slots[i][1], arguments);
		}
	}
};