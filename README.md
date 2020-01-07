# Voice Mod
This mod is an attempt to revive the voice acting mod (the code part at least). It has a different structure and setup compared to the voice acting mod, notably on the usage of langUids to locate messages (you can't add voices to messages without langUids) and the emphasis of allowing others to add their own content packs or voices from external mods.

# Major Changes from [CCVoiceActing](https://github.com/CCDirectLink/CCVoiceacting)
- **Structural:** Instead of loading a file table that defines where to split each track and which langUids to apply each segment to, sound files are loaded automatically upon playing a new message with a langUid.
	- The downside to this is that the user has to manually split lines using a tool like [Audacity](https://www.audacityteam.org/).
	- The upside to this is that the user doesn't have to manually add in entries in some definitions file.
- **Implementation:** The plan is to have one centralized location and allow for content packs to be installed in addition. There are 2 ways to add voices:
	- The first and most simple is to add voices to the centralized `voice/` directory. This is useful in case there's a centralized pack.
	- The second is to add voice packs to the `packs/` directory. The structure of each pack is the same as the `voice/` directory, as including `voice/` itself would be redundant. Its purpose is to allow for many people to add their own voice packs without the user having to worry about merging conflicts.
		- For example, let's say that there is a community voice acting pack that you're using, installed in the `voice/` directory. But say that someone else created voices for Lea that you like better than the one in the community pack. You would install this secondary voice pack in `packs/` and could have the voice in `packs/` overwrite the community pack without having to replace files.
		- This is also where you'd place voice packs for other mods if there are any.
- To avoid having to copy paste certain lines that are commonly used, a `common.json` table will be used to either select a common sound and apply it to or silence the selected lines.

# Other Features
- Previous voices are cut off when you move onto the next line. This means the player doesn't have to wait for a voice line to be finished to not have multiple voices going on at the same time. `Skip Cutscene` also won't overload on voices because of this. Voices also cut off whenever you move to another room.
- Dialogue beeps only appear when there is no voice and the line isn't declared silent in `common.json`.
- Added language support (which will override default language files, directory is `voice/lang/<LangID>/...`). While using `en_US` might sound redundant, it's important to remember that the default `voice/` directory doesn't have a language preference, which functions as a fallback in case there is no specific language setting set.
	- For example, if a [Korean modder](https://github.com/2hh8899) were to create content and add voices in their native language, they would use the default directory as that would best capture the author's original intent for the scenes. Then, you could add lines to `en_US`. In the case where `en_US` doesn't show up, the original voice files serve as a fallback.

# Overriding & Precedence
Since one of the goals of this mod is to allow for many people to submit their own voice packs, there will have to be rules on overriding due to potential conflicts.

Within each voice pack, there are 2 layers of precedence.
1. This level of precedence is based upon the current language setting the player has enabled, found in `voice/lang/<LangID>/`. It will override the main voice line, but only if the user has the same language selected.
2. This level of precedence is the default one, and is useful for a centralized community voice acting pack, where everything is already decided.

And when looking outward, there are 2 layers of precedence, with each layer following the rules described above.
1. Packs, found in the `packs/` directory, are meant to serve as addons, which are meant to be focused on one particular aspect, e.g. a character's voice.
2. Last, but definitely not least, is the actual main `voice/` directory itself. This is recommended for most purposes.

When considering which order/precedence level to use, you should start with the bottom and work your way up only when you have a valid reason to do so. When in doubt, just use the lowest precedence.

# common.json
*Coming Soon™*

# TODO List (There's a lot that isn't done yet!)
- Add database support/detection.
- Add support for ~~external voices in mods~~ packs (*will packs load alphabetically? ie Z overwrites A*). (Same file structure, your mods will override what's in va-test. That way, you can contribute to a larger project by basically adding your own sound packs. I'll have to figure out load order first. And you could always host your own sound packs elsewhere (ie Google Drive) because GitHub doesn't like binary files, also you get to change them. If there ever is a community sound pack, it'll probably be hosted not on GitHub. And ofc, merging multiple common.json files is going to be tough.)
	- Treat every pack the same in the code to make it easier.
- You could also include regex message or expression detections, like the Best-VA thing uses for Lea's words. That could be a more complex use of common.json.
- Add support for side messages and off-screen messages.
- Get OBS to work with CCLoader
- Maybe work on an Audacity plugin to make splitting voice files easier and more systematic.
- Clean up this readme (only do this once you've finished adding all of the core features).
- Add the possibility of adding voice to all messages with langUids, including off screen messages (which can be voiced with distant or echo-ish features), since everything's based on langUids. This would also allow narration... meh ¯\\\_(ツ)_/¯.
- Maybe add a try-catch statement when dealing with `common.json` to allow for user errors instead of crashing the game?

# Cancelled Features
- A system to allow for every modder to set up a voice pack in their own modding directory. This was planned with the intention of allowing modders to add voices to their own mods. This would've allowed other mods to have self-contained voices that came with the package.
	- I decided to cancel this feature when I realized how unnecessary all of this was. If a modder even decides to make voices for their own mods, it'll be a minor inconvenience at worst to make users have to move a folder. Plus, this'll keep everything in one place, either the main `voice/` folder or a voice pack in `packs/`, because other modders would also have to account for having a `voice/` directory unrelated to this mod as well as having to setup `voicemod.json` if they wanted to reroute the `voice/` folder. In doing this, I also cancelled an idea which would've allowed people to define their own paths instead of the default ones. Again, more headaches than necessary.