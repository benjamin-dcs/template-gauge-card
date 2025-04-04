import { version } from "../package.json";

import "./card/template-gauge-card";

console.info(
  `%c{{%c Template Gauge Card %c}}%c - v${version}`,
  "color:rgb(255, 0, 0); font-weight: bold;", 
  "color:rgb(75, 75, 255); font-weight: 700;", 
  "color:rgb(255, 0, 0); font-weight: bold;", 
  "color:rgb(0, 0, 0); font-weight: 700;"
); 