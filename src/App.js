import "./App.css";

import React, { Component } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import Logo from "./logo.svg";

import {
  PlaythroughState,
  PlaythroughController,
} from "./playthrough/PlaythroughController";

const pgn = [
  '[Event "Paris"]',
  '[Site "Paris FRA"]',
  '[Date "1858.??.??"]',
  '[EventDate "?"]',
  '[Round "?"]',
  '[Result "1-0"]',
  '[White "Paul Morphy"]',
  '[Black "Duke Karl / Count Isouard"]',
  '[ECO "C41"]',
  '[WhiteElo "?"]',
  '[BlackElo "?"]',
  '[PlyCount "33"]',
  "",
  "1.e4 e5 2.Nf3 d6 3.d4 Bg4 4.dxe5 Bxf3 5.Qxf3 dxe5 6.Bc4 Nf6 7.Qb3 Qe7",
  "8.Nc3 c6 9.Bg5 b5 10.Nxb5 cxb5 11.Bxb5+ Nbd7 12.O-O-O Rd8",
  "13.Rxd7 Rxd7 14.Rd1 Qe6 15.Bxd7+ Nxd7 16.Qb8+ Nxb8 17.Rd8# 1-0",
];

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pgn: undefined,
    };
  }

  async componentDidMount() {
    if (this.state.pgn) {
      return;
    }
    const response = await window.fetch(
      "http://localhost:8080/api/v1/getRandomGame"
    );
    const body = await response.json();
    this.setState({
      pgn: body.pgn,
    });
  }

  render() {
    return (
      <div className="App">
        <PlaythroughController
          playthroughState={
            this.state.pgn
              ? PlaythroughState.WAITING_FOR_MOVE
              : PlaythroughState.WAITING_FOR_PGN
          }
          pgn={this.state.pgn}
        />
        <div>
          <Container>
            <Row>
              <Col></Col>
              <Col>
                <div
                  style={{
                    fontFamily: "monospace",
                  }}
                >
                  <img src={Logo} />
                </div>
              </Col>
              <Col></Col>
            </Row>
          </Container>
        </div>
      </div>
    );
  }
}

export default App;
