# Voice Mod
This mod is an attempt to revive the voice acting mod (the code part at least). It has a different structure and setup compared to the voice acting mod, notably on the usage of langUids to locate messages (you can't add voices to messages without langUids) and the emphasis of allowing others to add their own content packs.

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
- Packs have the same file structure, your mods will override what's in va-test. That way, you can contribute to a larger project by basically adding your own sound packs. I'll have to figure out load order first. And you could always host your own sound packs elsewhere (ie Google Drive) because GitHub doesn't like binary files, also you get to change them. If there ever is a community sound pack, it'll probably be hosted not on GitHub.
- Added support for the Best-VA bonus code, meaning the voices from this mod and Best-VA doesn't conflict.
- The messages in `database.json` have their own directory, `database/`.
- There's also support for side, offscreen, and dream messages.

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
- In case one of the `common.json` files isn't working, an error will appear on the screen letting you know the directory of the malformed one.

*Coming Soon™*

# TODO Finalization
- Clean up this readme (only do this once you've finished adding all of the core features).
- Clean up the code and comments. The README's final form (when cleaned up) should look like professional documentation on how to use its features rather than a brain dump.

# Cancelled Features
- A system to allow for every modder to set up a voice pack in their own modding directory. This was planned with the intention of allowing modders to add voices to their own mods. This would've allowed other mods to have self-contained voices that came with the package.
	- I decided to cancel this feature when I realized how unnecessary all of this was. If a modder even decides to make voices for their own mods, it'll be a minor inconvenience at worst to make users have to move a folder. Plus, this'll keep everything in one place, either the main `voice/` folder or a voice pack in `packs/`, because other modders would also have to account for having a `voice/` directory unrelated to this mod as well as having to setup `voicemod.json` if they wanted to reroute the `voice/` folder. In doing this, I also cancelled an idea which would've allowed people to define their own paths instead of the default ones. Again, more headaches than necessary.
- A feature in `common.json` which would've allowed for choosing a sound (or a random sound of an array) based on a regex filter of what the text was and/or the expression(s) the character had. It would function much like the Best-VA voices do with its ability to select arbitrary text and filter the sounds it could have.
	- I decided to cancel this feature because it didn't fit the design perspective of this mod (also I was too lazy to implement it). But for the most part, I think it'd be better to have a separate mod which basically uses the system Best-VA provides instead of reinventing the wheel. The voice mod is meant to provide specificity rather than generality.
- A feature in `common.json` which would've allowed the user to use a wildcard `"*"` instead of an array of langUids to apply a certain sound to all messages (maybe even ones without langUids) unless otherwise specified. You could make entire maps silent with this for example.
	- This mostly would've been used to make entire maps silent. Another cancelled feature related to this would be the ability to toggle whether beeps should play at all. I'm thinking that a separate mod to handle this case would be better.
- The ability to add voices to all messages with langUids. This would've allowed for narration of certain messages (like debug or tutorial messages), and overall more versatility.
	- This isn't completely cancelled, as I might end up adding it in the future, but I've decided to put this out of the scope of the main release. The ones that make the most sense to add voices to are `SHOW_MSG`, `SHOW_SIDE_MSG`, `SHOW_OFFSCREEN_MSG`, and `SHOW_DREAM_MSG`. As for the message model itself, it has insane levels of abstraction I just don't understand. What'd you would've missed though is the following:
		- `SHOW_AR_MSG`: Stuff like the Login and Logout text.
		- `SHOW_BOARD_MSG`: What shows up in Direct Links.
		- `SHOW_CENTER_MSG`: "Update your save file!"
		- `SHOW_GET_MSG`: Getting more SP, getting an item, etc.
		- `SHOW_TUTORIAL_MSG`: Tutorial stuff.
		- `SHOW_TUTORIAL_PLAYER_MSG`: Tutorial stuff.