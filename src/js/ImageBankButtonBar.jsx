import React from 'react';

export default function (props) {
  return <section className="search-bar-component"><input
    autoFocus
    placeholder="Search photos"
    onChange={e => props.onChange(e.target.value)}
    value={props.value}
    ></input>
    <span>
      {props.numResults} image{props.numResults > 1 ? 's' : ''}
    </span>
  </section>
}

