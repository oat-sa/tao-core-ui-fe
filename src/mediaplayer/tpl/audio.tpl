<audio class="media audio" preload="{{preload}}" controls {{#if cors}}crossorigin="use-credentials"{{/if}}>
    {{__ 'Your browser doesn’t support the audio player.'}}
{{#if link}}
    <a href="{{link}}">{{__ 'Please download the track and listen offline.'}}</a>
{{/if}}
</audio>
