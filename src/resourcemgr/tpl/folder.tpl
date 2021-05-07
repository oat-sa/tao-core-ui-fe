{{#if permissions.read }}
	<li>
		<a
			data-path="{{path}}"
			data-display="{{relPath}}"
			data-children-limit="{{childrenLimit}}"
			href="#">
			{{label}}
		</a>
	</li>
{{/if}}
