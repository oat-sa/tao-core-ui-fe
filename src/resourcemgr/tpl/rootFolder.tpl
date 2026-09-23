{{#if permissions.read }}
	<li class="root">
		<a
			class="root-folder{{#unless showToggle}} is-leaf{{/unless}}"
			href="#"
			data-path="{{path}}"
			data-display="{{relPath}}"
			data-children-limit="{{childrenLimit}}"
			data-level="0"
			style="--tree-level: 0;">
			<span class="tree-toggle{{#if showToggle}} icon-right{{/if}}" aria-hidden="true"></span>
			<span class="tree-folder icon-folder" aria-hidden="true"></span>
			{{label}}
		</a>
		<ul></ul>
	</li>
{{/if}}
