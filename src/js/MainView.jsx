import ButtonConfirm from './ButtonConfirm';
import KeyboardNav from './KeyboardNav';
import ModalDialog from './ModalDialog';
import React, { useCallback } from 'react';

const dialog = React.createRef();

/**
 * This component holds the layout of the main view in CE, plus some common logic
 * It is instanciated by the view, e.g. CloudExplorerView and ImageBankView
 */
export default function MainView ({unifile, cancelInputMode, isInputMode, buttonBar, breadcrumbs, filesDropZone, filesComponent, files, onEnter, onSelection, loading, cached, onCancel, onPick, onSave, defaultFileName, inputName, path, pickFolder, selection}) {
  const onCancelKeyboard = useCallback(() => {
    if (dialog.current.isOpened()) {
      dialog.current.cancel();
    } else if (isInputMode()) {
      cancelInputMode();
    } else {
      onCancel();
    }
  });
  return (
      <div
        className={`cloud-explorer-component${loading ? ' loading' : ''}${cached ? ' cached' : ''}`}
    >
          <div className="panel top-button-bar">
              { buttonBar }
              <ButtonConfirm
                defaultFileName={defaultFileName}
                inputName={inputName}
                onCancel={onCancel}
                onPick={onPick}
                onSave={onSave}
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
                unifile={unifile}
                files={files}
                focusElement={filesComponent}
                pickFolder={pickFolder}
                selection={selection}
                onCancel={onCancelKeyboard}
                onChange={onSelection}
                onEnter={onEnter}
                onPick={onPick}
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

