const fs = require('fs');
const path = require('path');

const mod_name = 'voice-mod';
const base_dir = simplify.getMod(mod_name).baseDirectory;
const sounds_dir = 'voice/';
const database_dir = sounds_dir + 'database/';
const maps_dir = sounds_dir + 'maps/';

var COMMON;
var beep = true;

function getVoice(message)
{
	// Potential problems with database entries!
	var map = ig.game.mapName || simplify.getActiveMapName(); //hideout.entrance
	map = map.replace(/\./g,'/'); //hideout.entrance --> hideout/entrance
	var id = message.data.langUid; //either undefined or a number
	
	//base_dir.substring(7) gets rid of assets/
	if(id && fs.existsSync(path.join(base_dir, maps_dir, map, id+'.ogg'))) //id !== undefined && "assets/mods/va-test/sounds/maps/hideout/entrance/#.ogg" exists
		return new ig.EVENT_STEP.PLAY_SOUND({'sound': path.join(base_dir.substring(7), maps_dir, map, id+'.ogg'), 'name':'voice'});
	else
		return null;
}

ig.EVENT_STEP.SHOW_MSG.inject({
	voice: null,
	init: function()
	{
		this.parent(...arguments);
		this.voice = getVoice(this.message); // This is placed after the parent code because you need to initialize this.message first.
	},
	start: function()
	{
		// This is placed above the voice start to avoid stopping the current line.
		new ig.EVENT_STEP.STOP_SOUND({'name':'voice'}).start();
		
		// This is placed before the parent code because you want to figure out if you want to stop the beeps before the message box is instantiated.
		if(this.voice)
		{
			this.voice.start();
			beep = false;
		}
		else
			beep = true;
		
		this.parent();
	}
});

// Redefine PLAY_SOUND to allow for named sounds without requiring that those sounds are looped. This creates the problem that adding named sounds could clog up memory without knowing about it (since you don't have the sound on loop to receive feedback about it). Luckily, this actually solves two problems at once: By clearing previous voice sounds upon starting a new SHOW_MSG event, you avoid the memory clog on the ig.soundManager.namedSounds stack as well as have the ability to stop previous dialogue should the player want to skip over certain lines of dialogue. At worst, you'll be stuck with one unused voice sound which'll clear on the next message or transition to another room. //
ig.EVENT_STEP.PLAY_SOUND.inject({
	start: function()
	{
		var a = this.sound.play(this.loop, this.settings);
		
		if(this.name)
			ig.soundManager.addNamedSound(this.name, a);
		
		a && this.position && a.setFixPosition(this.position, null);
	}
});

// This is to stop all voices when moving from room to room.
// ERROR: Apparently I can't inject events into ig.Game? Adding the code in game.compiled.js directly works as expected.
ig.Game.inject({
	teleport: function()
	{
		new ig.EVENT_STEP.STOP_SOUND({'name':'voice'}).start();
		console.log('teleport event');
		this.parent(...arguments);
	}
});

ig.MessageOverlayGui.Entry.inject({
	// Injecting into the init function isn't used here because this is called once/twice whenever a person is added, not whenever a message pops up.
	addMessage: function()
	{
		// The advantage of injecting code into this rather than sc.MsgBoxGui's init function is that you don't have to worry about messing with ig.dreamFx.isActive(), whether there's a dream going on.
		this.beepSound = beep ? this.beepSound : null; // This is placed before the beepSound is used to let this script determine whether there is a beep or not.
		return this.parent(...arguments); // The original function returns a value, so you have to return the parent call, otherwise it'll throw an error.
	}
});

/*sc.MsgBoxGui.inject({
	init: function()
	{
		this.parent(...arguments);
		this.text.setBeepSound(beep && !ig.dreamFx.isActive() ? this.text.beepSound : null); // This is placed after the parent code because it'll override the previous beep setting. Make sure to include whether there's a dream or not, since you're basically overriding the code of ig.MessageOverlayGui.Entry.init();
	}
});*/

// Simplify's loadJSON function returns a Promise, so you have to await it asynchronously.
(async() => {
	BEEPS = await simplify.resources.loadJSON('mods/' + mod_name + '/voice/common.json');
})();