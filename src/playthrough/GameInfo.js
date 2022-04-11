import React, { Component } from "react";

import { Button } from "react-bootstrap";

function getEvalColor(score) {
  if (score > 0.5) {
    return "#E3FFE3";
  }
  if (score < -0.5) {
    return "#FFE3E3";
  }
  return "#E3E3E3";
}

export class GameInfo extends Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      enableAnalysis: false,
    };
  }

  componentDidMount() {
    const width = this.divElement.clientWidth;
    console.log(width);
    this.setState({ containerWidth: width });
  }

  render() {
    console.log(this.props);
    return (
      <div
        style={{
          height: "50%",
          display: this.props.pgnHeaders ? "block" : "none",
          width: "100%",
        }}
        ref={(divElement) => {
          this.divElement = divElement;
        }}
      >
        <div
          style={{
            height: "50%",
            backgroundColor: "lightgrey",
            backgroundClip: "content-box",
            paddingTop: "8px",
            paddingBottom: "2px",
            fontFamily: "monospace",
          }}
        >
          <p
            style={{
              paddingLeft: "4px",
              fontSize: "1vw",
            }}
          >
            {this.props.pgnHeaders?.White || ""} vs
            <br />
            {this.props.pgnHeaders?.Black || ""}
          </p>
          <p
            style={{
              paddingLeft: "4px",
              fontSize: "1vw",
            }}
          >
            {this.props.pgnHeaders?.Date || ""}
          </p>
        </div>
        <div
          style={{
            height: "50%",
            width: "100%",
            backgroundColor: "lightgrey",
            backgroundClip: "content-box",
            paddingTop: "2px",
            paddingBottom: "8px",
          }}
        >
          <div
            style={{
              height: "50%",
            }}
          >
            <div
              style={{
                fontFamily: "monospace",
                backgroundColor: "#E3E3E3",
                backgroundClip: "content-box",
                padding: "2px",
              }}
            >
              <div class="custom-control custom-switch">
                <input
                  type="checkbox"
                  class="custom-control-input"
                  id="engine-analysis-switch"
                  onChange={(event) => {
                    this.props.toggleAnalysisCallback(event.target.checked);
                  }}
                />
                <label
                  class="custom-control-label"
                  for="engine-analysis-switch"
                >
                  Engine analysis
                </label>
              </div>
            </div>
            <div
              style={{
                display: this.props.analysisEnabled ? "block" : "none",
                padding: "2px",
              }}
            >
              <p>
                <span
                  style={{
                    paddingRight: "8px",
                    fontFamily: "monospace",
                    backgroundColor: getEvalColor(
                      this.props.playthroughEval?.score
                    ),
                  }}
                >
                  {this.props.playthroughEval?.score}
                </span>
                <span
                  style={{
                    paddingLeft: "8px",
                    fontFamily: "monospace",
                    float: "right",
                  }}
                >
                  Depth: {this.props.playthroughEval?.depth}
                </span>
              </p>
            </div>
          </div>
          <div
            style={{
              display: this.props.skipOpeningCallback ? "block" : "none",
            }}
          >
            <Button
              className="btn-block mr-1 mt-1 btn-lg h-50"
              variant="link"
              size="lg"
              onClick={this.props.skipOpeningCallback?.bind(this)}
            >
              Skip opening
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
