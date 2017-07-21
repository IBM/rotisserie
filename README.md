# pubgredzone

Continuation/reiteration and port from BASH to node.js of [top-streams-player-unknown-battlegrounds](https://github.com/nibalizer/top-streams-player-unknown-battlegrounds).

pubgredzone takes the concept of the [red zone](https://en.wikipedia.org/wiki/Red_zone_(gridiron_football))
in American football and applies it to the popular online battle royale game
[PLAYERUNKNOWN'S BATTLEGROUNDS](https://www.playbattlegrounds.com/main.pu). The
idea is to always be viewing the most popular PUBG twitch stream with the least
amount of people alive in-game. This way, even your PUBG viewing experience is
always kept as spicy as possible!

## High Level Overview

pubgredzone queries twitch for the most popular English language PUBG streams.
It then records a very short clip of each of those streams, takes a screenshot
from that clip, crops the screenshot down to just the number of players alive,
and that image is then fed to a piece of Object Character Recognition software
which will give a plaintext interpretation of that image. Once we have a list
of streams and their respective number of players alive, pubgredzone sorts that
list, takes the best stream and embeds an iframe of that stream live on
[pubgred.zone](http://pubgred.zone). The chosen best stream is automatically
updated on the viewer's web browser so that they are not forced to constantly
click their browser and can leave it running in the background.
