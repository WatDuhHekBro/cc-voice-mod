# Voice Mod
This mod is an attempt to revive the voice acting mod (the code part at least). It has a different structure and setup compared to the voice acting mod, notably on the usage of langUids to locate messages (you can't add voices to messages without langUids) and the emphasis of allowing others to add their own content packs or voices from external mods.

# Major Changes from [CCVoiceActing](https://github.com/CCDirectLink/CCVoiceacting)
- **Structural:** Instead of loading a file table that defines where to split each track and which langUids to apply each segment to, sound files are loaded automatically upon playing a new message with a langUid.
	- The downside to this is that the user has to manually split lines using a tool like [Audacity](https://www.audacityteam.org/).
	- The upside to this is that the user doesn't have to manually add in entries in some definitions file.
- **Implementation:** The plan is to allow for other mods to integrate their own voice packs instead of only allowing for one central source. Voices can be added through three ways:
	- The first and most simple is to add voices to the centralized `voice/` directory. This is useful in case there's a centralized pack.
	- The second is to add voice packs to the `packs/` directory. The structure of each pack is the same as the `voice/` directory, as including `voice/` itself would be redundant. Its purpose is to allow for many people to add their own voice packs without the user having to worry about merging conflicts.
	- The third is to add voice packs from other mods, which is done by adding a `voice/` directory in the top layer. This works the same as the above, though is intended for only voices added to the mod itself.
- To avoid having to copy paste certain lines that are commonly used, a `common.json` table will be used to either select a common sound and apply it to or silence the selected lines.

# TODO List (There's a lot that isn't done yet!)
- Add database support/detection.
- Add support for external voices in mods. (Same file structure, your mods will override what's in va-test. That way, you can contribute to a larger project by basically adding your own sound packs. I'll have to figure out load order first. And you could always host your own sound packs elsewhere (ie Google Drive) because GitHub doesn't like binary files, also you get to change them. If there ever is a community sound pack, it'll probably be hosted not on GitHub. And ofc, merging multiple common.json files is going to be tough.)
- Add a common words JSON linker, such as Lea's words (so you don't have to copy paste them a bunch of times).
- Add support for other languages. But also make an option to play everything from one language regardless of selected language.
- Stop sounds whenever you move to another room.
- Cut off previous voices when you move onto the next dialogue. (Also make sure Skip Cutscene doesn't overload on voices.)
- Figure out if you can get the mod name without having to set it.
- Get rid of dialog-beep-2.ogg, only when there is no voice. But also have an option to have a completely silent line, no beeps, no voice. (Implement common.json first!)
- You could also include regex message or expression detections, like the Best-VA thing uses for Lea's words. That could be a more complex use of common.json.
- Add support for side messages and off-screen messages.
- Maybe add support for people who want to reroute the `voice/` directory in their own mods.
- Get OBS to work with CCLoader