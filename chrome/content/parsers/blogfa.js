
Exporter.Services.BLOGFA = {
	archive			: "archive.aspx",
	domain			: "blogfa.com",
	reCheckComments		: true,
	commentsPerPage		: 50,
	/*
	 * str getWeblogFromPanel()
	 * required:		yes
	 * description:
	 *	returns weblog URL when we are in adminPanel
	 */
	getWeblogFromPanel	: function(){
		var wLink = Exporter.main.getElementById("linkBlog");
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
		var archives = Exporter.doXPath(Exporter.main, "//body/div/div[3]//a");
		var result = [];
		for(var i in archives){
			var url = archives[i].getAttribute("href");
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
		if(Exporter.step==0)
			Exporter.Services.BLOGFA.getIntTimeZone();
		var posts = Exporter.doXPath(Exporter.main, "//body/div/div[3]/div[@class='post']");
		var result = [];
		for(var i in posts){
			var post = posts[i];
			var links = post.getElementsByTagName("a");
			var divs = post.getElementsByTagName("div");
			var postLinks = divs[1].getElementsByTagName("a");
			var tempObj = {};
			tempObj.id = parseInt(links[0].getAttribute("name"));
			tempObj.title = links[1].innerHTML;
			tempObj.link = links[1].getAttribute("href");
			if(tempObj.link.indexOf("http://")!=0)
				tempObj.link = Exporter.weblog+tempObj.link;
			tempObj.commentsCount = Exporter.Services.BLOGFA.getCommentsCountByScript(tempObj.id);
			if(postLinks.length>0 && postLinks[postLinks.length-1].hasAttribute("href") && postLinks[postLinks.length-1].getAttribute("href").indexOf("http://")!=0)
				postLinks[postLinks.length-1].setAttribute("href", Exporter.weblog+postLinks[postLinks.length-1].getAttribute("href"));
			tempObj.extended = (postLinks.length>0 && postLinks[postLinks.length-1].getAttribute("href")==tempObj.link && postLinks[postLinks.length-1].innerHTML=="\u0627\u062f\u0627\u0645\u0647 \u0645\u0637\u0644\u0628")?true:false;
			if(tempObj.extended==true)
				postLinks[postLinks.length-1].parentNode.removeChild(postLinks[postLinks.length-1]);
			Exporter.removeNode(divs[1]);
			tempObj.content = divs[1].innerHTML;
			var date = divs[divs.length-1].getElementsByTagName('span')[0].innerHTML.split("/"); // YYYY/MM/DD
			date = Exporter.clear0(date);
			var time = divs[divs.length-1].innerHTML.match(/nbsp;([0-9]+:[0-9]+)&nbsp;/)[1].split(":"); // HH:SS
			time = Exporter.clear0(time);
			tempObj.date = new Date(parseInt(date[0]), parseInt(date[1])-1, parseInt(date[2]), parseInt(time[0]), parseInt(time[1]), 0);
			tempObj.category = ""; // default blogfa template doesn't support category
			try{
				tempObj.author = divs[divs.length-1].innerHTML.match(/\u062a\u0648\u0633\u0637&nbsp;([^&]+)&nbsp;/)[1];
			} catch(e){
				tempObj.author = null;
			}
			tempObj.media = [];
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
	 * int getCommentsCountByScript((int)id)
	 * required:		no
	 * description:
	 *	returns number of comments on each post
	 *	the post is defined by given id
	 *	(used in parsePosts)
	 */
	getCommentsCountByScript	: function(id){
		if(Exporter.commentsScript == null){
			var Scripts = Exporter.doXPath(Exporter.main, "//script");
			for(var i=0; i<Scripts.length; i++)
				if(Scripts[i].innerHTML.indexOf("BlogComments")>-1){
					Exporter.commentsScript = Scripts[i].innerHTML.substring(Scripts[i].innerHTML.indexOf("=[")+2, Scripts[i].innerHTML.indexOf("];")).split(',');
					break;
				}
		}
		var intCount = false;
		for (var i=0; i<Exporter.commentsScript.length; i+=2)
			if(Exporter.commentsScript[i]==id){
				intCount=Exporter.commentsScript[i+1];
				break;
			}
		return intCount;
	},
	/*
	 * int getCommentsCountByScript()
	 * required:		if reCheckComments==true
	 * description:
	 *	returns number of comments when we are in comments page
	 */
	getCommentsCountByPage		: function(){
		var firstTD = Exporter.doXPath(Exporter.main, "//tr[1]/td[1]");
		if(firstTD.length==0)
			return false;
		firstTD = firstTD[0].innerHTML;
		var count = firstTD.match(/- ([0-9]+) \u0646\u0638\u0631/);
		if(!count)
			return false;
		return parseInt(count[1]);
	},
	/*
	 * int getIntTimeZone()
	 * required:		no
	 * description:
	 *	returns the timeZone that uses in blogfa
	 */
	getIntTimeZone			: function(){
		var commentsFunc = null;
		var Scripts = Exporter.doXPath(Exporter.main, "//script");
		for(var i=0; i<Scripts.length; i++)
			if(Scripts[i].innerHTML.indexOf("intTimeZone=")>-1){
				commentsFunc = Scripts[i].innerHTML;
				break;
			}
	
		if(commentsFunc==null){
			Exporter.intTimeZone = 12642;
			return;
		}
		Exporter.intTimeZone = parseInt(commentsFunc.match(/intTimeZone=([0-9]+);/)[1]);
	},
	/*
	 * str postToCommentURL((INT) lngPostid)
	 * reqired:		yes
	 * desciption:
	 *	returns comments url that related to given lngPostid
	 */
	postToCommentURL		: function(lngPostid){
		return ""+Exporter.weblog+"comments/?blogid=" +Exporter.strBlogId + "&postid=" + lngPostid + "&timezone=" + Exporter.intTimeZone;
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
		var comments = Exporter.doXPath(Exporter.main, "//body/div[2]/div[@class='box']");
		var result = [];
		for(var i in comments){
			var comment = comments[i];
			var divs = comment.getElementsByTagName("div");
			var tempObj = {};
			tempObj.author = divs[1].textContent;
			var time = Exporter.p2e(divs[2].innerHTML).match(/([0-9]+):([0-9]+)$/);
			time = Exporter.clear0(time);
			var dateTMP = Exporter.p2e(divs[2].innerHTML).match(/([0-9]+) ([^0-9]+) ([0-9]+)/);
			dateTMP = Exporter.clear0(dateTMP);
			var gDate = Exporter.JalaliDate.jalaliToGregorian(parseInt(dateTMP[3]), Exporter.strToMonth(dateTMP[2]), parseInt(dateTMP[1]));
			tempObj.date = new Date(gDate[0], gDate[1]-1, gDate[2], time[1], time[2], 0);
			try {
				tempObj.url = comment.getElementsByTagName("a")[0].getAttribute('href');
			} catch(e) {}
			tempObj.content = divs[4].innerHTML;
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
		// blogfa comments paging begin with 1 so we should add our result with 1
		var p = Math.ceil(Exporter.WXR.getCommentsCount(Exporter.comments[key][0])/Exporter.Services.BLOGFA.commentsPerPage)+1;
		return "&p="+p;
	},
	/*
	 * str idToPostURL((int)postID)
	 * required:		yes
	 * description:
	 *	returns the url of a post by given id
	 *	(will use for extended posts)
	 */
	idToPostURL			: function(pID){
		return Exporter.weblog+"post-"+pID+".aspx";
	}
};
