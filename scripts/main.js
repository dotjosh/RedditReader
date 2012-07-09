angular.module('redditReader', ["communication"])
    .run(function() {

    });
	
angular.module('communication', [])
	.factory('serviceBus', function() {
		return function(){};
	})
	.filter('utcdatetolocal', function() {
      return function(input) {
        var d = new Date(0);
		d.setUTCSeconds(input);
		return d;
      }
    })
	.filter('timeago', function() {
		return function(input) {
			return $.timeago(input);
		}
	});	
	
var Subreddit_List_Controller = function($rootScope, $scope, $http, serviceBus) {
	$scope.loading = true;
	$http
		.get("http://www.reddit.com/reddits/popular.json")
		.success(function(data){
			$scope.loading = false;
			$scope.subreddits = data.data.children;
		});
		
	$scope.load = function(item){
		$rootScope.$emit("select_subreddit", item.data.url);
	}
}

var Post_List_Controller = function($rootScope, $scope, $http) {
$scope.loading = false;
	$rootScope.$on("select_subreddit", function(ev, url){;
		$scope.loading = true;
		$http
			.get("http://www.reddit.com" + url + ".json")
			.success(function(data){
				$http.get("http://www.reddit.com/r/" + data.data.children[0].data.subreddit + "/about.json")
					.success(function(data2){
						angular.forEach(data.data.children, function(val, key){
							if(val.data.thumbnail == "self" || val.data.thumbnail == "default")
							{
								val.data.thumbnail = data2.data.header_img;
							}
							
							if(val.data.url.substr(-3) === "jpg"
								|| val.data.url.substr(-4) === "jpeg"
								|| val.data.url.substr(-3) === "gif"
								|| val.data.url.substr(-3) === "png"
							)
							{
								val.data.full_image = val.data.url;
							}
							else if(val.data.url.length >= 16 && val.data.url.substr(0, 16) === "http://imgur.com"){
								val.data.full_image = val.data.url.replace("imgur.com", "i.imgur.com") + ".jpg"
							}
							
							if(val.data.url.indexOf("youtube.com") > -1){
								var video_id = val.data.url.split('v=')[1];
								var ampersandPosition = video_id.indexOf('&');
								if(ampersandPosition != -1) {
								  video_id = video_id.substring(0, ampersandPosition);
								}
								val.data.embedded_video_url = "http://www.youtube.com/embed/" + video_id + "?autoplay=1&origin=" + document.URL;
							}
							val.data.subredditheader = data2.data.header_img;
						});
						$scope.loading = false;
						$scope.posts = data.data.children;
					});
				});	
			
	});
	
	var lastPostClicked = null;
	$scope.load = function(post) {
		$rootScope.$emit("select_post", post.data);
		if(lastPostClicked != null) {
			lastPostClicked.klass = "";
		}
		post.klass = "selected";
		lastPostClicked = post;
	};
}

var Post_Controller = function($rootScope, $scope, $http) {
	$scope.initialState = true;
	$rootScope.$on("select_post", function(ev, post){
		$scope.comments = null;
		$scope.loading = true;
		$scope.post = post;
		$scope.post.selftext_html = $('<div/>').html($scope.post.selftext_html).text();		
		$http
			.get("http://www.reddit.com" + post.permalink + ".json")
			.success(function(data){
				$scope.loading = false;
				$scope.post = data[0].data.children[0].data;
				$scope.post.subredditheader = post.subredditheader;
				$scope.post.thumbnail = post.thumbnail;
				$scope.post.embedded_video_url = post.embedded_video_url;
				$scope.post.full_image = post.full_image;
				$scope.post.selftext_html = $('<div/>').html($scope.post.selftext_html).text();
				$scope.comments = data[1].data.children;
				console.log($scope.post);
			});	
			
	});	
	
	$rootScope.$on("select_subreddit", function(ev, url){
		$scope.initialState = true;
		$scope.comments = null;
		$scope.loading = false;
		$scope.post = null;		
	});
}

//new Date(0).setUTCSeconds()

//http://www.reddit.com/reddits.json