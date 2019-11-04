import React, { useState} from 'react'

function Container({children}) {
  return <div className="tabs-component">
    {children}
  </div>
}

function TabBar({idx, elements, change}) {
  return <ul className="tab-bar-component">{
    elements.map(({name, displayName}, tabIdx) => {
      return <li
        key={name}
        className={'enabled' + (tabIdx === idx ? ' selected' : '')}
        onClick={() => change(tabIdx)}
      >{displayName}</li>
    })
  }</ul>
}

export default function({children, elements, hide}) {
  if(hide) return <Container>{children[0]}</Container>
  if(elements.length === 1) return <Container>{children[0]}</Container>
  const [idx, setIdx] = useState(0)
  return <Container>
    <TabBar idx={idx} elements={elements} change={idx => setIdx(idx)} />
    { children[idx] }
  </Container>
}
