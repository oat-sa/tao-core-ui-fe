<video class="media video" preload="{{preload}}" poster="{{poster}}" controls{{#if crossOriginUseCredentials}} crossorigin="use-credentials"{{else}}{{#if crossOrigin}} crossorigin{{/if}}{{/if}}>
    {{__ 'Your browser doesn’t support the video player.'}}
{{#if link}}
    <a href="{{link}}">{{__ 'Please download the video and view offline.'}}</a>
{{/if}}
</video>
