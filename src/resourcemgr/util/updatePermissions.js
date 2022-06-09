/**
 * Update the permissions in HTML Tree
 * @param {Object} item - the tree item
 * @return {Object} - item with permissions
 */
export default function updatePermissions(item) {
    const isAssets = (item.uri || item.path || '').includes('mediamanager');

    let permissions = {
        read: true,
        write: true,
        preview: true,
        download: true,
        upload: true,
        delete: true,
    };

    if (item.permissions) {
        if (!item.permissions.includes('READ')) {
            permissions.read = false;
        }
        if (!item.permissions.includes('WRITE')) {
            permissions.write = false;
        }
        // Atomic permissions for Assets
        if (isAssets) {
            if (!item.permissions.includes('PREVIEW')) {
                permissions.preview = false;
            }
            if (!item.permissions.includes('DOWNLOAD')) {
                permissions.download = false;
            }
            if (!item.permissions.includes('UPLOAD')) {
                permissions.upload = false;
            }
            if (!item.permissions.includes('DELETE')) {
                permissions.delete = false;
            }
            // Generic permissions for item gallery media
        } else {
            if (!permissions.read) {
                permissions.preview = false;
                permissions.download = false;
            }
            if (!permissions.write) {
                permissions.delete = false;
                permissions.upload = false;
            }
        }
    }

    item.permissions = permissions;
    return item;
}