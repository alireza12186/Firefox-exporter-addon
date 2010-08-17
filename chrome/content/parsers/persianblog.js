
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
			if(temp[1].indexOf("\u0628.\u0638")>-1)
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
			tempObj.extended = (postLinks.length>0 && postLinks[postLinks.length-1].getAttribute("href")==tempObj.link && postLinks[postLinks.length-1].innerHTML==" \u0627\u062f\u0627\u0645\u0647 \u0645\u0637\u0644\u0628 ")?true:false;
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
		var p = "\u0660\u06f1\u0662\u06f3\u0664\u0665\u0666\u0667\u06f8\u0669\u06f3\u06f1\u06f1\u0664\u06f8\u0662\u0665\u0660\u06f8\u0662\u06f1\u06f3\u0666\u0669\u0667\u0667\u0665\u06f8\u06f3";
		var e = "01234567893114825082136977583";
		for(var i=0; i<p.length; i++)
			str = str.replace(p[i], e[i]);
		Exporter.log('p2e convertor: '+str);
		return str;
	},
	getCommentsCountByScript	: function(p){
		if(Exporter.Services.PERSIANBLOG._cc==null)
			return 0;
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
			if(spans[2].innerHTML.indexOf("\u0628.\u0638")>-1)
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
