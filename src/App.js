import "./App.css";

import React, { Component } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

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
  }

  render() {
    return (
      <div className="App">
        <PlaythroughController
          playthroughState={PlaythroughState.WAITING_FOR_MOVE}
          pgn={pgn.join("\n")}
        />
        <div>
          <Container>
            <Row>
              <Col>Left Footer Placeholder</Col>
              <Col>Center Footer Placeholder</Col>
              <Col>Right Footer Placeholder</Col>
            </Row>
          </Container>
        </div>
      </div>
    );
  }
}

export default App;
