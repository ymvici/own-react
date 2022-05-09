/*
 * @Author: vici_y vici_y@163.com
 * @Date: 2022-05-08 09:04:40
 * @LastEditors: vici_y vici_y@163.com
 * @LastEditTime: 2022-05-09 09:37:59
 * @FilePath: \own-react\src\index.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { myCreateElement } from "./myCreateElement";

const root = ReactDOM.createRoot(document.getElementById("root"));
const res = myCreateElement("div", null, "a", "b");
console.log("~ res", res);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
