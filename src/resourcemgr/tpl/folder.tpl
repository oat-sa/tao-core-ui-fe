{{#if permissions.read }}
	<li>
		<a
			data-path="{{path}}"
			data-display="{{relPath}}"
			data-children-limit="{{childrenLimit}}"
			data-level="{{level}}"
			style="--tree-level: {{level}};"
			href="#"
			{{#unless showToggle}}class="is-leaf"{{/unless}}>
			<span class="tree-toggle{{#if showToggle}} icon-right{{/if}}" aria-hidden="true"></span>
			<span class="tree-folder icon-folder" aria-hidden="true"></span>
			{{label}}
		</a>
	</li>
{{/if}}
