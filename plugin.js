const fs = require('fs');
const path = require('path');
// In the future, see if there's a way to do all this asynchronously. It's not good to hold up the system like this.

export default class VoiceMod extends Plugin
{
	/*
	[Field Variables]
	- MOD_NAME (String): The referenceable name of the mod.
	- BASE_DIR (String): The top-level directory of the mod. Follows as "assets/mods/<MOD_NAME>/".
	- RELATIVE_DIR (String): The directory of the mod relative to "assets/". Follows as "mods/<MOD_NAME>/".
	- VOICE_DIR (String): The main directory used for voices. Lowest priority when it comes to overriding.
	- PACKS_DIR (String): The secondary directory used for voices. Middle priority when it comes to overriding.
	- COMMON_FILE (String): The filename used for the JSON file determining reused dialogue. Must be the same across all voice packs!
	- COMMON_DIR (String): The subdirectory used for reused dialogue. Must be the same across all voice packs!
	- DATABASE_DIR (String): The subdirectory used for database dialogue. Must be the same across all voice packs!
	- MAPS_DIR (String): The subdirectory used for dialogue from individual maps. Must be the same across all voice packs!
	- LANG_DIR (String): The subdirectory used for implementing voices on different languages. Must be the same across all voice packs!
	- COMMON (Object): Contains commonly used events for reused dialogue and/or silent dialogue (no sound, no beeps).
	- beep (Boolean): Determines whether the text makes sound whenever it progresses. Turned off for lines with voice or lines that are declared silent.
	
	[Directories] (Set in order of reverse precedence so that when looping through the list, later settings overwrite previous settings.)
	assets/mods/voice-mod/voice/...
	assets/mods/voice-mod/packs/<pack>/...
	
	It doesn't make sense to have a different object for keeping track of all the packs. Instead, it'll just be an array of pack names, the rest of the path is already taken care of.
	["demo-pack", ...]
	Then just use assets/mods/voice-mod/packs/demo-pack/...
	*/
	
	// Database: ig.EVENT_STEP.TRIGGER_COMMON_EVENTS?
	
	constructor(mod)
	{
		super(mod);
		//this.mod = mod; // Do I need this if I already initialized all the required variables?
		this.MOD_NAME = mod.name;
		this.BASE_DIR = mod.baseDirectory;
		this.RELATIVE_DIR = this.BASE_DIR.substring(7); // Gets rid of "assets/".
		this.VOICE_DIR = 'voice/';
		this.PACKS_DIR = 'packs/';
		this.PACKS = this._getPacks();
		// These will remain the same for the main voices and packs.
		this.COMMON_FILE = 'common.json';
		this.COMMON_DIR = 'common/';
		this.DATABASE_DIR = 'database/';
		this.MAPS_DIR = 'maps/';
		this.LANG_DIR = 'lang/';
		this.beep = true;
		this.bestva = false; // If bestva is being used, disable all beeps.
	}
	
	// Order: Constructor, Preload-Async, Preload, Postload-Async, Postload, Prestart-Async, Prestart, Main-Async, Main.
	// Injecting works in Prestart and Main.
	async preload() {}
	async postload() {}
	
	async prestart()
	{
		this._inject(this);
	}
	
	async main()
	{
		// common.json overriding works like this: You have your object and add onto it based on the order of this.DIRECTORIES. If a property exists in the index of this.DIRECTORIES, then overwrite it.
		this.COMMON = await simplify.resources.loadJSON(this.RELATIVE_DIR + this.VOICE_DIR + this.COMMON_FILE); // Async Main Required
		this._injectMain(this);
	}
	
	_getVoice(langUid) // langUid is either undefined or a number
	{
		// Potential problems with database entries!
		var map = ig.game.mapName; // ie hideout.entrance
		var lang = ig.currentLang; // en_US, de_DE, zh_CN, ja_JP, ko_KR, etc.
		var src;
		
		if(langUid && map) // If langUid !== undefined && map !== undefined/null
		{
			map = map.replace(/\./g,'/'); // ie hideout.entrance --> hideout/entrance, placed here just in case map is undefined (like if you're in the title screen).
			// The order here is based on precedence. A language setting overrides the default case, but the default case overrides common events (with the logic that if you're declaring a specific sound file, it should override commonly used ones which might be there by mistake).
			
			// Loops through the main directory and all the packs. Later entries will override previous entries.
			for(var i = 0; i < this.PACKS.length; i++)
			{
				var pack = this.PACKS[i] ? this.PACKS_DIR + this.PACKS[i] : this.VOICE_DIR;
				
				// The "Specific Language" (Map) Case
				if(fs.existsSync(path.join(this.BASE_DIR, pack, this.LANG_DIR, lang, this.MAPS_DIR, map, langUid + '.ogg'))) // ie "assets/mods/<MOD_NAME>/voice/maps/hideout/entrance/#.ogg" exists
					src = path.join(this.RELATIVE_DIR, pack, this.LANG_DIR, lang, this.MAPS_DIR, map, langUid + '.ogg');
				// The "Map" Case
				else if(fs.existsSync(path.join(this.BASE_DIR, pack, this.MAPS_DIR, map, langUid + '.ogg'))) // ie "assets/mods/<MOD_NAME>/voice/maps/hideout/entrance/#.ogg" exists
					src = path.join(this.RELATIVE_DIR, pack, this.MAPS_DIR, map, langUid + '.ogg');
				// The "common.json" (Map) Case
				else if(this.COMMON[map]) // ie If a common.json entry of "hideout/entrance" exists. This works on everything except "special:database" which will be its own case.
				{
					// Loop through the sounds defined in each map.
					for(var sound in this.COMMON[map])
					{
						// Loop through the array of langUids per sound.
						for(var j = 0; j < this.COMMON[map][sound].length; j++)
						{
							// If langUids match, fetch the sound.
							if(langUid === this.COMMON[map][sound][j])
							{
								if(sound.includes(':'))
								{
									var protocol = sound.substring(0, sound.indexOf(':')); // ie "external" or "special"
									var arg = sound.substring(sound.indexOf(':')+1);
									
									// "external" will allow the user to access mods outside the "common" folder.
									if(protocol === 'external')
										src = arg;
									else if(protocol === 'special')
									{
										if(arg === 'silence')
											this.beep = false; // Temporarily set beep to false to access this setting outside of 
										// Add future cases
									}
								}
								else
									src = path.join(this.RELATIVE_DIR, pack, this.COMMON_DIR, sound + '.ogg');
							}
						}
					}
				}
			}
		}
		
		return src ? new ig.EVENT_STEP.PLAY_SOUND({'sound':src, 'name':'voice'}) : null;
	}
	
	// "mod" will be used to reference the plugin while injecting code since "this" no longer references the plugin while inside those code blocks.
	_inject(mod)
	{
		ig.EVENT_STEP.SHOW_MSG.inject({
			voice: null,
			beep: true,
			init: function()
			{
				this.parent(...arguments);
				this.voice = mod._getVoice(this.message.data.langUid); // This is placed after the parent code because you need to initialize this.message first.
				// Retain whether or not this message should beep and reset beep to allow for beeps on non-SHOW_MSG messages.
				this.beep = mod.beep;
				mod.beep = true;
			},
			start: function()
			{
				// This is placed above the voice start to avoid stopping the current line.
				new ig.EVENT_STEP.STOP_SOUND({'name':'voice'}).start();
				
				// This is placed before the parent code because you want to figure out if you want to stop the beeps before the message box is instantiated.
				if(this.voice)
				{
					this.voice.start();
					this.beep = false;
					mod.bestva = false;
				}
				
				mod.beep = this.beep; // Set beep if there was a custom setting involved. If there's voice, it'll be set to false anyway.
				sc.voiceActing.load();
				this.parent();
				mod.bestva = true;
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
		// And apparently I can't inject into this unless I put it in prestart.
		ig.Game.inject({
			teleport: function()
			{
				new ig.EVENT_STEP.STOP_SOUND({'name':'voice'}).start();
				this.parent(...arguments);
			}
		});
		
		ig.MessageOverlayGui.Entry.inject({
			// Injecting into the init function isn't used here because this is called once/twice whenever a person is added, not whenever a message pops up.
			addMessage: function()
			{
				// The advantage of injecting code here rather than sc.MsgBoxGui's init function is that you don't have to worry about messing with ig.dreamFx.isActive(), whether there's a dream going on.
				// This is placed before the beepSound is used to let this script determine whether there is a beep or not.
				// Additionally, if mod.beep is true but this.beepSound is still null, then reset it. [ERROR: null when testing hideout/entrance, will (probably) conflict with undertale-sfx.] This is just a band aid.
				this.beepSound = mod.beep ? (this.beepSound ? this.beepSound : new ig.Sound("media/sound/hud/dialog-beep-2.ogg", 1, 0.02)) : null;
				return this.parent(...arguments); // The original function returns a value, so you have to return the parent call, otherwise there'll be an error.
			}
		});
		
		/*sc.MsgBoxGui.inject({
			init: function()
			{
				this.parent(...arguments);
				//console.log(this);
			}
		});
		
		// Database
		sc.CommonEvents.inject({
			triggerEvent: function()
			{
				this.parent(...arguments);
				console.log(this);
			}
		});*/
		
		sc.MessageModel.inject({
			showMessage: function(a, b, c)
			{
				this.boardSide || this.clearBoardMsg();
				this._checkActivePerson(a);
				this.blocking = true;
				this.autoContinue = c;
				ig.interact.addEntry(this.screenInteract);
				ig.interact.setBlockDelay(0.1);
				sc.Model.notifyObserver(this, sc.MESSAGE_EVENT.NEW_MESSAGE,
				{
					name: a,
					text: b
				});
				if(a = this.currentPeople[a])
				{
					if(mod.bestva)
						sc.voiceActing.play(a.charExpression, b);
					this.showSideMessage(a.charExpression, b, true)
				}
			}
		});
	}
	
	_injectMain(mod)
	{
		ig.EVENT_STEP.SHOW_MSG.inject({
			init: function()
			{
				this.parent(...arguments);
				
				if(sc.voiceActing.active)
					this.beep = false;
			}
		});
	}
	
	_getPacks()
	{
		// The idea behind putting a null as the first item in packs is that when looping through these packs, the first one will route to "voice/".
		var packs = [null];
		// Reads what's in "assets/mods/<MOD_NAME>/packs/" if "packs/" exists. ie ["demo-pack"] //
		var list = fs.existsSync(path.join(this.BASE_DIR, this.PACKS_DIR)) ? fs.readdirSync(path.join(this.BASE_DIR, this.PACKS_DIR)) : [];
		
		// For each entry in "packs/", if it's a folder, then add it to packs. //
		for(var i = 0; i < list.length; i++)
			if(fs.statSync(path.join(this.BASE_DIR, this.PACKS_DIR, list[i])).isDirectory())
				packs.push(list[i]);
		
		return packs;
	}
}