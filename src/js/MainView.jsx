import ButtonConfirm from './ButtonConfirm';
import KeyboardNav from './KeyboardNav';
import ModalDialog from './ModalDialog';
import React from 'react';

const dialog = React.createRef()

/**
 * This component holds the layout of the main view in CE, plus some common logic
 * It is instanciated by the view, e.g. CloudExplorerView and ImageBankView
 */
export default function({buttonBar, breadcrumbs, filesDropZone, filesComponent, files, onEnter, onSelection, loading, cached, onCancel, onPick, onSave, defaultFileName, inputName, path, pickFolder, selection }) {
  return (
    <div
      className={'cloud-explorer-component' + (loading ? ' loading' : '') + (cached ? ' cached' : '')}
    >
      <div className="panel top-button-bar">
        { buttonBar }
        <ButtonConfirm
          defaultFileName={defaultFileName}
          inputName={inputName}
          onCancel={() => onCancel()}
          onPick={(file) => onPick(file)}
          onSave={(fileName) => onSave(fileName)}
          path={path}
          pickFolder={pickFolder}
          selection={selection}
        />
      </div>
      <div className="breadcrumbs panel">
        { breadcrumbs }
      </div>
      <div className="files panel">
        { filesComponent }
        <KeyboardNav
          files={files}
          focusElement={filesComponent}
          onCancel={() => {
            if (dialog.current.isOpened()) {
              dialog.current.cancel();
            } else if (filesComponent.isInputMode()) {
              filesComponent.cancelInputMode();
            } else {
              onCancel();
            }
          }}
          onChange={(s) => onSelection(s)}
          onEnter={(folder) => onEnter(folder)}
          onPick={(file) => onPick(file)}
          selection={selection}
        />
      </div>
      <div className="upload panel">
        { filesDropZone }
      </div>

      <div className="dialogs panel">
        <ModalDialog
          ref={dialog}
        />
      </div>
    </div>);
}

