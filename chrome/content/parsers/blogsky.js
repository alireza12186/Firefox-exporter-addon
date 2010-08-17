
Exporter.Services.BLOGSKY = {
	archive			: "",
	domain			: "blogsky.com",
	reCheckComments		: false,
	commentsPerPage		: 9999,
	/*
	 * str getWeblogFromPanel()
	 * required:		yes
	 * description:
	 *	returns weblog URL when we are in adminPanel
	 */
	getWeblogFromPanel	: function(){
		var wLink = Exporter.doXPath(Exporter.main, "//div[@class='weblog']/a")[0];
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
		var archives = Exporter.doXPath(Exporter.main, "//div[@id='sidebar']/div[@class='menu']/select[@onchange]/option");
		// we don't need first option
		archives.shift();
		var result = new Array();
		for(var i in archives){
			var url = archives[i].getAttribute("value");
			if(url.indexOf("http://")!=0)
				url = Exporter.weblog+url.replace(/^[\/]{1}/, "");
			result.push(url);
		}
		//result.reverse();
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
		var posts = Exporter.doXPath(Exporter.main, "//div[@id='main']/div[@class='post']");
		var result = new Array();
		for(var i in posts){
			var post = posts[i];
			var links = post.getElementsByTagName("a");
			var divs = post.getElementsByTagName("div");
			var postLinks = divs[2].getElementsByTagName("a");
			var tempObj = new Object();
			tempObj.id = parseInt(links[0].getAttribute("href").match(/\/post-([0-9]+)\/$/)[1]);
			tempObj.title = links[0].innerHTML;
			tempObj.link = links[0].getAttribute("href");
			if(tempObj.link.indexOf("http://")!=0)
				tempObj.link = Exporter.weblog+tempObj.link.replace(/^[\/]{1}/, "");
			footerLinks = divs[3].getElementsByTagName('a');
			tempObj.commentsCount = (footerLinks.length-1>0 && footerLinks[footerLinks.length-1].hasAttribute('onclick'))?parseInt(footerLinks[footerLinks.length-1].innerHTML.match(/^([0-9]+)/)[1]):0;
			if(postLinks.length>0 && postLinks[postLinks.length-1].hasAttribute("href") && postLinks[postLinks.length-1].getAttribute("href").indexOf("http://")!=0)
				postLinks[postLinks.length-1].setAttribute("href", Exporter.weblog+postLinks[postLinks.length-1].getAttribute("href").replace(/^[\/]{1}/, ""));
			tempObj.extended = (postLinks.length>0 && postLinks[postLinks.length-1].getAttribute("href")==tempObj.link && postLinks[postLinks.length-1].innerHTML==" \u0627\u062f\u0627\u0645\u0647 \u0645\u0637\u0644\u0628 ...")?true:false;
			if(tempObj.extended==true)
				postLinks[postLinks.length-1].parentNode.removeChild(postLinks[postLinks.length-1]);
			Exporter.removeNode(divs[2]);
			tempObj.content = divs[2].innerHTML;
			var date = divs[1].innerHTML.match(/^([0-9]+\/[0-9]+\/[0-9]+)/)[1].split('/'); // YYYY/MM/DD
			date = Exporter.clear0(date);
			date = Exporter.JalaliDate.jalaliToGregorian(parseInt(date[0]), parseInt(date[1]), parseInt(date[2]));
			var time = divs[1].getElementsByTagName('span')[0].innerHTML.match(/([0-9]+:[0-9]+)/)[1].split(":"); // HH:SS
			time = Exporter.clear0(time);
			tempObj.date = new Date(parseInt(date[0]), parseInt(date[1])-1, parseInt(date[2]), parseInt(time[0]), parseInt(time[1]), 0);
			tempObj.category = ""; // we don't need it yet
			tempObj.author = divs[divs.length-2].getElementsByTagName('a')[0].innerHTML;
			tempObj.media = new Array();
			var images = post.getElementsByTagName('img');
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
	 * str postToCommentURL((INT) lngPostid)
	 * reqired:		yes
	 * desciption:
	 *	returns comments url that related to given lngPostid
	 */
	postToCommentURL		: function(lngPostid){
		return ""+Exporter.weblog+"Comments.bs?PostID=" + lngPostid;
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
		var comments = Exporter.doXPath(Exporter.main, "//body/div[@class='comment']//div[@class='left']");
		var result = new Array();
		for(var i in comments){
			var comment = comments[i];
			var divs = comment.getElementsByTagName("div");
			var tempObj = new Object();
			tempObj.author = divs[0].innerHTML;
			var time = divs[1].getElementsByTagName('span')[0].innerHTML.match(/([0-9]+):([0-9]+)$/);
			time = Exporter.clear0(time);
			var dateTMP = divs[1].innerHTML.match(/^([0-9]+)\/([0-9]+)\/([0-9]+)/);
			dateTMP = Exporter.clear0(dateTMP);
			var gDate = Exporter.JalaliDate.jalaliToGregorian(parseInt(dateTMP[1]), parseInt(dateTMP[2]), parseInt(dateTMP[3]));
			tempObj.date = new Date(gDate[0], gDate[1]-1, gDate[2], time[1], time[2], 0);
			// blogsky doesn't show emails any moew
			//tempObj.email = divs[3].getElementsByTagName('a')[1].innerHTML;
			tempObj.url = divs[3].getElementsByTagName('a')[0].getAttribute('href');
			divs[2].removeChild(divs[2].getElementsByTagName('div')[0]);
			if(divs[2].getElementsByTagName('div').length>0)
				divs[2].removeChild(divs[2].getElementsByTagName('div')[0]);
			tempObj.content = divs[2].innerHTML;
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
		// we don't have paging in blogSky
		return "";
	},
	/*
	 * str idToPostURL((int)postID)
	 * required:		yes
	 * description:
	 *	returns the url of a post by given id
	 *	(will use for extended posts)
	 */
	idToPostURL			: function(pID){
		return Exporter.weblog+"?PostID="+pID;
	}
};
