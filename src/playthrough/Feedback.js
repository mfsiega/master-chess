import React, { Component } from "react";
import { Button } from "react-bootstrap";

function getAcpl(cpls) {
  const sum = cpls.reduce((partial, a) => partial + a, 0);
  return (-1 * sum) / cpls.length;
}

export class Feedback extends Component {
  constructor(props) {
    super(props);
    this.tryAgainCallback = this.props.tryAgainCallback;
    this.continueCallback = this.props.continueCallback;
  }

  render() {
    let cpl = undefined;
    if (this.props.playthroughEval?.done && this.props.referenceEval?.done) {
      cpl = this.props.playthroughEval.score - this.props.referenceEval.score;
      cpl = cpl.toFixed(1);
    }
    console.log(this.props);
    return (
      <div
        style={{
          height: "50%",
          paddingTop: "4px",
          paddingBottom: "4px",
          fontFamily: 'monospace'
        }}
      >
        <div
          style={{
            height: "50%",
            paddingBottom: '2px',
            backgroundColor: "lightgrey",
            backgroundClip: "content-box",
          }}
        >
          <div style={{display: this.props.lastPlayerMove && !this.props.justContinued ? 'block' : 'none'}}>
            <span style={{paddingLeft: '4px'}}>You played: </span><span style={{float: 'right', paddingRight: '8px'}}>{this.props.lastPlayerMove}</span>
            <br />
            <div style={{display: this.props.handlingWrongMove ? 'block' : 'none', paddingLeft: '4px'}}>
              They played: <span style={{float: 'right', paddingRight: '8px'}}>{this.props.handlingWrongMove?.referencePlayed || ''}</span>
            </div>
            <div style={{display: (this.props.handlingWrongMove) ? 'none' : 'block', paddingLeft: '4px'}}>Correct!</div>
            <br />
            <span style={{paddingLeft: '4px'}}>{this.props.handlingWrongMove
              ? cpl
                ? `Eval diff: ${cpl}`
                : "Evaluation..."
              : ""}
            </span>
          </div>
          <div style={{
            display: this.props.lastPlayerMove && !this.props.justContinued ? 'none' : 'block',
            textAlign: 'center',
            verticalAlign: 'middle'
          }}>
            Your move!
          </div>
        </div>
        <div
          style={{
            height: "50%",
            paddingTop: '2px',
            backgroundColor: "lightgrey",
            backgroundClip: "content-box",
          }}
        >
          <div className="d-grid gap-2 h-100">
            <Button
              className="btn-block mr-1 mt-1 btn-lg h-50"
              variant="primary"
              onClick={this.continueCallback.bind(this)}
              size="lg"
            >
              Continue
            </Button>
            <Button
              className="btn-block mr-1 mt-1 btn-lg h-50"
              href={`https://lichess.org/analysis/${this.props.fen}`}
              target="_blank">
              <span style={{
                fontSize: 'x-small'
              }}>Analyze [Lichess.org] </span>
            </Button>
          </div>
        </div>
        <div
          className="feedback-row"
          style={{ display: this.props.gameOver ? "block" : "none" }}
        >
          Done! ACPL: {getAcpl(this.props.cpls).toFixed(0)}
        </div>
        <div
          style={{
            display: "none",
          }}
        >
          {this.props.referenceEval?.done}
        </div>
      </div>
    );
  }
}
