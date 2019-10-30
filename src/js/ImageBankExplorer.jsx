import React, {useState} from 'react';
import WithCustomUi from './WithCustomUi'
import {list, search, random} from './ImageBankService.js'
import Files from './Files';
import ImageBankButtonBar from './ImageBankButtonBar'

export default function ImageBankExplorer(props) {
  const [query, setQuery] = useState('')
  const [loadedData, setLoadedData] = useState({files: [], query: null, pending: false})
  if(loadedData.pending === false && query !== loadedData.query) {
    function done(files) {
      setLoadedData({
        pending: false,
        query,
        files,
      })
    }
    function error(err) {
      // TODO
      alert(err)
      setLoadedData({
        pending: false,
        query,
        files: [],
      })
    }
    setLoadedData(Object.assign({}, loadedData, {
      pending: true,
    }))
    if(query) {
      search(props.bankName, query)
        .then(json => done(json.results))
        .catch(err => error(err))
    }
    else {
      random(props.bankName)
        .then(json => done(json))
        .catch(err => error(err))
    }
  }

  return <WithCustomUi
    buttonBar={<ImageBankButtonBar
      onChange={val => setQuery(val)}
      value={query}
      numResults={loadedData.files.length}
    />}
    filesComponent={<Files
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
    />
}

