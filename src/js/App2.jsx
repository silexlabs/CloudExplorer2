import React from 'react';
import UnifileService from './UnifileService';

// don't store state into unifile service...
const unifileService = new UnifileService('/ce/cloud-explorer');

// reducers are always: data => state => newState;
const reducers = {
  // populates servicesByName map
  receiveServices: services => state => 
    ({
      servicesByName: services.reduce((memo, item) => {
        memo[item.name] = item;
        return memo;
      },{})
    }),
  // updates login status
  receiveLogin: serviceName => ({servicesByName}) =>
    ({
      ...servicesByName,
      [serviceName]: {
        ...servicesByName[serviceName],
        isLoggedIn: true,
      }
    })
};

export default class ServicesList extends React.Component {

  state = {
    servicesByName: {},
    fetchingServices: false,
    currentService: null,
    error: null
  }

  componentDidMount() {
    this.setState({fetchingServices:true});
    UnifileService.getServices()
      .then( services =>
        this.setState(reducers.receiveServices(services)(this.state))
      ).catch( error =>
        this.setState({error}) 
      )
      .finally( () =>
        this.setState({fetchingServices: false}) 
      );
  }

  gotoService = (serviceName) => {
    console.log('going to service', serviceName);
    const service = this.state.servicesByName[serviceName];
    const isLoggedIn = service && service.isLoggedIn || false;
    if( isLoggedIn ) {
      console.log("ok, we're logged in");
      this.setState({
        currentService: serviceName,
      });
    } else {
      unifileService.auth(serviceName)
        .then( () => {
          console.log('we are logged in !');
          this.setState({
            ...reducers.receiveLogin(serviceName)(this.state),
            currentService: serviceName,
          });
        });
    }
  }

  render() {
    const {servicesByName, error, fetchingServices, currentService} = this.state;
    const {gotoService} = this;

    const services = Object.values(servicesByName);

    console.log('rendering', this.state);

    if ( fetchingServices ) {
      return <div>Loading services</div>;
    }
    if ( error ) {
      return <div>Error: {error}</div>
    }
    if ( currentService ) {
      return (
        <Service 
          serviceName={currentService} 
          onClose={() =>
            this.setState({currentService: null})
          }
        />
      );
    }
    if ( services ) {
      return (
        <div>
          <div style={{fontWeight: 'bold'}}>Home</div>
          <List 
            items={services} 
            onItemClick={(service) =>
              gotoService(service.name)
            }  
            ItemView={({item}) =>
              <span>{item.displayName}</span>
            }
          />
        </div>
      );
    }
    return <div>initializing...</div>;
  }
}

class Service extends React.Component {
  state = {
    currentPath: [],
    fetchingFiles: false,
    files: [],
  }

  componentDidMount() {
    this.loadFiles();
  }

  willReceiveProps(props) {
    if( props.serviceName != this.props.serviceName ) {
      this.setState({
        files: [],
        currentPath: []
      });
      this.loadFiles();
    }
  }

  loadFiles = () => {
    const {serviceName} = this.props;
    const {currentPath} = this.state;
    unifileService.ls([serviceName].concat(currentPath))
      .then( files => {
        console.log('got files', files);
        this.setState({
          files
        });
      })
      .catch( err => {
        console.log('got error', err);
      })
  }

  onFileClick = (file) => {
    console.log('clicked on ', file);
    if( file.isDir ) {
      this.onPath(this.state.currentPath.concat([file.name]));
    } else {
      console.log('opening file', file);
    }
  }

  onPath = (path) => {
    this.setState({
        currentPath: path,
    }, this.loadFiles);
  }

  render() {
    const {files, currentPath} = this.state;
    const {serviceName, onClose} = this.props;
    const {onFileClick, onPath} = this;

    // build an array with absolute paths for breadcrumb
    const breadcrumb = 
      [{
        abs: [],
        name: serviceName
      }]
      .concat(
        currentPath
          .reduce((memo, item) => {
            const prevPath = memo[memo.length-1] || {};
            memo.push({
              abs: (prevPath.abs || []).concat(item),
              name: item,
            });
            return memo;
          }, [])
      );

    return (
      <div>
        <div style={{fontWeight: 'bold'}}>
          <span onClick={onClose}>Home</span>
          <span>
          {
            breadcrumb.map( path => (
                <span 
                  key={path.abs.join('/')} 
                  onClick={() => onPath(path.abs)}
                >
                  / {path.name}
                </span>
            ))
          }
          </span>
        </div>
        <List 
          items={files}
          onItemClick={onFileClick}
          ItemView={({item}) => <span>{item.name}</span>}
        />
      </div>
    );
  }

}

const List = ({items, onItemClick, ItemView}) => (
    <ul>
      {items.map((item,i) => 
        <li 
          onClick={
            onItemClick 
            ? () => onItemClick(item)
            : undefined
          } 
          key={i}
        >
          <ItemView item={item} />
        </li>
      )}
    </ul>
)