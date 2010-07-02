
Exporter.Services = new Object();
Exporter.JalaliDate = new Object();
Exporter.wSystems = new Array();

Exporter.JalaliDate.g_days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
Exporter.JalaliDate.j_days_in_month = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

Exporter.JalaliDate.jalaliToGregorian = function(j_y, j_m, j_d){
	j_y = parseInt(j_y);
	j_m = parseInt(j_m);
	j_d = parseInt(j_d);
	var jy = j_y-979;
	var jm = j_m-1;
	var jd = j_d-1;

	var j_day_no = 365*jy + parseInt(jy / 33)*8 + parseInt((jy%33+3) / 4);
	for (var i=0; i < jm; ++i) j_day_no += Exporter.JalaliDate.j_days_in_month[i];

	j_day_no += jd;

	var g_day_no = j_day_no+79;

	var gy = 1600 + 400 * parseInt(g_day_no / 146097); // 146097 = 365*400 + 400/4 - 400/100 + 400/400
	g_day_no = g_day_no % 146097;

	var leap = true;
	if (g_day_no >= 36525) // 36525 = 365*100 + 100/4
	{
		g_day_no--;
		gy += 100*parseInt(g_day_no/  36524); // 36524 = 365*100 + 100/4 - 100/100
		g_day_no = g_day_no % 36524;

		if (g_day_no >= 365)
			g_day_no++;
		else
			leap = false;
	}

	gy += 4*parseInt(g_day_no/ 1461); // 1461 = 365*4 + 4/4
	g_day_no %= 1461;

	if (g_day_no >= 366) {
		leap = false;

		g_day_no--;
		gy += parseInt(g_day_no/ 365);
		g_day_no = g_day_no % 365;
	}

	for (var i = 0; g_day_no >= Exporter.JalaliDate.g_days_in_month[i] + (i == 1 && leap); i++)
		g_day_no -= Exporter.JalaliDate.g_days_in_month[i] + (i == 1 && leap);
	var gm = i+1;
	var gd = g_day_no+1;

	return [gy, gm, gd];
};

// blogfa.com
Exporter.wSystems.push({panel:/blogfa\.com\/Desktop\/Default\.aspx/, variable: "BLOGFA"});
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
		var wLink = Exporter.main.getElementById("PanelMenu1_linkBlog");
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
		var result = new Array();
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
		var result = new Array();
		for(var i in posts){
			var post = posts[i];
			var links = post.getElementsByTagName("a");
			var divs = post.getElementsByTagName("div");
			var postLinks = divs[1].getElementsByTagName("a");
			var tempObj = new Object();
			tempObj.id = parseInt(links[0].getAttribute("name"));
			tempObj.title = links[1].innerHTML;
			tempObj.link = links[1].getAttribute("href");
			if(tempObj.link.indexOf("http://")!=0)
				tempObj.link = Exporter.weblog+tempObj.link;
			tempObj.commentsCount = Exporter.Services.BLOGFA.getCommentsCountByScript(tempObj.id);
			if(postLinks.length>0 && postLinks[postLinks.length-1].hasAttribute("href") && postLinks[postLinks.length-1].getAttribute("href").indexOf("http://")!=0)
				postLinks[postLinks.length-1].setAttribute("href", Exporter.weblog+postLinks[postLinks.length-1].getAttribute("href"));
			tempObj.extended = (postLinks.length>0 && postLinks[postLinks.length-1].getAttribute("href")==tempObj.link && postLinks[postLinks.length-1].innerHTML=="ادامه مطلب")?true:false;
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
				tempObj.author = divs[divs.length-1].innerHTML.match(/توسط&nbsp;([^&]+)&nbsp;/)[1];
			} catch(e){
				tempObj.author = null;
			}
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
		var count = firstTD.match(/- ([0-9]+) نظر$/);
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
		var comments = Exporter.doXPath(Exporter.main, "//body/div[1]/div[@class='box']");
		var result = new Array();
		for(var i in comments){
			var comment = comments[i];
			var divs = comment.getElementsByTagName("div");
			var tempObj = new Object();
			tempObj.author = comment.getElementsByTagName("span")[0].innerHTML;
			var time = divs[2].innerHTML.match(/([0-9]+):([0-9]+)$/);
			time = Exporter.clear0(time);
			var dateTMP = divs[2].innerHTML.match(/([0-9]+) ([^0-9]+)([0-9]+)/);
			dateTMP = Exporter.clear0(dateTMP);
			var gDate = Exporter.JalaliDate.jalaliToGregorian(parseInt(dateTMP[3]), Exporter.strToMonth(dateTMP[2]), parseInt(dateTMP[1]));
			tempObj.date = new Date(gDate[0], gDate[1]-1, gDate[2], time[1], time[2], 0);
			var lastDivLinks = divs[divs.length-1].getElementsByTagName("a");
			tempObj.email = "";
			tempObj.url = "";
			if(lastDivLinks.length==2){
				tempObj.email = lastDivLinks[1].getAttribute("href").split(":")[1];
				tempObj.url = lastDivLinks[0].getAttribute("href");
			} else if(lastDivLinks.length==1) {
				if(lastDivLinks[0].getAttribute("href").indexOf("@")>-1)
					tempObj.email = lastDivLinks[0].getAttribute("href").split(":")[1];
				else
					tempObj.url = lastDivLinks[0].getAttribute("href");
			}
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

// persianblog.ir
Exporter.wSystems.push({panel:/persianblog\.ir\/EditBlog\.aspx/, variable: "PERSIANBLOG"});
Exporter.Services.PERSIANBLOG = {
	weblogId			: null,
	idToMainId			: new Array(),
	archive				: "",
	reCheckComments			: false,
	_cc				: null,
	domain				: "persianblog.ir",
	commentsPerPage			: 20,
	getWeblogFromPanel		: function(){
		var wLink = Exporter.doXPath(Exporter.main, "//div[@id='sidebar']//dt/a")[0];
		return 'http://'+wLink.innerHTML.replace(/[\/]{1}$/,"")+".persianblog.ir/";
	},
	belongs				: function(){
		Exporter.log('can find comments.persianblog.ir? '+Exporter.main.location.href.indexOf("http://comments.persianblog.ir/"));
		if(Exporter.main.location.href.indexOf("http://comments.persianblog.ir/")==0){ // chech that this comment page belongs to this blog
			Exporter.log('can find blogID in URI? '+(Exporter.main.location.href.indexOf("?blogID="+Exporter.Services.PERSIANBLOG.weblogId)>-1));
			return Exporter.main.location.href.indexOf("?blogID="+Exporter.Services.PERSIANBLOG.weblogId)>-1;
		} else {
			Exporter.log('can find '+Exporter.weblog+' URI? '+(Exporter.main.location.href.indexOf(Exporter.weblog)==0));
			return Exporter.main.location.href.indexOf(Exporter.weblog)==0;
		}
	},
	parseArchive			: function(){
		httpRequest = new XMLHttpRequest();
		//_PERSIANBLOG = PERSIANBLOG;
		httpRequest.onreadystatechange = function(){
			Exporter.log('Persianblog comment request state: '+httpRequest.readyState);
			if (httpRequest.readyState == 4){
				Exporter.log('Persianblog comment response status: '+httpRequest.status);
				Exporter.log('Persianblog comment response: '+httpRequest.responseText);
				if(httpRequest.status == 200){
					Exporter.Services.PERSIANBLOG.setCC(new String(httpRequest.responseText));
				} else {
					alert("مشکلی در اتصال به پرشین‌بلاگ رخ داد. صفحه را دوباره بارگذاری کنید و در صورت ادامه‌ی مشکل گزارش خطا کنید");
				}
			}
		};
		httpRequest.open('GET', 'http://comments.persianblog.ir/cc.aspx?blogID='+Exporter.Services.PERSIANBLOG.weblogId+'&rnd='+Math.random(), true);
		httpRequest.send(null);
		Exporter.loadPage = false;
		var archives = Exporter.main.getElementById("sidebar").getElementsByTagName('div')[0].getElementsByTagName("a"); //div[@id='sidebar']/div[1]/a");
		Exporter.log('found archives.length: '+archives.length);
		var result = new Array();
		for(var i=2; i<archives.length; i++){
			var url = archives[i].getAttribute("href");
			if(url.indexOf("http://")!=0)
				url = Exporter.weblog+url;
			result.push(url);
		}
		result.reverse();
		return result;
	},
	setCC				: function(scriptStr){
		var temp = scriptStr.match(/_cc=([^;]+)/), i=0;
		temp = temp[1].replace('{','').replace('}','').split(',');
		Exporter.log('setCC temp: '+temp.toString());
		Exporter.Services.PERSIANBLOG._cc = new Object();
		for(i; i<temp.length; i++){
			var xTmp = temp[i].split(':');
			Exporter.Services.PERSIANBLOG._cc[xTmp[0]] = parseInt(xTmp[1]);
		}
		Exporter.log('Exporter.loadPage: '+Exporter.loadPage);
		Exporter.loadPage = true;
	},
	parsePosts			: function(){
		var posts = Exporter.doXPath(Exporter.main, "//body/center/div[1]/div[1]/div");
		var heads = Exporter.doXPath(Exporter.main, "//body/center/div[1]/div[1]/h2/a");
		var result = [];
		for(var i in posts){
			var post = posts[i];
			var tempObj = {};
			tempObj.link = heads[i].getAttribute("href");
			tempObj.id = parseInt(tempObj.link.match(/post\/([0-9]+)/i)[1]);
			tempObj.title = heads[i].innerHTML;
			if(tempObj.link.indexOf("http://")!=0)
				tempObj.link = Exporter.weblog+tempObj.link;
			var divs = post.getElementsByTagName("div");
			//Exporter.log("onclick: "+divs[divs.length-2].getElementsByTagName("a")[0].getAttribute("onclick"));
			Exporter.log('founded divs: '+divs.length);
			//Exporter.log(divs[divs.length-2].innerHTML);
			var temp = divs[divs.length-2].getElementsByTagName("a")[0].getAttribute("onclick").match(/s_comment\(([0-9]+),([0-9]+)\)/);
			Exporter.Services.PERSIANBLOG.idToMainId[tempObj.id] = temp[2];
			if(Exporter.Services.PERSIANBLOG.weblogId == null)
				Exporter.Services.PERSIANBLOG.weblogId = temp[1];
			tempObj.author = divs[divs.length-3].getElementsByTagName('a')[1].innerHTML;
			var temp = divs[divs.length-3].innerHTML.split(";");
			//Exporter.log(PERSIANBLOG.p2e(temp[1]));
			var time = Exporter.Services.PERSIANBLOG.p2e(temp[1]).match(/([0-9]+):([0-9]+)/); // HH:mm
			time = Exporter.clear0(time);
			if(temp[1].indexOf("ب.ظ")>-1)
				time[1] = parseInt(time[1])+12;
			//Exporter.log("Converted Date:"+PERSIANBLOG.p2e(temp[2]));
			var date = Exporter.Services.PERSIANBLOG.p2e(temp[2]).match(/([0-9]+)\/([0-9]+)\/([0-9]+)/); // YYYY/MM/DD
			date = Exporter.clear0(date);
			var gDate = Exporter.JalaliDate.jalaliToGregorian(parseInt(date[1]), parseInt(date[2]), parseInt(date[3]))
			tempObj.date = new Date(gDate[0], gDate[1]-1, gDate[2], parseInt(time[1]), parseInt(time[2]), 0);
			// remove Extra elements
			post.removeChild(divs[divs.length-2]);
			post.removeChild(divs[divs.length-1]);
			var postLinks = post.getElementsByTagName("a");
			tempObj.commentsCount = Exporter.Services.PERSIANBLOG.getCommentsCountByScript(tempObj.id);
			tempObj.extended = (postLinks.length>0 && postLinks[postLinks.length-1].getAttribute("href")==tempObj.link && postLinks[postLinks.length-1].innerHTML==" ادامه مطلب ")?true:false;
			if(tempObj.extended==true)
				// remove last link
				post.removeChild(postLinks[postLinks.length-1]);
			Exporter.removeNode(post);
			tempObj.content = post.innerHTML;
			tempObj.category = ""; // we don't need it now
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
	p2e				: function(str){
		var p = ["٠","۱","٢","۳","٤","٥","٦","٧","۸","٩","۳","۱","۱","٤","۸","٢","٥","٠","۸","٢","۱","۳","٦","٩","٧","٧","٥","۸", "۳"];
		var e = ["0","1","2","3","4","5","6","7","8","9","3","1","1","4","8","2","5","0","8","2","1","3","6","9","7","7","5","8", "3"];
		for(var i=0; i<p.length; i++)
			str = str.replace(p[i], e[i]);
		Exporter.log('p2e convertor: '+str);
		return str;
	},
	getCommentsCountByScript	: function(p){
		if(Exporter.Services.PERSIANBLOG._cc==null)
			Exporter.Services.PERSIANBLOG._cc = gBrowser.selectedBrowser.contentWindow._cc;
		return Exporter.Services.PERSIANBLOG._cc[Exporter.Services.PERSIANBLOG.idToMainId[p]];
	},
	postToCommentURL		: function(pID){
		return "http://comments.persianblog.ir/?blogID="+Exporter.Services.PERSIANBLOG.weblogId+"&postID="+Exporter.Services.PERSIANBLOG.idToMainId[pID]+"&blogName="+Exporter.strBlogId;
	},
	parseComments			: function(){
		var divs = Exporter.doXPath(Exporter.main, "//body/form/div[@class='m']");
		var result = new Array();
		for(var i=1; i<divs.length; i++){ // we don't nedd first div
			var tObj = new Object();
			var header = divs[i].getElementsByTagName("div")[0];
			var spans = header.getElementsByTagName('span');
			tObj.url = "";
			tObj.email = "";
			tObj.author = "";
			var urlLink = header.getElementsByTagName("a");
			if(urlLink.length==1){
				tObj.author = urlLink[0].innerHTML;
				tObj.url = urlLink[0].getAttribute("href");
			} else
				tObj.author = spans[0].innerHTML;
			if(Exporter.debug==true)
				Exporter.log('comment author: '+Exporter.Services.PERSIANBLOG.p2e(spans[0].innerHTML));
			var time = Exporter.Services.PERSIANBLOG.p2e(spans[2].innerHTML).match(/([0-9]+):([0-9]+)/);
			time = Exporter.clear0(time);
			if(spans[2].innerHTML.indexOf("ب.ظ")>-1)
				time[1] = parseInt(time[1])+12;
			if(Exporter.debug==true)
				Exporter.log('converted numbers: '+Exporter.Services.PERSIANBLOG.p2e(spans[2].innerHTML));
			var date = Exporter.Services.PERSIANBLOG.p2e(spans[3].innerHTML).match(/([0-9]+)\s+([^0-9\s]+)\s+([0-9]+)/);
			date = Exporter.clear0(date);
			if(Exporter.debug==true)
				Exporter.log('found date: '+date[1]+"-"+date[2]+"-"+date[3]);
			var gDate = Exporter.JalaliDate.jalaliToGregorian(date[3], Exporter.strToMonth(date[2]), date[1]);
			tObj.date = new Date(gDate[0], gDate[1]-1, gDate[2], time[1], time[2], 0);
			tObj.content = divs[i].getElementsByTagName("div")[1].innerHTML;
			result.push(tObj);
		}
		return result;
	},
	commentsPaging			: function(key){
		var p = Math.ceil(Exporter.WXR.getCommentsCount(Exporter.comments[key][0])/Exporter.Services.PERSIANBLOG.commentsPerPage);
		return "&p="+p;
	},
	idToPostURL			: function(pID){
		return Exporter.weblog+"post/"+pID+"/";
	}
};

// blogsky.com
Exporter.wSystems.push({panel:/blogsky\.com\/cp\/weblog\/Post\.bs|blogsky\.com\/cp\/weblog\/GeneralSettings\.bs|blogsky\.com\/cp\/weblog\/NewTemplate\.bs/, variable: "BLOGSKY"});
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
		if(Exporter.step==0)
			Exporter.Services.BLOGFA.getIntTimeZone();
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
			tempObj.extended = (postLinks.length>0 && postLinks[postLinks.length-1].getAttribute("href")==tempObj.link && postLinks[postLinks.length-1].innerHTML==" ادامه مطلب ...")?true:false;
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

// mihanblog.com
Exporter.wSystems.push({panel:/mihanblog\.com\/web\/index\/|mihanblog\.com\/web\/setting/i, variable: "MIHANBLOG"});
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
		var result = new Array();
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
		if(Exporter.step==0)
			Exporter.Services.BLOGFA.getIntTimeZone();
		var posts = Exporter.doXPath(Exporter.main, "//body/div[@class='CONBG']/div[@class='CON']/div[@class='SC']/div[@class='Post clearfix']");
		var result = new Array();
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
			var tempObj = new Object();
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
	 * int getCommentsCountByScript((int)id)
	 * required:		no
	 * description:
	 *	returns number of comments on each post
	 *	the post is defined by given id
	 *	(used in parsePosts)
	 */
	getCommentsCountByScript	: function(id){
		if(!Exporter.commentsScript)
			Exporter.commentsScript = new Array();
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
		var result = new Array();
		for(var i in comments){
			var comment = comments[i];
			var divs = comment.getElementsByTagName("div");
			var tempObj = new Object();
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
