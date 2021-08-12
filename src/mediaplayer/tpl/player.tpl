<div class="mediaplayer {{type}}">
    <div class="player">
        <div class="overlay">
            <a class="action play" data-control="play"><span class="icon icon-play" title="{{__ 'Play'}}"></span></a>
            <a class="action play" data-control="pause"><span class="icon icon-pause" title="{{__ 'Pause'}}"></span></a>
            <a class="action reload" data-control="start">
                <span class="icon icon-play" title="{{__ 'Start'}}"></span>
                <div class="message">{{__ 'Click to start'}}</div>
            </a>
            <a class="action reload" data-control="reload">
                <div class="icon icon-reload" title="{{__ 'Reload'}}"></div>
                <div class="message">{{__ 'You are encountering a prolonged connectivity loss.'}}</div>
                <div class="message">{{__ 'Click to reload.'}}</div>
            </a>
        </div>
    </div>
    <div class="controls">
        <div class="bar">
            <div class="control actions playback">
                <a class="action play" data-control="play" title="{{__ 'Play'}}"><span class="icon icon-play"></span></a>
                <a class="action play" data-control="pause" title="{{__ 'Pause'}}"><span class="icon icon-pause"></span></a>
            </div>
            <div class="control seek"><div class="slider"></div></div>
            <div class="control infos timer">
                <span class="info time" data-control="time-cur" title="{{__ 'Current playback position'}}">--:--</span>
                <span class="info time" data-control="time-end" title="{{__ 'Total duration'}}">--:--</span>
            </div>
            <div class="control actions sound">
                <div class="volume"><div class="slider"></div></div>
                <a class="action mute" data-control="mute" title="{{__ 'Mute'}}"><span class="icon icon-sound"></span></a>
                <a class="action mute" data-control="unmute" title="{{__ 'Restore sound'}}"><span class="icon icon-mute"></span></a>
            </div>
        </div>
    </div>
    <div class="error">
        <div class="message">{{__ 'This media cannot be played!'}}</div>
    </div>
</div>
