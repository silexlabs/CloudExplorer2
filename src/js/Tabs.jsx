import React, {useState, useCallback} from 'react';

function Container ({children}) {
  return <div className="tabs-component">
      {children}
  </div>;
}

function TabBar ({idx, elements, change}) {
  return <ul className="tab-bar-component">{
    elements.map(({name, displayName}, tabIdx) => {
      const onClick = useCallback(() => change(tabIdx));
      return <li
        key={name}
        className={`enabled${tabIdx === idx ? ' selected' : ''}`}
        onClick={onClick}
      >{displayName}</li>
    })
  }</ul>;
}

export default function Tabs ({children, elements, hide}) {
  if (hide) return <Container>{children[0]}</Container>;
  if (elements.length === 1) return <Container>{children[0]}</Container>;
  const [
    idx,
    setIdx
  ] = useState(0);
  const change = useCallback((idx) => setIdx(idx))
  return <Container>
      <TabBar idx={idx} elements={elements} change={change} />
      { children[idx] }
  </Container>;
}
