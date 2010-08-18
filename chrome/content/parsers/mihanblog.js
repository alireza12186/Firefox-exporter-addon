
Exporter.Services.MIHANBLOG = {
	archive			: "post/archive", // http://everplays.mihanblog.com/
	domain			: "mihanblog.com",
	reCheckComments		: false,
	commentsPerPage		: 30,
	/*
	 * str getWeblogFromPanel()
	 * required:		yes
	 * description:
	 *	returns weblog URL when we are in adminPanel
	 */
	getWeblogFromPanel	: function(){
		var wLink = Exporter.doXPath(Exporter.main, "//div[@class='contentDiv']/ul[1]/li[3]/div/a")[0];
		return wLink.getAttribute("href").replace(/[\/]{1}$/, "")+"/"; // make sure that we have fSlash
	},
	/*
	 * boolean belongs()
	 * required:		yes
	 * description:
	 *	check that current url belongs to weblog?
	 */
	belongs			: function(){
		return Exporter.main.location.href.indexOf(Exporter.weblog)==0;
	},
	/*
	 * array(str) parseArchive()
	 * required:		yes
	 * description:
	 *	returns an array of addresses
	 *	that must be parse to get posts
	 */
	parseArchive		: function(){
		var archives = Exporter.doXPath(Exporter.main, "//body/div[@class='CONBG']/div[@class='CON']/div[@class='SC']/div[@class='cb_general']/a");
		var result = [];
		for(var i in archives){
			var url = archives[i].getAttribute("href").replace(/^\//, '');
			if(url.indexOf("http://")!=0)
				url = Exporter.weblog+url;
			result.push(url);
		}
		result.reverse();
		return result;
	},
	/*
	 * array(object) parsePosts
	 * required:		yes
	 * description:
	 *	returns an array of objects
	 *	that each object must has a post
	 *	data.
	 *	object: (int)id, (str)title, (str)link, (str)content, (int)commentsCount, (boolean)extended, (Date)date, (array(str))category
	 */
	parsePosts		: function(){
		var posts = Exporter.doXPath(Exporter.main, "//body/div[@class='CONBG']/div[@class='CON']/div[@class='SC']/div[@class='Post clearfix']");
		var result = [];
		for(var i in posts){
			var post = posts[i];
			if(!post.getAttribute("id") || !post.getAttribute("id").match(/^[0-9]+$/))
				continue;
			var _ads = Exporter.main.getElementById("InPost_MihanblogShopAds");
			if(_ads)
				_ads.parentNode.removeChild(_ads);
			var _tags = post.getElementsByTagName("ul");
			if(_tags.length>1 && _tags[_tags.length-2].className=='clearfix')
				_tags[_tags.length-2].parentNode.removeChild(_tags[_tags.length-2]);
			var links = post.getElementsByTagName("a");
			var divs = post.getElementsByTagName("div");
			var postLinks = divs[3].getElementsByTagName("a");
			var tempObj = {};
			tempObj.id = parseInt(posts[i].id);
			tempObj.title = links[0].innerHTML;
			tempObj.link = links[0].getAttribute("href").replace(/^\//, '');
			if(tempObj.link.indexOf("http://")!=0)
				tempObj.link = Exporter.weblog+tempObj.link;
			tempObj.commentsCount = Exporter.Services.MIHANBLOG.getCommentsCountByScript(tempObj.id);
			if(postLinks.length>0 && postLinks[postLinks.length-1].hasAttribute("href") && postLinks[postLinks.length-1].getAttribute("href").indexOf("http://")!=0)
				postLinks[postLinks.length-1].setAttribute("href", Exporter.weblog+postLinks[postLinks.length-1].getAttribute("href").replace(/^\//, ''));
			tempObj.extended = (postLinks.length>0 && postLinks[postLinks.length-1].getAttribute("href")==tempObj.link)?true:false;
			if(postLinks.length>0)
				Exporter.log('extended post? '+postLinks[postLinks.length-1].getAttribute("href")+'=='+tempObj.link);
			if(tempObj.extended==true)
				postLinks[postLinks.length-1].parentNode.removeChild(postLinks[postLinks.length-1]);
			tempObj.content = divs[3].innerHTML.replace('<p>&nbsp;&nbsp;&nbsp;</p><br>', '');
			var date = divs[0].getElementsByTagName('small')[0].innerHTML.split("/"); // YYYY/MM/DD
			///var time = divs[divs.length-1].innerHTML.match(/nbsp;([0-9]+:[0-9]+)&nbsp;/)[1].split(":"); // HH:SS
			date = Exporter.clear0(date);
			date = Exporter.JalaliDate.jalaliToGregorian(parseInt(date[0]), parseInt(date[1]), parseInt(date[2]));
			tempObj.date = new Date(date[0], date[1]-1, date[2], 0, 0, 0);
			tempObj.category = "";
			tempObj.author = links[1].innerHTML;
			tempObj.media = [];
			var images = divs[3].getElementsByTagName('img');
			for(var jj=0, jjlen=images.length; jj<jjlen; jj++)
				if(images[jj].hasAttribute('src')){
					if(/^http:\/\//.test(images[jj].getAttribute('src')))
						tempObj.media.push(images[jj].getAttribute('src'));
					else if(/^\//.test(images[jj].getAttribute('src')))
						tempObj.media.push(Exporter.main.location.href.match(/http:\/\/[^\/]+/)[0]+images[jj].getAttribute('src'));
					else
						tempObj.media.push(Exporter.main.location.href.replace(/[^\/]+$/,'')+images[jj].getAttribute('src'))
				}
			result.push(tempObj);
		}
		return result;
	},
	/*
	 * int getCommentsCountByScript((int)id)
	 * required:		no
	 * description:
	 *	returns number of comments on each post
	 *	the post is defined by given id
	 *	(used in parsePosts)
	 */
	getCommentsCountByScript	: function(id){
		if(!Exporter.commentsScript)
			Exporter.commentsScript = [];
		if(!Exporter.commentsScript[id]){
			var scripts = Exporter.doXPath(Exporter.main, "//script");
			for(var i in scripts)
				if(/var\scommentCnt/.test(scripts[i].innerHTML)){
					var matches = scripts[i].innerHTML.match(/commentCnt\[(\d+)\]='(\d+)';/mg);
					for(var j in matches){
						var f = matches[j].match(/commentCnt\[(\d+)\]='(\d+)';/);
						Exporter.commentsScript[parseInt(f[1])] = parseInt(f[2]);
					}
					break;
				}
			if(Exporter.commentsScript[id])
				return Exporter.commentsScript[id];
			else
				return 0;
		} else
			return Exporter.commentsScript[id];
	},
	/*
	 * str postToCommentURL((INT) lngPostid)
	 * reqired:		yes
	 * desciption:
	 *	returns comments url that related to given lngPostid
	 */
	postToCommentURL		: function(lngPostid){
		// http://*.mihanblog.com/post/comment/3
		Exporter.log('comment url for '+lngPostid);
		return ""+Exporter.weblog+"post/comment/"+lngPostid;
	},
	/*
	 * array(object) parseComments
	 * required		yes
	 * description:
	 *	returns an array of objects that each object
	 *	contains a comment
	 *	object: [(STR)author, (Date)date, (STR)email, (STR) url, (STR) content]
	 */
	parseComments			: function(){
		var comments = Exporter.doXPath(Exporter.main, "//body/div[@class='comment_list']/div[@class='comment']");
		var result = [];
		for(var i in comments){
			var comment = comments[i];
			var divs = comment.getElementsByTagName("div");
			var tempObj = {};
			tempObj.author = divs[1].innerHTML;
			var tmp = divs[2].innerHTML.split(' ');
			var timeTmp = tmp[1].split(':');
			var dateTmp = tmp[0].split('/');
			timeTmp = Exporter.clear0(timeTmp);
			dateTmp = Exporter.clear0(dateTmp);
			var gDate = Exporter.JalaliDate.jalaliToGregorian(parseInt(dateTmp[0]), parseInt(dateTmp[1]), parseInt(dateTmp[2]));
			tempObj.date = new Date(gDate[0], gDate[1]-1, gDate[2], timeTmp[0], timeTmp[1], 0);
			tempObj.email = "";
			tempObj.url = divs[4].getElementsByTagName("a")[0].getAttribute('href');
			tempObj.content = divs[3].innerHTML;
			if(divs[divs.length-2].getAttribute('class')=='reply')
				tempObj.content += '<br/>'+divs[divs.length-2].innerHTML;
			result.push(tempObj);
		}
		return result;
	},
	/*
	 * int commentsPaging
	 * required		yes
	 * description:
	 *	returns next page query that will be joined to comments url
	 */
	commentsPaging			: function(key){
		// something like "/offset/90" should be added
		var p = (Math.ceil(Exporter.WXR.getCommentsCount(Exporter.comments[key][0])/Exporter.Services.MIHANBLOG.commentsPerPage)+1)*Exporter.Services.MIHANBLOG.commentsPerPage;
		return "/offset/"+p;
	},
	/*
	 * str idToPostURL((int)postID)
	 * required:		yes
	 * description:
	 *	returns the url of a post by given id
	 *	(will use for extended posts)
	 */
	idToPostURL			: function(pID){
		// http://*.mihanblog.com/post/<ID>
		return Exporter.weblog+"post/"+pID;
	}
};
