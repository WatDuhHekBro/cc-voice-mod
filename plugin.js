// To quote @Emiliyah, "To handle paths, use this [https://github.com/CCDirectLink/hardcoded-config-injector/blob/master/util.js] file." Will attempt to implement in a future version.
const fs = require('fs');
const path = require('path');
var voicemod; // This will be used to reference the Plugin while injecting code since "this" no longer references the Plugin while inside those code blocks.

export default class VoiceMod extends Plugin
{
	/*
	[Field Variables]
	- MOD_NAME (String): The referenceable name of the mod.
	- BASE_DIR (String): The top-level directory of the mod. Follows as "assets/mods/<MOD_NAME>/".
	- RELATIVE_DIR (String): The directory of the mod relative to "assets/". Follows as "mods/<MOD_NAME>/".
	- VOICE_DIR (String): The main directory used for voices. Lowest priority when it comes to overriding.
	- PACKS_DIR (String): The secondary directory used for voices. Middle priority when it comes to overriding.
	- COMMON_DIR (String): The subdirectory used for reused dialogue. Must be the same across all voice packs!
	- DATABASE_DIR (String): The subdirectory used for database dialogue. Must be the same across all voice packs!
	- MAPS_DIR (String): The subdirectory used for dialogue from individual maps. Must be the same across all voice packs!
	- COMMON (Object): Contains commonly used events for reused dialogue and/or silent dialogue (no sound, no beeps).
	- beep (Boolean): Determines whether the text makes sound whenever it progresses. Turned off for lines with voice or lines that are declared silent.
	*/
	
	constructor(mod)
	{
		super(mod);
		//this.mod = mod; // Do I need this if I already initialized all the required variables?
		voicemod = this;
		this.MOD_NAME = mod.name;
		this.BASE_DIR = mod.baseDirectory;
		this.RELATIVE_DIR = this.BASE_DIR.substring(7); // Gets rid of "assets/".
		this.VOICE_DIR = 'voice/';
		this.PACKS_DIR = 'packs/';
		// Note: If you're going to use this for consistency between different packs, maybe remove this.VOICE_DIR in a future release.
		this.COMMON_DIR = this.VOICE_DIR + 'common/';
		this.DATABASE_DIR = this.VOICE_DIR + 'database/';
		this.MAPS_DIR = this.VOICE_DIR + 'maps/';
	}
	
	// Order: Constructor, Preload-Async, Preload, Postload-Async, Postload, Prestart-Async, Prestart, Main-Async, Main.
	async preload() {}
	async postload() {}
	async prestart() {}
	
	async main()
	{
		this.COMMON = await simplify.resources.loadJSON('mods/voice-mod/voice/common.json'); // Async Main Required
		this.beep = true;
		
		ig.EVENT_STEP.SHOW_MSG.inject({
			voice: null,
			init: function()
			{
				this.parent(...arguments);
				this.voice = voicemod.getVoice(this.message); // This is placed after the parent code because you need to initialize this.message first.
			},
			start: function()
			{
				// This is placed above the voice start to avoid stopping the current line.
				new ig.EVENT_STEP.STOP_SOUND({'name':'voice'}).start();
				
				// This is placed before the parent code because you want to figure out if you want to stop the beeps before the message box is instantiated.
				if(this.voice)
				{
					this.voice.start();
					voicemod.beep = false;
				}
				else
					voicemod.beep = true;
				
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
				this.beepSound = voicemod.beep ? this.beepSound : null; // This is placed before the beepSound is used to let this script determine whether there is a beep or not.
				return this.parent(...arguments); // The original function returns a value, so you have to return the parent call, otherwise it'll throw an error.
			}
		});
	}
	
	getVoice(message)
	{
		// Potential problems with database entries!
		var map = ig.game.mapName || simplify.getActiveMapName(); // i.e. hideout.entrance
		map = map.replace(/\./g,'/'); // i.e. hideout.entrance --> hideout/entrance
		var id = message.data.langUid; //either undefined or a number
		
		if(id) //id !== undefined
		{
			// The "Map" Case
			if(fs.existsSync(path.join(this.BASE_DIR, this.MAPS_DIR, map, id + '.ogg'))) // i.e. "assets/mods/va-test/sounds/maps/hideout/entrance/#.ogg" exists
				return new ig.EVENT_STEP.PLAY_SOUND({'sound': path.join(this.BASE_DIR.substring(7), this.MAPS_DIR, map, id + '.ogg'), 'name':'voice'});
			// Add future cases here
		}
		else
			return null;
	}
}