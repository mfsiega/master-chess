import React, { Component } from "react";

import { EngineEval } from "./EngineEval";

export class EngineEvalComponent extends Component {
  constructor(props) {
    super(props);
    this.engineEval = new EngineEval({
      onEvalCallback: this.evalCallback.bind(this),
      fen: this.props.fen,
      onEvalDone: this.props.onEvalDone
    });
    this.state = {
      eval: 0.0,
      depth: 0,
    };
  }

  evalCallback = (engineEval) => {
    this.setState({
      eval: engineEval.score,
      depth: engineEval.depth,
    });
  };

  render() {
    this.engineEval.evaluatePosition(this.props.fen);
    return (
      <div>
        Eval: {this.state.eval} Depth: {this.state.depth}
      </div>
    );
  }
}
