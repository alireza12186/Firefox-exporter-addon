
var Exporter = {
	debug		: true,
	result		: null,
	main		: null,
	weblog		: null,
	strBlogId	: null,
	step		: 0,
	secondStep	: false,
	level		: null,
	commentsScript	: null,
	intTimeZone	: null,
	PARSER		: null,
	loadPage	: true,
	archives	: new Array(),
	comments	: new Array(),
	extended	: new Array(),
	progressWin : false,
	jsLoader	: Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader),
	init		: function(){
		try {
			Exporter.main = gBrowser.selectedBrowser.contentDocument;
			if(Exporter.PARSER)
				Exporter.log('belong result: '+Exporter.PARSER.belongs());
			if(Exporter.weblog!=null && Exporter.PARSER && Exporter.PARSER.belongs()){
				Exporter.removeIFrame();
				if(Exporter.level==null && Exporter.archives.length==0){
					// we are in first level parse the archive urls
					Exporter.archives = Exporter.PARSER.parseArchive();
					Exporter.level = "posts";
					Exporter.step = 0;
					Exporter.log('found archives: '+Exporter.archives.toString());
					Exporter.log('Exporter.step: '+Exporter.step);
					Exporter.log('Exporter.archives.length: '+Exporter.archives.length);
					Exporter.log('Exporter.archives.length: '+Exporter.archives[Exporter.step]);
					if(Exporter.archives.length>0)
						Exporter.goTo(Exporter.archives[Exporter.step]);
					else
						alert(Exporter.jsProperties.getString('noPostFound')+'\n'+Exporter.jsProperties.getString('ThemeAndSettings'));
				} else if(Exporter.level=="posts" && Exporter.step<Exporter.archives.length) {
					// we should fetch posts
					var posts = Exporter.PARSER.parsePosts();
					if(posts.length==0)
						Exporter.log(Exporter.jsProperties.getString('problemInPage')+"\n"+Exporter.archives[Exporter.step]+'\n'+Exporter.jsProperties.getString('ThemeAndSettings'));
					for(var i=posts.length-1; i>=0; i--){
						Exporter.WXR.insertPost(posts[i]);
						if(posts[i].commentsCount>0 || Exporter.PARSER.reCheckComments==true)
							Exporter.comments.push([posts[i].id,posts[i].commentsCount]);
						if(posts[i].extended==true)
							Exporter.extended.push(posts[i].id);
					}
					Exporter.step++; // go to archive's next step
					Exporter.updateProgress();
					if(Exporter.step<Exporter.archives.length)
						Exporter.goTo(Exporter.archives[Exporter.step]);
					else {
						if(Exporter.comments.length>0){
							Exporter.level = "comments";
							Exporter.step = 0;
							var key = Exporter.step;
							Exporter.goTo(Exporter.PARSER.postToCommentURL(Exporter.comments[key][0]));
							return;
						} else if(Exporter.extended.length>0) {
							Exporter.level = "extended";
							Exporter.step = 0;
							Exporter.goTo(Exporter.PARSER.idToPostURL(Exporter.extended[Exporter.step]));
							return;
						} else {
							Exporter.save();
							return;
						}
					}
				}
				if(Exporter.level == "comments" && Exporter.comments.length>0){
					key = Exporter.step;
					if(Exporter.debug==true)
						Exporter.log("key: "+key+"\npost: "+Exporter.comments[key][0]+"\ncomment: "+Exporter.comments[key][1]);
					if(typeof(Exporter.comments[key][1]) == "boolean" && Exporter.secondStep==false){ // we should get the number manualy so go to page
						if(Exporter.debug==true)
							Exporter.log("if 1.0");
						Exporter.secondStep = true;
						if(Exporter.main.location.href!=Exporter.PARSER.postToCommentURL(Exporter.comments[key][0])){
							if(Exporter.debug==true)
								Exporter.log("if 1.1");
							Exporter.goTo(Exporter.PARSER.postToCommentURL(Exporter.comments[key][0]));
							return;
						}
					}
					if(typeof(Exporter.comments[key][1]) == "boolean" && Exporter.secondStep==true){
						if(Exporter.debug==true)
							Exporter.log("if 2.0");
						Exporter.secondStep = false;
						if(Exporter.PARSER.reCheckComments==true)
							var tempCount = Exporter.PARSER.getCommentsCountByPage();
						if(Exporter.debug==true && Exporter.PARSER.reCheckComments==true)
							Exporter.log("getCommentsCountByPage: "+tempCount);
						if(typeof(tempCount)=="boolean"){
							if(Exporter.debug==true)
								Exporter.log("if 2.1.0");
							Exporter.step++; // comment's next step
							Exporter.updateProgress();
							if(Exporter.step<Exporter.comments.length){ // we have posts yet
								if(Exporter.debug==true)
									Exporter.log("if 2.1.1");
								var key = Exporter.step;
								if(Exporter.debug==true)
									Exporter.log("key: "+key+"\npost: "+Exporter.comments[key][0]+"\ncomment: "+Exporter.comments[key][1]);
								Exporter.goTo(Exporter.PARSER.postToCommentURL(Exporter.comments[key][0]));
								return;
							}
						} else {
							if(Exporter.debug==true)
								Exporter.log("else 2.0");
							Exporter.comments[key][1] = tempCount;
						}
					}
					if(typeof(Exporter.comments[key][1]) == "number" && Exporter.main.location.href.indexOf(Exporter.PARSER.postToCommentURL(Exporter.comments[key][0]))!=0){
						if(Exporter.debug==true)
							Exporter.log("if 3");
						Exporter.goTo(Exporter.PARSER.postToCommentURL(Exporter.comments[key][0]));
						return;
					}
					if(Exporter.debug==true)
						Exporter.log("if 4.0");
					if(Exporter.PARSER.reCheckComments==true)
						Exporter.comments[key][1] = Exporter.PARSER.getCommentsCountByPage();
					if(Exporter.PARSER.reCheckComments==true && Exporter.debug==true)
						Exporter.log("ReCheck in if 4.0: "+Exporter.comments[key][1]);
					var comments = Exporter.PARSER.parseComments();
					Exporter.log('Comments found in this page: '+comments.length);
					if(Exporter.debug==true)
						Exporter.log("Comments Found: "+comments.length);
					for(var i in comments)
						Exporter.WXR.insertComment(Exporter.comments[key][0], comments[i]);
					if(Exporter.debug==true)
						Exporter.log('Found comments: '+Exporter.WXR.getCommentsCount(Exporter.comments[key][0]))
						Exporter.log('Expected comments: '+Exporter.comments[key][1]);
					if(typeof(Exporter.comments[key][1]) == "number" && Exporter.WXR.getCommentsCount(Exporter.comments[key][0])<Exporter.comments[key][1]
						  && Exporter.PARSER.postToCommentURL(Exporter.comments[key][0])+nextPage!=gBrowser.selectedBrowser.contentDocument.location.href && comments.length>1){ // go to next page
						if(Exporter.debug==true)
							Exporter.log("if 4.1");
						var nextPage = Exporter.PARSER.commentsPaging(key);
						Exporter.goTo(Exporter.PARSER.postToCommentURL(Exporter.comments[key][0])+nextPage);
						return;
					} else { // comments fetched go to next
						if(Exporter.debug==true)
							Exporter.log("else 4.1");
						Exporter.step++; // comment's next step
						Exporter.updateProgress();
						if(Exporter.step<Exporter.comments.length){ // we have posts yet
							if(Exporter.debug==true)
								Exporter.log("if 4.1.1");
							var key = Exporter.step;
							if(Exporter.debug==true)
								Exporter.log("key: "+key+"\npost: "+Exporter.comments[key][0]+"\ncomment: "+Exporter.comments[key][1]);
							Exporter.goTo(Exporter.PARSER.postToCommentURL(Exporter.comments[key][0]));
							return;
						} else {
							if(Exporter.extended.length>0){
								Exporter.level = "extended";
								Exporter.step = 0;
								Exporter.goTo(Exporter.PARSER.idToPostURL(Exporter.extended[Exporter.step]));
								return;
							} else {
								Exporter.save();
								return;
							}
						}
					}
				}
				if(Exporter.level=="extended" && Exporter.extended.length>Exporter.step){
					var POST = Exporter.PARSER.parsePosts();
					if(POST.length!=1){
						Exporter.log(Exporter.jsProperties.getString('problemInPage')+"\n"+Exporter.archives[Exporter.step]+'\n'+Exporter.jsProperties.getString('ThemeAndSettings'));
					} else {
						POST = POST[0];
						Exporter.WXR.addExtended(Exporter.extended[Exporter.step], POST.content);
					}
					Exporter.step++; // extended's next step
					Exporter.updateProgress();
					if(Exporter.step<Exporter.extended.length)
						Exporter.goTo(Exporter.PARSER.idToPostURL(Exporter.extended[Exporter.step]));
					else
						Exporter.save();
				}
			}
		} catch(e) {
			Exporter.progressWin = false;
			Exporter.log(e.message+'\n'+e.fileName+':'+e.lineNumber);
		}
	},
	setWeblog	: function(){
		// load common.js & wxt.js if are not loaded yet
		if(!Exporter.wSystems){
			Exporter.jsLoader.loadSubScript("chrome://exporter/content/common.js");
			Exporter.jsLoader.loadSubScript("chrome://exporter/content/wxr.js");
		}
		if(Exporter.progressWin==false || Exporter.progressWin.document==null){
			Exporter.progressWin = window.open("chrome://exporter/content/progress.xul", "exporter_progress_win", "chrome,width=330,height=110");
			if(Exporter.level!=null) // just reopen progressWin if we are exporting now
				return;
		} else {
			Exporter.updateProgress();
			return;
		}
		for(var i=0; i<Exporter.wSystems.length; i++){
			if(Exporter.wSystems[i].panel.test(gBrowser.selectedBrowser.contentDocument.location.href)){
				try{
					Exporter.main = gBrowser.selectedBrowser.contentDocument;
					// load weblog module if is not loaded yet
					if(!Exporter.Services[Exporter.wSystems[i].variable])
						Exporter.jsLoader.loadSubScript("chrome://exporter/content/parsers/"+Exporter.wSystems[i].variable.toLowerCase()+".js");
					Exporter.PARSER = Exporter.Services[Exporter.wSystems[i].variable];
					Exporter.weblog = Exporter.PARSER.getWeblogFromPanel().toLowerCase();
					if(Exporter.debug==true)
						Exporter.log('weblog: '+Exporter.weblog);
					var http_str = "http://";
					if(Exporter.weblog.indexOf("http://www.")==0)
						http_str += "www.";
					Exporter.strBlogId = Exporter.weblog.replace(http_str, "");
					Exporter.strBlogId = Exporter.strBlogId.replace("."+Exporter.PARSER.domain+"/", "");
					if(Exporter.debug==true)
						Exporter.log('blog id: '+Exporter.strBlogId);
					if(Exporter.PARSER.domain=="persianblog.ir"){
						var _f = gBrowser.selectedBrowser.contentDocument.location.href.match(/blogID=([0-9]+)/i);
						Exporter.PARSER.weblogId = _f[1];
					}
					Exporter.goTo(Exporter.weblog+Exporter.PARSER.archive);
					return;
				} catch(e) {
					Exporter.log('ERROR: '+e.message+'\n'+e.fileName+':'+e.lineNumber);
				}
			}
		}
		alert("برای امنیت شما باید اول وارد مدیریت وبلاگ شوید");
	},
	removeIFrame	: function(){
		var iFrames = Exporter.main.getElementsByTagName("iframe");
		for(var i=0; i<iFrames.length; i++)
			iFrames[i].parentNode.removeChild(iFrames[i]);
	},
	goTo		: function(url, refURL){
		if(!refURL)
			refURL = Exporter.weblog;
		Exporter.log('Exporter.goto: Exporter.pageLoad: '+Exporter.loadPage);
		if(Exporter.loadPage==false){
			window.setTimeout("Exporter.goTo('"+url+"','"+refURL+"');", 500);
			return;
		}
		Exporter.log('Exporter.goTo: '+url);
		var ios = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
		var ref = ios.newURI(refURL, null, null);
		Exporter.firstScript = null;
		gBrowser.selectedBrowser.loadURI(url, ref, "UTF-8");
	},
	save		: function(){
		try{
			var serializer = Components.classes["@mozilla.org/xmlextras/xmlserializer;1"].createInstance(Components.interfaces.nsIDOMSerializer);
			
			// creating file
			var file = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("Desk", Components.interfaces.nsIFile);
			file.append("backup.xml");
			file.createUnique(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0600);

			// writing to file
			var stream = Components.classes["@mozilla.org/network/safe-file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
			stream.init(file, 0x04 | 0x08 | 0x20, 0600, 0); // write, create, truncate
			serializer.serializeToStream(Exporter.result, stream, "utf-8");
			if (stream instanceof Components.interfaces.nsISafeOutputStream) {
				stream.finish();
			} else {
				stream.close();
			}

			Exporter.log(Exporter.jsProperties.getString('done'));
			if(Exporter.progressWin!=false && Exporter.progressWin.document!=null)
				Exporter.progressWin.document.getElementById('status').innerHTML = Exporter.jsProperties.getString('done');
			Exporter.reset();
		} catch(e) {
			Exporter.log('ERROR: '+e.message+'\n'+e.fileName+':'+e.lineNumber);
		}
	},
	reset		: function(){
		Exporter.result = Exporter.domParser.parseFromString(Exporter.baseStr, "text/xml");
		Exporter.main = null;
		Exporter.weblog	= null;
		Exporter.strBlogId = null;
		Exporter.step = 0;
		Exporter.secondStep = false;
		Exporter.WXR.posts = new Array();
		Exporter.WXR.commentCount = 1;
		Exporter.level = null;
		Exporter.commentsScript = null;
		Exporter.intTimeZone = null;
		Exporter.PARSER	= null;
		Exporter.loadPage = true;
		Exporter.archives = new Array();
		Exporter.comments = new Array();
		Exporter.extended = new Array();
		Exporter.progressWin = false;
	},
	consoleService	: Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService),
	log		: function(msg){
		if(Exporter.debug==true)
			Exporter.consoleService.logStringMessage(msg);
	},
	baseStr : '<?xml version="1.0" encoding="UTF-8"?>\n'+
		'<rss version="2.0" \n'+
		'\txmlns:excerpt="http://wordpress.org/export/1.0/excerpt/"\n'+
		'\txmlns:content="http://purl.org/rss/1.0/modules/content/"\n'+
		'\txmlns:wfw="http://wellformedweb.org/CommentAPI/"\n'+
		'\txmlns:dc="http://purl.org/dc/elements/1.1/"\n'+
		'\txmlns:wp="http://wordpress.org/export/1.0/"\n'+
		'\txmlns:sy="http://purl.org/rss/1.0/modules/syndication/"\n'+
		'\txmlns:slash="http://purl.org/rss/1.0/modules/slash/"\n'+
		'\txmlns:georss="http://www.georss.org/georss"\n'+
		'\txmlns:geo="http://www.w3.org/2003/01/geo/wgs84_pos#"\n'+
		'\txmlns:media="http://search.yahoo.com/mrss/"\n'+
		'>\n'+
		'<channel>\n'+
		'\t<title>پشتیبان</title>\n'+
		'\t<description>پشتیبان از وبلاگ</description>\n'+
		'\t<generator>http://darkprince.ir/</generator>\n'+
		'\t<language>fa</language>\n'+
		'\t<wp:wxr_version>1.0</wp:wxr_version>\n'+
		'</channel>\n'+
		'</rss>',
	domParser : new DOMParser(),
	doXPath : function (aNode, aExpr) {
		var xpe = new XPathEvaluator();
		var nsResolver = xpe.createNSResolver(aNode.ownerDocument == null ?aNode.documentElement : aNode.ownerDocument.documentElement);
		var result = xpe.evaluate(aExpr, aNode, nsResolver, 0, null);
		var found = [];
		var res;
		while (res = result.iterateNext())
			found.push(res);
		return found;
	},
	removeNode : function(el){
		if(!el.hasChildNodes())
			return;
		var elC = el.firstChild;
		while(elC){
			if(elC.nodeType==8 || elC.nodeType==4 || elC.nodeType==1 && elC.nodeName.toLowerCase()=="style"){ // remove html comments, CDATAs & style tags
				// we must first get next node then remove current node
				elC = elC.nextSibling;
				if(elC!=null)
					el.removeChild(elC.previousSibling);
				else
					el.removeChild(el.lastChild);
				continue;
			}
			if(elC.nodeType==1)
				Exporter.removeNode(elC);
			elC = elC.nextSibling;
		}
	},
	strToMonth : function(str){
		switch(str){
			case 'فروردین':
			case 'فروردین':
				return 1;
			case 'اردیبهشت':
			case 'اردیبهشت':
				return 2;
			case 'خرداد':
			case 'خرداد':
				return 3;
			case 'تیر':
			case 'تیر':
			case 'تیر':
				return 4;
			case 'مرداد':
			case 'امرداد':
				return 5;
			case 'شهریور':
			case 'شهریور':
				return 6;
			case 'مهر':
			case 'مهر':
				return 7;
			case 'آبان':
			case 'آبان':
				return 8;
			case 'آذر':
			case 'آذر':
				return 9;
			case 'دی':
			case 'دی':
				return 10;
			case 'بهمن':
			case 'بهمن':
				return 11;
			case 'اسفند':
			case 'اسفند':
				return 12;
			default:
				Exporter.log(Exporter.jsProperties.getString('monthName'));
		}
	},
	clear0 : function(a){
		for(var nn=0, nnlen=a.length; nn<nnlen && a[nn].length>1; nn++)
			a[nn] = a[nn].replace(/^0/, '');
		return a;
	},
	updateProgress : function(){
		var total = 0;
		var progressmeter = null;
		var label = null
		if(Exporter.progressWin==false || Exporter.progressWin.document==null)
			return false;
		var xvars = {
			archives: ['posts_prog', 'posts_label'],
			comments: ['comments_prog', 'comments_label'],
			extended: ['extended_prog', 'extended_label']
		};
		for(var x in xvars){
			total = Exporter[x].length;
			if(total==0)
				continue;
			progressmeter = Exporter.progressWin.document.getElementById(xvars[x][0]);
			label = Exporter.progressWin.document.getElementById(xvars[x][1]);
			// should use previous state if we're not fetching same state
			var state = parseInt(label.getAttribute('value').split('/')[0]);
			if(
				Exporter.level=='posts' && x=='archives' || // posts
				Exporter.level=='comments' && x=='comments' || // comments
				Exporter.level=='extended' && x=='extended' // extendeds
			)
				state = Exporter.step;
			label.setAttribute("value", state+"/"+total);
			progressmeter.setAttribute("value", parseInt(state*100/total));
		}
		return true;
	}
};

Exporter.result = Exporter.domParser.parseFromString(Exporter.baseStr, "text/xml");

window.addEventListener("load", function() {
	if(document.getElementById("appcontent"))
		document.getElementById("appcontent").addEventListener("DOMContentLoaded", Exporter.init, true);
}, false);
