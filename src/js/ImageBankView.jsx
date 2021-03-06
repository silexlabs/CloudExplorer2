import React, {useState} from 'react';
import MainView from './MainView';
import {list, random, search} from './ImageBankService.js';
import Files from './Files';
import ImageBankButtonBar from './ImageBankButtonBar';

export default function (props) {
  const [
    query,
    setQuery
  ] = useState('');
  const [
    loadedData,
    setLoadedData
  ] = useState({files: [],
    query: null,
    pending: false});
  if (loadedData.pending === false && query !== loadedData.query) {
    function done (files, numFiles) {
      setLoadedData({
        pending: false,
        query,
        files,
        numFiles,
      });
    }
    function error (err) {
      // TODO: use notif of CE
      console.error(err);
      alert(err);
      setLoadedData({
        pending: false,
        query,
        files: [],
      });
    }
    setLoadedData({...loadedData,
      pending: true, });
    if (query) {
      search(props.bankName, query)
      .then((json) => done(json.results, json.total))
      .catch((err) => error(err));
    } else {
      random(props.bankName)
      .then((json) => done(json.results, json.total))
      .catch((err) => error(err));
    }
  }

  return <MainView
    buttonBar={<ImageBankButtonBar
      onChange={(val) => setQuery(val)}
      value={query}
      numResults={loadedData.numFiles || loadedData.files.length}
    />}
    filesComponent={<Files
      unifile={props.unifile}
      files={loadedData.files}
      getDownloadUrl={(file) => file.urls.big}
      getThumbnailUrl={(file) => file.urls.small}
      multiple={false}
      onPick={(file) => props.onPick(file)}
      selection={props.selection}
      onChange={(s) => props.onSelection(s)}
      thumbnailMode={true}
    />}
    loading={loadedData.pending}
    files={loadedData.files}
    pickFolder={false}
    onPick={(file) => props.onPick(file)}
    selection={props.selection}
    onSelection={(s) => props.onSelection(s)}
    onCancel={(s) => props.onCancel(s)}
  />;
}

