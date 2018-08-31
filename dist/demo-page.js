/* eslint-disable */

let selectedBtn = null;
let selection = [];
let extensions = null;

window.onload = function onload () {
  'use strict';
  const {ce} = document.querySelector('#ceIFrame').contentWindow;
  const setSelection = function setSelection (sel) {
    selection = sel;
    console.log('setSelection', sel, ce.state.path);
    document.querySelector('#selection').innerHTML =
      `<p>Selection:<p><ul><li>${sel.map((file) => file.name).join('</li><li>')}</li></ul>`;
  };
  const selectTab = function selectTab (btn) {
    document.body.classList.add('visible');
    if (selectedBtn) selectedBtn.classList.remove('selected');
    selectedBtn = btn;
    btn.classList.add('selected');
  };
  const unselectTab = function unselectTab () {
    document.body.classList.remove('visible');
    if (selectedBtn) selectedBtn.classList.remove('selected');
  };
  const handleCePromise = function handleCePromise (promise, cbk) {
    promise.then((result) => {
      console.log('result from ce', result);
      if (result) {
        cbk(result);
      } else {
        console.info('user canceled action');
      }
      unselectTab();
    })
    .catch((e) => {
      console.error('Error thrown by CE', e);
    });
  };

  document.querySelector('#ce-extensions').onchange = function onchange (e) {
    extensions = e.target.value.split(',').filter((el) => el !== '');
    if (extensions.length === 0) extensions = null;
    console.log(extensions);
    ce.reload(extensions);
  };

  document.querySelector('#ce-open-file').onclick = function onclick (e) {
    selectTab(e.target);
    handleCePromise(ce.openFile(extensions), (result) => setSelection([result]));
  };
  document.querySelector('#ce-open-files').onclick = function onclick (e) {
    selectTab(e.target);
    handleCePromise(ce.openFiles(extensions), (result) => setSelection(result));
  };
  document.querySelector('#ce-open-folder').onclick = function onclick (e) {
    selectTab(e.target);
    handleCePromise(ce.openFolder(), (result) => setSelection([result]));
  };
  document.querySelector('#ce-save-file').onclick = function onclick () {
    if (selection.length) {
      ce.read(selection[0])
      .then((data) => ce.write(JSON.stringify(data), Object.assign({}, selection[0], {
        name: `tmp-saved-file-${selection[0].name}`,
        path: selection[0].path.replace(selection[0].name, `tmp-saved-file-${selection[0].name}`)
      }))
      .then(() => {
        ce.reload(extensions);
      }));
    } else {
      alert('choose a file first');
      unselectTab();
    }
  };
  document.querySelector('#ce-saveas-file').onclick = function onclick (event) {
    selectTab(event.target);
    if (selection.length) {
      ce.saveAs(selection[0].name, extensions).then((result) => {
        if (result) {
          console.log('result from ce', result);
          ce.read(selection[0])
          .then((data) => ce.write(data, result)
          .then(() => {
            unselectTab();
            ce.reload(extensions);
          }));
        } else {
          console.info('user canceled action');
          unselectTab();
        }
      })
      .catch((err) => {
        console.error('Error thrown by CE', err);
      });
    } else {
      alert('choose a file first');
      unselectTab();
    }
  };
};
