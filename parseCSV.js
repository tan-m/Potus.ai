var fs = require('fs');
var csv = require('fast-csv');


var map = new Object(); // or var map = {};
function get(k) {
    return map[k];
}

fs.createReadStream('Donald_Trump.csv')
	.pipe(csv())
	.on('data', function(data) {
		console.log(data);
		for (var i = 0; i < data.length; i++) {
   			var list = get(data[0]);
   			if (list) {
   				list.push(data[i]);
   			} else {
   				list = [data[i]]
   				map[data[0]] = list;
   			}
		}
	})
	.on('end', function(data) {
		console.log('Read finished');
	});
	
	
