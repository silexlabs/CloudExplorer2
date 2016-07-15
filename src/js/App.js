import React from 'react';
import ReactDom from 'react-dom';
import CloudExplorer from './CloudExplorer';

const SERVICES = ['FTP', 'Dropbox', 'GitHub'];

ReactDom.render(
  <CloudExplorer
    services={SERVICES}
    onCancel={() => console.log('CloudExplorer: Canceled')}
    onPick={(selection) => console.log('CloudExplorer: Picked', selection)}
  />,
  document.getElementById('cloud-explorer')
);
