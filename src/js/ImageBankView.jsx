import React, {useState} from 'react';
import MainView from './MainView';
import {list, random, search} from './ImageBankService.js';
import Files from './Files';
import ImageBankButtonBar from './ImageBankButtonBar';

const getDownloadUrl = (file) => file.urls.big;
const getThumbnailUrl = (file) => file.urls.small;

export default function ImageBankView(props) {
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
      onChange={setQuery}
      value={query}
      numResults={loadedData.numFiles || loadedData.files.length}
    />}
    filesComponent={<Files
      unifile={props.unifile}
      files={loadedData.files}
      getDownloadUrl={getDownloadUrl}
      getThumbnailUrl={getThumbnailUrl}
      multiple={false}
      onPick={props.onPick}
      selection={props.selection}
      onChange={props.onSelection}
      thumbnailMode={true}
    />}
    loading={loadedData.pending}
    files={loadedData.files}
    pickFolder={false}
    onPick={props.onPick}
    selection={props.selection}
    onSelection={props.onSelection}
    onCancel={props.onCancel}
  />;
}

