import React, { Component } from "react";

import Table from "react-bootstrap/Table";

// TODO: use an enum.
function getEvalIndicator(score) {
  switch (score) {
    case 'DOUBLE_EXCLAM': {
      return (
        <span
          style={{width: "20px", display: "inline-block"}}
          className="badge badge-success">!!</span>
      )
    }
    case 'EXCLAM': {
      return (
        <span
          style={{width: "20px", display: "inline-block"}}
          className="badge badge-success">!</span>
      )
    }
    case 'CORRECT': {
      return (
        <span
          style={{width: "20px", display: "inline-block"}}
          className="badge badge-success">{'\u2713'}</span>
      );
    }
    case 'INTERESTING': {
      return (
        <span
          style={{width: "20px", display: "inline-block"}}
          className="badge badge-success">!?</span>
      )
    }
    case 'INACCURACY': {
      return (
        <span
          style={{width: "20px", display: "inline-block"}}
          className="badge badge-warning">?!</span>
      )
    }
    case 'MISTAKE': {
      return (
        <span
          style={{width: "20px", display: "inline-block"}}
          className="badge badge-danger">?</span>
      )
    }
    default: {
      return (
        <span
          style={{width: "20px", display: "inline-block"}}
          ></span>
      )
    }
  }
}

export class MoveList extends Component {
  constructor(props) {
    super(props);
    this.props = props || [];
  }

  render() {
    const movelist = this.props.movelist;
    if (movelist.length === 0) {
      movelist.push({});
    }
    return (
        <Table 
          hover={true}
          striped={true}
          style={{
            fontFamily: "monospace",
            overflowY: "scroll",
          }}>
          <tbody>
            {movelist.map(this.renderMove.bind(this))}
          </tbody>
        </Table>
    );
  }

  renderMove(move, index) {
    const padMove = (move) => {
      const desiredWidth = 8;
      let paddedMove = move;
      for (let i = move.length; i < desiredWidth; i++) {
        paddedMove += '\xa0';
      }
      return paddedMove;
    }
    const formatIndex = (index) => {
      const indexString = `${index + 1}.`;
      if (indexString.length === 2) {
        return indexString + '\xa0\xa0';
      }
      return indexString + '\xa0';
    }
    return (
      <tr key={index}>
        <td>{formatIndex(index)}</td>
        <td>{padMove(move.whiteMove || "")}</td>
        <td>{padMove(move.blackMove || "")}</td>
        <td>{getEvalIndicator(this.props.moveScores[index])}</td>
      </tr>
    );
  }
}
// <td>{getEvalIndicator(this.props.moveScore[index])}</td>
