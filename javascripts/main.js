//global variables
var c = document.getElementById("renderWindow");
var ctx = c.getContext("2d");
var cheatWindow; // global refrence for cheatsheet window

var text = document.getElementById("text");
var language = document.getElementById("language");
var override = document.getElementById("override"); // tenno manual override button
var bold = document.getElementById("bold"); // corpus bold option button
var background = document.getElementById("background"); // background option button

var js = {
	path: "./javascripts/",
	ext: ".js",
};

var languages = ["tenno", "orokin", "corpus", "grineer"];
var cheatsheets = {};
	for(var a = 0; a < languages.length; a++){
		var img = new Image();
		img.src = "./images/" + languages[a] + "bet.png";
		cheatsheets[languages[a]] = img;
	}

//html callbacks
/*-------------------------------------------------*/

function draw(){
	var str = text.value.toLowerCase();
	switch(language.value){
		case "corpus":
			override.parentElement.style.display = "none";
			bold.parentElement.style.display = "";
			placeString(ctx, str, corpus);
			break;
		case "grineer":
			override.parentElement.style.display = "none";
			bold.parentElement.style.display = "none";
			placeString(ctx, str, grineer);
			break;
		case "tenno":
			override.parentElement.style.display = "";
			bold.parentElement.style.display = "none";
			placeString(ctx, str, tenno);
			break;
		case "orokin":
			override.parentElement.style.display = "";
			bold.parentElement.style.display = "none";
			placeString(ctx, str, orokin);
			break;
		default:
			clearCanvas();
			ctx.font = "20pt Optima";
			ctx.fillText(str, 2, 30);
			break;
	}
}

function cheatsheet(){
	if(cheatWindow != undefined){
		cheatWindow.close();
	}
	cheatWindow = window.open(cheatsheets[language.value].src);
	cheatWindow.focus();
}

function dictload(){
	return CMUdict.dictload()
	.then(function(){
		tenno.currWord = orokin.currWord = null
	})
	.then(draw);
}

function saveImg(){
	try{
		var d=c.toDataURL("image/png");
		var w=window.open('about:blank','image from canvas');
		w.document.write("<img src='"+d+"' alt='from canvas'/>");
	}catch(error){
		console.log("Could not save canvas.");
		alert("Could not save image:\n" + error);
	}
}

var debugBox = document.getElementById("debug");
var debug = debugBox.checked;
if (debug) debugBox.parentElement.style.display = "";
document.onkeydown = function(evt) {
	if (!evt) evt = event;
	if (evt.altKey) {
		debugBox.parentElement.style.display = "";
	}
	// if (debug) console.log(evt.keyCode)
	if (document.body == document.activeElement) text.focus()
	else if (false // the key pressed isn't any of:
		|| evt.keyCode == 32 // space
		|| evt.keyCode == 9  // tab
		// || evt.keyCode == 17 // ctrl
		|| evt.keyCode == 16 // shift
		|| evt.keyCode == 18 // alt
		|| evt.keyCode == 13 // enter
		|| document.activeElement==language && (evt.keyCode >= 37 && evt.keyCode <= 40) // arrow keys on dropdown
	) ;else text.focus()
}

//functionality
/*-------------------------------------------------*/

function find(item, array){
	return array.includes(item)
}

/*
	isolate each word
	calculate required canvas size, and draw
	call required drawing functions
*/
function placeString(ctx, string, lanClass){
	if (lanClass.modify) string = lanClass.modify(string)
	var txt = new Paragraph(string, lanClass);

	c.width = Math.ceil(txt.w);
	c.height = Math.ceil(txt.h);

	var xOff = 0;
	var yOff = 0;

	ctx.fillStyle = "white";
	ctx.rect(0, 0, txt.w, txt.h);
	if(background.checked == true){
		ctx.fill();
	}
	for(var a = 0; a < txt.lines.length; a++){ // for each line
		var line = txt.lines[a];

		var initOff = 0; // left aligned or centered
		if(lanClass.centered){
			initOff = (c.width - line.w) / 2;
		}
		ctx.translate(initOff, 0);
		ctx.rect(xOff, yOff + line.yIM, line.w, 0); // show drawline
		ctx.rect(xOff, yOff, line.w, line.h);

		for(var b = 0; b < line.words.length; b++){ // for each word
			var word = line.words[b];
			var hOff = line.yIM - word.yI

			ctx.translate(xOff, yOff + hOff);
			ctx.rect(0, 0, word.w, word.h);
			lanClass.placeWord(ctx, word.str);
			ctx.translate(-xOff, -(yOff + hOff));

			xOff += word.w + lanClass.spacing.SpaceWidth;
		}

		ctx.translate(-initOff, 0);

		yOff += line.h + lanClass.spacing.LineHeight;
		xOff = 0;
	}

	if(debug){
		ctx.stroke(); // for rect bounding boxes
	}
}

function Word(str, w, h, yI){ // basic word class
	this.str = str;
	this.w = w;
	this.h = h;
	this.yI = yI; // individual y initial offset
}

function Line(str, lanClass){
	var array = str.split(' '); // make array of words for each line
	this.words = [];
	this.w = 0;
	this.h = 0;
	this.yIM = 0; // line l initial offset maximum
	// instanciate words array and line width/height
	for(var a = 0; a < array.length; a++){
		this.words[a] = new Word(array[a], lanClass.getWordLength(array[a]), lanClass.getWordHeight(array[a]), lanClass.getWordHeightOffset(array[a]));
		this.w += this.words[a].w + lanClass.spacing.SpaceWidth;

		if(this.words[a].yI > this.yIM){ // find max offset
			this.yIM = this.words[a].yI;
		}
	}
	this.w -= lanClass.spacing.SpaceWidth; // deal with extra width spacing
	
	for(var a = 0; a < this.words.length; a++){ // update line height
		var pH = this.words[a].h + (this.yIM - this.words[a].yI);
		if(pH > this.h){
			this.h = pH;
		}
	}
}

function Paragraph(str, lanClass){
	var array = str.split('\n'); // make array of lines for the paragraph
	this.lines = [];
	this.w = 0;
	this.h = 0;
	//instansiate lines array and canvas width and height
	for(var a = 0; a < array.length; a++){
		this.lines[a] = new Line(array[a], lanClass);
		if(this.lines[a].w > this.w){
			this.w = this.lines[a].w;
		}
		this.h += this.lines[a].h + lanClass.spacing.LineHeight;
	}
	this.h -= lanClass.spacing.LineHeight; // deal with extra height spacing
}

function escapePunctuation(char){
	switch(char){
		case '?': return "Question";
		case ',': return "Comma";
		case '-': return "Hyphen";
		case '.': return "Period";
		case '#': return "Hash";
		case '@': return "Logo";
		default : return char;
	}
}

//phonetic dictionary
/*-------------------------------------------------*/
var CMUdict = new function(){
	// http://www.speech.cs.cmu.edu/cgi-bin/cmudict
	// this.uri = "https://svn.code.sf.net/p/cmusphinx/code/trunk/cmudict/"
	// this.uri = "https://raw.githubusercontent.com/Alexir/CMUdict/master/"
	this.uri = "cmu/"
	this.uri = this.uri + "cmudict-0.7b" // 2015 version (recent as of early 2024)
	// +'.phones' is SYM\ttype, +'.symbols' is all valid symbols
	this.dictparsekey = {
		AA: 'aw',
		AE: 'a',
		AH: 'u',
		AO: 'aw',
		AW: 'ow',
		AY: 'aye',

		B:  'b',
		CH: 'ch',
		D:  'd',
		DH: 'dh',

		EH: 'e',
		ER: ['u','r'],// hurt /hɜːt/,/hɝt/ HH ER T
		EY: 'ae',

		F:  'f',
		G:  'g',
		HH: 'h',

		IH: 'i',
		IY: 'ee',

		JH: 'j',
		K:  'k',
		L:  'l',
		M:  'm',
		N:  'n',
		NG: 'ng',

		OW: 'o',
		OY: ['o','ee'],

		P:  'p',
		R:  'r',
		S:  's',
		SH: 'sh',
		T:  't',
		TH: 'th',
		UH: 'u',// hood hʊd/ HH UH D
		UW: 'oo',
		V:  'v',

		W:  'oo',//
		Y:  'ee',//
		Z:  'z',
		ZH: 'zh',
		// 'kh' // LOCH  L AA1 K  //current implementation is (vowel)ch
	}
	this.dictload = function(){
		// console.log('dictload begin')
		if (typeof this.dict === 'object') return this.promise
		else return this.promise = this._dictload()
	}
	this._dictload = async function(){
		this.dict = {}
		let text = await fetch(this.uri).then(response => response.text())
			// .catch(function(err){CMUdict.dict=undefined;console.log(err)})
		for (let line of text.split('\n')){
			if (line.match(/^;;;/)) continue // comment
			if (line === '') continue // empty
			let regex = /^(\S+)  (.+)$/
			let match = line.match(regex)
			if (!match){console.log("line",line,"doesn't match",regex);continue}
			let word = match[1]
			this.dict[word]=[]
			for (let symbol of match[2].split(' ')) {
				let sregex = /^([A-Z]+)([0-2]?)$/
				let smatch = symbol.match(sregex)
				if (!smatch){console.log(symbol,"in line",line,"doesn't match",sregex);continue}
				this.dict[word]=this.dict[word].concat(this.dictparsekey[smatch[1]])
			}
			// console.log(line,'->',this.dict[word])
		}
		// console.log('end of dictload')
	}
	// this.promise = this.dictload()
	this.query = function(word){
		if (typeof word !== 'string') return console.log('word',word,'is not a string')
		if (typeof this.dict !== 'object') return null
		return this.dict[word.toUpperCase()]
	}
	this._query = async function(word){
		if (typeof word !== 'string') return Promise.reject('word '+word+' is not a string')
		await this.dictload()
		return this.query(word)
	}
}

//grineer
/*-------------------------------------------------*/

var grineer = new function(){
	this.folder = "./images/grineer/";
	this.pre = 'g';
	this.ext = ".png";
	this.centered = false;

	this.spacing = {
		LineHeight: 15,
		SpaceWidth: 25,
		LetterSpacing: 5,
	};

	this.imgs = [];
	this.chars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'r', 's', 't', 'u', 'v', 'w', 'y', 'z', '?', '.', ',', '#', '@'/*logo*/, '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
	for(var a = 0; a < this.chars.length; a++){ // gets images and puts them in imgs table
		this.imgs[this.chars[a]] = new Image();
		this.imgs[this.chars[a]].src = this.folder + this.pre + escapePunctuation(this.chars[a]) + this.ext;
	}
	this.bImgs = this.imgs;


	this.placeWord = function(ctx, word){ // place left aligned images
		var offset = 0;
		var img;

		var imgs = bold.checked ? this.bImgs : this.imgs;

		for(letter in word){
			img = imgs[word[letter]];
			if(img != undefined){
				ctx.rect(offset, 0, img.width, img.height);
				ctx.drawImage(img, offset, 0);
				offset += (img.width + this.spacing.LetterSpacing);
			}
		}
	}

	this.getWordLength = function(word){
		var len = 0;
		var img;

		var imgs = bold.checked ? this.bImgs : this.imgs;

		for(letter in word){
			//console.log("word:" + word + " letter:" + letter + " letterVal:" + word[letter] + " img:" + this.imgs[word[letter]] + " imgLen:" + this.imgs[word[letter]].width);
			img = imgs[word[letter]];
			if(img != undefined){
				len += (img.width + this.spacing.LetterSpacing);
			}
		}
		return (len - this.spacing.LetterSpacing);
	}

	this.getWordHeight = function(word){
		var height = 0;
		var img;

		var imgs = bold.checked ? this.bImgs : this.imgs;

		for(letter in word){
			img = imgs[word[letter]];
			if(img != undefined && img.height > height){
				height = img.height;
			}
		}
		return height;
	}

	this.getWordHeightOffset = function(word){
		return 0;
	}

	this.modify = function(str){
		return str.replace(/qu?/g, "kw").replace(/(?<=\W)x/g, "z").replace(/x/g, "ks")
	}
}

//corpus
/*-------------------------------------------------*/

var corpus = new function(){
	this.folder = "./images/corpus/";
	this.pre = 'c';
	this.ext = ".png";
	this.centered = true;

	this.spacing = {
		LineHeight: 20,
		SpaceWidth: 25,
		LetterSpacing: 5,
	};

	this.imgs = [];
	this.bImgs = [];
	this.chars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'r', 's', 't', 'u', 'v', 'w', 'y', 'z', '0', '1'];
	for(var index = 0; index < this.chars.length; index += 1){ // gets images and puts them in imgs table
		this.imgs[this.chars[index]] = new Image();
		this.imgs[this.chars[index]].src = this.folder + this.pre + this.chars[index] + this.ext;
		this.bImgs[this.chars[index]] = new Image();
		this.bImgs[this.chars[index]].src = this.folder + 'b' + this.pre + this.chars[index] + this.ext;
	}

	this.placeWord = grineer.placeWord;
	this.getWordLength = grineer.getWordLength;
	this.getWordHeight = grineer.getWordHeight;
	this.getWordHeightOffset = grineer.getWordHeightOffset;
	this.modify = grineer.modify;
}


//tenno
/*-------------------------------------------------*/

var tenno = new function(){
	this.folder = "./images/tenno/";
	this.pre = 't';
	this.ext = ".png";

	this.currWord = "";
	this.currlit = null; // currWordArray is literal?
	this.currWordArray = [];
	this.dim = [0, 0, 0, 0]; // width, height, drawline offset, startpoint offset
	this.phoneticizecache = function(word){
		if(word != this.currWord || this.currlit != override.checked){
			this.currWord = word;
			this.currlit = override.checked;
			this.currWordArray = this.phoneticize(word);
			this.dim = this.getWordDimensions(word);
		}
		// return this.currWordArray;
	}

	this.centered = true;
	this.rot = 24.3 * Math.PI / 180;
	this.spacing = {
		LineHeight: 15,
		SpaceWidth: 20,
		LetterSpacing: 0,
	};

	// categories
	this.vowels = ['a', 'e', 'i', 'o', 'u', 'w', 'y', 'ee', 'aw', 'oo', 'ae', 'aye', 'ow'];
	this.misc = [',', '.', '-', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
	this.fortis = this.vowels+['dh', 'zh', 'kh', 'ng', 'b', 'd', 'z', 'j', 'g', 'v', 'm', 'n'/*?*/, 'r'/*?*/, 'l'];
	this.consonants = [];

	this.imgs = [];
	this.chars = ['aye', 'ae', 'ow', 'aw', 'ee', 'i', 'e', 'a', 'u', 'oo', 'o', 'th', 'dh', 'sh', 'zh', 'ch', 'kh', 'ng', 'p', 'b', 't', 'd', 's', 'z', 'j', 'k', 'g', 'f', 'v', 'm', 'n', 'h', 'r', 'l', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', ',', '-'];
	for(var ch of this.chars){
		this.imgs[ch] = new Image();
		this.imgs[ch].src = this.folder + this.pre + escapePunctuation(ch) + this.ext;
		if (!this.vowels.includes(ch) && !this.misc.includes(ch)) this.consonants.push(ch);
	}

	this.placeWord = function(ctx, word){ // place centered images
		this.phoneticizecache(word);

		var pCha = 0; // prevchar, 1 = misc, 2 = vowel, 3 = consonant
		var xOff = this.dim[3]; // x offset
		var yOff = this.dim[2]; // y offset, initially set to drawline offset
		var exta = 0; // extra var placeholder
		var ref; // image array refrence var
		var img; // image var

		for(var a = 0; a < this.currWordArray.length; a++){
			ref = this.currWordArray[a];
			img = this.imgs[ref]; // set img var
			if(img != undefined){
				if(find(ref, this.misc)){ // misc
					if(exta > 0){ // if previous char was consonant and consonant drew below drawline, add spacing
						var tmp = img.height / Math.tan(this.rot);
						if(exta > tmp){
							xOff += tmp;
						}else{
							xOff += exta;
						}
						exta = 0;
					}else if(-exta > img.width){ // update exta var, to prevent vowel overlap
						exta += img.width;
					}else{
						exta = 0;
					}

					ctx.rect(xOff, yOff, img.width, img.height);
					ctx.drawImage(img, xOff, yOff);

					xOff += img.width; // add to width

					pCha = 1;
				}else if(find(ref, this.vowels)){ // vowel
					var mWid = img.width;
					var b = a;
					a++;
					while(find(this.currWordArray[a], this.vowels)){ // get max dimensions
						img = this.imgs[this.currWordArray[a]];
						mWid += img.width + this.spacing.LetterSpacing;
						a++;
					}
					a--; // account for extra increment
					mWid -= this.spacing.LetterSpacing;

					if(pCha == 0){ // if vowel is first char
						xOff += mWid * Math.cos(this.rot);
					}

					if(exta < 0){
						if(mWid >= -exta){
							xOff -= exta;
						}else{
							xOff += mWid * Math.cos(this.rot) + (-exta) * Math.sin(this.rot) * Math.sin(this.rot);
						}
					}
					ctx.translate(xOff, yOff);
					ctx.rotate(this.rot);

					for(; b <= a; b++){ // for each vowel
						img = this.imgs[this.currWordArray[b]];
						ctx.rect(-mWid, -img.height, img.width, img.height);
						ctx.drawImage(img, -mWid, -img.height);
						mWid -= img.width + this.spacing.LetterSpacing;
					}

					ctx.rotate(-this.rot);
					ctx.translate(-xOff, -yOff);

					var off = mWid * Math.cos(this.rot);
					if(exta < 0){ // update width
						if(-exta < off){
							xOff -= exta;
						}else{
							xOff += off;
						}
						exta = 0;
					}

					pCha = 2;
				}else{ // cosonant
					ctx.translate(xOff, yOff);
					ctx.rotate(this.rot);

					ctx.rect(0, -img.height, img.width, img.height);
					ctx.drawImage(img, 0, -img.height);

					ctx.rotate(-this.rot);
					ctx.translate(-xOff, -yOff);

					// update width vars
					var b = img.height / Math.sin(this.rot); // xOff if this ends below drawline
					var c = img.width / Math.cos(this.rot); // xOff is this ends above drawline
					if(b < c){
						xOff += b;
						exta = (c-b) * Math.cos(this.rot)*Math.cos(this.rot);
					}else{
						xOff += c;
						exta = (c-b);
					}

					pCha = 3;
				}
			}
			xOff += this.spacing.LetterSpacing;
		}
	}

	this.getWordLength = function(word){
		this.phoneticizecache(word);
		return this.dim[0];
	}

	this.getWordHeight = function(word){
		this.phoneticizecache(word);
		return this.dim[1];
	}

	this.getWordHeightOffset = function(word){
		this.phoneticizecache(word);
		return this.dim[2];
	}

	this.getWordDimensions = function(word){
		var pCha = 0; // prevchar, 1 = misc, 2 = vowel, 3 = consonant
		var netW = 0; // x offset
		var staW = 0; // starting xOffset
		var tail = 0; // trailing required whitespace
		var uHei = 0; // upper y offset from drawline
		var dHei = 0; // lower y offset from drawline
		var exta = 0; // extra var placeholder
		var ref; // image array refrence var
		var img; // image var

		for(var a = 0; a < this.currWordArray.length; a++){
			ref = this.currWordArray[a];
			img = this.imgs[ref]; // set img var
			if(img != undefined){
				if(find(ref, this.misc)){ // misc
					if(exta > 0){ // if previous char was consonant and consonant drew below drawline, add spacing
						netW += exta;
						exta = 0;
					}else if(-exta > img.width){ // update exta var, to prevent vowel overlap
						exta += img.width;
					}else{
						exta = 0;
					}
					netW += img.width; // add to width

					if(dHei < img.height){ // update height if neccesary
						dHei = img.height;
					}

					tail = 0;
					pCha = 1;
				}else if(find(ref, this.vowels)){ // vowel
					var dim = [img.width, img.height];
					a++;
					while(find(this.currWordArray[a], this.vowels)){ // get max dimensions
						img = this.imgs[this.currWordArray[a]];
						dim[0] += img.width + this.spacing.LetterSpacing;
						if(dim[1] < img.height){
							dim[1] = img.height;
						}
						a++;
					}
					a--; // account for extra increment
					dim[0] -= this.spacing.LetterSpacing;
					var off = dim[0] * Math.cos(this.rot);
					var pTail = img.height * Math.sin(this.rot); // potential tail, img should be the last vowel
					if(exta < 0){ // update width for consonant above drawline
						if (debug) console.log(-exta + " < " + off);
						if(-exta < off){
							netW -= exta;
						}else{
							if (debug) console.log("width:" + dim[0] + " exta:" + -exta + " off:" + off);
							if(dim[0] > -exta){
								netW += off;
							}else{
								netW += dim[0] * Math.cos(this.rot) + (-exta) * Math.sin(this.rot) * Math.sin(this.rot);
							}
						}
						exta = 0;
						tail = pTail; // update tail
					}else{ // if positive exta, tail is below drawline
						if(tail < pTail){ // test how to update tail
							tail = pTail;
						}
					}

					// setup starting width offset and update width based on previous char and offset
					if(pCha == 0){
						netW += off;
					}else if(netW < off){
						staW = off - netW;
						netW += off - netW;
					}else{
						staW = 0;
					}

					//only approximate, more accurate in future versions?
					var pHei = dim[0] * Math.sin(this.rot) + dim[1] * Math.cos(this.rot); // update height var
					if(pHei > uHei){
						uHei = pHei;
					}

					pCha = 2;
				}else{ // consonant
					// update width vars
					var b = img.height / Math.sin(this.rot); // xOff if this ends below drawline
					var c = img.width / Math.cos(this.rot); // xOff is this ends above drawline
					if(b < c){ // tail below drawline
						netW += b;
						exta = (c-b) * Math.cos(this.rot) * Math.cos(this.rot);
						if(tail < b + exta){
							tail = exta;
						}else{
							tail -= b;
						}
					}else{ // if tail is above drawline
						netW += c;
						exta = (c-b);
						var tmp = -exta * Math.sin(this.rot) * Math.sin(this.rot);
						if(tail < c + tmp){
							tail = tmp;
						}else{
							tail -= c;
						}
					}

					// update height vars
					var tmpH = img.height * Math.cos(this.rot);
					if(tmpH > uHei){
						uHei = tmpH;
					}
					tmpH = img.width * Math.sin(this.rot);
					if(tmpH > dHei){
						dHei = tmpH;
					}

					pCha = 3;
				}
			}
			netW += this.spacing.LetterSpacing;
		}
		netW -= this.spacing.LetterSpacing; // account for extra LetterSpacing
		var out = [netW + tail, uHei + dHei, uHei, staW];
		return out; // return array containing width, height, drawline offset
	}

	/**
	 * Returns word as array of directly-matched characters
	 */
	this.literal = function(word){
		var array = [];

		/**
		 * For each character in word swap to dialect character
		 */
		var a = 0;
		while(a < word.length){
			var hit = true;
			while(hit){
				hit = false;
				for(glyph of this.chars){
					if(glyph != word.slice(a,a+glyph.length)) continue;

					array.push(glyph);
					a += glyph.length;
					hit = true;
					break;
				}
			}
			switch(word[a++]){
				case 'q':
					array.push('k');
					break;
				case 'x':
					array.push('k');
					array.push('s');
					break;
				case 'y':
					array.push('ee');
					break;
				case 'w':
					array.push('oo');
					break;
				case 'c':
					array.push('k');
					break;
				default:
					// array.push('-');
					break;
			}
		}
		return array;
	}

	/**
	 * Returns word as array of phoneticized characters
	 * https://www.thefreedictionary.com/words-containing-(substring) is handy
	 */
	this.phoneticize = function(word){ // return array of phoneticized chars, according to phoneticizeGuide.txt
		var wordsArray = [];

		if (override.checked) return this.literal(word);

		var suffix = [];
		{
			let a = word.length - 1;
			while(a >= 0){
				let hit = true;
				while(hit){
					hit = false;
					for(glyph of this.misc){
						if(glyph != word.slice(a,a+glyph.length)) continue;

						suffix.push(glyph);
						a -= glyph.length;
						hit = true;
						break;
					}
				}
				if(!hit) break;
			}
			word=word.slice(0,a+1);
			suffix=suffix.reverse()
		}

		{
			let cmu = CMUdict.query(word);
			if(cmu && cmu.length > 0){
				if (this == orokin && find(cmu[cmu.length-1], this.vowels)) cmu.push('h');
				if (debug) console.log(word,'-dict->',cmu);
				if (debug && suffix.length > 0) console.log(suffix);
				return cmu.concat(suffix);
			}
		}

		for(var a = 0; a < word.length; a++){
			if(a < word.length-1){ // if there is at least 1 char after a
				var b = true; // should the char be pushed after this switch?
				switch(word[a]){
					case 'a':
						switch(word[a+1]){
							case 'e':
								wordsArray.push('ae');
								a++
								b = false;
								break;
							case 'i':
								wordsArray.push('aye');
								a++
								b = false;
								break;
							case 'y':
								if(a+2 < word.length && word[a+2] == 'e'){
									wordsArray.push('aye');
									a += 2;
									b = false;
									break;
								}
								wordsArray.push('ae');
								a++;
								b = false;
								break;
							case 'w':
								wordsArray.push('aw');
								a++;
								b = false;
								break;
							default:
								if(a+2 < word.length && word[a+2] == 'e'
									&& this.consonants.includes(word[a+1])){
									if(word[a+1] == 'r'){
										wordsArray.push('aw');
									}else{
										wordsArray.push('ae');
									}
									b = false;
									break;
								}
						}
						break;
					case 'b':
						if(a < word.length-2 && word[a+2] == 'u'){
							if(word[a+1] == 'o'){
								wordsArray.push('b');
								wordsArray.push('ow');
								a += 2;
								b = false;
							}
						}
						break;
					case 'c': b = false;
						switch(word[a+1]){
							case 'h':
								if(a > 0 && find(wordsArray[wordsArray.length-1], this.vowels)){
									wordsArray.push('kh');
									break;
								}
								wordsArray.push('ch');
								a++;
								break;
							default:
								wordsArray.push('k');
						}
						break;
					case 'd':
						switch(word[a+1]){
							case 'h':
								wordsArray.push('dh');
								a++;
								b = false;
								break;
							case 'o':
								if(a < word.length-2 && word[a+2] == 'u'){
									wordsArray.push(word[a]);
									wordsArray.push('ow');
									a += 2; // account for removing 3 chars
									b = false;
								}
							default:
						}
						break;
					case 'e':
						switch(word[a+1]){
							case 'a':
							case 'e':
								wordsArray.push('ee');
								a++;
								b = false;
								break;
							case 'y':
								wordsArray.push('aye');
								if(a+2 < word.length && word[a+2] == 'e') a++;
								a++;
								b = false;
								break;
							default:
						}
						break;
					case 'f': break;
					case 'g':
						if(word[a+1] == 'e'){
							wordsArray.push('j');
							wordsArray.push('i');
							a++;
							b = false;
						}
						break;
					case 'h': break;
					case 'i':
						if(a > 0 && word[a-1] == 'd'){
							wordsArray.push('aye');
							b = false;
						}else if(word[a+1] == 'e'){
							if(word[a-1] == 't' || word[a-1] == 'l' || word[a-1] == 'r'){
								wordsArray.push('aye');
							}else{
								wordsArray.push('ee');
							}
							a++;
							b = false;
						}else if(word[a+1] == 'a'){
							wordsArray.push('ee');
							b = false;
						}else if(a < word.length-2 && word[a+2] == 'e' && !find(word[a+3], this.vowels)){
							if(!find(word[a+1], this.vowels) && !find(word[a+1], this.misc)){
								wordsArray.push('aye');
								b = false;
							}
						}else if(wordsArray[wordsArray.length-1] == 'sh' && a+1 < word.length && word[a+1] == 'o'){
							wordsArray.push('u');
							a++;
							b = false;
						}
						break;
					case 'j': break;
					case 'k': break;
					case 'l': break;
					case 'm': break;
					case 'n':
						if(a+1 < word.length && word[a+1] == 'g'){
							wordsArray.push('ng');
							a++;
							b = false;
						}
						break;
					case 'o': b = false;
						switch(word[a+1]){
							case 'u':
								if(wordsArray[wordsArray.length-1] == 'sh'){
									b = false;
									break;
								}
							case 'o':
								wordsArray.push('oo');
								a++;
								break;
							case 'w':
								wordsArray.push('ow');
								a++;
								break;
							case 'l':
								wordsArray.push('o');
								break;
							default:
								if(find(word[a+1], this.vowels) || find(word[a+1], this.misc) || (a+2 < word.length && find(word[a+2], this.vowels))){
									wordsArray.push('o');
								}else{
									wordsArray.push('aw');
								}
						}
						break;
					case 'p': break;
					case 'q': b = false;
						wordsArray.push('k');
						if(word[a+1] == 'u'){
							wordsArray.push('oo');
							a++;
						}
						break;
					case 'r': break;
					case 's':
						if(word[a+1] == 'h' || word[a+1] == 's' && a+2 < word.length){
							wordsArray.push('sh');
							a++;
							b = false;
						}
						break;
					case 't':
						if(word[a+1] == 'h'){
							wordsArray.push('th');
							if(a < word.length-2 && word[a+2] == 'e'){
								if(word.length == 3 || find(word[a+3], this.misc)){
									wordsArray.push('u');
									wordsArray.push('h');
									a++;
								}
							}
							a++;
							b = false;
						}else if(word.slice(a,a+4) == 'tion'){
							wordsArray.push('sh');
							// wordsArray.push('u');
							// wordsArray.push('m');// may have been a typo
							// a += 3;
							b = false;
						}else if(a > 0 && a+1<word.length && word[a+1] == 'y'){
							wordsArray.push('t');
							wordsArray.push('ee');
							a++;
							b = false;
						}
						break;
					case 'u':
						if(a < word.length-2 && find(word[a+1], this.consonants) && find(word[a+2], this.vowels)){
							wordsArray.push('oo');
							b = false;
							break;
						}
						break;
					case 'v': break;
					case 'w': b = false;
						wordsArray.push('oo');
						if(word[a+1] == 'a'){
							wordsArray.push('o');
							a++;
						}
						break;
					case 'x': b = false;
						//reverse order as in wikipedia article for X
						if(a == 0){
							wordsArray.push('z');
						}else if(word.slice(a-2,a+3)=='luxur'){
							wordsArray.push('g');
							wordsArray.push('zh');
						}else if(word == 'flexure' || word.slice(a,a+3) == 'xua' || word.slice(a,a+5) == 'xious' || word.slice(a,a+4) == 'xion'){
							wordsArray.push('k');
							wordsArray.push('sh');
							if(word.slice(a,a+3) == 'xio'){
								a+=2
								wordsArray.push('u');
							}
						}else if(word[a+1]=='e' || word[a+1]=='y'){//before stressed vowel (inaccurate rn)
							wordsArray.push('g');
							wordsArray.push('z');
						}else{
							wordsArray.push('k');
							wordsArray.push('s');
						}
						break;
					case 'y': b = false;
						switch(word[a+1]){
							case 'i':
								a++;
							case 'r':
							case 'l':
								wordsArray.push('aye');
								break;
							case 'o':
								if(a < word.length-2 && word[a+2] == 'u'){
									if(word.length == 3 || find(word[a+3], this.misc)){
										wordsArray.push('ee');
										wordsArray.push('oo');
										wordsArray.push('h');
										a += 2;
										break;
									}
								}
							default:
								wordsArray.push('ee');
						}
						break;
					case 'z': break;
					default:
				}
				if(b){ // true by default
					wordsArray.push(word[a]);
				}
			}else{ // word[a] is the last char in word
				switch(word[a]){
					case 'c':
						wordsArray.push('k');
						break;
					case 'e':
						if (a == 0) wordsArray.push('ee');
						//silent
						break;
					case 'i':
						if(a == 0){ // if 'i' is the only letter
							wordsArray.push('aye');
						}else{
							wordsArray.push('i');
						}
						break;
					case 'o':
						wordsArray.push('o');
						break;
					case 'q':
						wordsArray.push('k');
						break;
					case 's':
						if(wordsArray.length > 0 && find(wordsArray[wordsArray.length-1], this.fortis)){
							wordsArray.push('z');
						}else{
							wordsArray.push('s');
						}
						break;
					case 'w':
						wordsArray.push('oo');
						break;
					case 'x':
						wordsArray.push('k');
						wordsArray.push('s');
						break;
					case 'y':
						// 'ally' vs 'usually' etc makes this tough
						if(a > 0 && find(wordsArray[wordsArray.length-1], this.vowels)){
							wordsArray.push('aye');
						}else{
							wordsArray.push('ee');
						}
						break;
					default:
						wordsArray.push(word[a]);
				}
			}
		}

		for(var a = 0; a < wordsArray.length; a++){
			if(!find(wordsArray[a], this.misc)){
				while(a < wordsArray.length-1 && wordsArray[a] == wordsArray[a+1]){
					wordsArray.splice(a, 1); // remove duplicate
				}
			}
			if(this.imgs[wordsArray[a]] == undefined){
				wordsArray.splice(a, 1);
			}
		}

		if (this == orokin && find(wordsArray[wordsArray.length-1], this.vowels)) wordsArray.push('h');

		if(debug) console.log(word, "->", wordsArray);
		if (debug && suffix.length > 0) console.log(suffix);
		return wordsArray.concat(suffix);
	}
}

//orokin 1999
/*-------------------------------------------------*/

var orokin = new function(){

	/**
	 * Parameters
	 */
	this.folder = "./images/orokin/";
	this.pre = 'o_';
	this.ext = ".png";
	this.centered = true;

	this.currWord = "";
	this.currlit = null; // currWordArray is literal?
	this.currWordArray = [];
	this.phoneticizecache = function(word){
		if(this.currWord != word || this.currlit != override.checked){
			this.currWord = word;
			this.currlit = override.checked;
			this.currWordArray = this.phoneticize(word);
		}
		return this.currWordArray;
	}

	this.spacing = {
		LineHeight: 20,
		SpaceWidth: 22,
		LetterSpacing: 5,
	};
	this.vowelsOffset = 12;

	// categories
	this.vowels = tenno.vowels;
	this.consonants = tenno.consonants;
	this.fortis = tenno.fortis;
	this.misc = tenno.misc;

	this.imgs = [];
	this.chars = tenno.chars;
	for(var ch of this.chars){
		this.imgs[ch] = new Image();
		this.imgs[ch].src = this.folder + this.pre + escapePunctuation(ch) + this.ext;
	}

	this.placeWord = function(ctx, word){
		const chType = {
			Misc: 'misc',
			Vowel: 'vowel',
			Consonant: 'consonant',
			None: 'none'
		};
		let letterOffsetX = 0;
		let img;
		let vowelsInRow = [];
		let vowelsLen = 0;
		
		for(let ch of this.phoneticizecache(word)){
			img = this.imgs[ch];
			
			// Skip unregistered characters
			if(img == undefined) continue;

			// Set type of current character
			let curCh;
			if(find(ch, this.misc)) curCh = chType.Misc;
			else if(find(ch, this.vowels)) curCh = chType.Vowel;
			else curCh = chType.Consonant;

			// Draw character
			switch(curCh){
				case chType.Misc:
					// Draw remaining vowels before misc character
					if(vowelsInRow.length > 0){
						img = new Image();
					
						let cOffsetX = letterOffsetX;
						let vOffsetX = letterOffsetX;
					
						// Remove last letter spacing
						vowelsLen -= this.spacing.LetterSpacing;
					
						if(vowelsLen > img.width){
							cOffsetX += (vowelsLen - img.width) / 2;

							// Draw consonant
							ctx.rect(cOffsetX, this.vowelsOffset, img.width, img.height);
							ctx.drawImage(img, cOffsetX, this.vowelsOffset);
							letterOffsetX += vowelsLen + this.spacing.LetterSpacing;
						}else{
							vOffsetX += (img.width - vowelsLen) / 2;
						
							// Draw consonant
							ctx.rect(cOffsetX, this.vowelsOffset, img.width, img.height);
							ctx.drawImage(img, cOffsetX, this.vowelsOffset);
							letterOffsetX += img.width + this.spacing.LetterSpacing;
						}
					
						// Draw vowels
						for(let vImg of vowelsInRow){
							ctx.rect(vOffsetX, 0, vImg.width, vImg.height);
							ctx.drawImage(vImg, vOffsetX, 0);
							vOffsetX += vImg.width + this.spacing.LetterSpacing;
						}
					
						vowelsInRow = [];
						vowelsLen = 0;

						// reset img to misc ch
						img = this.imgs[ch];
					}

					// Draw misc character
					ctx.rect(letterOffsetX, this.vowelsOffset, img.width, img.height);
					ctx.drawImage(img, letterOffsetX, this.vowelsOffset);
					letterOffsetX += img.width + this.spacing.LetterSpacing;
					break;
				case chType.Vowel:
					vowelsInRow.push(img);
					vowelsLen += img.width + this.spacing.LetterSpacing;
					break;
				case chType.Consonant:

					if(vowelsInRow.length > 0){
						let cOffsetX = letterOffsetX;
						let vOffsetX = letterOffsetX;

						// Remove last letter spacing
						vowelsLen -= this.spacing.LetterSpacing;

						if(vowelsLen > img.width){
							cOffsetX += (vowelsLen - img.width) / 2;
							
							// Draw consonant
							ctx.rect(cOffsetX, this.vowelsOffset, img.width, img.height);
							ctx.drawImage(img, cOffsetX, this.vowelsOffset);
							letterOffsetX += vowelsLen + this.spacing.LetterSpacing;
						}else{
							vOffsetX += (img.width - vowelsLen) / 2;

							// Draw consonant
							ctx.rect(cOffsetX, this.vowelsOffset, img.width, img.height);
							ctx.drawImage(img, cOffsetX, this.vowelsOffset);
							letterOffsetX += img.width + this.spacing.LetterSpacing;
						}

						// Draw vowels
						for(let vImg of vowelsInRow){
							ctx.rect(vOffsetX, 0, vImg.width, vImg.height);
							ctx.drawImage(vImg, vOffsetX, 0);
							vOffsetX += vImg.width + this.spacing.LetterSpacing;
						}

						vowelsInRow = [];
						vowelsLen = 0;
						break;
					}
					
					ctx.rect(letterOffsetX, this.vowelsOffset, img.width, img.height);
					ctx.drawImage(img, letterOffsetX, this.vowelsOffset);
					letterOffsetX += img.width + this.spacing.LetterSpacing;
					break;
				default: break;
			}
		}

		// Draw remaining vowels on end of the word
		if(vowelsInRow.length > 0){
			img = new Image();

			let cOffsetX = letterOffsetX;
			let vOffsetX = letterOffsetX;

			// Remove last letter spacing
			vowelsLen -= this.spacing.LetterSpacing;

			if(vowelsLen > img.width){
				cOffsetX += (vowelsLen - img.width) / 2;
				
				// Draw consonant
				ctx.rect(cOffsetX, this.vowelsOffset, img.width, img.height);
				ctx.drawImage(img, cOffsetX, this.vowelsOffset);
				letterOffsetX += vowelsLen + this.spacing.LetterSpacing;
			}else{
				vOffsetX += (img.width - vowelsLen) / 2;

				// Draw consonant
				ctx.rect(cOffsetX, this.vowelsOffset, img.width, img.height);
				ctx.drawImage(img, cOffsetX, this.vowelsOffset);
				letterOffsetX += img.width + this.spacing.LetterSpacing;
			}

			// Draw vowels
			for(let vImg of vowelsInRow){
				ctx.rect(vOffsetX, 0, vImg.width, vImg.height);
				ctx.drawImage(vImg, vOffsetX, 0);
				vOffsetX += vImg.width + this.spacing.LetterSpacing;
			}

			vowelsInRow = [];
			vowelsLen = 0;
		}
	}

	this.getWordLength = function(word){
		//Same as placeWord function but doesn't draw images and returns "carriage" position
		const chType = {
			Misc: 'misc',
			Vowel: 'vowel',
			Consonant: 'consonant',
			None: 'none'
		};
		let letterOffsetX = 0;
		let img;
		let vowelsInRow = [];
		let vowelsLen = 0;
		
		for(let ch of this.phoneticizecache(word)){
			img = this.imgs[ch];
			
			// Skip unregistered characters
			if(img == undefined) continue;

			// Set type of current character
			let curCh;
			if(find(ch, this.misc)) curCh = chType.Misc;
			else if(find(ch, this.vowels)) curCh = chType.Vowel;
			else curCh = chType.Consonant;

			// Get length of character
			switch(curCh){
				case chType.Misc:
					if(vowelsInRow.length > 0){
						img = new Image();
					
						let cOffsetX = letterOffsetX;
						let vOffsetX = letterOffsetX;
					
						// Remove last letter spacing
						vowelsLen -= this.spacing.LetterSpacing;
					
						if(vowelsLen > img.width){
							cOffsetX += (vowelsLen - img.width) / 2;

							letterOffsetX += vowelsLen + this.spacing.LetterSpacing;
						}else{
							vOffsetX += (img.width - vowelsLen) / 2;

							letterOffsetX += img.width + this.spacing.LetterSpacing;
						}
					
						vowelsInRow = [];
						vowelsLen = 0;

						// reset img to misc ch
						img = this.imgs[ch];
					}

					letterOffsetX += img.width + this.spacing.LetterSpacing;
					break;
				case chType.Vowel:
					vowelsInRow.push(img);
					vowelsLen += img.width + this.spacing.LetterSpacing;
					break;
				case chType.Consonant:

					if(vowelsInRow.length > 0){
						let cOffsetX = letterOffsetX;
						let vOffsetX = letterOffsetX;

						// Remove last letter spacing
						vowelsLen -= this.spacing.LetterSpacing;

						if(vowelsLen > img.width){
							cOffsetX += (vowelsLen - img.width) / 2;
							
							letterOffsetX += vowelsLen + this.spacing.LetterSpacing;
						}else{
							vOffsetX += (img.width - vowelsLen) / 2;

							letterOffsetX += img.width + this.spacing.LetterSpacing;
						}

						vowelsInRow = [];
						vowelsLen = 0;
						break;
					}
					
					letterOffsetX += img.width + this.spacing.LetterSpacing;
					break;
				default: break;
			}
		}

		// Get length of remaining vowels on end of the word
		if(vowelsInRow.length > 0){
			img = new Image();

			let cOffsetX = letterOffsetX;
			let vOffsetX = letterOffsetX;

			// Remove last letter spacing
			vowelsLen -= this.spacing.LetterSpacing;

			if(vowelsLen > img.width){
				cOffsetX += (vowelsLen - img.width) / 2;
				
				letterOffsetX += vowelsLen + this.spacing.LetterSpacing;
			}else{
				vOffsetX += (img.width - vowelsLen) / 2;

				letterOffsetX += img.width + this.spacing.LetterSpacing;
			}

			// Get length of vowels
			for(let vImg of vowelsInRow){
				vOffsetX += vImg.width + this.spacing.LetterSpacing;
			}

			vowelsInRow = [];
			vowelsLen = 0;
		}

		return letterOffsetX - this.spacing.LetterSpacing;
	}

	this.getWordHeight = function(word){
		let height = 0;

		for(ch of this.phoneticizecache(word)){
			let img = this.imgs[ch];
			if(img == undefined) continue;

			let h = img.height + this.vowelsOffset;
			if(h > height) height = h;
		}
		return height;
	}

	this.getWordHeightOffset = function(word){
		return this.vowelsOffset;
	}

	this.literal = tenno.literal;

	this.phoneticize = tenno.phoneticize;
}
