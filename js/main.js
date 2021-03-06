var zoomLev;
function CheckSizeZoom() {
	var minW = 750;
    zoomLev = $(window).width() / minW;
    setZoom();
}
function resetZoom() {
	zoomLev = 1;
	setZoom();
}
function setZoom(){
	$(document.body).css('zoom', zoomLev);
    var bottom = $('#game').height()*zoomLev;
	var bottomOfVisibleWindow = $(window).height();
	var half = (bottomOfVisibleWindow-bottom)/3;
	$(document.body).css('margin-top', half+'px');
}
jQuery(document).ready(function($){


    $(window).resize(CheckSizeZoom);
    
    resetZoom();

    $('#game').css('visibility', 'visible');

    scene('menu');

	$('#game').on('click',function(e){

		if($('#sprite').length) {
			if(!glowaction) {
				var target = e.offsetX / zoomLev;
				//walk to position
				walkto(target, 10);
			}
			glowaction = false;
		}
	});

	$('#inventory div').on('click',function(){
		if($('#text').text() === "") {
			if($(this).hasClass('has')) {
				$('.target').css('background-image', $(this).css('background-image'));
				$('#inventory .active').removeClass('active');
				$(this).addClass('active');
				$('a').css('cursor', $(this).css('background-image')+', auto');
			}
		}
		return false;
	});

	$('#sprite').on('click', function(e){
		e.preventDefault();
	});
	$('#game').on('mousedown touchstart', function(){
		if($('#sprite').length) {
			pressing = true;
			setTimeout(function(){
				if(pressing) {
					$('#game a').addClass('glowing');
					pressing = false;
					glowaction = true;
				}
			}, 1000);
		}
	});
	$('#game').on('mouseup touchend', function(){
		if($('#sprite').length) {
			pressing = false;
			$('#game a').removeClass('glowing');
		}
	});
	$('#text').on('click', function(){
		if($(this).children('span').length === 0) {
			$('#text').hide();
			$("#text").text('');
			closedtext();
			return false;
		}
	});

});
var closedtext = function() { };
var pressing = false;
var glowaction = false;
var walking = {};
function walkto(target, targetwidth, id){
	//only do something if there is no dialogue happening
	if($("#text").text() == "") {
		if(walking.animation){
			cancelAnimationFrame(walking.animation);
		}

		walking.sprite = $('#sprite');
		walking.sprite.addClass('walking');
		walking.pos = walking.sprite.position();
		walking.pos = walking.pos.left;
		walking.target = target;
		walking.targetwidth = targetwidth;
		walking.id = id;
		walking.diff = walking.target - walking.pos;
		if(typeof states.speed == 'undefined') {
			states.speed = 8;
		}
		walking.step = states.speed;
		if(walking.diff < 0) {
			//face left
			walking.sprite.removeClass('right');
			walking.step *= -1;
		} else {
			//face right
			walking.sprite.addClass('right');
		}
		if(walking.pos < (walking.target +walking.targetwidth + 10) && (walking.pos+26) > (walking.target - 10)) {
			walking.sprite.removeClass('walking');
			cancelAnimationFrame(walking.animation);
			if(id !== undefined) {
				//save the game
				save();
				arrivedat(walking.id);
				globalarrivedat(walking.id);
			}
		} else {
			walking.animation = requestAnimationFrame(walk);
			walking.lastFrame = +new Date;
		}
	}
}
function walk(){
	var now = +new Date;
	if(now > (walking.lastFrame + 110)) {
		walking.lastFrame = now;
		walking.pos = walking.sprite.position();
		walking.pos = walking.pos.left;
		walking.sprite.css('left', walking.pos+walking.step);
	}
	if(walking.pos < (walking.target +walking.targetwidth + 10) && (walking.pos+26) > (walking.target - 10)) {
		save();
		cancelAnimationFrame(walking.animation);
		walking.sprite.removeClass('walking');
		if(walking.id !== undefined) {
			arrivedat(walking.id);
			globalarrivedat(walking.id);
		}
	} else {
		walking.animation = requestAnimationFrame(walk);
	}
}
var states = {};
function save(){
	if($('#sprite').length){
		var pos = $('#sprite').position();
		var inventory = [];
		$('#inventory .has').each(function(){
			if($(this).attr('data-tool') !== 'eye' && $(this).attr('data-tool') !== 'hand') {
				inventory.push($(this).attr('data-tool'));
			}
		});
		localStorage.game = JSON.stringify({
			scene: $('#game').attr('data-scene'),
			left: pos.left,
			inventory: inventory,
			states: states
		});
	}
}
function load(){
	if(localStorage.game.length > 0) {
		var game = JSON.parse(localStorage.game);
		states = game.states;
		for(var i in game.inventory){
			$('#inventory .has:last').next().addClass('has').attr('data-tool', game.inventory[i]);
		}
		scene(game.scene);
		if($('#sprite').length){
			$('#sprite').css('left', game.left+"px");
		}
	} else {
		$('#newgame').click();
	}
}
function hastool(tool){
	return $('#inventory [data-tool='+tool+']').length;
}

function say(text, color){
	args = { text: text, color: color };
	setTimeout((function(){
		if(typeof this.color === 'undefined') {
			this.color = '#91f256';
		} else {
			this.text = '"'+this.text+'"';
		}
		var t = $('#text');
		t.text(this.text).show();
		if(this.text === '') {
			t.hide();
		}
		t.addClass('say');
		t.css('color', this.color);
	}).bind(args), 0);
}
function ask(options) {
	var t = $('#text');
	h = "";
	for(var i in options){
		h += "<span data-say='"+i+"'>\""+options[i]+"\"</span>";
	}
	t.removeClass('say');
	t.html(h).show();
	t.css('color', '#91f256');
}
function scene(thescene){
	closedtext = function() { };
	save();
	console.log('loading '+thescene);
	$('#sprite').attr('style', '');
	$('#scene').html(ich[thescene]());
	$('#game').attr('data-scene', thescene);
	$('a').on('click touchup',function(){
		//walk to the object
		if(!$(this).hasClass('target')){
			var pos = $(this).position();
			var target = pos.left;
			if($('#sprite').hasClass('right')){
				target -= ($('#sprite').width());
			}
			walkto(target, $(this).width(), $(this).attr('id'));
		}
		return false;
	});
	$('a').css('cursor', $('#inventory .active').css('background-image')+', auto');
	globalscene();
}
function current_tool(){
	return $('#inventory .active').attr('data-tool');
}
function add_tool(tool){
	if($('#inventory div:not(.has):first').length) {
		$('#inventory div:not(.has):first').addClass('has').attr('data-tool', tool);
	} else {
		say("I can't carry anything else!");
		return false;
	}
	save();
	return true;
}
function lose_tool(tool){
	$('#inventory [data-tool='+tool+']').removeClass('has').attr('data-tool', '');
	$('#inventory [data-tool=eye]').click();
	save();
}

var isPlaying = false;
var readyStateInterval = null;
