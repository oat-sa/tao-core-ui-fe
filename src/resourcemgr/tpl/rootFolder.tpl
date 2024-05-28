{{#if permissions.read }}
	<li class="root">
		<a
			class="root-folder active"
			href="#"
			data-path="{{path}}"
			data-display="{{relPath}}"
			data-children-limit="{{childrenLimit}}"
			data-level="0"
			style="--tree-level: 0;">
			{{label}}
		</a>
		<ul></ul>
	</li>
{{/if}}
