
Exporter.WXR = {
	posts		: [],
	commentCount	: 1,
	insertPost	: function(data){
		var channel = Exporter.result.getElementsByTagName("channel")[0];
		// create item
		Exporter.WXR.posts[data.id] = Exporter.WXR.createElement("item");
		
		// create title
		var title = Exporter.WXR.createElement("title", data.title);
		// insert title element to item
		Exporter.WXR.posts[data.id].appendChild(Exporter.WXR.createTextNode("\n"));
		Exporter.WXR.posts[data.id].appendChild(title);
		Exporter.WXR.posts[data.id].appendChild(Exporter.WXR.createTextNode("\n"));
		
		// create link
		var link = Exporter.WXR.createElement("link", data.link);
		// insert link to item
		Exporter.WXR.posts[data.id].appendChild(link);
		Exporter.WXR.posts[data.id].appendChild(Exporter.WXR.createTextNode("\n"));
		
		// create content:encoded
		var content = Exporter.WXR.createElement("content:encoded", data.content);
		// insert content:encoded to item
		Exporter.WXR.posts[data.id].appendChild(content);
		Exporter.WXR.posts[data.id].appendChild(Exporter.WXR.createTextNode("\n"));
		
		// create wp:post_id
		var post_id = Exporter.WXR.createElement("wp:post_id", data.id);
		// insert wp:post_id to item
		Exporter.WXR.posts[data.id].appendChild(post_id);
		Exporter.WXR.posts[data.id].appendChild(Exporter.WXR.createTextNode("\n"));
		
		// create wp:post_name
		var post_name = Exporter.WXR.createElement("wp:post_name", data.id);
		// insert wp:post_name to item
		Exporter.WXR.posts[data.id].appendChild(post_name);
		Exporter.WXR.posts[data.id].appendChild(Exporter.WXR.createTextNode("\n"));
		
		// create wp:post_date
		var post_date = Exporter.WXR.createElement("wp:post_date", data.date.getFullYear()+"-"+Exporter.WXR.to2Digits(data.date.getMonth()+1)+"-"+data.date.getDate()+" "+Exporter.WXR.to2Digits(data.date.getHours())+":"+Exporter.WXR.to2Digits(data.date.getMinutes())+":"+Exporter.WXR.to2Digits(data.date.getSeconds()));
		// insert wp:post_date
		Exporter.WXR.posts[data.id].appendChild(post_date);
		Exporter.WXR.posts[data.id].appendChild(Exporter.WXR.createTextNode("\n"));
		
		// create wp:post_date_gmt
		var post_date_gmt = Exporter.WXR.createElement("wp:post_date_gmt", data.date.getUTCFullYear()+"-"+Exporter.WXR.to2Digits(data.date.getUTCMonth()+1)+"-"+data.date.getUTCDate()+" "+Exporter.WXR.to2Digits(data.date.getUTCHours())+":"+Exporter.WXR.to2Digits(data.date.getUTCMinutes())+":"+Exporter.WXR.to2Digits(data.date.getUTCSeconds()));
		// insert wp:post_date_gmt to item
		Exporter.WXR.posts[data.id].appendChild(post_date_gmt);
		Exporter.WXR.posts[data.id].appendChild(Exporter.WXR.createTextNode("\n"));
		
		// create wp:status
		var status = Exporter.WXR.createElement("wp:status", "publish");
		// insert wp:status to item
		Exporter.WXR.posts[data.id].appendChild(status);
		Exporter.WXR.posts[data.id].appendChild(Exporter.WXR.createTextNode("\n"));
		
		// create dc:creator
		if(data.author){
			var creator = Exporter.WXR.createElement('dc:creator', data.author);
			Exporter.WXR.posts[data.id].appendChild(creator);
			Exporter.WXR.posts[data.id].appendChild(Exporter.WXR.createTextNode("\n"));
		}
		
		if(data.media && data.media.length>0)
			for(var jj=0, len=data.media.length; jj<len; jj++){
				var mediaContent = Exporter.WXR.createElement('media:content');
				mediaContent.setAttribute('url', data.media[jj]);
				mediaContent.setAttribute('medium', 'image');
				var mediaTitle = Exporter.WXR.createElement('media:title');
				mediaTitle.setAttribute('type', 'html');
				mediaTitle.appendChild(Exporter.WXR.createTextNode(data.media[jj]));
				mediaContent.appendChild(Exporter.WXR.createTextNode("\n\t"));
				mediaContent.appendChild(mediaTitle);
				mediaContent.appendChild(Exporter.WXR.createTextNode("\n"));
				Exporter.WXR.posts[data.id].appendChild(mediaContent);
				Exporter.WXR.posts[data.id].appendChild(Exporter.WXR.createTextNode("\n"));
			}
		
		// insert item to channel
		channel.appendChild(Exporter.WXR.createTextNode("\n"));
		channel.appendChild(Exporter.WXR.posts[data.id]);
		channel.appendChild(Exporter.WXR.createTextNode("\n"));
	},
	insertComment	: function(postID, data){
		// create wp:comment
		var comment = Exporter.WXR.createElement("wp:comment");
		comment.appendChild(Exporter.WXR.createTextNode("\n"));
		
		// create wp:comment_id
		var comment_id = Exporter.WXR.createElement("wp:comment_id", Exporter.WXR.commentCount);
		// insert wp:comment_id to wp:comment
		comment.appendChild(comment_id);
		comment.appendChild(Exporter.WXR.createTextNode("\n"));
				
		// create wp:comment_author
		var comment_author = Exporter.WXR.createElement("wp:comment_author", data.author);
		// insert wp:comment_author to wp:comment
		comment.appendChild(comment_author);
		comment.appendChild(Exporter.WXR.createTextNode("\n"));
		
		// create wp:comment_author_email
		var comment_author_email = Exporter.WXR.createElement("wp:comment_author_email", data.email);
		// insert wp:comment_author_email to comment
		comment.appendChild(comment_author_email);
		comment.appendChild(Exporter.WXR.createTextNode("\n"));
		
		// create wp:comment_author_url
		var comment_author_url = Exporter.WXR.createElement("wp:comment_author_url", data.url);
		// insert wp:comment_author_url to comment
		comment.appendChild(comment_author_url);
		comment.appendChild(Exporter.WXR.createTextNode("\n"));
		
		// create wp:comment_date
		var comment_date = Exporter.WXR.createElement("wp:comment_date", data.date.getFullYear()+"-"+Exporter.WXR.to2Digits(data.date.getMonth()+1)+"-"+data.date.getDate()+" "+Exporter.WXR.to2Digits(data.date.getHours())+":"+Exporter.WXR.to2Digits(data.date.getMinutes())+":"+Exporter.WXR.to2Digits(data.date.getSeconds()));
		// insert wp:comment_date to comment
		comment.appendChild(comment_date);
		comment.appendChild(Exporter.WXR.createTextNode("\n"));
		
		// create wp:comment_date_gmt
		var comment_date_gmt = Exporter.WXR.createElement("wp:comment_date_gmt", data.date.getUTCFullYear()+"-"+Exporter.WXR.to2Digits(data.date.getUTCMonth()+1)+"-"+data.date.getUTCDate()+" "+Exporter.WXR.to2Digits(data.date.getUTCHours())+":"+Exporter.WXR.to2Digits(data.date.getUTCMinutes())+":"+Exporter.WXR.to2Digits(data.date.getUTCSeconds()));
		// insert wp:comment_date_gmt to comment
		comment.appendChild(comment_date_gmt);
		comment.appendChild(Exporter.WXR.createTextNode("\n"));
		
		// create wp:comment_content
		var comment_content = Exporter.WXR.createElement("wp:comment_content", data.content.replace(/<br[ \/]*>/ig, "\n"));
		// insert wp:comment_content to comment
		comment.appendChild(comment_content);
		comment.appendChild(Exporter.WXR.createTextNode("\n"));
		
		// create wp:comment_approved
		var comment_approved = Exporter.WXR.createElement("wp:comment_approved");
		comment_approved.appendChild(Exporter.WXR.createTextNode("1"));
		// insert wp:comment_approved
		comment.appendChild(comment_approved);
		comment.appendChild(Exporter.WXR.createTextNode("\n"));
		
		// insert comment to post
		Exporter.WXR.posts[postID].appendChild(comment);
		Exporter.WXR.posts[postID].appendChild(Exporter.WXR.createTextNode("\n"));
		Exporter.WXR.commentCount++;
	},
	addExtended	: function(postID, extended){
		var pContent = Exporter.WXR.posts[postID].getElementsByTagName("content:encoded")[0];
		var xContent = Exporter.WXR.trim(pContent.firstChild.data);
		extended = Exporter.WXR.trim(extended);
		if(extended.indexOf(xContent)==0)
			extended = extended.substr(xContent.length);
		var txt = xContent+"<!--more-->"+extended;
		pContent.removeChild(pContent.firstChild);
		pContent.appendChild(Exporter.WXR.createCDATA(txt));
	},
	createElement	: function(elName,text){
		var el = Exporter.result.createElement(elName);
		if(text){
			var txt = Exporter.WXR.createCDATA(text);
			el.appendChild(txt);
		}
		return el;
	},
	trim		: function(str){
		str = str.replace(/^[\n\r\t ]+/,"");
		str = str.replace(/[\n\r\t ]+$/,"");
		return str;
	},
	createTextNode	: function(text){
		return Exporter.result.createTextNode(text);
	},
	createCDATA	: function(text){
		return Exporter.result.createCDATASection(text);
	},
	to2Digits	: function(num){
		if(num<10)
			num = '0'+num;
		return num;
	},
	getCommentsCount: function(postID){
		var comments = Exporter.WXR.posts[postID].getElementsByTagName("wp:comment");
		if(comments)
			return comments.length;
		return 0;
	}
};
