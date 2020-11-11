<div class="media-editor">
    {{#if mediaDimension.active}}<div class="media-dimension"></div>{{/if}}
    {{#if mediaAlignment.active}}
        <div class="media-align">
            <label class="smaller-prompt">
                <input type="radio" name="orientation" value="vertical" checked="">
                <span class="icon-radio"></span>
                Inline
            </label>
            <br>
            <label class="smaller-prompt">
                <input type="radio" name="orientation" value="horizontal">
                <span class="icon-radio"></span>
                Wrap image left
            </label>
            <br>
            <label class="smaller-prompt">
                <input type="radio" name="orientation" value="horizontal">
                <span class="icon-radio"></span>
                Wrap image right
            </label>
        </div>
    {{/if}}
</div>
