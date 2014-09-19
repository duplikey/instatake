var images = new Array();
var account = null;
var limit = 300;
//your account name here
var account = null;

console.log = function() {};

function parse(id) {
	if (!checkUsername(account)) {
		alert('Username not valid!');
		return false;
	}

	url = 	'https://query.yahooapis.com/v1/public/yql?q=' +
			'select%20*%20from%20json%20where%20url%3D%22http%3A%2F%2Finstagram.com%2F' +
			account + '%2Fmedia%3Fmax_id%3D' + id + '%22&format=json';

	$.ajax({
		url : url,
		type : 'GET',
		dataType : 'json',
		success : function(json) {
			if (json.query.results == null) {
				alert('Account not found! Do you think it\'s valid? Please try in few minutes ;)');
				return false;
			}
			else if (json.query.results.json.items == undefined) {
				alert('Account private or empty!');
				return false;
			}

			var items = json.query.results.json.items;
			var more = json.query.results.json.more_available;

			for (i in items)
				images.push(items[i]['images']['standard_resolution']['url']);

			if(more == 'true' && images.length < limit)
				parse(items[19]['id'], images);
			else 
				createZip();
		},
		error : function(xhr, txt, e) {
			alert('Something went wrong! Probably too many requests. Please try in few minutes ;)');
			return false;
		}
	});
}

function checkUsername(username) {
	var regex = /^[a-zA-Z0-9._]{1,30}$/;
	return regex.test(username);
}

function getProxy() {
	//put some cors proxies here
	var proxies = [];

	return proxies[Math.floor((Math.random() * proxies.length))];
}

function deferredAddZip(url, filename, zip) {
	var deferred = $.Deferred();

	$.ajax({
		url : url,
		type : 'GET',
		beforeSend : function(xhr) {
			xhr.overrideMimeType('text/plain; charset=x-user-defined');
		},
		success : function(data) {
			zip.file(filename, data, {binary : true});
			deferred.resolve();
			console.log('file added: ' + filename);
		},
		error : function(xhr, txt, e) {
			deferred.reject();
			console.log('error adding: ' + filename);
		}
	});

	return deferred;
}

function createZip() {
	var zip = new JSZip();
	var deferreds = new Array();

	$.each(images, function(i, image) {
		var img = image.substring(7);
		var url = getProxy() + img;
		var filename = (i + 1) + '.jpg';

		deferreds.push(deferredAddZip(url, filename, zip));
	});

	$.when.apply($, deferreds).always(function() {
		var blob = zip.generate({type :'blob'});

		saveAs(blob, account + '.zip');

		images = new Array();
	});
}