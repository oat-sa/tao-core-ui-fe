{{~#each .~}}
{{~#if (isArray label)~}}
    <span class="term term-{{type}}{{#if elide}} term-elide{{/if}}" data-value="{{value}}" data-token="{{token}}" data-type="{{type}}">{{~> ui/maths/calculator/core/tpl/terms label~}}</span>
{{~else~}}
    <span class="term term-{{type}}{{#if elide}} term-elide{{/if}}" data-value="{{value}}" data-token="{{token}}" data-type="{{type}}">{{{label}}}</span>
{{~/if~}}
{{~/each~}}
