import React, { Component } from "react";

export class EngineEval {
  uciCmd = (cmd, engine) => {
    engine.postMessage(cmd);
  };

  maybeGetCpScore = (event) => {
    const regex = /score cp (-?\d*\.?\d+)/;
    const scoreMatch = event.data.match(regex);
    if (scoreMatch && scoreMatch[1]) {
      let score = Number.parseInt(scoreMatch[1]);
      if (this.blackToPlay) {
        score *= -1;
      }
      score = (score / 100).toFixed(1);
      return score;
    } else {
      return null;
    }
  };

  maybeGetEvalDepth = (event) => {
    const regex = /info depth (\d+)/;
    const depthMatch = event.data.match(regex);
    if (depthMatch && depthMatch[1]) {
      return Number.parseInt(depthMatch[1]);
    }
    return null;
  };

  constructor(props) {
    this.options = props.options;
    this.onEvalCallback = props.onEvalCallback;
    this.onEvalDone = props.onEvalDone;
    this.engine = new Worker("/stockfish.js");
    this.engine.onmessage = (event) => {
      if (event.data?.startsWith("bestmove") && !this.doneEvaluating) {
        this.doneEvaluating = true;
        this.onEvalDone(this.currentEval);
      }
      const score = this.maybeGetCpScore(event);
      const depth = this.maybeGetEvalDepth(event);
      if (score && depth) {
        this.currentEval = {score, depth};
        this.onEvalCallback({
          score: score,
          depth: depth,
        });
      }
    };
    this.uciCmd("uci", this.engine);
    this.blackToPlay = false;
  }

  evaluatePosition = (fen) => {
    if (fen === this.currentPosition) {
      return;
    }
    this.doneEvaluating = false;
    this.currentPosition = fen;
    const parts = fen.split(" ");
    if (parts[1] === "b") {
      this.blackToPlay = true;
    } else {
      this.blackToPlay = false;
    }
    this.uciCmd("stop", this.engine);
    this.uciCmd(`position fen ${fen}`, this.engine);
    this.uciCmd("go ponder depth 20", this.engine);
  };
}
