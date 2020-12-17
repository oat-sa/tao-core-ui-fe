import $ from 'jquery';
import _ from 'lodash';
import bytes from 'util/bytes';
import context from 'context';
import 'ui/previewer';

const ns = 'resourcemgr';

export default function(options) {
    const $container = options.$target;
    const $filePreview = $('.file-preview', $container);
    const $previewer = $('.previewer', $container);
    const $propType = $('.prop-type', $filePreview);
    const $propSize = $('.prop-size', $filePreview);
    const $propUrl = $('.prop-url', $filePreview);
    const $link = $('a', $propUrl);
    const $selectButton = $('.select-action', $filePreview);
    let currentSelection = [];

    $container.on(`fileselect.${ns}`, function(e, file) {
        if (file && file.file) {
            startPreview(file);
            currentSelection = file;
        } else {
            stopPreview();
        }
    });
    $container.on(`filedelete.${ns}`, function (e, path) {
        if (currentSelection.file === path) {
            stopPreview();
        }
    });

    $selectButton.on('click', function(e) {
        e.preventDefault();

        const data = _.pick(currentSelection, ['file', 'type', 'mime', 'size', 'alt']);
        if (context.mediaSources && context.mediaSources.length === 0 && data.file.indexOf('local/') > -1) {
            data.file = data.file.substring(6);
        }

        $container.trigger(`select.${ns}`, [[data]]);
    });

    function startPreview(file) {
        $previewer.previewer(file);
        $propType.text(`${file.type} (${file.mime})`);
        $propSize.text(bytes.hrSize(file.size));
        $link.attr('href', file.download).attr('download', file.file);
        if ($link.hasClass('hidden')) {
            $link.removeClass('hidden');
        }
        $selectButton.removeAttr('disabled');
    }

    function stopPreview() {
        $previewer.previewer('update', { url: false });
        $propType.empty();
        $propSize.empty();
        $('a', $propUrl).addClass('hidden');
        $selectButton.attr('disabled', 'disabled');
    }
}
