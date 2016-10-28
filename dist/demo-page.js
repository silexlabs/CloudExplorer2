var selectedBtn = null;
var selection = [];

function setSelection(sel) {
  selection = sel;
  console.log('setSelection', sel);
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

window.onload = function() {
  const ce = document.querySelector('#ceIFrame').contentWindow.ce;
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
    ce.saveFile().then(result => {
      console.log('result from ce', result);
      unselectTab();
    })
    .catch(e => {
      console.error('Error thrown by CE', e);
    });
  }
  document.querySelector('#ce-saveas-file').onclick = function(e) {
    selectTab(e.target);
    ce.saveAsFile(selection.length ? selection[0].name : '').then(result => {
      console.log('result from ce', result);
      console.info('TODO: save bytes with CE API');
      unselectTab();
    })
    .catch(e => {
      console.error('Error thrown by CE', e);
    });
  }
}
