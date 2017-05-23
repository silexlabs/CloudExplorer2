var selectedBtn = null;
var selection = [];

window.onload = function() {
  const ce = document.querySelector('#ceIFrame').contentWindow.ce;
  function setSelection(sel) {
    selection = sel;
    console.log('setSelection', sel, ce.state.path);
    document.querySelector('#selection').innerHTML =
      '<p>Selection:<p><ul><li>' + sel.map(file => file.name).join('</li><li>') + '</li></ul>';
  }
  function selectTab(btn) {
    document.body.classList.add('visible');
    if(selectedBtn)
      selectedBtn.classList.remove('selected');
    selectedBtn = btn;
    btn.classList.add('selected');
  }
  function unselectTab() {
    document.body.classList.remove('visible');
    if(selectedBtn)
      selectedBtn.classList.remove('selected');
  }

  document.querySelector('#ce-open-file').onclick = function(e) {
    selectTab(e.target);
    ce.openFile().then(result => {
      console.log('result from ce', result);
      if(result) {
        setSelection([result]);
      }
      else {
        console.info('user canceled action');
      }
      unselectTab();
    })
    .catch(e => {
      console.error('Error thrown by CE', e);
    });
  }
  document.querySelector('#ce-open-files').onclick = function(e) {
    selectTab(e.target);
    ce.openFiles().then(result => {
      console.log('result from ce', result);
      if(result) {
        setSelection(result);
      }
      else {
        console.info('user canceled action');
      }
      unselectTab();
    })
    .catch(e => {
      console.error('Error thrown by CE', e);
    });
  }
  document.querySelector('#ce-open-folder').onclick = function(e) {
    selectTab(e.target);
    ce.openFolder().then(result => {
      console.log('result from ce', result);
      if(result) {
        setSelection([result]);
      }
      else {
        console.info('user canceled action');
      }
      unselectTab();
    })
    .catch(e => {
      console.error('Error thrown by CE', e);
    });
  }
  document.querySelector('#ce-save-file').onclick = function(e) {
    selectTab(e.target);
    if(selection.length) {
      ce.read(selection[0])
      .then(data => ce.write(data, Object.assign({}, selection[0], {
        name: 'tmp-saved-file-' + selection[0].name,
        path: selection[0].path.replace(selection[0].name, 'tmp-saved-file-' + selection[0].name),
      }))
      .then(() => {
        unselectTab();
      }));
    }
    else {
      alert('choose a file first');
      unselectTab();
    }
  }
  document.querySelector('#ce-saveas-file').onclick = function(e) {
    selectTab(e.target);
    if(selection.length) {
      ce.saveAs(selection[0].name).then(result => {
        if(result) {
          console.log('result from ce', result);
          ce.read(selection[0])
          .then(data => ce.write(data, result)
          .then(() => {
            unselectTab();
          }));
        }
        else {
          console.info('user canceled action');
          unselectTab();
        }
      })
      .catch(e => {
        console.error('Error thrown by CE', e);
      });
    }
    else {
      alert('choose a file first');
      unselectTab();
    }
  }
}
